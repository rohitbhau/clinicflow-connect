use actix_web::{web, HttpRequest, HttpResponse};
use bson::{doc, oid::ObjectId};
use serde_json::json;
use mongodb::Collection;
use futures::TryStreamExt;

use crate::config::AppState;
use crate::errors::ApiError;
use crate::routes::auth::extract_claims;

pub async fn get_patients(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let patients_col: Collection<bson::Document> = db.collection("patients");

    // Hospital admins can see all patients for their hospital
    let hospital_name = claims.hospital_name.clone().unwrap_or_default();

    let filter = if !hospital_name.is_empty() {
        let hospitals: Collection<bson::Document> = db.collection("hospitals");
        if let Some(hospital) = hospitals.find_one(doc! { "name": &hospital_name }, None).await? {
            if let Ok(hospital_id) = hospital.get_object_id("_id") {
                doc! { "hospitalId": hospital_id }
            } else {
                doc! {}
            }
        } else {
            doc! {}
        }
    } else {
        doc! {}
    };

    let mut cursor = patients_col.find(filter, None).await?;
    let mut patients = Vec::new();
    while let Some(p) = cursor.try_next().await? {
        patients.push(bson::from_document::<serde_json::Value>(p).unwrap_or(json!({})));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": patients
    })))
}

pub async fn get_patient(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let _claims = extract_claims(&req)?;
    let db = &state.db;
    let patients_col: Collection<bson::Document> = db.collection("patients");

    let patient_id = ObjectId::parse_str(&path.into_inner())
        .map_err(|_| ApiError::bad_request("Invalid patient ID"))?;

    let patient = patients_col.find_one(doc! { "_id": patient_id }, None).await?
        .ok_or_else(|| ApiError::not_found("Patient not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": bson::from_document::<serde_json::Value>(patient).unwrap_or(json!({}))
    })))
}
