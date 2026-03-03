#!/bin/bash
# Start Rust server
cd "$(dirname "$0")"
echo "Starting Rust backend on port 8080..."
RUST_LOG=info cargo run --release
