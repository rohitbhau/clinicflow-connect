use actix_web::web;
use actix_web_httpauth::middleware::HttpAuthentication;
use crate::middleware::auth::validator;

pub mod auth;
pub mod doctor;
pub mod hospital;
pub mod appointment;
pub mod attendance;
pub mod leave;
pub mod patient;
pub mod upload;
pub mod super_admin;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            // Auth routes
            .service(
                web::scope("/auth")
                    .route("/register", web::post().to(auth::register))
                    .route("/login", web::post().to(auth::login))
                    .route("/logout", web::post().to(auth::logout))
                    .route("/profile", web::get().to(auth::get_profile))
                    .route("/profile", web::put().to(auth::update_profile))
            )
            // Appointment routes - frontend uses /appointments/book
            .service(
                web::scope("/appointments")
                    .route("/book", web::post().to(appointment::book_appointment))
                    .route("", web::post().to(appointment::book_appointment))
                    .route("/queue/{doctor_id}", web::get().to(appointment::get_queue_status))
                    .route("/queues/hospital/{hospital_id}", web::get().to(appointment::get_all_queues_status))
                    .route("/{id}/status", web::patch().to(appointment::update_status))
                    .route("/{id}", web::patch().to(appointment::update_appointment_details))
                    .route("/{id}", web::put().to(appointment::update_appointment_details))
            )
            // Hospital routes
            .service(
                web::scope("/hospitals")
                    .route("/slug/{slug}", web::get().to(hospital::get_hospital_by_slug))
                    .route("/stats", web::get().to(hospital::get_hospital_stats))
                    .route("/users", web::get().to(hospital::get_hospital_users))
                    .route("/users", web::post().to(hospital::add_hospital_user))
                    .route("/users/{id}", web::delete().to(hospital::delete_hospital_user))
                    .route("/users/{id}/status", web::patch().to(hospital::update_user_status))
                    .route("/details", web::put().to(hospital::update_hospital_details))
                    .route("/details", web::patch().to(hospital::update_hospital_details))
            )
            // Doctor routes - match frontend exactly (dashboard-stats, upcoming-appointments)
            .service(
                web::scope("/doctors")
                    .route("/dashboard-stats", web::get().to(doctor::get_dashboard_stats))
                    .route("/dashboard", web::get().to(doctor::get_dashboard_stats))
                    .route("/upcoming-appointments", web::get().to(doctor::get_upcoming_appointments))
                    .route("/upcoming", web::get().to(doctor::get_upcoming_appointments))
                    .route("/patients", web::get().to(doctor::get_patients))
                    .route("/profile", web::get().to(doctor::get_profile))
                    .route("/profile", web::put().to(doctor::update_profile))
                    .route("/profile", web::patch().to(doctor::update_profile))
            )
            // Attendance routes - frontend uses check-in / check-out (with hyphens)
            .service(
                web::scope("/attendance")
                    .route("/check-in", web::post().to(attendance::check_in))
                    .route("/checkin", web::post().to(attendance::check_in))
                    .route("/check-out", web::post().to(attendance::check_out))
                    .route("/checkout", web::post().to(attendance::check_out))
                    .route("/status", web::get().to(attendance::get_status))
                    .route("/history", web::get().to(attendance::get_history))
            )
            // Leave routes - frontend uses /leaves/{id}/remove-slot
            .service(
                web::scope("/leaves")
                    .route("", web::get().to(leave::get_leaves))
                    .route("", web::post().to(leave::add_leave))
                    .route("/blocked/{doctor_id}", web::get().to(leave::get_blocked_dates))
                    .route("/{id}", web::delete().to(leave::delete_leave))
                    .route("/{id}/remove-slot", web::patch().to(leave::remove_slot_from_leave))
                    .route("/{id}/slot", web::patch().to(leave::remove_slot_from_leave))
            )
            // Patient routes
            .service(
                web::scope("/patients")
                    .route("", web::get().to(patient::get_patients))
                    .route("/{id}", web::get().to(patient::get_patient))
            )
            // SuperAdmin routes
            .service(
                web::scope("/superadmin")
                    .route("/stats", web::get().to(super_admin::get_stats))
                    .route("/hospitals", web::get().to(super_admin::get_hospitals))
                    .route("/hospitals", web::post().to(super_admin::create_hospital))
            )
    )
    // Upload route - frontend calls /upload directly
    .service(
        web::scope("/api/v1/upload")
            .route("", web::post().to(upload::upload_image))
            .route("/{filename}", web::delete().to(upload::delete_image))
    );
}

