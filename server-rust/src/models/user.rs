use serde::{Deserialize, Serialize};
use bson::{oid::ObjectId, DateTime as BsonDateTime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub email: String,
    #[serde(skip_serializing)]
    pub password: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temp_password: Option<String>,
    pub name: String,
    #[serde(default)]
    pub experience: String,
    #[serde(default)]
    pub profile_image: String,
    #[serde(rename = "profileImage", default)]
    pub profile_image_alias: String,
    #[serde(rename = "hospitalImage", default)]
    pub hospital_image: String,
    pub role: String,
    #[serde(rename = "hospitalName", default)]
    pub hospital_name: String,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<BsonDateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<BsonDateTime>,
}

fn default_true() -> bool {
    true
}

// Safe public version (no password)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PublicUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: String,
    #[serde(rename = "hospitalName")]
    pub hospital_name: String,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "profileImage")]
    pub profile_image: String,
    #[serde(rename = "hospitalImage")]
    pub hospital_image: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub experience: Option<String>,
    #[serde(rename = "tempPassword", skip_serializing_if = "Option::is_none")]
    pub temp_password: Option<String>,
}

impl User {
    pub fn to_public(&self) -> PublicUser {
        PublicUser {
            id: self.id.map(|id| id.to_hex()).unwrap_or_default(),
            email: self.email.clone(),
            name: self.name.clone(),
            role: self.role.clone(),
            hospital_name: self.hospital_name.clone(),
            is_active: self.is_active,
            profile_image: if !self.profile_image_alias.is_empty() {
                self.profile_image_alias.clone()
            } else {
                self.profile_image.clone()
            },
            hospital_image: self.hospital_image.clone(),
            experience: if self.experience.is_empty() { None } else { Some(self.experience.clone()) },
            temp_password: self.temp_password.clone(),
        }
    }
}
