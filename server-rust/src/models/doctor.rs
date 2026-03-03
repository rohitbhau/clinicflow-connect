use serde::{Deserialize, Serialize};
use bson::{oid::ObjectId, DateTime as BsonDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AvailableSlot {
    #[serde(rename = "dayOfWeek")]
    pub day_of_week: i32,
    #[serde(rename = "startTime")]
    pub start_time: String,
    #[serde(rename = "endTime")]
    pub end_time: String,
    #[serde(rename = "isAvailable", default = "default_true")]
    pub is_available: bool,
}

fn default_true() -> bool { true }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Doctor {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "userId")]
    pub user_id: ObjectId,
    #[serde(rename = "firstName")]
    pub first_name: String,
    #[serde(rename = "lastName")]
    pub last_name: String,
    pub specialization: String,
    pub qualification: String,
    pub phone: String,
    #[serde(rename = "licenseNumber")]
    pub license_number: String,
    #[serde(rename = "hospitalId")]
    pub hospital_id: ObjectId,
    #[serde(rename = "departmentId", skip_serializing_if = "Option::is_none")]
    pub department_id: Option<ObjectId>,
    #[serde(rename = "consultationFee", default)]
    pub consultation_fee: f64,
    #[serde(rename = "maxAppointmentsPerSlot", default = "default_max_appointments")]
    pub max_appointments_per_slot: i32,
    #[serde(rename = "availableSlots", default)]
    pub available_slots: Vec<AvailableSlot>,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<BsonDateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<BsonDateTime>,
}

fn default_max_appointments() -> i32 { 5 }
