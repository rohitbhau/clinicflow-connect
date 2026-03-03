use actix_web::{web, HttpResponse, Responder};
use mongodb::bson::doc;
use crate::models::user::{LoginDTO, User};
use crate::config::database::AppState;
use serde_json::json;

pub async fn login(
    data: web::Data<AppState>,
    body: web::Json<LoginDTO>,
) -> impl Responder {
    let email = &body.email;
    let _password = &body.password;

    let user_collection = data.db.collection::<User>("users");
    
    // Attempt to find user by email
    match user_collection.find_one(doc! { "email": email }, None).await {
        Ok(Some(user)) => {
            // Password verification placeholder
            // In production, use bcrypt::verify(_password, &user.password.unwrap())
            
            // Generate dummy token for now
            let token = "dummy_token_12345"; 

            HttpResponse::Ok().json(json!({
                "success": true,
                "data": {
                    "token": token,
                    "user": user
                }
            }))
        }
        Ok(None) => HttpResponse::Unauthorized().json(json!({ 
            "success": false,
            "error": "Invalid credentials" 
        })),
        Err(e) => {
            eprintln!("Database error: {}", e);
            HttpResponse::InternalServerError().json(json!({ 
                "success": false, 
                "error": "Internal server error" 
            }))
        }
    }
}
