use actix_web::{web, HttpRequest, HttpResponse};
use bson::{doc, DateTime as BsonDateTime, oid::ObjectId};
use serde::Deserialize;
use serde_json::json;
use mongodb::Collection;
use futures::TryStreamExt;
use chrono::Utc;

use crate::config::AppState;
use crate::errors::ApiError;
use crate::routes::auth::extract_claims;

pub async fn get_hospital_users(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let hospital_name = claims.hospital_name.clone()
        .ok_or_else(|| ApiError::bad_request("User is not associated with a hospital"))?;
    if hospital_name.is_empty() {
        return Err(ApiError::bad_request("User is not associated with a hospital"));
    }

    let mut cursor = users.find(doc! {
        "hospitalName": &hospital_name,
        "role": { "$in": ["doctor", "staff"] }
    }, None).await?;

    let mut enhanced_users = Vec::new();
    while let Some(user) = cursor.try_next().await? {
        let role = user.get_str("role").unwrap_or("");
        let user_id_oid = user.get_object_id("_id").ok();

        let mut extra = json!({});
        if role == "doctor" {
            if let Some(uid) = user_id_oid {
                if let Some(doc_profile) = doctors_col.find_one(doc! { "userId": uid }, None).await? {
                    extra = json!({
                        "specialization": doc_profile.get_str("specialization").unwrap_or(""),
                        "phone": doc_profile.get_str("phone").unwrap_or(""),
                        "status": if doc_profile.get_bool("isActive").unwrap_or(true) { "active" } else { "inactive" }
                    });
                }
            }
        } else {
            extra = json!({
                "status": if user.get_bool("isActive").unwrap_or(true) { "active" } else { "inactive" }
            });
        }

        let mut user_json = bson::from_document::<serde_json::Value>(user).unwrap_or(json!({}));
        if let Some(obj) = user_json.as_object_mut() {
            if let Some(extra_obj) = extra.as_object() {
                for (k, v) in extra_obj {
                    obj.insert(k.clone(), v.clone());
                }
            }
        }
        enhanced_users.push(user_json);
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": enhanced_users
    })))
}

pub async fn get_hospital_by_slug(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let hospitals: Collection<bson::Document> = db.collection("hospitals");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");
    let users: Collection<bson::Document> = db.collection("users");

    let slug = path.into_inner();
    let hospital = hospitals.find_one(doc! { "slug": &slug }, None).await?
        .ok_or_else(|| ApiError::not_found("Hospital not found"))?;

    let hospital_id = hospital.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid hospital ID"))?;

    let mut doctors_cursor = doctors_col.find(doc! {
        "hospitalId": hospital_id,
        "isActive": true
    }, None).await?;

    let mut formatted_doctors = Vec::new();
    while let Some(doc) = doctors_cursor.try_next().await? {
        let doc_id = doc.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default();
        let user_id_oid = doc.get_object_id("userId").ok();

        let profile_image = if let Some(uid) = user_id_oid {
            users.find_one(doc! { "_id": uid }, None).await?
                .and_then(|u| u.get_str("profileImage").ok().map(|s| s.to_string()))
                .unwrap_or_default()
        } else {
            String::new()
        };

        formatted_doctors.push(json!({
            "_id": doc_id,
            "userId": doc.get_object_id("userId").map(|id| id.to_hex()).unwrap_or_default(),
            "firstName": doc.get_str("firstName").unwrap_or(""),
            "lastName": doc.get_str("lastName").unwrap_or(""),
            "specialization": doc.get_str("specialization").unwrap_or(""),
            "qualification": doc.get_str("qualification").unwrap_or(""),
            "profileImage": profile_image
        }));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "hospital": bson::from_document::<serde_json::Value>(hospital).unwrap_or(json!({})),
            "doctors": formatted_doctors
        }
    })))
}

#[derive(Deserialize)]
pub struct AddUserRequest {
    pub name: String,
    pub email: String,
    pub role: String,
    pub specialization: Option<String>,
    pub qualification: Option<String>,
    pub phone: Option<String>,
}

pub async fn add_hospital_user(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<AddUserRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");
    let hospitals: Collection<bson::Document> = db.collection("hospitals");

    let hospital_name = claims.hospital_name.clone()
        .ok_or_else(|| ApiError::bad_request("Admin not associated with a hospital"))?;

    if !["doctor", "staff"].contains(&body.role.as_str()) {
        return Err(ApiError::bad_request("Invalid role"));
    }

    if users.find_one(doc! { "email": body.email.to_lowercase().trim().to_string() }, None).await?.is_some() {
        return Err(ApiError::bad_request("Email already registered"));
    }

    let password = gen_password();
    let hashed = bcrypt::hash(&password, bcrypt::DEFAULT_COST)?;
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    let new_user_id = ObjectId::new();

    let user_doc = doc! {
        "_id": new_user_id,
        "email": body.email.to_lowercase().trim().to_string(),
        "password": &hashed,
        "tempPassword": &password,
        "name": &body.name,
        "role": &body.role,
        "hospitalName": &hospital_name,
        "isActive": true,
        "experience": "",
        "profileImage": "",
        "hospitalImage": "",
        "createdAt": &now,
        "updatedAt": &now,
    };
    users.insert_one(user_doc, None).await?;

    if body.role == "doctor" {
        let hospital = hospitals.find_one(doc! { "name": &hospital_name }, None).await?
            .ok_or_else(|| ApiError::not_found("Hospital not found"))?;
        let hospital_id = hospital.get_object_id("_id")
            .map_err(|_| ApiError::internal("Invalid hospital ID"))?;

        let split: Vec<&str> = body.name.splitn(2, ' ').collect();
        let first = split.get(0).unwrap_or(&"Doctor").to_string();
        let last = split.get(1).unwrap_or(&"Doc").to_string();
        let n = rand::thread_rng().gen_range(100..999u32);
        let lic = format!("DOC-{}-{}", &new_user_id.to_hex()[..6].to_uppercase(), n);
        let dept_id = ObjectId::new();

        let doctor_doc = doc! {
            "_id": ObjectId::new(),
            "userId": new_user_id,
            "hospitalId": hospital_id,
            "firstName": first,
            "lastName": last,
            "specialization": body.specialization.as_deref().unwrap_or("General"),
            "qualification": body.qualification.as_deref().unwrap_or("MBBS"),
            "phone": body.phone.as_deref().unwrap_or("0000000000"),
            "licenseNumber": lic,
            "departmentId": dept_id,
            "consultationFee": 0.0,
            "maxAppointmentsPerSlot": 5,
            "availableSlots": [],
            "isActive": true,
            "createdAt": &now,
            "updatedAt": &now,
        };
        doctors_col.insert_one(doctor_doc, None).await?;
    }

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": {
            "user": {
                "id": new_user_id.to_hex(),
                "name": &body.name,
                "email": body.email.to_lowercase(),
                "role": &body.role
            },
            "generatedPassword": password
        }
    })))
}

pub async fn get_hospital_stats(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");
    let patients: Collection<bson::Document> = db.collection("patients");
    let appointments: Collection<bson::Document> = db.collection("appointments");
    let hospitals: Collection<bson::Document> = db.collection("hospitals");

    let hospital_name = claims.hospital_name.clone()
        .ok_or_else(|| ApiError::bad_request("User is not associated with a hospital"))?;

    let hospital = hospitals.find_one(doc! { "name": &hospital_name }, None).await?
        .ok_or_else(|| ApiError::not_found("Hospital not found"))?;
    let hospital_id = hospital.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid hospital ID"))?;

    let now = Utc::now();
    let start_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let end_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let doctor_count = users.count_documents(doc! { "hospitalName": &hospital_name, "role": "doctor", "isActive": true }, None).await? as i64;
    let patient_count = patients.count_documents(doc! { "hospitalId": hospital_id }, None).await? as i64;
    let today_appt_count = appointments.count_documents(doc! {
        "hospitalId": hospital_id,
        "appointmentDate": { "$gte": start_of_day, "$lt": end_of_day }
    }, None).await? as i64;
    let active_users = users.count_documents(doc! { "hospitalName": &hospital_name, "isActive": true }, None).await? as i64;

    let mut activity_cursor = users.find(
        doc! { "hospitalName": &hospital_name },
        mongodb::options::FindOptions::builder()
            .sort(doc! { "updatedAt": -1 })
            .limit(5)
            .projection(doc! { "name": 1, "role": 1, "updatedAt": 1 })
            .build(),
    ).await?;

    let mut recent_activity = Vec::new();
    while let Some(u) = activity_cursor.try_next().await? {
        recent_activity.push(json!({
            "id": u.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default(),
            "userName": u.get_str("name").unwrap_or(""),
            "role": u.get_str("role").unwrap_or(""),
            "loginTime": "Just now",
            "status": "online"
        }));
    }

    let address = hospital.get_document("address").ok();
    let address_json = address.map(|a| json!({
        "street": a.get_str("street").unwrap_or(""),
        "city": a.get_str("city").unwrap_or(""),
        "state": a.get_str("state").unwrap_or(""),
        "zipCode": a.get_str("zipCode").unwrap_or(""),
        "country": a.get_str("country").unwrap_or("India"),
    })).unwrap_or(json!({}));

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "hospital": {
                "id": hospital_id.to_hex(),
                "name": hospital.get_str("name").unwrap_or(""),
                "slug": hospital.get_str("slug").unwrap_or(""),
                "email": hospital.get_str("email").unwrap_or(""),
                "phone": hospital.get_str("phone").unwrap_or(""),
                "address": address_json,
                "status": if hospital.get_bool("isActive").unwrap_or(true) { "active" } else { "inactive" }
            },
            "doctors": doctor_count,
            "patients": patient_count,
            "appointments": today_appt_count,
            "online": (active_users as f64 * 0.4) as i64 + 1,
            "loginActivity": recent_activity
        }
    })))
}

pub async fn delete_hospital_user(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let hospital_name = claims.hospital_name.clone()
        .ok_or_else(|| ApiError::bad_request("Admin not associated with a hospital"))?;

    let user_id = ObjectId::parse_str(&path.into_inner())
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let user_to_delete = users.find_one(doc! { "_id": user_id, "hospitalName": &hospital_name }, None).await?
        .ok_or_else(|| ApiError::not_found("User not found in your hospital"))?;

    users.delete_one(doc! { "_id": user_id }, None).await?;

    if user_to_delete.get_str("role").unwrap_or("") == "doctor" {
        doctors_col.delete_one(doc! { "userId": user_id }, None).await?;
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "User deleted successfully"
    })))
}

#[derive(Deserialize)]
pub struct UpdateUserStatusRequest {
    pub status: String,
}

pub async fn update_user_status(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<UpdateUserStatusRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let hospital_name = claims.hospital_name.clone()
        .ok_or_else(|| ApiError::bad_request("Admin not associated with a hospital"))?;

    let user_id = ObjectId::parse_str(&path.into_inner())
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let user_to_update = users.find_one(doc! { "_id": user_id, "hospitalName": &hospital_name }, None).await?
        .ok_or_else(|| ApiError::not_found("User not found in your hospital"))?;

    let is_active = body.status == "active" || body.status == "on-leave";
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());

    users.update_one(
        doc! { "_id": user_id },
        doc! { "$set": { "isActive": is_active, "updatedAt": &now } },
        None,
    ).await?;

    if user_to_update.get_str("role").unwrap_or("") == "doctor" {
        doctors_col.update_one(
            doc! { "userId": user_id },
            doc! { "$set": { "isActive": is_active, "updatedAt": &now } },
            None,
        ).await?;
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": format!("User status updated to {}", body.status)
    })))
}

#[derive(Deserialize)]
pub struct UpdateHospitalRequest {
    pub name: Option<String>,
    pub address: Option<serde_json::Value>,
    pub phone: Option<String>,
    pub status: Option<String>,
}

pub async fn update_hospital_details(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<UpdateHospitalRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");
    let hospitals: Collection<bson::Document> = db.collection("hospitals");

    let hospital_name = claims.hospital_name.clone()
        .ok_or_else(|| ApiError::bad_request("User is not associated with a hospital"))?;

    let hospital = hospitals.find_one(doc! { "name": &hospital_name }, None).await?
        .ok_or_else(|| ApiError::not_found("Hospital not found"))?;

    let hospital_id = hospital.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid hospital ID"))?;

    let mut set_doc = doc! {};
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());

    if let Some(phone) = &body.phone {
        set_doc.insert("phone", phone.clone());
    }

    if let Some(address) = &body.address {
        if let Some(addr_str) = address.as_str() {
            let existing_addr = hospital.get_document("address").ok().cloned().unwrap_or_default();
            let mut addr_doc = existing_addr;
            addr_doc.insert("street", addr_str.to_string());
            set_doc.insert("address", addr_doc);
        } else if let Some(addr_obj) = address.as_object() {
            let existing_addr = hospital.get_document("address").ok().cloned().unwrap_or_default();
            let mut addr_doc = existing_addr;
            for (k, v) in addr_obj {
                if let Some(s) = v.as_str() {
                    addr_doc.insert(k.clone(), s.to_string());
                }
            }
            set_doc.insert("address", addr_doc);
        }
    }

    if let Some(status) = &body.status {
        if status == "active" || status == "inactive" {
            set_doc.insert("isActive", status == "active");
        }
    }

    if let Some(new_name) = &body.name {
        if new_name != &hospital_name {
            if hospitals.find_one(doc! { "name": new_name }, None).await?.is_some() {
                return Err(ApiError::bad_request("Hospital name already exists"));
            }
            set_doc.insert("name", new_name.clone());
            // Update all users with old hospital name
            users.update_many(
                doc! { "hospitalName": &hospital_name },
                doc! { "$set": { "hospitalName": new_name.clone() } },
                None,
            ).await?;
        }
    }

    set_doc.insert("updatedAt", now);

    let updated = hospitals.find_one_and_update(
        doc! { "_id": hospital_id },
        doc! { "$set": set_doc },
        mongodb::options::FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build(),
    ).await?
    .ok_or_else(|| ApiError::not_found("Hospital not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": bson::from_document::<serde_json::Value>(updated).unwrap_or(json!({})),
        "message": "Hospital details updated successfully"
    })))
}

use rand::Rng;

fn gen_password() -> String {
    let mut rng = rand::thread_rng();
    (0..8).map(|_| {
        let idx = rng.gen_range(0..36usize);
        if idx < 10 { (b'0' + idx as u8) as char } else { (b'a' + (idx - 10) as u8) as char }
    }).collect()
}
