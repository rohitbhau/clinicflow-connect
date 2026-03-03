use actix_web::{HttpResponse, Responder};
use chrono::Utc;
use serde_json::json;

pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "status": "healthy",
        "timestamp": Utc::now(),
    }))
}
