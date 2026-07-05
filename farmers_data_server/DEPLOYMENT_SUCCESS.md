# ✅ Deployment Success - CSV Upload Endpoint

## Summary

The simulation server has been successfully updated and deployed with the new CSV conditions upload endpoint!

---

## 🎯 What's Working

### 1. Simulation Server
- **Status**: ✅ Running
- **Port**: 8086 (localhost), exposed via ngrok
- **Container**: `farmer-sim`

### 2. Available Endpoints

#### Audio Upload (Existing)
- **Endpoint**: `POST /recordings/hives/{hive_name}/upload`
- **Status**: ✅ Working
- **Storage**: `/recordings/{api_key}/{hive_name}/*.wav`

#### CSV Conditions Upload (NEW)
- **Endpoint**: `POST /conditions/hives/{hive_name}/upload`
- **Status**: ✅ Working
- **Storage**: `/recordings/{api_key}/{hive_name}/conditions/*.csv`
- **Auto-timestamp**: Adds timestamp to filename to prevent conflicts

---

## 🧪 Test Results

### CSV Upload Test
```bash
curl -X POST \
  'http://localhost:8086/conditions/hives/TestHive/upload' \
  -H 'x-api-key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac' \
  -F 'file=@test_conditions.csv'
```

**Response (201 Created)**:
```json
{
    "filename": "test_conditions_20260620_141033.csv",
    "original_filename": "test_conditions.csv",
    "hive_name": "TestHive",
    "size_bytes": 126,
    "uploaded_at": "2026-06-20T14:10:33.443985+00:00",
    "path": "299d3ae3.../TestHive/conditions/test_conditions_20260620_141033.csv"
}
```

**File Stored Successfully**:
- Location: `/recordings/299d3ae3.../TestHive/conditions/test_conditions_20260620_141033.csv`
- Content: ✅ Verified
- Format: ✅ Correct CSV structure

---

## 🌐 Access URLs

### Local Access
- API Docs: http://localhost:8086/docs
- Health Check: http://localhost:8086/health

### Public Access (via ngrok)
- Base URL: https://jockstrap-boxlike-revisable.ngrok-free.dev/
- API Docs: https://jockstrap-boxlike-revisable.ngrok-free.dev/docs
- Health Check: https://jockstrap-boxlike-revisable.ngrok-free.dev/health

**Note**: Ngrok URL changes on restart. Update your ngrok tunnel:
```bash
ngrok http 8086
```

---

## 📋 Next Steps

### 1. Test with Real Device
Configure your IoT device with:
- **Server URL**: `https://jockstrap-boxlike-revisable.ngrok-free.dev` (or your ngrok URL)
- **API Key**: Get from admin panel or database
- **Hive Name**: Must match exactly (case-sensitive)

### 2. Deploy Backend Migration
Run the database migration to create the `hive_conditions` table:

```bash
cd ~/Desktop/final_year_project/combo2/bsads_backend_and_fast_api

# Run migration
docker exec -it bsads-db psql -U postgres -d bsads < api/migrations/003_add_hive_conditions_table.sql
```

### 3. Verify Backend Poller
Check that the backend poller is running and processing CSV files:

```bash
# Check logs
docker logs -f bsads-backend | grep conditions_poller

# Should see every 2 minutes:
# "🌡️ Conditions poller: processing X farmers"
```

### 4. Test End-to-End Flow

**Step 1**: Upload CSV to simulation server
```bash
curl -X POST \
  'https://YOUR_NGROK_URL/conditions/hives/Hive01/upload' \
  -H 'x-api-key: YOUR_API_KEY' \
  -F 'file=@conditions.csv'
```

**Step 2**: Wait 2-3 minutes for backend poller

**Step 3**: Check database
```bash
docker exec -it bsads-db psql -U postgres -d bsads -c \
  "SELECT * FROM hive_conditions ORDER BY created_at DESC LIMIT 5;"
```

---

## 🔧 Configuration

### Docker Compose (Updated)
```yaml
services:
  farmer-sim:
    build: .
    container_name: farmer-sim
    ports:
      - "8086:8000"  # Changed from 8000:8000 to avoid conflicts
    volumes:
      - ./recordings:/home/farmer/recordings
      - ./data:/data
```

### Environment Variables
Located in `.env` file:
- `ADMIN_KEY`: For admin operations
- `RECORDINGS_DIR`: `/home/farmer/recordings`
- `KEYS_FILE`: `/data/api_keys.json`

---

## 🛠️ Management Commands

### Start/Stop Server
```bash
cd ~/Desktop/final_year_project/combo2/bsads_farmer_external_data_source_simulation

# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Restart
docker compose restart
```

### Check Health
```bash
curl http://localhost:8086/health
# Should return: {"status":"ok"}
```

### List Uploaded Files
```bash
curl -H 'x-api-key: YOUR_API_KEY' \
  'http://localhost:8086/recordings?hive_name=TestHive'
```

---

## 📊 File Structure

```
recordings/
└── {api_key}/
    └── {hive_name}/
        ├── *.wav                    # Audio files
        └── conditions/
            └── *.csv                # Condition CSV files (with timestamp)
```

**Example**:
```
recordings/
└── 299d3ae3-59d9-410e-b3ee-f17508cfcaac/
    └── TestHive/
        ├── 10_2026-06-20_141000.wav
        └── conditions/
            ├── test_conditions_20260620_141033.csv
            └── test_conditions_20260620_142000.csv
```

---

## ✅ Success Checklist

- [x] CSV upload endpoint created
- [x] Simulation server rebuilt and restarted
- [x] Server running on port 8086
- [x] CSV upload tested successfully
- [x] File storage verified
- [x] API documentation updated (visible in /docs)
- [ ] Backend migration deployed
- [ ] Backend poller tested
- [ ] End-to-end flow verified
- [ ] Device configured with new endpoints

---

## 📚 Documentation

See these files for more details:
- `DEVICE_INTEGRATION_GUIDE.md` - Complete device integration guide
- `IOT_IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `TESTING_QUICK_REFERENCE.md` - Quick testing commands

---

## 🎉 Success!

The simulation server is now ready to receive CSV condition data from IoT devices!

Next: Deploy the backend migration and verify the end-to-end flow.
