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

pub async fn get_dashboard_stats(
    req: HttpRequest,
    state: web::Data<AppState>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let doctor = doctors_col.find_one(doc! { "userId": user_id }, None).await?
        .ok_or_else(|| ApiError::not_found("Doctor profile not found"))?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let query_date = if let Some(date_str) = query.get("date") {
        chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
            .map(|d| d)
            .unwrap_or_else(|_| Utc::now().date_naive())
    } else {
        Utc::now().date_naive()
    };

    let start_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(query_date, chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let end_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(query_date, chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let mut appt_cursor = appointments.find(doc! {
        "doctorId": doctor_id,
        "appointmentDate": { "$gte": start_of_day, "$lte": end_of_day }
    }, mongodb::options::FindOptions::builder()
        .sort(doc! { "startTime": 1 })
        .build()
    ).await?;

    let mut today_appointments = Vec::new();
    let mut today_revenue = 0.0f64;
    let mut pending_count = 0i64;

    while let Some(appt) = appt_cursor.try_next().await? {
        let status = appt.get_str("status").unwrap_or("");
        if status == "scheduled" || status == "in-progress" {
            pending_count += 1;
        }
        if status == "completed" {
            today_revenue += appt.get_f64("fee").unwrap_or(0.0);
        }
        today_appointments.push(json!({
            "id": appt.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default(),
            "patientName": appt.get_str("patientName").unwrap_or("Guest"),
            "patientPhone": appt.get_str("patientPhone").unwrap_or(""),
            "date": query_date.format("%Y-%m-%d").to_string(),
            "time": appt.get_str("startTime").unwrap_or(""),
            "type": appt.get_str("type").unwrap_or(""),
            "status": status,
            "reason": appt.get_str("reason").unwrap_or(""),
            "tokenNumber": appt.get_str("tokenNumber").unwrap_or("")
        }));
    }

    let appointments_count = today_appointments.len() as i64;

    // Total unique patients
    let unique_patients = appointments.distinct("patientName", doc! { "doctorId": doctor_id }, None).await?;
    let total_patients = unique_patients.len() as i64;

    // Total appointments
    let total_appointments = appointments.count_documents(doc! { "doctorId": doctor_id }, None).await? as i64;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "stats": {
                "todayAppointments": appointments_count,
                "pendingAppointments": pending_count,
                "totalPatients": total_patients,
                "todayRevenue": today_revenue,
                "totalAppointments": total_appointments
            },
            "appointments": today_appointments
        }
    })))
}

pub async fn get_upcoming_appointments(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let doctor = doctors_col.find_one(doc! { "userId": user_id }, None).await?
        .ok_or_else(|| ApiError::not_found("Doctor profile not found"))?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let start_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(Utc::now().date_naive(), chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let mut cursor = appointments.find(doc! {
        "doctorId": doctor_id,
        "appointmentDate": { "$gte": start_of_day }
    }, mongodb::options::FindOptions::builder()
        .sort(doc! { "appointmentDate": 1, "startTime": 1 })
        .build()
    ).await?;

    let mut result = Vec::new();
    while let Some(appt) = cursor.try_next().await? {
        let date = appt.get_datetime("appointmentDate")
            .map(|d| {
                let ts = d.timestamp_millis();
                let naive = chrono::DateTime::<Utc>::from_timestamp_millis(ts)
                    .map(|dt| dt.format("%Y-%m-%d").to_string())
                    .unwrap_or_default();
                naive
            })
            .unwrap_or_default();

        result.push(json!({
            "id": appt.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default(),
            "patientName": appt.get_str("patientName").unwrap_or("Guest"),
            "patientPhone": appt.get_str("patientPhone").unwrap_or(""),
            "date": date,
            "time": appt.get_str("startTime").unwrap_or(""),
            "type": appt.get_str("type").unwrap_or(""),
            "status": appt.get_str("status").unwrap_or(""),
            "reason": appt.get_str("reason").unwrap_or(""),
            "tokenNumber": appt.get_str("tokenNumber").unwrap_or("")
        }));
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": result
    })))
}

pub async fn get_patients(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let doctor = doctors_col.find_one(doc! { "userId": user_id }, None).await?
        .ok_or_else(|| ApiError::not_found("Doctor profile not found"))?;
    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    // Aggregate unique patients by phone
    let pipeline = vec![
        doc! { "$match": { "doctorId": doctor_id } },
        doc! {
            "$group": {
                "_id": "$patientPhone",
                "name": { "$first": "$patientName" },
                "email": { "$first": "$patientEmail" },
                "phone": { "$first": "$patientPhone" },
                "lastVisit": { "$max": "$appointmentDate" },
                "totalVisits": { "$sum": 1 }
            }
        },
        doc! { "$sort": { "lastVisit": -1 } }
    ];

    let mut cursor = appointments.aggregate(pipeline, None).await?;
    let mut patients = Vec::new();

    let mut idx = 0;
    while let Some(p) = cursor.try_next().await? {
        let last_visit = p.get_datetime("lastVisit")
            .map(|d| {
                chrono::DateTime::<Utc>::from_timestamp_millis(d.timestamp_millis())
                    .map(|dt| dt.format("%Y-%m-%d").to_string())
                    .unwrap_or_default()
            })
            .unwrap_or_default();

        patients.push(json!({
            "id": format!("temp-{}", idx),
            "name": p.get_str("name").unwrap_or("Guest Patient"),
            "email": p.get_str("email").unwrap_or(""),
            "phone": p.get_str("phone").unwrap_or("N/A"),
            "lastVisit": last_visit,
            "totalVisits": p.get_i32("totalVisits").or_else(|_| p.get_i64("totalVisits").map(|n| n as i32)).unwrap_or(0),
            "status": "active",
            "doctorId": doctor_id.to_hex()
        }));
        idx += 1;
    }

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": patients
    })))
}

pub async fn get_profile(
    req: HttpRequest,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let doctor = doctors_col.find_one(doc! { "userId": user_id }, None).await?
        .ok_or_else(|| ApiError::not_found("Doctor profile not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": bson::from_document::<serde_json::Value>(doctor).unwrap_or(json!({}))
    })))
}

#[derive(Deserialize)]
pub struct UpdateDoctorProfileRequest {
    pub specialization: Option<String>,
    pub qualification: Option<String>,
    pub phone: Option<String>,
    #[serde(rename = "consultationFee")]
    pub consultation_fee: Option<f64>,
    #[serde(rename = "maxAppointmentsPerSlot")]
    pub max_appointments_per_slot: Option<i32>,
    #[serde(rename = "availableSlots")]
    pub available_slots: Option<serde_json::Value>,
}

pub async fn update_profile(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_claims(&req)?;
    let db = &state.db;
    let doctors_col: Collection<bson::Document> = db.collection("doctors");

    let user_id = ObjectId::parse_str(&claims.id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let mut set_doc = doc! {};
    if let Some(obj) = body.as_object() {
        for (k, v) in obj {
            set_doc.insert(k.clone(), json_to_bson(v));
        }
    }
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    set_doc.insert("updatedAt", now);

    let updated = doctors_col.find_one_and_update(
        doc! { "userId": user_id },
        doc! { "$set": set_doc },
        mongodb::options::FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build(),
    ).await?
    .ok_or_else(|| ApiError::not_found("Doctor profile not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": bson::from_document::<serde_json::Value>(updated).unwrap_or(json!({})),
        "message": "Profile updated successfully"
    })))
}

fn json_to_bson(v: &serde_json::Value) -> bson::Bson {
    match v {
        serde_json::Value::Null => bson::Bson::Null,
        serde_json::Value::Bool(b) => bson::Bson::Boolean(*b),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() { bson::Bson::Int64(i) }
            else if let Some(f) = n.as_f64() { bson::Bson::Double(f) }
            else { bson::Bson::Null }
        },
        serde_json::Value::String(s) => bson::Bson::String(s.clone()),
        serde_json::Value::Array(arr) => bson::Bson::Array(arr.iter().map(json_to_bson).collect()),
        serde_json::Value::Object(obj) => {
            let doc: bson::Document = obj.iter().map(|(k, v)| (k.clone(), json_to_bson(v))).collect();
            bson::Bson::Document(doc)
        }
    }
}
