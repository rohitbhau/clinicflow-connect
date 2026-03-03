use actix_web::{
    dev::ServiceRequest,
    web,
    HttpMessage,
};
use actix_web_httpauth::extractors::bearer::BearerAuth;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use std::env;
use crate::errors::ApiError;
use crate::config::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub id: String,
    pub role: String,
    #[serde(rename = "hospitalName", skip_serializing_if = "Option::is_none")]
    pub hospital_name: Option<String>,
    pub exp: usize,
    pub iat: usize,
}

pub fn decode_token(token: &str) -> Result<Claims, ApiError> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-super-secret-jwt-key-change-in-production".to_string());
    let key = DecodingKey::from_secret(secret.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 0;

    decode::<Claims>(token, &key, &validation)
        .map(|data| data.claims)
        .map_err(|e| {
            use jsonwebtoken::errors::ErrorKind;
            match e.kind() {
                ErrorKind::ExpiredSignature => ApiError::unauthorized("Token expired"),
                _ => ApiError::unauthorized("Invalid token"),
            }
        })
}

pub fn generate_token(id: &str, role: &str, hospital_name: Option<&str>) -> Result<String, ApiError> {
    use jsonwebtoken::{encode, EncodingKey, Header};
    
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-super-secret-jwt-key-change-in-production".to_string());
    let expires = env::var("JWT_EXPIRES_IN").unwrap_or_else(|_| "7d".to_string());
    
    // Parse expires (e.g. "7d" -> 7 days)
    let duration_secs: usize = if expires.ends_with('d') {
        expires.trim_end_matches('d').parse::<usize>().unwrap_or(7) * 86400
    } else if expires.ends_with('h') {
        expires.trim_end_matches('h').parse::<usize>().unwrap_or(24) * 3600
    } else {
        86400 * 7
    };

    let now = chrono::Utc::now().timestamp() as usize;
    let claims = Claims {
        id: id.to_string(),
        role: role.to_string(),
        hospital_name: hospital_name.map(|s| s.to_string()),
        exp: now + duration_secs,
        iat: now,
    };

    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
        .map_err(|e| ApiError::internal(format!("Failed to generate token: {}", e)))
}

pub async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, (actix_web::Error, ServiceRequest)> {
    let token = credentials.token();
    match decode_token(token) {
        Ok(claims) => {
            req.extensions_mut().insert(claims);
            Ok(req)
        }
        Err(e) => Err((e.into(), req)),
    }
}
