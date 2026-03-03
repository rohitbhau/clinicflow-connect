use serde::{Deserialize, Serialize};
use bson::{oid::ObjectId, DateTime as BsonDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Attendance {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "doctorId")]
    pub doctor_id: ObjectId,
    pub date: BsonDateTime,
    #[serde(rename = "checkIn")]
    pub check_in: BsonDateTime,
    #[serde(rename = "checkOut", skip_serializing_if = "Option::is_none")]
    pub check_out: Option<BsonDateTime>,
    #[serde(rename = "totalHours", default)]
    pub total_hours: f64,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<BsonDateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<BsonDateTime>,
}

fn default_status() -> String { "present".to_string() }
