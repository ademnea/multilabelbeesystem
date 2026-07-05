# Sensor Upload Guide

This guide explains how beehive sensors upload audio recordings to the Farmer Data Source API after deployment.

---

## 🔐 Security & Folder Isolation

### Folder Structure

The server stores recordings in a **secure, isolated folder structure**:

```
/home/farmer/recordings/
├── {api_key_1}/              ← Farmer 1's recordings (isolated)
│   ├── Hive 01/
│   │   ├── recording1.wav
│   │   └── recording2.wav
│   ├── Hive 02/
│   │   └── recording3.wav
│   └── Hive 03/
│       └── recording4.wav
│
├── {api_key_2}/              ← Farmer 2's recordings (isolated)
│   ├── Hive 01/
│   │   └── recording1.wav
│   └── Hive 02/
│       └── recording2.wav
│
└── {api_key_3}/              ← Farmer 3's recordings (isolated)
    └── Hive A/
        └── recording1.wav
```

### Security Guarantees

✅ **API Key Isolation**: Each farmer can ONLY access their own recordings
- API key `abc-123` can ONLY see/upload to `/recordings/abc-123/*`
- Cannot access other farmers' data at `/recordings/xyz-789/*`

✅ **Hive Isolation**: Within their folder, farmers organize by hive name
- Upload to `Hive 01` creates `/recordings/{their_api_key}/Hive 01/`
- Upload to `Hive 02` creates `/recordings/{their_api_key}/Hive 02/`

✅ **Path Traversal Protection**: 
- Hive names with `/` or `\` are rejected
- Path validation prevents accessing parent directories
- All paths are resolved and checked server-side

---

## 📤 How to Upload Recordings

### After Deployment

Your API is now accessible at:
- **Direct IP**: `http://196.43.168.57:8086`
- **Ngrok URL**: `https://xxxx-xxxx.ngrok-free.app` (if enabled)

### Upload Endpoint

```
POST /recordings/hives/{hive_name}/upload
Header: X-API-Key: your-api-key-here
Body: multipart/form-data with 'file' field
```

### Important Notes

1. **The API key determines which folder the file goes to**
   - You don't specify the API key folder - it's automatic
   - The server extracts your API key from the header
   - Your file goes to `/recordings/{your_api_key}/{hive_name}/`

2. **You only specify the hive name**
   - Hive name can be anything: "Hive 01", "Apiary A", "North-Field-01"
   - The hive folder is created automatically if it doesn't exist
   - Must not contain `/` or `\` characters

3. **Only .wav files are accepted**
   - Files must have `.wav` extension (case-insensitive)
   - Other formats will be rejected with HTTP 400

---

## 🐝 Example: Sensor Upload Script

### Method 1: Using Python Script (Recommended)

```bash
# Configuration
export FARMER_API_URL="http://196.43.168.57:8086"
export FARMER_API_KEY="f47ac10b-58cc-4372-a567-0e02b2c3d479"
export HIVE_NAME="Hive 01"

# Upload a recording
python example_sensor_upload.py recording.wav
```

**Output:**
```
======================================================================
Beehive Sensor - Recording Upload
======================================================================
Server URL: http://196.43.168.57:8086
Hive Name:  Hive 01
Timestamp:  2026-06-17 14:30:00
======================================================================

📤 Uploading recording.wav to Hive 01...
   Server: http://196.43.168.57:8086
   File size: 524,288 bytes
✅ Upload successful!
   Filename: recording.wav
   Hive: Hive 01
   Size: 524,288 bytes
   Uploaded at: 2026-06-17T14:30:05.123456+00:00
```

### Method 2: Using cURL

```bash
# Upload to Hive 01
curl -X POST http://196.43.168.57:8086/recordings/hives/Hive%2001/upload \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@recording.wav"
```

**Response:**
```json
{
  "filename": "recording.wav",
  "hive_name": "Hive 01",
  "size_bytes": 524288,
  "uploaded_at": "2026-06-17T14:30:05.123456+00:00",
  "path": "f47ac10b-58cc-4372-a567-0e02b2c3d479/Hive 01/recording.wav"
}
```

### Method 3: Embedded Sensor Code (Python)

For IoT devices with Python:

```python
import requests
import os
from pathlib import Path

API_URL = "http://196.43.168.57:8086"
API_KEY = "your-api-key-here"
HIVE_NAME = "Hive 01"

def upload_recording(wav_file_path):
    """Upload a WAV file to the farmer's server."""
    url = f"{API_URL}/recordings/hives/{HIVE_NAME}/upload"
    headers = {"X-API-Key": API_KEY}
    
    with open(wav_file_path, 'rb') as f:
        files = {'file': (Path(wav_file_path).name, f, 'audio/wav')}
        response = requests.post(url, headers=headers, files=files)
    
    if response.status_code == 201:
        print(f"✅ Uploaded: {response.json()['filename']}")
        return True
    else:
        print(f"❌ Upload failed: {response.status_code}")
        return False

# Usage in sensor loop
if __name__ == "__main__":
    # After recording audio
    upload_recording("/tmp/recording_20260617_143000.wav")
```

### Method 4: Arduino/ESP32 (C++)

For microcontrollers:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverUrl = "http://196.43.168.57:8086";
const char* apiKey = "your-api-key-here";
const char* hiveName = "Hive 01";

bool uploadRecording(uint8_t* audioData, size_t dataSize, const char* filename) {
    HTTPClient http;
    String url = String(serverUrl) + "/recordings/hives/" + String(hiveName) + "/upload";
    
    http.begin(url);
    http.addHeader("X-API-Key", apiKey);
    
    // Create multipart form data
    String boundary = "----FormBoundary7MA4YWxkTrZu0gW";
    String contentType = "multipart/form-data; boundary=" + boundary;
    http.addHeader("Content-Type", contentType);
    
    // Build multipart body (simplified)
    String body = "--" + boundary + "\r\n";
    body += "Content-Disposition: form-data; name=\"file\"; filename=\"" + String(filename) + "\"\r\n";
    body += "Content-Type: audio/wav\r\n\r\n";
    
    // Send request
    int httpCode = http.POST(audioData, dataSize);
    
    http.end();
    return (httpCode == 201);
}
```

---

## 🔍 Verifying Uploads

### List Your Recordings

After uploading, verify the file is there:

```bash
# List all recordings for your API key
curl -H "X-API-Key: your-api-key-here" \
  http://196.43.168.57:8086/recordings

# List recordings for a specific hive
curl -H "X-API-Key: your-api-key-here" \
  "http://196.43.168.57:8086/recordings?hive_name=Hive%2001"
```

**Response:**
```json
{
  "recordings": [
    "Hive 01/recording1.wav",
    "Hive 01/recording2.wav",
    "Hive 02/recording3.wav"
  ]
}
```

### Download a Recording (to verify)

```bash
curl -H "X-API-Key: your-api-key-here" \
  "http://196.43.168.57:8086/recordings/Hive%2001/recording1.wav" \
  -o downloaded.wav
```

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid API key" (401)

**Cause**: Wrong API key or key has been revoked

**Solution**:
- Verify your API key is correct
- Contact the server admin to check if key is active
- Request a new API key if needed

---

### Issue: "File already exists" (409)

**Cause**: A file with the same name already exists in that hive

**Solution**:
- Use unique filenames (add timestamp)
- Example: `recording_20260617_143000.wav`
- Or: `hive01_2026-06-17_14-30-00.wav`

**Recommended naming pattern:**
```python
from datetime import datetime

filename = f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
# Example: recording_20260617_143045.wav
```

---

### Issue: "Only .wav files are supported" (400)

**Cause**: File doesn't have `.wav` extension

**Solution**:
- Ensure your file ends with `.wav`
- Convert other formats to WAV before uploading
- Check filename doesn't have typos

---

### Issue: "Cannot connect to server"

**Cause**: Server is unreachable or URL is wrong

**Solution**:
- Check server is running: `curl http://196.43.168.57:8086/health`
- Verify the URL is correct
- Check firewall allows port 8086
- For ngrok: Get the current URL from server admin

---

### Issue: Upload timeout

**Cause**: File too large or network too slow

**Solution**:
- Check file size (recommend < 10MB per file)
- Split long recordings into smaller chunks
- Increase timeout in your code:
  ```python
  response = requests.post(url, files=files, timeout=120)  # 2 minutes
  ```

---

## 📋 Best Practices

### 1. Use Unique Filenames

Include timestamp in filename to avoid collisions:

```python
from datetime import datetime

timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
filename = f"{HIVE_NAME}_{timestamp}.wav"
# Example: Hive_01_20260617_143045.wav
```

### 2. Organize by Hive

Each sensor should upload to its own hive folder:
- Sensor on Hive 01 → uploads to "Hive 01"
- Sensor on Hive 02 → uploads to "Hive 02"

### 3. Handle Upload Errors

```python
def upload_with_retry(file_path, max_retries=3):
    for attempt in range(max_retries):
        try:
            if upload_recording(file_path):
                return True
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(5)  # Wait before retry
    return False
```

### 4. Store API Key Securely

**DON'T**: Hardcode in source code
```python
API_KEY = "f47ac10b-58cc-4372-a567-0e02b2c3d479"  # ❌ Bad
```

**DO**: Use environment variables or config files
```python
API_KEY = os.getenv("FARMER_API_KEY")  # ✅ Good
```

### 5. Validate Before Upload

```python
def validate_file(file_path):
    path = Path(file_path)
    
    # Check file exists
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Check is WAV file
    if path.suffix.lower() != '.wav':
        raise ValueError(f"Not a WAV file: {file_path}")
    
    # Check file size (e.g., max 50MB)
    if path.stat().st_size > 50 * 1024 * 1024:
        raise ValueError(f"File too large: {path.stat().st_size} bytes")
    
    return True
```

### 6. Log Uploads

Keep a log of successful uploads:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def upload_recording(file_path):
    logger.info(f"Uploading {file_path}...")
    # ... upload code ...
    logger.info(f"✅ Upload successful: {filename}")
```

---

## 🎯 Production Deployment Checklist

For farmers deploying sensors in production:

- [ ] Each sensor has the correct API key configured
- [ ] Each sensor knows its hive name
- [ ] Sensors use unique filenames (with timestamps)
- [ ] Upload errors are logged
- [ ] Failed uploads are retried
- [ ] API keys are stored securely (not in code)
- [ ] Network connectivity is monitored
- [ ] Disk space on sensor is monitored
- [ ] Server URL is configurable (for ngrok URL changes)
- [ ] Sensors can resume after network outages

---

## 📞 Getting Your Credentials

### For Farmers

Contact your server administrator to get:

1. **Server URL**: 
   - Direct: `http://196.43.168.57:8086`
   - Or ngrok URL: `https://xxxx-xxxx.ngrok-free.app`

2. **API Key**: A UUID like `f47ac10b-58cc-4372-a567-0e02b2c3d479`

### For Server Administrators

Generate API keys for farmers:

```bash
curl -X POST http://localhost:8000/admin/keys \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"client_name": "Farmer John - Apiary A"}'
```

---

## 📚 Related Documentation

- **[README.md](README.md)** - Project overview
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Server deployment guide
- **[example_sensor_upload.py](example_sensor_upload.py)** - Complete upload script
- **API Documentation**: `http://196.43.168.57:8086/docs`

---

## ✅ Quick Test

Test your sensor can upload:

```bash
# 1. Set credentials
export FARMER_API_URL="http://196.43.168.57:8086"
export FARMER_API_KEY="your-api-key-here"
export HIVE_NAME="Hive 01"

# 2. Create a test WAV file (1 second of silence)
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 test.wav

# 3. Upload
python example_sensor_upload.py test.wav

# 4. Verify
curl -H "X-API-Key: $FARMER_API_KEY" \
  "$FARMER_API_URL/recordings" | jq
```

If you see your file in the list, you're ready to go! 🎉
