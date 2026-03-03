use actix_web::{web, HttpRequest, HttpResponse};
use bson::{doc, DateTime as BsonDateTime, oid::ObjectId};
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

pub async fn check_in(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let attendance_col: Collection<bson::Document> = db.collection("attendances");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let now = Utc::now();
    let today_start = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let today_end = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    if attendance_col.find_one(doc! {
        "doctorId": doctor_id,
        "date": { "$gte": today_start, "$lte": today_end }
    }, None).await?.is_some() {
        return Err(ApiError::bad_request("Already checked in for today"));
    }

    let now_bson = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    let att_id = ObjectId::new();
    let att_doc = doc! {
        "_id": att_id,
        "doctorId": doctor_id,
        "date": today_start,
        "checkIn": now_bson,
        "checkOut": bson::Bson::Null,
        "totalHours": 0.0,
        "status": "present",
        "createdAt": now_bson,
        "updatedAt": now_bson,
    };

    attendance_col.insert_one(att_doc, None).await?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": {
            "_id": att_id.to_hex(),
            "doctorId": doctor_id.to_hex(),
            "checkIn": chrono::DateTime::<Utc>::from_timestamp_millis(Utc::now().timestamp_millis()).map(|d| d.to_rfc3339()),
            "status": "present"
        },
        "message": "Checked in successfully"
    })))
}

pub async fn check_out(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let attendance_col: Collection<bson::Document> = db.collection("attendances");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let now = Utc::now();
    let today_start = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let today_end = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let att = attendance_col.find_one(doc! {
        "doctorId": doctor_id,
        "date": { "$gte": today_start, "$lte": today_end }
    }, None).await?
    .ok_or_else(|| ApiError::bad_request("You have not checked in today"))?;

    if att.get_datetime("checkOut").is_ok() {
        return Err(ApiError::bad_request("Already checked out today"));
    }

    let check_in_ms = att.get_datetime("checkIn")
        .map_err(|_| ApiError::internal("Invalid checkIn time"))?.timestamp_millis();

    let now_ms = Utc::now().timestamp_millis();
    let total_hours = (now_ms - check_in_ms) as f64 / (1000.0 * 60.0 * 60.0);
    let total_hours = (total_hours * 100.0).round() / 100.0;

    let now_bson = BsonDateTime::from_millis(now_ms);
    let att_id = att.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid attendance ID"))?;

    attendance_col.update_one(
        doc! { "_id": att_id },
        doc! { "$set": { "checkOut": now_bson, "totalHours": total_hours, "updatedAt": now_bson } },
        None,
    ).await?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "_id": att_id.to_hex(),
            "checkOut": chrono::DateTime::<Utc>::from_timestamp_millis(now_ms).map(|d| d.to_rfc3339()),
            "totalHours": total_hours
        },
        "message": "Checked out successfully"
    })))
}

pub async fn get_status(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let attendance_col: Collection<bson::Document> = db.collection("attendances");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let now = Utc::now();
    let today_start = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let today_end = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let att = attendance_col.find_one(doc! {
        "doctorId": doctor_id,
        "date": { "$gte": today_start, "$lte": today_end }
    }, None).await?;

    let (checked_in, checked_out, check_in_time, check_out_time, total_hours) = if let Some(a) = att {
        let ci = a.get_datetime("checkIn").ok()
            .and_then(|d| chrono::DateTime::<Utc>::from_timestamp_millis(d.timestamp_millis()))
            .map(|d| d.to_rfc3339());
        let co = a.get_datetime("checkOut").ok()
            .and_then(|d| chrono::DateTime::<Utc>::from_timestamp_millis(d.timestamp_millis()))
            .map(|d| d.to_rfc3339());
        let th = a.get_f64("totalHours").unwrap_or(0.0);
        (true, co.is_some(), ci, co, th)
    } else {
        (false, false, None, None, 0.0)
    };

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "checkedIn": checked_in,
            "checkedOut": checked_out,
            "checkInTime": check_in_time,
            "checkOutTime": check_out_time,
            "totalHours": total_hours
        }
    })))
}

pub async fn get_history(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let attendance_col: Collection<bson::Document> = db.collection("attendances");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;
    let doctor = get_doctor_from_user(db, user_id).await?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let mut cursor = attendance_col.find(
        doc! { "doctorId": doctor_id },
        mongodb::options::FindOptions::builder()
            .sort(doc! { "date": -1 })
            .limit(30)
            .build(),
    ).await?;

    let mut history = Vec::new();
    while let Some(rec) = cursor.try_next().await? {
        history.push(bson::from_document::<serde_json::Value>(rec).unwrap_or(json!({})));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": history
    })))
}
