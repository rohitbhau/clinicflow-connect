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

#[derive(Deserialize)]
pub struct BookAppointmentRequest {
    #[serde(rename = "doctorId")]
    pub doctor_id: String,
    #[serde(rename = "patientName")]
    pub patient_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub date: String,
    pub time: String,
    #[serde(rename = "appointmentType")]
    pub appointment_type: Option<String>,
    pub notes: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
}

async fn find_doctor(db: &mongodb::Database, id: &str) -> Result<Option<bson::Document>, mongodb::error::Error> {
    let doctors: Collection<bson::Document> = db.collection("doctors");
    // Try by _id first
    if let Ok(oid) = ObjectId::parse_str(id) {
        if let Some(doc) = doctors.find_one(doc! { "_id": oid }, None).await? {
            return Ok(Some(doc));
        }
        // Try by userId
        if let Some(doc) = doctors.find_one(doc! { "userId": oid }, None).await? {
            return Ok(Some(doc));
        }
    }
    Ok(None)
}

pub async fn book_appointment(
    state: web::Data<AppState>,
    body: web::Json<BookAppointmentRequest>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");
    let leaves: Collection<bson::Document> = db.collection("doctorleaves");

    if body.doctor_id.is_empty() || body.patient_name.is_empty() || body.date.is_empty() || body.time.is_empty() {
        return Err(ApiError::bad_request("Missing required fields"));
    }

    let doctor = find_doctor(db, &body.doctor_id).await?
        .ok_or_else(|| ApiError::not_found("Doctor not found"))?;

    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;
    let hospital_id = doctor.get_object_id("hospitalId")
        .map_err(|_| ApiError::internal("Invalid hospital ID"))?;
    let max_appointments = doctor.get_i32("maxAppointmentsPerSlot").unwrap_or(5);

    // Parse date
    let date_obj = chrono::NaiveDate::parse_from_str(&body.date, "%Y-%m-%d")
        .map_err(|_| ApiError::bad_request("Invalid date format. Use YYYY-MM-DD"))?;
    let date_str = date_obj.format("%Y%m%d").to_string();

    // Check for doctor leave
    let leave_start = chrono::DateTime::<Utc>::from_naive_utc_and_offset(
        chrono::NaiveDateTime::new(date_obj, chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
        Utc,
    );
    let leave_end = chrono::DateTime::<Utc>::from_naive_utc_and_offset(
        chrono::NaiveDateTime::new(date_obj, chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
        Utc,
    );
    let leave_bson_start = BsonDateTime::from_millis(leave_start.timestamp_millis());
    let leave_bson_end = BsonDateTime::from_millis(leave_end.timestamp_millis());

    if let Some(leave) = leaves.find_one(doc! {
        "doctorId": doctor_id,
        "date": { "$gte": leave_bson_start, "$lte": leave_bson_end }
    }, None).await? {
        let leave_type = leave.get_str("type").unwrap_or("");
        if leave_type == "full-day" {
            return Err(ApiError::bad_request("Doctor is not available on this date. Please choose a different date."));
        }
        if leave_type == "slot" {
            let blocked: Vec<String> = leave.get_array("blockedSlots")
                .unwrap_or(&bson::Array::new())
                .iter()
                .filter_map(|b| b.as_str().map(|s| s.to_string()))
                .collect();
            if blocked.contains(&body.time) {
                return Err(ApiError::bad_request("This time slot is blocked by the doctor. Please choose a different slot."));
            }
        }
    }

    // Check slot count
    let existing_count = appointments.count_documents(doc! {
        "doctorId": doctor_id,
        "appointmentDate": { "$gte": leave_bson_start, "$lte": leave_bson_end },
        "startTime": &body.time,
        "status": { "$ne": "cancelled" }
    }, None).await? as i32;

    if existing_count >= max_appointments {
        return Err(ApiError::bad_request("Appointment slot is already full. Please choose a different slot."));
    }

    // Generate token number
    let last_appt = appointments.find_one(
        doc! {
            "doctorId": doctor_id,
            "appointmentDate": { "$gte": leave_bson_start, "$lte": leave_bson_end }
        },
        mongodb::options::FindOneOptions::builder()
            .sort(doc! { "tokenNumber": -1 })
            .build()
    ).await?;

    let mut next_serial = 1u32;
    if let Some(last) = last_appt {
        if let Ok(token) = last.get_str("tokenNumber") {
            let parts: Vec<&str> = token.split('-').collect();
            if parts.len() == 3 {
                if let Ok(n) = parts[2].parse::<u32>() {
                    next_serial = n + 1;
                }
            }
        }
    }

    // Doctor initials
    let first_initial = doctor.get_str("firstName").unwrap_or("D").chars().next().unwrap_or('D').to_ascii_uppercase();
    let last_initial = doctor.get_str("lastName").unwrap_or("R").chars().next().unwrap_or('R').to_ascii_uppercase();
    let token_number = format!("{}-{}{}-{:03}", date_str, first_initial, last_initial, next_serial);

    let appt_type = body.appointment_type.clone().unwrap_or_else(|| "consultation".to_string()).to_lowercase();

    let appt_id = ObjectId::new();
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    let appt_date = BsonDateTime::from_millis(leave_start.timestamp_millis());

    let appt_doc = doc! {
        "_id": appt_id,
        "doctorId": doctor_id,
        "hospitalId": hospital_id,
        "patientName": &body.patient_name,
        "patientEmail": body.email.clone().unwrap_or_default(),
        "patientPhone": body.phone.clone().unwrap_or_default(),
        "appointmentDate": appt_date,
        "startTime": &body.time,
        "endTime": &body.time,
        "type": &appt_type,
        "reason": &appt_type,
        "notes": body.notes.clone().unwrap_or_default(),
        "status": "scheduled",
        "tokenNumber": &token_number,
        "fee": 0.0,
        "paymentStatus": "pending",
        "createdAt": &now,
        "updatedAt": &now,
    };

    appointments.insert_one(appt_doc.clone(), None).await?;

    Ok(HttpResponse::Created().json(json!({
        "success": true,
        "data": {
            "_id": appt_id.to_hex(),
            "doctorId": doctor_id.to_hex(),
            "hospitalId": hospital_id.to_hex(),
            "patientName": &body.patient_name,
            "patientEmail": body.email,
            "patientPhone": body.phone,
            "appointmentDate": body.date,
            "startTime": &body.time,
            "type": &appt_type,
            "status": "scheduled",
            "tokenNumber": &token_number,
        },
        "message": "Appointment booked successfully"
    })))
}

pub async fn get_queue_status(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");
    let doctor_id_str = path.into_inner();

    let doctor = find_doctor(db, &doctor_id_str).await?
        .ok_or_else(|| ApiError::not_found("Doctor not found"))?;

    let doctor_id = doctor.get_object_id("_id")
        .map_err(|_| ApiError::internal("Invalid doctor ID"))?;

    let now = Utc::now();
    let start_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let end_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let current = appointments.find_one(doc! {
        "doctorId": doctor_id,
        "status": "in-progress",
        "appointmentDate": { "$gte": start_of_day, "$lte": end_of_day }
    }, None).await?;

    let mut cursor = appointments.find(doc! {
        "doctorId": doctor_id,
        "status": "scheduled",
        "appointmentDate": { "$gte": start_of_day, "$lte": end_of_day }
    }, mongodb::options::FindOptions::builder()
        .sort(doc! { "tokenNumber": 1 })
        .limit(5)
        .build()
    ).await?;

    let mut queue = Vec::new();
    while let Some(appt) = cursor.try_next().await? {
        queue.push(json!({
            "tokenNumber": appt.get_str("tokenNumber").unwrap_or(""),
            "patientName": appt.get_str("patientName").unwrap_or("Unknown"),
            "_id": appt.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default()
        }));
    }

    let current_json = current.map(|c| json!({
        "tokenNumber": c.get_str("tokenNumber").unwrap_or(""),
        "patientName": c.get_str("patientName").unwrap_or("Unknown"),
        "_id": c.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default()
    }));

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "current": current_json,
            "queue": queue,
            "doctor": {
                "name": format!("{} {}", doctor.get_str("firstName").unwrap_or(""), doctor.get_str("lastName").unwrap_or("")),
                "specialization": doctor.get_str("specialization").unwrap_or("")
            }
        }
    })))
}

pub async fn get_all_queues_status(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");
    let doctors_col: Collection<bson::Document> = db.collection("doctors");
    let hospitals_col: Collection<bson::Document> = db.collection("hospitals");

    let hospital_id_str = path.into_inner();
    let hospital_id = ObjectId::parse_str(&hospital_id_str)
        .map_err(|_| ApiError::bad_request("Invalid hospital ID"))?;

    let now = Utc::now();
    let start_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(0, 0, 0).unwrap()),
            Utc,
        ).timestamp_millis()
    );
    let end_of_day = BsonDateTime::from_millis(
        chrono::DateTime::<Utc>::from_naive_utc_and_offset(
            chrono::NaiveDateTime::new(now.date_naive(), chrono::NaiveTime::from_hms_opt(23, 59, 59).unwrap()),
            Utc,
        ).timestamp_millis()
    );

    let mut doctors_cursor = doctors_col.find(doc! { "hospitalId": hospital_id }, None).await?;
    let mut queues = Vec::new();

    while let Some(doctor) = doctors_cursor.try_next().await? {
        let doc_id = match doctor.get_object_id("_id") {
            Ok(id) => id,
            Err(_) => continue,
        };

        let current = appointments.find_one(doc! {
            "doctorId": doc_id,
            "status": "in-progress",
            "appointmentDate": { "$gte": start_of_day, "$lte": end_of_day }
        }, None).await?;

        let mut waiting_cursor = appointments.find(doc! {
            "doctorId": doc_id,
            "status": "scheduled",
            "appointmentDate": { "$gte": start_of_day, "$lte": end_of_day }
        }, mongodb::options::FindOptions::builder()
            .sort(doc! { "tokenNumber": 1 })
            .limit(10)
            .build()
        ).await?;

        let mut waiting = Vec::new();
        while let Some(appt) = waiting_cursor.try_next().await? {
            waiting.push(json!({
                "tokenNumber": appt.get_str("tokenNumber").unwrap_or(""),
                "patientName": appt.get_str("patientName").unwrap_or("Unknown"),
                "_id": appt.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default()
            }));
        }

        let queue_count = waiting.len();
        let current_json = current.map(|c| json!({
            "tokenNumber": c.get_str("tokenNumber").unwrap_or(""),
            "patientName": c.get_str("patientName").unwrap_or("Unknown"),
            "_id": c.get_object_id("_id").map(|id| id.to_hex()).unwrap_or_default()
        }));

        queues.push(json!({
            "doctor": {
                "id": doc_id.to_hex(),
                "name": format!("{} {}", doctor.get_str("firstName").unwrap_or(""), doctor.get_str("lastName").unwrap_or("")),
                "specialization": doctor.get_str("specialization").unwrap_or("")
            },
            "current": current_json,
            "queue": waiting,
            "queueCount": queue_count
        }));
    }

    let hospital = hospitals_col.find_one(doc! { "_id": hospital_id }, None).await?;
    let hospital_name = hospital.as_ref()
        .and_then(|h| h.get_str("name").ok())
        .unwrap_or("Hospital Queue");

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": {
            "queues": queues,
            "hospitalId": hospital_id_str,
            "hospitalName": hospital_name
        }
    })))
}

pub async fn update_status(
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<UpdateStatusRequest>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");

    let appt_id = ObjectId::parse_str(&path.into_inner())
        .map_err(|_| ApiError::bad_request("Invalid appointment ID"))?;

    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    let updated = appointments.find_one_and_update(
        doc! { "_id": appt_id },
        doc! { "$set": { "status": &body.status, "updatedAt": now } },
        mongodb::options::FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build(),
    ).await?
    .ok_or_else(|| ApiError::not_found("Appointment not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": bson::from_document::<serde_json::Value>(updated).unwrap_or(json!({})),
        "message": "Appointment status updated"
    })))
}

pub async fn update_appointment_details(
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, ApiError> {
    let db = &state.db;
    let appointments: Collection<bson::Document> = db.collection("appointments");

    let appt_id = ObjectId::parse_str(&path.into_inner())
        .map_err(|_| ApiError::bad_request("Invalid appointment ID"))?;

    let mut update_doc = doc! {};
    if let Some(obj) = body.as_object() {
        for (k, v) in obj {
            let val = if k == "type" {
                bson::Bson::String(v.as_str().unwrap_or("").to_lowercase())
            } else {
                bson_from_json(v)
            };
            update_doc.insert(k.clone(), val);
        }
    }
    let now = BsonDateTime::from_millis(Utc::now().timestamp_millis());
    update_doc.insert("updatedAt", now);

    let updated = appointments.find_one_and_update(
        doc! { "_id": appt_id },
        doc! { "$set": update_doc },
        mongodb::options::FindOneAndUpdateOptions::builder()
            .return_document(mongodb::options::ReturnDocument::After)
            .build(),
    ).await?
    .ok_or_else(|| ApiError::not_found("Appointment not found"))?;

    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "data": bson::from_document::<serde_json::Value>(updated).unwrap_or(json!({})),
        "message": "Appointment updated successfully"
    })))
}

fn bson_from_json(v: &serde_json::Value) -> bson::Bson {
    match v {
        serde_json::Value::Null => bson::Bson::Null,
        serde_json::Value::Bool(b) => bson::Bson::Boolean(*b),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() { bson::Bson::Int64(i) }
            else if let Some(f) = n.as_f64() { bson::Bson::Double(f) }
            else { bson::Bson::Null }
        },
        serde_json::Value::String(s) => bson::Bson::String(s.clone()),
        serde_json::Value::Array(arr) => bson::Bson::Array(arr.iter().map(bson_from_json).collect()),
        serde_json::Value::Object(obj) => {
            let doc: bson::Document = obj.iter().map(|(k, v)| (k.clone(), bson_from_json(v))).collect();
            bson::Bson::Document(doc)
        }
    }
}
