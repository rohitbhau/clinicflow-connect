use actix_web::{web, HttpRequest, HttpResponse};
use bson::{doc, oid::ObjectId};
use serde::Deserialize;
use serde_json::json;
use mongodb::Collection;
use futures::TryStreamExt;

use crate::config::AppState;
use crate::errors::ApiError;
use crate::routes::auth::extract_claims;

pub async fn get_stats(
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let hospitals: Collection<bson::Document> = db.collection("hospitals");
    let users: Collection<bson::Document> = db.collection("users");

    let total_hospitals = hospitals.count_documents(doc! {}, None).await? as i64;
    let total_users = users.count_documents(doc! {}, None).await? as i64;
    let admins = users.count_documents(doc! { "role": "admin" }, None).await? as i64;
    let doctors = users.count_documents(doc! { "role": "doctor" }, None).await? as i64;
    let patients = users.count_documents(doc! { "role": "patient" }, None).await? as i64;

    let mut hosp_cursor = hospitals.find(doc! {}, mongodb::options::FindOptions::builder()
        .sort(doc! { "createdAt": -1 })
        .limit(5)
        .build()
    ).await?;

    let mut latest_hospitals = Vec::new();
    while let Some(h) = hosp_cursor.try_next().await? {
        latest_hospitals.push(bson::from_document::<serde_json::Value>(h).unwrap_or(json!({})));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "hospitals": total_hospitals,
            "users": total_users,
            "admins": admins,
            "doctors": doctors,
            "patients": patients,
            "recentHospitals": latest_hospitals
        }
    })))
}

pub async fn get_hospitals(
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let hospitals: Collection<bson::Document> = db.collection("hospitals");
    let users: Collection<bson::Document> = db.collection("users");
    let patients: Collection<bson::Document> = db.collection("patients");

    let mut cursor = hospitals.find(doc! {}, mongodb::options::FindOptions::builder()
        .sort(doc! { "createdAt": -1 })
        .build()
    ).await?;

    let mut data = Vec::new();
    while let Some(h) = cursor.try_next().await? {
        let hospital_name = h.get_str("name").unwrap_or("").to_string();
        let hospital_id = h.get_object_id("_id").ok();

        let doc_count = users.count_documents(doc! { "hospitalName": &hospital_name, "role": "doctor" }, None).await? as i64;
        let patient_count = if let Some(hid) = hospital_id {
            patients.count_documents(doc! { "hospitalId": hid }, None).await? as i64
        } else { 0 };
        let admin_count = users.count_documents(doc! { "hospitalName": &hospital_name, "role": "admin" }, None).await? as i64;

        let address_str = if let Ok(addr) = h.get_document("address") {
            vec![
                addr.get_str("street").unwrap_or(""),
                addr.get_str("city").unwrap_or(""),
                addr.get_str("state").unwrap_or(""),
                addr.get_str("country").unwrap_or(""),
            ].iter().filter(|s| !s.is_empty()).cloned().collect::<Vec<_>>().join(", ")
        } else {
            "No Address".to_string()
        };

        data.push(json!({
            "id": hospital_id.map(|id| id.to_hex()).unwrap_or_default(),
            "name": hospital_name,
            "address": if address_str.is_empty() { "No Address".to_string() } else { address_str },
            "phone": h.get_str("phone").unwrap_or(""),
            "email": h.get_str("email").unwrap_or(""),
            "doctors": doc_count,
            "patients": patient_count,
            "admins": admin_count,
            "status": if h.get_bool("isActive").unwrap_or(true) { "active" } else { "inactive" },
            "createdAt": h.get_datetime("createdAt").map(|d| {
                chrono::DateTime::<chrono::Utc>::from_timestamp_millis(d.timestamp_millis())
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            }).unwrap_or_default()
        }));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": data
    })))
}

#[derive(Deserialize)]
pub struct CreateHospitalRequest {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub address: Option<serde_json::Value>,
    #[serde(rename = "licenseNumber")]
    pub license_number: Option<String>,
    #[serde(rename = "adminName")]
    pub admin_name: String,
    #[serde(rename = "adminEmail")]
    pub admin_email: String,
    #[serde(rename = "adminPassword")]
    pub admin_password: String,
}

pub async fn create_hospital(
    state: web::Data<AppState>,
    body: web::Json<CreateHospitalRequest>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let hospitals: Collection<bson::Document> = db.collection("hospitals");
    let users: Collection<bson::Document> = db.collection("users");

    // Check existing
    let existing = hospitals.find_one(doc! {
        "$or": [
            { "name": &body.name },
            { "email": &body.email },
        ]
    }, None).await?;
    if existing.is_some() {
        return Err(ApiError::bad_request("Hospital with this name or email already exists"));
    }

    use chrono::Utc;
    use bson::DateTime as BsonDateTime;
    use rand::Rng;

    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    let hospital_id = ObjectId::new();
    let n = rand::thread_rng().gen_range(100..999u32);
    let lic = body.license_number.clone().unwrap_or_else(|| format!("LIC-{}-{}", Utc::now().timestamp(), n));
    let slug = format!("{}-{}", body.name.to_lowercase().chars().map(|c| if c.is_alphanumeric() { c } else { '-' }).collect::<String>(), n);

    let addr_doc = if let Some(addr) = &body.address {
        if let Some(s) = addr.as_str() {
            doc! { "street": s, "city": "", "state": "", "zipCode": "", "country": "India" }
        } else {
            doc! {
                "street": addr.get("street").and_then(|v| v.as_str()).unwrap_or(""),
                "city": addr.get("city").and_then(|v| v.as_str()).unwrap_or(""),
                "state": addr.get("state").and_then(|v| v.as_str()).unwrap_or(""),
                "zipCode": addr.get("zipCode").and_then(|v| v.as_str()).unwrap_or(""),
                "country": addr.get("country").and_then(|v| v.as_str()).unwrap_or("India"),
            }
        }
    } else {
        doc! { "street": "", "city": "", "state": "", "zipCode": "", "country": "India" }
    };

    let hosp_doc = doc! {
        "_id": hospital_id,
        "name": &body.name,
        "email": body.email.to_lowercase(),
        "phone": &body.phone,
        "licenseNumber": lic,
        "address": addr_doc,
        "isActive": true,
        "slug": slug,
        "createdAt": now,
        "updatedAt": now,
    };
    hospitals.insert_one(hosp_doc, None).await?;

    // Check admin email
    if users.find_one(doc! { "email": body.admin_email.to_lowercase() }, None).await?.is_some() {
        // Rollback hospital
        hospitals.delete_one(doc! { "_id": hospital_id }, None).await?;
        return Err(ApiError::bad_request("Admin email already exists"));
    }

    let hashed = bcrypt::hash(&body.admin_password, bcrypt::DEFAULT_COST)?;
    let user_id = ObjectId::new();
    let user_doc = doc! {
        "_id": user_id,
        "email": body.admin_email.to_lowercase(),
        "password": hashed,
        "name": &body.admin_name,
        "role": "admin",
        "hospitalName": &body.name,
        "isActive": true,
        "experience": "",
        "profileImage": "",
        "hospitalImage": "",
        "createdAt": now,
        "updatedAt": now,
    };
    users.insert_one(user_doc, None).await?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": {
            "hospital": { "id": hospital_id.to_hex(), "name": &body.name },
            "admin": { "id": user_id.to_hex(), "email": body.admin_email.to_lowercase() }
        }
    })))
}
