use mongodb::{Client, Database, options::ClientOptions};
use std::env;

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
}

pub async fn connect_db() -> Result<Database, mongodb::error::Error> {
    let db_uri = env::var("MONGODB_URI")
        .unwrap_or_else(|_| "mongodb://localhost:27017".to_string());

    let mut client_options = ClientOptions::parse(&db_uri).await?;
    client_options.app_name = Some("ClinicFlow-Rust".to_string());

    let client = Client::with_options(client_options)?;

    let db_name = env::var("DB_NAME").unwrap_or_else(|_| "clinicflow".to_string());
    log::info!("Connected to MongoDB database: {}", db_name);

    Ok(client.database(&db_name))
}
