use serde::{Deserialize, Serialize};
use bson::{oid::ObjectId, DateTime as BsonDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DoctorLeave {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(rename = "doctorId")]
    pub doctor_id: ObjectId,
    pub date: BsonDateTime,
    #[serde(rename = "type")]
    pub leave_type: String,
    #[serde(rename = "blockedSlots", default)]
    pub blocked_slots: Vec<String>,
    #[serde(default)]
    pub reason: String,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<BsonDateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<BsonDateTime>,
}
