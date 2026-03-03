use actix_web::{web, HttpResponse, Responder};
use mongodb::bson::{doc, oid::ObjectId};
use crate::models::user::{User, UpdateProfileDTO};
use crate::config::database::AppState;
use serde_json::json;

pub async fn get_profile(
    data: web::Data<AppState>,
    path: web::Path<String>, // assuming user ID in path or extracted from JWT token in middleware
) -> impl Responder {
    let user_id = path.into_inner();
    let oid = match ObjectId::parse_str(&user_id) {
        Ok(oid) => oid,
        Err(_) => return HttpResponse::BadRequest().json(json!({ "error": "Invalid user ID" })),
    };

    let user_collection = data.db.collection::<User>("users");

    match user_collection.find_one(doc! { "_id": oid }, None).await {
        Ok(Some(user)) => HttpResponse::Ok().json(json!({ "success": true, "data": user })),
        Ok(None) => HttpResponse::NotFound().json(json!({ "error": "User not found" })),
        Err(_) => HttpResponse::InternalServerError().json(json!({ "error": "Database error" })),
    }
}

pub async fn update_profile(
    data: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<UpdateProfileDTO>,
) -> impl Responder {
    let user_id = path.into_inner();
    let oid = match ObjectId::parse_str(&user_id) {
        Ok(oid) => oid,
        Err(_) => return HttpResponse::BadRequest().json(json!({ "error": "Invalid user ID" })),
    };

    let user_collection = data.db.collection::<User>("users");
    
    let mut update_doc = doc! {};
    if let Some(name) = &body.name {
        update_doc.insert("name", name);
    }
    if let Some(experience) = &body.experience {
        update_doc.insert("experience", experience);
    }
    if let Some(profile_image) = &body.profile_image {
        update_doc.insert("profileImage", profile_image); // Use camelCase explicitly for Mongo
    }
    if let Some(hospital_image) = &body.hospital_image {
        update_doc.insert("hospitalImage", hospital_image);
    }
    if let Some(hospital_name) = &body.hospital_name {
        update_doc.insert("hospitalName", hospital_name);
    }

    if update_doc.is_empty() {
        return HttpResponse::Ok().json(json!({ "success": true, "message": "No changes provided" }));
    }

    match user_collection.update_one(doc! { "_id": oid }, doc! { "$set": update_doc }, None).await {
        Ok(result) => {
            if result.matched_count == 1 {
                 // Fetch updated user to return
                 match user_collection.find_one(doc! { "_id": oid }, None).await {
                    Ok(Some(updated_user)) => HttpResponse::Ok().json(json!({ 
                        "success": true, 
                        "data": updated_user,
                        "message": "Profile updated successfully" 
                    })),
                    _ => HttpResponse::Ok().json(json!({ "success": true, "message": "Profile updated" })),
                 }
            } else {
                HttpResponse::NotFound().json(json!({ "error": "User not found" }))
            }
        },
        Err(e) => {
            eprintln!("Update error: {}", e);
            HttpResponse::InternalServerError().json(json!({ "error": "Update failed" }))
        }
    }
}
