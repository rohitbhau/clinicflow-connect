use actix_web::{web, HttpRequest, HttpResponse};
use actix_multipart::Multipart;
use futures_util::TryStreamExt;
use serde_json::json;
use std::io::Write;
use std::path::Path;
use std::fs;
use uuid::Uuid;

use crate::config::AppState;
use crate::errors::ApiError;
use crate::routes::auth::extract_claims;

fn get_uploads_dir() -> String {
    std::env::var("UPLOADS_DIR").unwrap_or_else(|_| {
        // Try to create uploads dir relative to current working directory
        let path = "uploads";
        if !std::path::Path::new(path).exists() {
            let _ = fs::create_dir_all(path);
        }
        path.to_string()
    })
}

pub async fn upload_image(
    req: HttpRequest,
    _state: web::Data<AppState>,
    mut payload: Multipart,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;

    let uploads_dir = get_uploads_dir();
    fs::create_dir_all(&uploads_dir)
        .map_err(|e| ApiError::internal(format!("Failed to create uploads directory: {}", e)))?;

    while let Some(mut field) = payload.try_next().await
        .map_err(|e| ApiError::bad_request(format!("Multipart error: {}", e)))? 
    {
        let content_type = field.content_type().cloned();
        let mime_type = content_type.as_ref().map(|m| m.to_string()).unwrap_or_default();
        
        // Check allowed types
        let allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
        if !allowed.contains(&mime_type.as_str()) {
            return Err(ApiError::bad_request("Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed"));
        }

        let content_disp = field.content_disposition();
        let original_name = content_disp.get_filename().unwrap_or("upload").to_string();
        
        // Get extension
        let ext = Path::new(&original_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg");
        
        // Sanitize and create unique filename
        let base_name = Path::new(&original_name)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("upload")
            .to_string();
        let safe_base: String = base_name.chars()
            .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '-' })
            .take(30)
            .collect();
        
        let unique_id = Uuid::new_v4().to_string().replace('-', "")[..8].to_string();
        let filename = format!("{}-{}.{}", safe_base, unique_id, ext);
        let filepath = format!("{}/{}", uploads_dir, filename);

        // Collect file data
        let mut file_data: Vec<u8> = Vec::new();
        let max_size = 5 * 1024 * 1024; // 5MB
        
        while let Some(chunk) = field.try_next().await
            .map_err(|e| ApiError::bad_request(format!("Error reading chunk: {}", e)))?
        {
            file_data.extend_from_slice(&chunk);
            if file_data.len() > max_size {
                return Err(ApiError::bad_request("File size exceeds 5MB limit"));
            }
        }

        // Write file
        let mut f = fs::File::create(&filepath)
            .map_err(|e| ApiError::internal(format!("Failed to create file: {}", e)))?;
        f.write_all(&file_data)
            .map_err(|e| ApiError::internal(format!("Failed to write file: {}", e)))?;

        let image_url = format!("/uploads/{}", filename);
        log::info!("Image uploaded: {} by user {}", filename, claims.id);

        return Ok(HttpResponse::Created().json(json!({
            "success": true,
            "data": {
                "url": image_url,
                "filename": filename,
                "originalName": original_name,
                "size": file_data.len(),
                "mimetype": mime_type,
            },
            "message": "Image uploaded successfully"
        })));
    }

    Err(ApiError::bad_request("No image file provided"))
}

pub async fn delete_image(
    req: HttpRequest,
    _state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let uploads_dir = get_uploads_dir();
    
    let filename = path.into_inner();
    // Sanitize - only keep the base filename, no path traversal
    let safe_filename = Path::new(&filename)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| ApiError::bad_request("Invalid filename"))?
        .to_string();

    let filepath = format!("{}/{}", uploads_dir, safe_filename);
    
    if !Path::new(&filepath).exists() {
        return Err(ApiError::not_found("File not found"));
    }

    fs::remove_file(&filepath)
        .map_err(|e| ApiError::internal(format!("Failed to delete file: {}", e)))?;

    log::info!("Image deleted: {} by user {}", safe_filename, claims.id);

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Image deleted successfully"
    })))
}
