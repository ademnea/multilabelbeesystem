# Local Testing Guide

This guide shows how to test the upload endpoint **locally** on your machine, separate from the production deployment.

---

## 🚫 Problem: Ngrok Conflict

The error you're seeing:
```
ERROR: failed to start tunnel: The endpoint 'https://jockstrap-boxlike-revisable.ngrok-free.dev' is already online.
```

This happens because:
1. Production server (196.43.168.57) is using that ngrok URL
2. You can't use the same ngrok URL on two machines
3. For local testing, you **don't need ngrok**

---

## ✅ Solution: Test Locally Without Ngrok

### Step 1: Stop Production-Like Setup (if running)

```bash
# Stop any running containers
docker compose down
```

### Step 2: Start Local Test Server

```bash
# Use the local docker-compose file (WITHOUT ngrok)
docker compose -f docker-compose.local.yml up --build
```

This will:
- ✅ Build using regular `Dockerfile` (no ngrok)
- ✅ Start server on `http://localhost:8000`
- ✅ Use your local `recordings/` folder
- ✅ Use your local `data/api_keys.json`

### Step 3: Verify Server is Running

```bash
# Health check
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

---

## 🧪 Test Upload Endpoint Locally

### Test 1: Simple Upload Test

```bash
# Set up environment
export FARMER_API_URL="http://localhost:8000"
export FARMER_API_KEY="299d3ae3-59d9-410e-b3ee-f17508cfcaac"
export HIVE_NAME="Hive 01"

# Run test script
./test_upload.sh
```

### Test 2: Upload with cURL

Pick a recording from your local `recordings/` folder:

```bash
# Upload to Admin Ahaabwe's Hive 01
curl -X 'POST' \
  'http://localhost:8000/recordings/hives/Hive%2001/upload' \
  -H 'accept: application/json' \
  -H 'X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive 01/1-17808-A-12.wav;type=audio/wav'
```

### Test 3: Upload with Python Script

```bash
export FARMER_API_URL="http://localhost:8000"
export FARMER_API_KEY="299d3ae3-59d9-410e-b3ee-f17508cfcaac"
export HIVE_NAME="Hive 01"

python example_sensor_upload.py recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive\ 01/1-17808-A-12.wav
```

### Test 4: Test Multiple Uploads (Migration Script)

```bash
# Test uploading all recordings for a specific farmer
export FARMER_API_URL="http://localhost:8000"
python migrate_existing_recordings.py 299d3ae3-59d9-410e-b3ee-f17508cfcaac "Hive 01"
```

---

## 📋 Local Testing Workflow

```bash
# 1. Start local server (WITHOUT ngrok)
docker compose -f docker-compose.local.yml up --build

# 2. In another terminal, test health
curl http://localhost:8000/health

# 3. List recordings (verify API key works)
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  http://localhost:8000/recordings

# 4. Test upload with existing file
curl -X POST http://localhost:8000/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  -F "file=@recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive 01/1-17808-A-12.wav"

# 5. Verify upload appeared
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  "http://localhost:8000/recordings?hive_name=Hive%2001"

# 6. View logs
docker logs farmer-api-local

# 7. Stop when done
docker compose -f docker-compose.local.yml down
```

---

## 🔑 Use Your Existing API Keys

Your current API keys from `data/api_keys.json`:

| API Key | Client Name | Has Recordings |
|---------|-------------|----------------|
| `299d3ae3-59d9-410e-b3ee-f17508cfcaac` | Admin Ahaabwe | ✅ Yes (Hive 01, Hive 02) |
| `d706187a-86ed-4adf-97d2-b9522ce44e57` | Test User | ✅ Yes (Hive 01-08) |
| `8361f43b-65bf-4f9e-b7ff-200a7d451577` | Local User | ✅ Yes (Hive 01, Hive 02) |
| `f31dccb4-8132-4bc1-8840-67b3c3fc3440` | Local Admin | ✅ Yes (Hive 01, Hive 02, Hive 4) |

---

## 🎯 Quick Test Commands

### Test Admin Ahaabwe's Upload

```bash
curl -X POST http://localhost:8000/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  -F "file=@recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive 01/1-17808-A-12.wav"
```

**Expected Response:**
```json
{
  "filename": "1-17808-A-12.wav",
  "hive_name": "Hive 01",
  "size_bytes": 524288,
  "uploaded_at": "2026-06-17T14:30:05.123456+00:00",
  "path": "299d3ae3-59d9-410e-b3ee-f17508cfcaac/Hive 01/1-17808-A-12.wav"
}
```

### Test Different Farmer

```bash
curl -X POST http://localhost:8000/recordings/hives/Hive%2007/upload \
  -H "X-API-Key: d706187a-86ed-4adf-97d2-b9522ce44e57" \
  -F "file=@recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive 07/250515_1056-01_segment_006.wav"
```

### Test with Spaces in Filename

```bash
curl -X POST http://localhost:8000/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: 8361f43b-65bf-4f9e-b7ff-200a7d451577" \
  -F "file=@recordings/8361f43b-65bf-4f9e-b7ff-200a7d451577/Hive 01/pest infested hive 28052026(3)_part23.wav"
```

---

## 📊 Verify Uploads

### Check if file appears in recordings list

```bash
# List all recordings for Admin Ahaabwe
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  http://localhost:8000/recordings

# List only Hive 01
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  "http://localhost:8000/recordings?hive_name=Hive%2001"
```

### Download uploaded file (to verify)

```bash
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  "http://localhost:8000/recordings/Hive%2001/1-17808-A-12.wav" \
  -o downloaded_test.wav
```

---

## 🐛 Troubleshooting

### Issue: "Connection refused"

**Problem**: Server not running

**Solution**:
```bash
# Check if container is running
docker ps | grep farmer-api-local

# If not, start it
docker compose -f docker-compose.local.yml up --build
```

### Issue: "Invalid API key" (401)

**Problem**: Using API key not in your local `data/api_keys.json`

**Solution**: Use one of your existing keys:
```bash
# List your keys
cat data/api_keys.json | jq 'keys'

# Use a valid key
export FARMER_API_KEY="299d3ae3-59d9-410e-b3ee-f17508cfcaac"
```

### Issue: "File already exists" (409)

**Problem**: File with same name already uploaded

**Solution**: This is expected behavior! Use a different filename:
```bash
# Add timestamp to filename
timestamp=$(date +%Y%m%d_%H%M%S)
cp original.wav "recording_${timestamp}.wav"
```

### Issue: Port 8000 already in use

**Problem**: Another service using port 8000

**Solution**:
```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>

# Or use a different port in docker-compose.local.yml:
# ports:
#   - "8001:8000"
```

---

## 🔄 Switch Between Local and Production

### Local Testing (your machine)
```bash
# Use local compose file WITHOUT ngrok
docker compose -f docker-compose.local.yml up

# Test at http://localhost:8000
```

### Production Simulation (with ngrok)
```bash
# Use main compose file
docker compose up

# Get ngrok URL (different from production)
curl http://localhost:4040/api/tunnels
```

### Production Server (deployed)
```bash
# Already running at http://196.43.168.57:8086
# Don't interfere with this!
```

---

## ✅ Complete Local Test Example

```bash
# Terminal 1: Start local server
docker compose -f docker-compose.local.yml up --build

# Terminal 2: Run tests
# Test 1: Health check
curl http://localhost:8000/health

# Test 2: List recordings
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  http://localhost:8000/recordings

# Test 3: Upload a file
curl -X POST http://localhost:8000/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  -F "file=@recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive 01/1-17808-A-12.wav"

# Test 4: Verify upload
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  "http://localhost:8000/recordings?hive_name=Hive%2001" | jq

# Test 5: View API docs
firefox http://localhost:8000/docs

# When done, stop server
docker compose -f docker-compose.local.yml down
```

---

## 📚 Summary

| Aspect | Local Testing | Production |
|--------|--------------|------------|
| **URL** | `http://localhost:8000` | `http://196.43.168.57:8086` |
| **Ngrok** | ❌ Not needed | ✅ Automatic in container |
| **Compose File** | `docker-compose.local.yml` | Main via GitHub Actions |
| **Data** | Local `recordings/` & `data/` | Server volumes |
| **Purpose** | Development & testing | Live farmer access |

---

**🎯 You're now ready to test locally without ngrok conflicts!**

Commands to start testing:
```bash
docker compose -f docker-compose.local.yml up --build
curl http://localhost:8000/health
```
