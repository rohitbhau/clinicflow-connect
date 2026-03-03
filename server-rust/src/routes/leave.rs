use actix_web::{web, HttpRequest, HttpResponse};
use bson::{doc, DateTime as BsonDateTime, oid::ObjectId};
use serde::Deserialize;
use serde_json::json;
use mongodb::Collection;
use futures::TryStreamExt;
use chrono::Utc;

use crate::config::AppState;
use crate::errors::ApiError;
use crate::routes::auth::extract_claims;

async fn get_doctor_from_user(db: &mongodb::Database, user_id: ObjectId) -> Result<bson::Document, ApiError> {
    let doctors: Collection<bson::Document> = db.collection("doctors");
    doctors.find_one(doc! { "userId": user_id }, None).await?
        .ok_or_else(|| ApiError::not_found("Doctor profile not found"))
}

pub async fn get_leaves(
    req: HttpRequest,
    state: web::Data<AppState>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let leaves_col: Collection<bson::Document> = db.collection("doctorleaves");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let mut filter = doc! { "doctorId": doctor_id };

    if let (Some(from), Some(to)) = (query.get("from"), query.get("to")) {
        if let (Ok(from_d), Ok(to_d)) = (
            chrono::NaiveDate::parse_from_str(from, "%Y-%m-%d"),
            chrono::NaiveDate::parse_from_str(to, "%Y-%m-%d"),
        ) {
            let from_bson = BsonDateTime::from_millis(
                chrono::DateTime::<Utc>::from_naive_utc_and_offset(
                    chrono::NaiveDateTime::new(from_d, chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
                    Utc,
                ).timestamp_millis()
            );
            let to_bson = BsonDateTime::from_millis(
                chrono::DateTime::<Utc>::from_naive_utc_and_offset(
                    chrono::NaiveDateTime::new(to_d, chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
                    Utc,
                ).timestamp_millis()
            );
            filter.insert("date", doc! { "$gte": from_bson, "$lte": to_bson });
        }
    }

    let mut cursor = leaves_col.find(filter, mongodb::options::FindOptions::builder()
        .sort(doc! { "date": 1 })
        .build()
    ).await?;

    let mut leaves = Vec::new();
    while let Some(l) = cursor.try_next().await? {
        leaves.push(bson::from_document::<serde_json::Value>(l).unwrap_or(json!({})));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": leaves
    })))
}

#[derive(Deserialize)]
pub struct AddLeaveRequest {
    pub date: String,
    #[serde(rename = "type")]
    pub leave_type: String,
    #[serde(rename = "blockedSlots", default)]
    pub blocked_slots: Vec<String>,
    pub reason: Option<String>,
}

pub async fn add_leave(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<AddLeaveRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let leaves_col: Collection<bson::Document> = db.collection("doctorleaves");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    if body.date.is_empty() || body.leave_type.is_empty() {
        return Err(ApiError::bad_request("Date and type are required"));
    }

    if body.leave_type == "slot" && body.blocked_slots.is_empty() {
        return Err(ApiError::bad_request("At least one slot is required for slot-type leave"));
    }

    let leave_date = chrono::NaiveDate::parse_from_str(&body.date, "%Y-%m-%d")
        .map_err(|_| ApiError::bad_request("Invalid date format"))?;
    let leave_bson_start = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(leave_date, chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let leave_bson_end = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(leave_date, chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let existing = leaves_col.find_one(doc! {
        "doctorId": doctor_id,
        "date": { "$gte": leave_bson_start, "$lte": leave_bson_end }
    }, None).await?;

    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());

    if let Some(el) = existing {
        let el_type = el.get_str("type").unwrap_or("").to_string();
        let el_id = el.get_object_id("_id")
            .map_err(|_| ApiError::internal("Invalid leave ID"))?;

        if el_type == "full-day" {
            return Err(ApiError::bad_request("This date is already blocked as full-day leave"));
        }

        if body.leave_type == "full-day" {
            let updated = leaves_col.find_one_and_update(
                doc! { "_id": el_id },
                doc! { "$set": { "type": "full-day", "blockedSlots": bson::Bson::Array(vec![]), "updatedAt": now } },
                mongodb::options::FindOneAndUpdateOptions::builder()
                    .return_document(mongodb::options::ReturnDocument::After)
                    .build()
            ).await?;
            return Ok(HttpResponse::Ok().json(json!({
                "success": true,
                "data": bson::from_document::<serde_json::Value>(updated.unwrap()).unwrap_or(json!({})),
                "message": "Leave updated to full-day"
            })));
        }

        // Merge slots
        let existing_slots: Vec<bson::Bson> = el.get_array("blockedSlots")
            .unwrap_or(&bson::Array::new())
            .clone();
        let mut merged: Vec<String> = existing_slots.iter()
            .filter_map(|b| b.as_str().map(|s| s.to_string()))
            .collect();
        for slot in &body.blocked_slots {
            if !merged.contains(slot) {
                merged.push(slot.clone());
            }
        }
        let merged_bson: bson::Array = merged.iter().map(|s| bson::Bson::String(s.clone())).collect();

        let updated = leaves_col.find_one_and_update(
            doc! { "_id": el_id },
            doc! { "$set": { "blockedSlots": merged_bson, "updatedAt": now } },
            mongodb::options::FindOneAndUpdateOptions::builder()
                .return_document(mongodb::options::ReturnDocument::After)
                .build()
        ).await?;

        return Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "data": bson::from_document::<serde_json::Value>(updated.unwrap()).unwrap_or(json!({})),
            "message": "Blocked slots updated"
        })));
    }

    // Create new
    let blocked_bson: bson::Array = if body.leave_type == "full-day" {
        vec![]
    } else {
        body.blocked_slots.iter().map(|s| bson::Bson::String(s.clone())).collect()
    };

    let leave_id = ObjectId::new();
    let leave_doc = doc! {
        "_id": leave_id,
        "doctorId": doctor_id,
        "date": leave_bson_start,
        "type": &body.leave_type,
        "blockedSlots": blocked_bson,
        "reason": body.reason.clone().unwrap_or_default(),
        "createdAt": now,
        "updatedAt": now,
    };
    leaves_col.insert_one(leave_doc, None).await?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": {
            "_id": leave_id.to_hex(),
            "doctorId": doctor_id.to_hex(),
            "date": body.date,
            "type": &body.leave_type,
            "blockedSlots": &body.blocked_slots,
        },
        "message": "Leave added successfully"
    })))
}

pub async fn delete_leave(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let leaves_col: Collection<bson::Document> = db.collection("doctorleaves");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let leave_id = ObjectId::parse_str(&path.into_inner())
        .map_err(|_| ApiError::bad_request("Invalid leave ID"))?;

    let result = leaves_col.delete_one(doc! { "_id": leave_id, "doctorId": doctor_id }, None).await?;
    if result.deleted_count == 0 {
        return Err(ApiError::not_found("Leave not found"));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Leave deleted successfully"
    })))
}

#[derive(Deserialize)]
pub struct RemoveSlotRequest {
    pub slot: String,
}

pub async fn remove_slot_from_leave(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<RemoveSlotRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let leaves_col: Collection<bson::Document> = db.collection("doctorleaves");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    if body.slot.is_empty() {
        return Err(ApiError::bad_request("Slot is required"));
    }

    let leave_id = ObjectId::parse_str(&path.into_inner())
        .map_err(|_| ApiError::bad_request("Invalid leave ID"))?;

    let leave = leaves_col.find_one(doc! { "_id": leave_id, "doctorId": doctor_id }, None).await?
        .ok_or_else(|| ApiError::not_found("Leave not found"))?;

    if leave.get_str("type").unwrap_or("") == "full-day" {
        return Err(ApiError::bad_request("Cannot remove a slot from full-day leave. Delete the leave instead."));
    }

    let mut slots: Vec<String> = leave.get_array("blockedSlots")
        .unwrap_or(&bson::Array::new())
        .iter()
        .filter_map(|b| b.as_str().map(|s| s.to_string()))
        .collect();

    slots.retain(|s| s != &body.slot);

    if slots.is_empty() {
        leaves_col.delete_one(doc! { "_id": leave_id }, None).await?;
        return Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "All slots removed, leave entry deleted"
        })));
    }

    let slots_bson: bson::Array = slots.iter().map(|s| bson::Bson::String(s.clone())).collect();
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    let updated = leaves_col.find_one_and_update(
        doc! { "_id": leave_id },
        doc! { "$set": { "blockedSlots": slots_bson, "updatedAt": now } },
        mongodb::options::FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build()
    ).await?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": bson::from_document::<serde_json::Value>(updated.unwrap()).unwrap_or(json!({})),
        "message": "Slot removed from leave"
    })))
}

pub async fn get_blocked_dates(
    state: web::Data<AppState>,
    path: web::Path<String>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let leaves_col: Collection<bson::Document> = db.collection("doctorleaves");

    let doctor_id_str = path.into_inner();
    let doctor_id = ObjectId::parse_str(&doctor_id_str)
        .map_err(|_| ApiError::bad_request("Invalid doctor ID"))?;

    let mut filter = doc! { "doctorId": doctor_id };

    if let (Some(from), Some(to)) = (query.get("from"), query.get("to")) {
        if let (Ok(from_d), Ok(to_d)) = (
            chrono::NaiveDate::parse_from_str(from, "%Y-%m-%d"),
            chrono::NaiveDate::parse_from_str(to, "%Y-%m-%d"),
        ) {
            let from_bson = BsonDateTime::from_millis(
                chrono::DateTime::<Utc>::from_naive_utc_and_offset(
                    chrono::NaiveDateTime::new(from_d, chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
                    Utc,
                ).timestamp_millis()
            );
            let to_bson = BsonDateTime::from_millis(
                chrono::DateTime::<Utc>::from_naive_utc_and_offset(
                    chrono::NaiveDateTime::new(to_d, chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
                    Utc,
                ).timestamp_millis()
            );
            filter.insert("date", doc! { "$gte": from_bson, "$lte": to_bson });
        }
    }

    let mut cursor = leaves_col.find(filter, mongodb::options::FindOptions::builder()
        .sort(doc! { "date": 1 })
        .build()
    ).await?;

    let mut blocked_dates = Vec::new();
    while let Some(l) = cursor.try_next().await? {
        let date = l.get_datetime("date")
            .map(|d| {
                chrono::DateTime::<Utc>::from_timestamp_millis(d.timestamp_millis())
                    .map(|dt| dt.format("%Y-%m-%d").to_string())
                    .unwrap_or_default()
            })
            .unwrap_or_default();

        let slots: Vec<String> = l.get_array("blockedSlots")
            .unwrap_or(&bson::Array::new())
            .iter()
            .filter_map(|b| b.as_str().map(|s| s.to_string()))
            .collect();

        blocked_dates.push(json!({
            "date": date,
            "type": l.get_str("type").unwrap_or(""),
            "blockedSlots": slots
        }));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": blocked_dates
    })))
}
