use serde::{Deserialize, Serialize};
use bson::{oid::ObjectId, DateTime as BsonDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Address {
    #[serde(default)]
    pub street: String,
    #[serde(default)]
    pub city: String,
    #[serde(default)]
    pub state: String,
    #[serde(rename = "zipCode", default)]
    pub zip_code: String,
    #[serde(default = "default_country")]
    pub country: String,
}

fn default_country() -> String { "India".to_string() }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Hospital {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    pub address: Address,
    pub phone: String,
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub website: Option<String>,
    #[serde(rename = "licenseNumber")]
    pub license_number: String,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<BsonDateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<BsonDateTime>,
}

fn default_true() -> bool { true }
