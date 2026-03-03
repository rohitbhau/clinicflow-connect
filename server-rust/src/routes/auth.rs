use actix_web::{web, HttpRequest, HttpResponse};
use bson::{doc, DateTime as BsonDateTime, oid::ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::json;
use mongodb::Collection;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use rand::Rng;

use crate::config::AppState;
use crate::errors::{ApiError, ApiResult};
use crate::middleware::auth::{Claims, generate_token, decode_token};
use crate::models::{User, Hospital, Doctor};

fn create_slug(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' { c } else if c == ' ' { '-' } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn gen_password() -> String {
    let mut rng = rand::thread_rng();
    (0..8).map(|_| {
        let idx = rng.gen_range(0..36);
        if idx < 10 { (b'0' + idx) as char } else { (b'a' + idx - 10) as char }
    }).collect()
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub name: Option<String>,
    pub email: String,
    pub password: String,
    pub role: String,
    #[serde(rename = "hospitalName")]
    pub hospital_name: Option<String>,
    #[serde(rename = "hospitalPhone")]
    pub hospital_phone: Option<String>,
    pub doctors: Option<Vec<serde_json::Value>>,
    pub staff: Option<Vec<serde_json::Value>>,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub name: Option<String>,
    pub experience: Option<String>,
    #[serde(rename = "profileImage")]
    pub profile_image: Option<String>,
    #[serde(rename = "hospitalImage")]
    pub hospital_image: Option<String>,
}

pub async fn register(
    state: web::Data<AppState>,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");
    let hospitals: Collection<bson::Document> = db.collection("hospitals");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    // Check existing user
    if users.find_one(doc! { "email": &body.email }, None).await?.is_some() {
        return Err(ApiError::bad_request("Email already registered"));
    }

    let hashed_pw = hash(&body.password, DEFAULT_COST)?;
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());

    // HOSPITAL REGISTRATION FLOW
    if body.role == "admin" && body.hospital_name.is_some() {
        let hospital_name = body.hospital_name.as_ref().unwrap();
        let admin_name = body.name.clone().unwrap_or_else(|| "Hospital Admin".to_string());
        let user_id = ObjectId::new();

        // Create admin user
        let user_doc = doc! {
            "_id": user_id,
            "email": body.email.to_lowercase().trim().to_string(),
            "password": &hashed_pw,
            "name": &admin_name,
            "role": "admin",
            "hospitalName": hospital_name,
            "isActive": true,
            "experience": "",
            "profileImage": "",
            "hospitalImage": "",
            "createdAt": &now,
            "updatedAt": &now,
        };
        users.insert_one(user_doc, None).await?;

        // Create hospital
        let slug = create_slug(hospital_name);
        let existing_slug = hospitals.find_one(doc! { "slug": &slug }, None).await?;
        let final_slug = if existing_slug.is_some() {
            let n = rand::thread_rng().gen_range(100..999u32);
            format!("{}-{}", slug, n)
        } else {
            slug
        };

        let hospital_id = ObjectId::new();
        let n = rand::thread_rng().gen_range(1000..9999u32);
        let hospital_doc = doc! {
            "_id": hospital_id,
            "name": hospital_name,
            "slug": &final_slug,
            "email": body.email.to_lowercase(),
            "phone": body.hospital_phone.as_deref().unwrap_or("0000000000"),
            "address": {
                "street": "",
                "city": "",
                "state": "",
                "zipCode": "",
                "country": "India"
            },
            "licenseNumber": format!("PENDING-{}-{}", final_slug.to_uppercase(), n),
            "isActive": true,
            "createdAt": &now,
            "updatedAt": &now,
        };
        hospitals.insert_one(hospital_doc, None).await?;

        // Process doctors
        let mut generated_credentials: Vec<serde_json::Value> = Vec::new();
        if let Some(doc_list) = &body.doctors {
            for doc_info in doc_list {
                let doc_name = doc_info["name"].as_str().unwrap_or("Doctor").to_string();
                let doc_email = doc_info["email"].as_str().unwrap_or("").to_string();
                let doc_password = gen_password();
                let hashed_doc_pw = hash(&doc_password, DEFAULT_COST)?;
                let doc_user_id = ObjectId::new();
                let split: Vec<&str> = doc_name.splitn(2, ' ').collect();
                let first = split.get(0).unwrap_or(&"Doctor").to_string();
                let last = split.get(1).unwrap_or(&"Doc").to_string();
                let n2 = rand::thread_rng().gen_range(100..999u32);
                let lic = format!("DOC-{}-{}", &doc_user_id.to_hex()[..6].to_uppercase(), n2);

                let doc_user_doc = doc! {
                    "_id": doc_user_id,
                    "email": doc_email.to_lowercase(),
                    "password": &hashed_doc_pw,
                    "name": &doc_name,
                    "role": "doctor",
                    "hospitalName": hospital_name,
                    "isActive": true,
                    "experience": "",
                    "profileImage": "",
                    "hospitalImage": "",
                    "createdAt": &now,
                    "updatedAt": &now,
                };
                users.insert_one(doc_user_doc, None).await?;

                let dept_id = ObjectId::new();
                let doctor_doc = doc! {
                    "_id": ObjectId::new(),
                    "userId": doc_user_id,
                    "hospitalId": hospital_id,
                    "firstName": &first,
                    "lastName": &last,
                    "specialization": doc_info["specialization"].as_str().unwrap_or("General"),
                    "qualification": doc_info["qualification"].as_str().unwrap_or("MBBS"),
                    "phone": doc_info["phone"].as_str().unwrap_or("0000000000"),
                    "licenseNumber": &lic,
                    "departmentId": dept_id,
                    "consultationFee": 0.0,
                    "maxAppointmentsPerSlot": 5,
                    "availableSlots": [],
                    "isActive": true,
                    "createdAt": &now,
                    "updatedAt": &now,
                };
                doctors_col.insert_one(doctor_doc, None).await?;

                generated_credentials.push(json!({
                    "name": doc_name,
                    "email": doc_email,
                    "password": doc_password,
                    "role": "doctor"
                }));
            }
        }

        // Process staff
        if let Some(staff_list) = &body.staff {
            for member in staff_list {
                let m_name = member["name"].as_str().unwrap_or("Staff").to_string();
                let m_email = member["email"].as_str().unwrap_or("").to_string();
                let m_password = gen_password();
                let hashed_m = hash(&m_password, DEFAULT_COST)?;
                let staff_id = ObjectId::new();
                let staff_doc = doc! {
                    "_id": staff_id,
                    "email": m_email.to_lowercase(),
                    "password": &hashed_m,
                    "name": &m_name,
                    "role": "staff",
                    "hospitalName": hospital_name,
                    "isActive": true,
                    "experience": "",
                    "profileImage": "",
                    "hospitalImage": "",
                    "createdAt": &now,
                    "updatedAt": &now,
                };
                users.insert_one(staff_doc, None).await?;
                generated_credentials.push(json!({
                    "name": m_name,
                    "email": m_email,
                    "password": m_password,
                    "role": "staff"
                }));
            }
        }

        let token = generate_token(&user_id.to_hex(), "admin", Some(hospital_name))?;

        return Ok(HttpResponse::Created().json(json!({
            "success": true,
            "data": {
                "user": {
                    "id": user_id.to_hex(),
                    "email": body.email.to_lowercase(),
                    "role": "admin",
                    "name": admin_name,
                    "hospitalName": hospital_name,
                },
                "token": token,
                "generatedCredentials": generated_credentials
            }
        })));
    }

    // Standard registration
    let new_user_id = ObjectId::new();
    let name = body.name.clone().unwrap_or_default();
    let hospital_name = body.hospital_name.clone().unwrap_or_default();

    let user_doc = doc! {
        "_id": new_user_id,
        "email": body.email.to_lowercase().trim().to_string(),
        "password": &hashed_pw,
        "name": &name,
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

    let token = generate_token(&new_user_id.to_hex(), &body.role, Some(&hospital_name))?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": {
            "user": {
                "id": new_user_id.to_hex(),
                "email": body.email.to_lowercase(),
                "role": &body.role,
                "name": &name,
                "profileImage": "",
                "hospitalName": &hospital_name,
                "hospitalImage": "",
            },
            "token": token,
        }
    })))
}

pub async fn login(
    state: web::Data<AppState>,
    body: web::Json<LoginRequest>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");

    let user_doc = users.find_one(doc! { "email": body.email.to_lowercase().trim().to_string() }, None).await?;
    let user_doc = user_doc.ok_or_else(|| ApiError::unauthorized("Invalid credentials"))?;

    let stored_hash = user_doc.get_str("password").unwrap_or("");
    if !verify(&body.password, stored_hash).unwrap_or(false) {
        return Err(ApiError::unauthorized("Invalid credentials"));
    }

    let is_active = user_doc.get_bool("isActive").unwrap_or(true);
    if !is_active {
        return Err(ApiError::unauthorized("Account is deactivated"));
    }

    let user_id = user_doc.get_object_id("_id").map_err(|_| ApiError::internal("Invalid user id"))?.to_hex();
    let role = user_doc.get_str("role").unwrap_or("").to_string();
    let hospital_name = user_doc.get_str("hospitalName").unwrap_or("").to_string();
    let name = user_doc.get_str("name").unwrap_or("").to_string();
    let profile_image = user_doc.get_str("profileImage").unwrap_or("").to_string();
    let hospital_image = user_doc.get_str("hospitalImage").unwrap_or("").to_string();

    let token = generate_token(&user_id, &role, Some(&hospital_name))?;

    // Update updatedAt
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    let _ = users.update_one(
        doc! { "email": body.email.to_lowercase() },
        doc! { "$set": { "updatedAt": now } },
        None
    ).await;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "user": {
                "id": user_id,
                "email": body.email.to_lowercase(),
                "role": role,
                "name": name,
                "profileImage": profile_image,
                "hospitalName": hospital_name,
                "hospitalImage": hospital_image,
            },
            "token": token,
        }
    })))
}

pub async fn get_profile(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let user_doc = users.find_one(doc! { "_id": user_id }, None).await?
        .ok_or_else(|| ApiError::not_found("User not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": doc_to_public_user(&user_doc)
    })))
}

pub async fn update_profile(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let users: Collection<bson::Document> = db.collection("users");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let mut set_doc = doc! {};
    if let Some(name) = &body.name {
        set_doc.insert("name", name.clone());
    }
    if let Some(experience) = &body.experience {
        set_doc.insert("experience", experience.clone());
    }
    if let Some(profile_image) = &body.profile_image {
        set_doc.insert("profileImage", profile_image.clone());
    }
    if let Some(hospital_image) = &body.hospital_image {
        set_doc.insert("hospitalImage", hospital_image.clone());
    }
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    set_doc.insert("updatedAt", now);

    let updated = users.find_one_and_update(
        doc! { "_id": user_id },
        doc! { "$set": set_doc },
        mongodb::options::FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build(),
    ).await?
    .ok_or_else(|| ApiError::not_found("User not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": doc_to_public_user(&updated),
        "message": "Profile updated successfully"
    })))
}

pub async fn logout(req: HttpRequest) -> Result<HttpResponse, ApiError> {
    // JWT is stateless, just acknowledge
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Logged out successfully"
    })))
}

// Helper to extract claims from Authorization header
pub fn extract_claims(req: &HttpRequest) -> Result<Claims, ApiError> {
    let auth_header = req.headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| ApiError::unauthorized("No token provided"))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(ApiError::unauthorized("No token provided"));
    }

    let token = &auth_header[7..];
    crate::middleware::auth::decode_token(token)
}

fn doc_to_public_user(doc: &bson::Document) -> serde_json::Value {
    json!({
        "id": doc.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default(),
        "email": doc.get_str("email").unwrap_or(""),
        "name": doc.get_str("name").unwrap_or(""),
        "role": doc.get_str("role").unwrap_or(""),
        "hospitalName": doc.get_str("hospitalName").unwrap_or(""),
        "isActive": doc.get_bool("isActive").unwrap_or(true),
        "profileImage": doc.get_str("profileImage").unwrap_or(""),
        "hospitalImage": doc.get_str("hospitalImage").unwrap_or(""),
        "experience": doc.get_str("experience").unwrap_or(""),
        "tempPassword": doc.get_str("tempPassword").ok(),
    })
}
