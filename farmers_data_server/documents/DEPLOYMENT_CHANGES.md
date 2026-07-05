# Deployment Changes Summary

## What Changed After Deployment

### Before Deployment (Development)
- ❌ Manually copied files to `recordings/` folder
- ❌ Used ngrok URL: `https://jockstrap-boxlike-revisable.ngrok-free.dev/docs`
- ❌ No way for sensors to upload files programmatically

### After Deployment (Production)
- ✅ Sensors upload via API endpoint
- ✅ Deployed to production server: `http://196.43.168.57:8086`
- ✅ Ngrok available in Docker container (automatic tunnel)
- ✅ Automated API for sensor uploads

---

## 🌐 New Access URLs

### 1. Direct Server Access (Stable)
```
http://196.43.168.57:8086
```
- **API Docs**: http://196.43.168.57:8086/docs
- **Health Check**: http://196.43.168.57:8086/health
- **Use for**: Production sensors, internal systems

### 2. Ngrok Tunnel (Public Access)
To find your current ngrok URL:
```bash
ssh ademneadev@196.43.168.57
docker logs farmer-data-source 2>&1 | grep "url="
```

Or check ngrok API:
```bash
curl http://localhost:4040/api/tunnels
```

- **Use for**: External access, public integrations

---

## 📤 New Upload Endpoint

### Endpoint
```
POST /recordings/hives/{hive_name}/upload
```

### Request
```bash
curl -X POST http://196.43.168.57:8086/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@recording.wav"
```

### Response (201 Created)
```json
{
  "filename": "recording.wav",
  "hive_name": "Hive 01",
  "size_bytes": 524288,
  "uploaded_at": "2026-06-17T14:30:05.123456+00:00",
  "path": "f47ac10b-58cc-4372-a567-0e02b2c3d479/Hive 01/recording.wav"
}
```

---

## 🔐 Folder Structure (Security)

```
/home/farmer/recordings/
├── {api_key_1}/              ← Isolated per farmer
│   ├── Hive 01/              ← Sensor specifies hive name
│   │   ├── recording1.wav
│   │   └── recording2.wav
│   └── Hive 02/
│       └── recording3.wav
│
└── {api_key_2}/              ← Different farmer, isolated
    └── Hive 01/
        └── recording1.wav
```

### Security Features
✅ API key determines which folder (automatic)
✅ Sensor only specifies hive name
✅ Cannot access other farmers' data
✅ Path traversal protection
✅ Validates .wav files only

---

## 🐝 How Sensors Upload Now

### Option 1: Python Script (Easy)
```bash
export FARMER_API_URL="http://196.43.168.57:8086"
export FARMER_API_KEY="your-api-key-here"
export HIVE_NAME="Hive 01"

python example_sensor_upload.py recording.wav
```

### Option 2: Embedded in Sensor Code
```python
import requests

API_URL = "http://196.43.168.57:8086"
API_KEY = "your-api-key-here"
HIVE_NAME = "Hive 01"

def upload_recording(wav_file):
    url = f"{API_URL}/recordings/hives/{HIVE_NAME}/upload"
    headers = {"X-API-Key": API_KEY}
    
    with open(wav_file, 'rb') as f:
        files = {'file': (wav_file, f, 'audio/wav')}
        response = requests.post(url, headers=headers, files=files)
    
    return response.status_code == 201
```

### Option 3: cURL (Testing)
```bash
curl -X POST http://196.43.168.57:8086/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@recording.wav"
```

---

## 🔄 Migration Steps

### For Server Administrators

1. **Deploy the updated code**
   ```bash
   git pull origin main
   # GitHub Actions will deploy automatically
   ```

2. **Verify deployment**
   ```bash
   curl http://196.43.168.57:8086/health
   ```

3. **Generate API keys for farmers**
   ```bash
   curl -X POST http://196.43.168.57:8086/admin/keys \
     -H "X-Admin-Key: your-admin-key" \
     -H "Content-Type: application/json" \
     -d '{"client_name": "Farmer Name"}'
   ```

4. **Share credentials with farmers**
   - Server URL: `http://196.43.168.57:8086`
   - API Key: (from step 3)
   - Upload guide: `SENSOR_UPLOAD_GUIDE.md`

### For Farmers/Sensor Operators

1. **Get credentials from server admin**
   - Server URL
   - Your API key
   - Your hive name(s)

2. **Configure sensor**
   ```bash
   export FARMER_API_URL="http://196.43.168.57:8086"
   export FARMER_API_KEY="your-api-key-here"
   export HIVE_NAME="Hive 01"
   ```

3. **Test upload**
   ```bash
   python example_sensor_upload.py test.wav
   ```

4. **Verify in API**
   ```bash
   curl -H "X-API-Key: your-api-key-here" \
     http://196.43.168.57:8086/recordings
   ```

---

## 📋 Quick Comparison

| Aspect | Before (Dev) | After (Production) |
|--------|-------------|-------------------|
| **File Upload** | Manual copy | HTTP API upload |
| **Access Method** | Local ngrok tunnel | Production server |
| **Server URL** | `https://jockstrap-boxlike-revisable.ngrok-free.dev` | `http://196.43.168.57:8086` |
| **Ngrok** | Manual terminal | Automatic in Docker |
| **Security** | API key only | API key + folder isolation |
| **Sensor Integration** | Not supported | Full API support |
| **Deployment** | Manual | GitHub Actions CI/CD |
| **Availability** | Development hours | 24/7 production |

---

## 🎯 Next Steps

### For Server Admins
1. ✅ Deploy updated code (done via GitHub Actions)
2. ⬜ Generate API keys for each farmer
3. ⬜ Document ngrok URL (if using)
4. ⬜ Share `SENSOR_UPLOAD_GUIDE.md` with farmers
5. ⬜ Monitor upload logs
6. ⬜ Set up backup for recordings

### For Farmers
1. ⬜ Receive credentials from admin
2. ⬜ Configure sensors with API URL and key
3. ⬜ Test upload with sample file
4. ⬜ Deploy sensors to hives
5. ⬜ Monitor upload success rate
6. ⬜ Verify recordings appear in API

---

## 📚 Documentation

- **[SENSOR_UPLOAD_GUIDE.md](SENSOR_UPLOAD_GUIDE.md)** - Complete sensor integration guide
- **[example_sensor_upload.py](example_sensor_upload.py)** - Ready-to-use upload script
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Server deployment details
- **[README.md](README.md)** - Project overview

---

## 🆘 Troubleshooting

### Issue: "Cannot connect to server"
```bash
# Test server is running
curl http://196.43.168.57:8086/health

# Should return: {"status":"ok"}
```

### Issue: "Invalid API key"
```bash
# Verify your key with admin
# Request new key if needed
```

### Issue: Upload fails silently
```bash
# Check server logs
ssh ademneadev@196.43.168.57
docker logs farmer-data-source --tail 50
```

### Issue: File not appearing
```bash
# List your recordings
curl -H "X-API-Key: your-api-key" \
  http://196.43.168.57:8086/recordings
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Server responds: `curl http://196.43.168.57:8086/health`
- [ ] API docs accessible: http://196.43.168.57:8086/docs
- [ ] Can create API key (admin)
- [ ] Can upload file with API key
- [ ] Can list recordings with API key
- [ ] Can download recording with API key
- [ ] Different API keys see different recordings
- [ ] Ngrok tunnel working (if enabled)

---

**🎉 Ready to go!** Sensors can now upload recordings programmatically to your production server.
