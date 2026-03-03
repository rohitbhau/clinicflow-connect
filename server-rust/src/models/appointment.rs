use serde::{Deserialize, Serialize};
use bson::{oid::ObjectId, DateTime as BsonDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Appointment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "patientId", skip_serializing_if = "Option::is_none")]
    pub patient_id: Option<ObjectId>,
    #[serde(rename = "patientName", skip_serializing_if = "Option::is_none")]
    pub patient_name: Option<String>,
    #[serde(rename = "patientEmail", skip_serializing_if = "Option::is_none")]
    pub patient_email: Option<String>,
    #[serde(rename = "patientPhone", skip_serializing_if = "Option::is_none")]
    pub patient_phone: Option<String>,
    #[serde(rename = "doctorId")]
    pub doctor_id: ObjectId,
    #[serde(rename = "hospitalId")]
    pub hospital_id: ObjectId,
    #[serde(rename = "appointmentDate")]
    pub appointment_date: BsonDateTime,
    #[serde(rename = "startTime")]
    pub start_time: String,
    #[serde(rename = "endTime")]
    pub end_time: String,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(rename = "type", default = "default_type")]
    pub appointment_type: String,
    #[serde(default)]
    pub reason: String,
    #[serde(default)]
    pub notes: String,
    #[serde(default)]
    pub fee: f64,
    #[serde(rename = "paymentStatus", default = "default_payment_status")]
    pub payment_status: String,
    #[serde(rename = "tokenNumber", skip_serializing_if = "Option::is_none")]
    pub token_number: Option<String>,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<BsonDateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<BsonDateTime>,
}

fn default_status() -> String { "scheduled".to_string() }
fn default_type() -> String { "consultation".to_string() }
fn default_payment_status() -> String { "pending".to_string() }
