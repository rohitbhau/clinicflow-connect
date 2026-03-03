use actix_web::{web, App, HttpServer, HttpResponse};
use actix_web::middleware::Logger as ActixLogger;
use actix_cors::Cors;
use actix_files::Files;
use dotenv::dotenv;
use serde_json::json;
use std::env;

mod config;
mod errors;
mod middleware;
mod models;
mod routes;

use config::{AppState, connect_db};
use routes::configure_routes;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    // Initialize logger
    if env::var("RUST_LOG").is_err() {
        env::set_var("RUST_LOG", "info,actix_web=info");
    }
    env_logger::init();

    // Connect to MongoDB
    let db = connect_db().await.expect("Failed to connect to MongoDB");
    let app_state = AppState { db };

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .expect("PORT must be a valid number");

    // Setup uploads dir
    let uploads_dir = env::var("UPLOADS_DIR").unwrap_or_else(|_| "uploads".to_string());
    std::fs::create_dir_all(&uploads_dir).ok();

    log::info!("🚀 ClinicFlow Rust Server starting on port {}", port);

    let app_state = web::Data::new(app_state);

    HttpServer::new(move || {
        // CORS
        let allowed_origins = env::var("CORS_ORIGIN")
            .unwrap_or_default();

        let cors = Cors::default()
            .allowed_origin("https://cliniqmg.ropratech.com")
            .allowed_origin("https://clinicmg.ropratech.com")
            .allowed_origin("https://chic-vitality-production-e566.up.railway.app")
            .allowed_origin("http://localhost:8080")
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://localhost:5173")
            .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::ACCEPT,
                actix_web::http::header::CONTENT_TYPE,
                actix_web::http::header::HeaderName::from_static("x-requested-with"),
            ])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .app_data(app_state.clone())
            .app_data(
                web::JsonConfig::default()
                    .limit(10 * 1024) // 10KB
                    .error_handler(|err, _req| {
                        let response = HttpResponse::BadRequest().json(json!({
                            "success": false,
                            "error": {
                                "message": format!("Invalid JSON: {}", err),
                                "statusCode": 400
                            }
                        }));
                        actix_web::error::InternalError::from_response(err, response).into()
                    })
            )
            .wrap(cors)
            .wrap(ActixLogger::default())
            // Health check
            .route("/health", web::get().to(|| async {
                HttpResponse::Ok().json(json!({
                    "status": "healthy",
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                    "engine": "Rust/Actix-Web",
                    "version": env!("CARGO_PKG_VERSION")
                }))
            }))
            // Static file serving for uploads
            .service(Files::new("/uploads", "uploads").show_files_listing())
            // API Routes
            .configure(configure_routes)
            // 404 handler
            .default_service(web::route().to(|| async {
                HttpResponse::NotFound().json(json!({
                    "success": false,
                    "error": {
                        "message": "Route not found",
                        "statusCode": 404
                    }
                }))
            }))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
