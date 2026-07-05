# BSADS Farmer External Data Source Simulation

A lightweight HTTP server that simulates a farmer's beehive audio recording repository. It exposes WAV recordings over a REST API secured with API keys, and is designed to be consumed by the BSADS (Beehive Sound Analysis and Detection System) backend.

---

## 📚 Quick Links

### 🎯 Start Here - Choose Your Role
- **[Roles Overview](0.ROLES_OVERVIEW.md)** - Understand the two user roles and choose your guide

### For Server Owners (Host Your Own Server)
- **[🚀 Server Owner Guide](1.Server(farmer)_owner_admin.md)** - Complete setup for hosting your recordings (START HERE!)
- **[Administrator Guide](ADMIN_GUIDE.md)** - Detailed server management and security
- **[Getting Started](GETTING_STARTED.md)** - Quick reference

### For External Integrators (Consume API with Your Key)
- **[🔌 Integration Guide](2.ExternalFarmerIntergrator.md)** - Complete guide for API consumers (START HERE!)
- **[Client Integration Guide](CLIENT_INTEGRATION_GUIDE.md)** - Additional integration examples
- **[Example Polling Client](example_polling_client.py)** - Ready-to-use Python client
- **[Test Script](test_client.sh)** - Quick API connectivity test

---

## What This Server Does

This server allows farmers to:
1. Host beehive audio recordings on their own computer
2. Generate secure API keys for BSADS users
3. Let BSADS automatically poll and analyze recordings
4. Maintain full control over their data

**No SSH required!** Simple HTTP API with API key authentication.

---

## For Farmers: Quick Setup

**Complete guide:** See [Server Owner Guide](1.Server(farmer)_owner_admin.md)

```bash
# 1. Install Docker and ngrok (one-time setup)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Generate your admin key
openssl rand -hex 32

# 3. Create configuration
cat > .env << 'EOF'
ADMIN_KEY=your-generated-key-here
EOF

# 4. Start server
docker compose up -d --build

# 5. Expose to internet (in separate terminal)
ngrok http 8000

# 6. Generate API key for sensor/farmer
curl -X POST https://YOUR_NGROK_URL/admin/keys \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_name": "Farmer Name"}'

# 7. Share with farmer:
#    - Server URL: https://YOUR_NGROK_URL (or production IP)
#    - API Key: (from response above)
#    - Upload guide: SENSOR_UPLOAD_GUIDE.md
```

---

## For BSADS Users: Quick Test

**Complete guide:** See the BSADS backend's `FARMER_API_KEY_SETUP.md`

```bash
# Test connection
curl -H "X-API-Key: your-api-key" \
  https://farmer-server.ngrok-free.dev/recordings

# Configure in BSADS backend
curl -X POST http://localhost:8000/hives/HIVE_ID/data-source/configure-http-api \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_base_url": "https://farmer-server.ngrok-free.dev",
    "api_key": "your-api-key"
  }'
```

---

## 🚀 After Deployment: How Sensors Upload Data

### NEW: Upload Endpoint

Sensors can now upload recordings directly via API:

```bash
# Upload a recording to a specific hive
curl -X POST http://196.43.168.57:8086/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@recording.wav"
```

### Folder Structure (Automatic Isolation)

```
/home/farmer/recordings/
├── {api_key_1}/              ← Farmer 1 (isolated by API key)
│   ├── Hive 01/
│   │   └── recording1.wav
│   └── Hive 02/
│       └── recording2.wav
└── {api_key_2}/              ← Farmer 2 (isolated by API key)
    └── Hive 01/
        └── recording1.wav
```

**Security:** Each API key can ONLY access their own recordings. The server automatically routes uploads to the correct folder based on the API key.

### Quick Upload Test

```bash
# Configure
export FARMER_API_URL="http://196.43.168.57:8086"
export FARMER_API_KEY="your-api-key-here"
export HIVE_NAME="Hive 01"

# Test upload
./test_upload.sh recording.wav

# Or use Python script
python example_sensor_upload.py recording.wav
```

**Complete guide:** See [SENSOR_UPLOAD_GUIDE.md](SENSOR_UPLOAD_GUIDE.md) for sensor integration details.

---

## 🧪 Testing the API

### Quick Test with Script

```bash
# Test your API connection
./test_client.sh https://your-server.ngrok-free.dev your-api-key-here
```

### Manual Testing

```bash
# Health check (no auth required)
curl https://your-server.ngrok-free.dev/health

# List recordings (requires API key)
curl -H "X-API-Key: your-api-key" \
  https://your-server.ngrok-free.dev/recordings

# Download a recording
curl -H "X-API-Key: your-api-key" \
  https://your-server.ngrok-free.dev/recordings/filename.wav \
  -o filename.wav
```

### Run Example Polling Client

```bash
# Install dependencies
pip install -r client_requirements.txt

# Set environment variables
export FARMER_API_URL="https://your-server.ngrok-free.dev"
export FARMER_API_KEY="your-api-key-here"

# Run the client
python example_polling_client.py
```

The client will continuously poll for new recordings and download them to `./downloaded_recordings/`.

---

## Project Structure

```
.
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container definition
├── docker-compose.yml   # Service orchestration
├── recordings/          # Mounted at /home/farmer/recordings inside the container
│   └── <api_key>/
│       └── <hive_name>/
│           └── *.wav
└── data/
    └── api_keys.json    # Auto-created; stores issued API keys
```

---

## Prerequisites

- [Docker](https://docs.docker.com/engine/install/ubuntu/) and Docker Compose
- Your user added to the `docker` group:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

---

## Running the Server

```bash
docker compose up -d --build
```

The server starts on **port 8000** and is bound to `0.0.0.0` (all interfaces).

Verify it is running:

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

---

## Authentication

There are two levels of access:

| Header        | Value                      | Purpose                          |
| ------------- | -------------------------- | -------------------------------- |
| `X-Admin-Key` | Your admin key             | Manage API keys (issue / revoke) |
| `X-API-Key`   | A UUID issued by the admin | Access recordings                |

The admin key is set via the `ADMIN_KEY` environment variable (see [Configuration](#configuration)).  
**Never share the admin key.** Only share per-client API keys.

---

## API Reference

### Health check

```
GET /health
```

No authentication required.

```bash
curl http://localhost:8000/health
```

---

### Admin — Issue a new API key

```
POST /admin/keys
Header: X-Admin-Key: <admin-key>
Body:   {"client_name": "<label>"}
```

```bash
curl -X POST http://localhost:8000/admin/keys \
  -H "X-Admin-Key: admin-secret-changeme" \
  -H "Content-Type: application/json" \
  -d '{"client_name": "bsads-pipeline"}'
```

Response:

```json
{
  "api_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "client_name": "bsads-pipeline"
}
```

Give the returned `api_key` to the client. The key is automatically saved to `data/api_keys.json`.

---

### Admin — List all active keys

```
GET /admin/keys
Header: X-Admin-Key: <admin-key>
```

```bash
curl http://localhost:8000/admin/keys \
  -H "X-Admin-Key: admin-secret-changeme"
```

---

### Admin — Revoke a key

```
DELETE /admin/keys/{api_key}
Header: X-Admin-Key: <admin-key>
```

```bash
curl -X DELETE http://localhost:8000/admin/keys/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "X-Admin-Key: admin-secret-changeme"
```

---

### Recordings — List available files

```
GET /recordings
Header: X-API-Key: <api-key>
```

```bash
curl http://localhost:8000/recordings \
  -H "X-API-Key: f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

Response:

```json
{ "recordings": ["hive1_test.wav", "hive2_test.wav", "hive3_test.wav"] }
```

---

### Recordings — Create a hive folder

```
POST /recordings/hives/A05
Header: X-API-Key: <api-key>
```

This creates `/home/farmer/recordings/A05/` if it does not already exist.

---

### Recordings — Download a file

```
GET /recordings/{filename}
Header: X-API-Key: <api-key>
```

```bash
curl http://localhost:8000/recordings/hive1_test.wav \
  -H "X-API-Key: f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -o hive1_test.wav
```

---

## Configuration

Environment variables (set in `docker-compose.yml` or a `.env` file):

| Variable         | Default                   | Description                                               |
| ---------------- | ------------------------- | --------------------------------------------------------- |
| `ADMIN_KEY`      | `admin-secret-changeme`   | Key used to manage API keys — change before going live    |
| `RECORDINGS_DIR` | `/home/farmer/recordings` | Base path inside the container for API-key hive folders   |
| `KEYS_FILE`      | `/data/api_keys.json`     | Path inside the container where issued keys are persisted |

To set a custom admin key without editing `docker-compose.yml`, create a `.env` file:

```bash
# .env
ADMIN_KEY=your-strong-admin-key-here
```

Then restart:

```bash
docker compose up -d
```

---

## Exposing the Server Online (ngrok)

The server binds to `0.0.0.0` so it is reachable on your local network. To make it accessible over the internet from your Ubuntu machine (no public IP required), use [ngrok](https://ngrok.com):

**Install ngrok:**

```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**Start the tunnel (in a separate terminal):**

```bash
ngrok http 8000
```

Ngrok prints a public HTTPS URL such as `https://abc123.ngrok-free.app`. Share that base URL and a freshly issued API key with any client that needs to connect.

---

## Interactive API Docs

FastAPI provides auto-generated documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

These are also available via the ngrok public URL when the tunnel is active.

---

## Stopping the Server

```bash
docker compose down
```

Issued keys are preserved in `data/api_keys.json` and will still be valid when the server is restarted.
