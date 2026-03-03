@echo off
echo Starting ClinicFlow Rust Backend on port 8080...
set RUST_LOG=info
cargo run --release
