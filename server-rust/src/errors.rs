use actix_web::{HttpResponse, ResponseError};
use serde_json::json;
use std::fmt;

#[derive(Debug)]
pub struct ApiError {
    pub message: String,
    pub status_code: u16,
}

impl ApiError {
    pub fn new(message: impl Into<String>, status_code: u16) -> Self {
        ApiError {
            message: message.into(),
            status_code,
        }
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        ApiError::new(message, 400)
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        ApiError::new(message, 401)
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        ApiError::new(message, 403)
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        ApiError::new(message, 404)
    }

    pub fn internal(message: impl Into<String>) -> Self {
        ApiError::new(message, 500)
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        let status = actix_web::http::StatusCode::from_u16(self.status_code)
            .unwrap_or(actix_web::http::StatusCode::INTERNAL_SERVER_ERROR);

        HttpResponse::build(status).json(json!({
            "success": false,
            "error": {
                "message": self.message,
                "statusCode": self.status_code
            }
        }))
    }
}

impl From<mongodb::error::Error> for ApiError {
    fn from(e: mongodb::error::Error) -> Self {
        log::error!("MongoDB error: {:?}", e);
        ApiError::internal("Database error")
    }
}

impl From<bcrypt::BcryptError> for ApiError {
    fn from(e: bcrypt::BcryptError) -> Self {
        log::error!("Bcrypt error: {:?}", e);
        ApiError::internal("Password hashing error")
    }
}

impl From<jsonwebtoken::errors::Error> for ApiError {
    fn from(e: jsonwebtoken::errors::Error) -> Self {
        use jsonwebtoken::errors::ErrorKind;
        match e.kind() {
            ErrorKind::ExpiredSignature => ApiError::unauthorized("Token expired"),
            _ => ApiError::unauthorized("Invalid token"),
        }
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
