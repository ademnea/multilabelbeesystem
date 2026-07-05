# BSADS IoT Device Upload Endpoints Guide

This guide explains how IoT devices can upload audio recordings and CSV condition data to the BSADS Farmer External Data Repository.

## 🔑 Authentication

All endpoints require an API key in the header:
```
X-API-Key: your-api-key-here
```

**Example API Keys** (from test environment):
- `2f25bed8-edda-4040-abde-fdc5b87a180a` (user256)
- `f31dccb4-8132-4bc1-8840-67b3c3fc3440` (Local Admin)

---

## 📊 1. CSV Conditions Upload

**Upload temperature and humidity readings from hive sensors**

### Endpoint
```
POST /conditions/hives/{hive_name}/upload
```

### Parameters
- **hive_name** (path parameter): The name of the hive (e.g., "Hive 01", "Hive 02")

### Headers
- `X-API-Key`: Your farmer API key (required)
- `Content-Type`: multipart/form-data

### Request Body
- **file**: CSV file containing condition data

### CSV Format
```csv
Date,Temperature,Humidity
2026-06-22 10:00:00,28.5*34.2*25.1,60.3*75.0*45.2
2026-06-22 10:05:00,28.7*34.5*25.3,61.1*74.8*45.5
2026-06-22 10:10:00,29.0*34.8*25.5,61.5*74.5*46.0
```

**Data Format:**
- **Date**: `YYYY-MM-DD HH:MM:SS` format
- **Temperature**: `honey*brood*exterior` (3 temperature zones separated by asterisk)
- **Humidity**: `honey*brood*exterior` (3 humidity zones separated by asterisk)

### Response (Success - 201 Created)
```json
{
  "filename": "conditions_20260622_072906.csv",
  "original_filename": "conditions.csv",
  "hive_name": "Hive 01",
  "size_bytes": 176,
  "uploaded_at": "2026-06-22T07:29:06.123456",
  "path": "2f25bed8-edda-4040-abde-fdc5b87a180a/Hive 01/conditions_20260622_072906.csv"
}
```

### Storage Location
Files are stored in: `/hive_conditions/{api_key}/{hive_name}/filename_timestamp.csv`

### Example: cURL
```bash
curl -X POST "http://localhost:8000/conditions/hives/Hive%2001/upload" \
  -H "X-API-Key: 2f25bed8-edda-4040-abde-fdc5b87a180a" \
  -F "file=@conditions.csv"
```

### Example: Python
```python
import requests

url = "http://localhost:8000/conditions/hives/Hive 01/upload"
headers = {
    "X-API-Key": "2f25bed8-edda-4040-abde-fdc5b87a180a"
}
files = {
    "file": ("conditions.csv", open("conditions.csv", "rb"), "text/csv")
}

response = requests.post(url, headers=headers, files=files)
print(response.json())
```

### Example: Arduino/ESP32 (HTTP Client)
```cpp
#include <HTTPClient.h>

void uploadConditions(String csvData, String hiveName) {
  HTTPClient http;
  String url = "http://your-server.com/conditions/hives/" + hiveName + "/upload";
  
  http.begin(url);
  http.addHeader("X-API-Key", "2f25bed8-edda-4040-abde-fdc5b87a180a");
  
  // Create multipart form data
  String boundary = "----BoundaryString";
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  
  String body = "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"file\"; filename=\"data.csv\"\r\n";
  body += "Content-Type: text/csv\r\n\r\n";
  body += csvData + "\r\n";
  body += "--" + boundary + "--\r\n";
  
  int httpResponseCode = http.POST(body);
  
  if (httpResponseCode == 201) {
    Serial.println("Upload successful!");
  } else {
    Serial.printf("Upload failed: %d\n", httpResponseCode);
  }
  
  http.end();
  
  // Device goes back to sleep immediately
  ESP.deepSleep(0);
}
```

---

## 🎵 2. Audio Recording Upload

**Upload WAV audio recordings from hive acoustic sensors**

### Endpoint
```
POST /recordings/{hive_name}
```

### Parameters
- **hive_name** (path parameter): The name of the hive (e.g., "Hive 01", "Hive 02")

### Headers
- `X-API-Key`: Your farmer API key (required)
- `Content-Type`: multipart/form-data

### Request Body
- **file**: WAV audio file

### Audio Format Requirements
- **Format**: WAV (Waveform Audio File Format)
- **Recommended**: 16-bit PCM, 44.1kHz or lower for IoT devices
- **Max file size**: Depends on your server configuration

### Response (Success - 201 Created)
```json
{
  "filename": "recording_20260622_073000.wav",
  "hive_name": "Hive 01",
  "size_bytes": 524288,
  "uploaded_at": "2026-06-22T07:30:00.456789",
  "path": "2f25bed8-edda-4040-abde-fdc5b87a180a/Hive 01/recording_20260622_073000.wav"
}
```

### Storage Location
Files are stored in: `/recordings/{api_key}/{hive_name}/filename_timestamp.wav`

### Example: cURL
```bash
curl -X POST "http://localhost:8000/recordings/Hive%2001" \
  -H "X-API-Key: 2f25bed8-edda-4040-abde-fdc5b87a180a" \
  -F "file=@recording.wav"
```

### Example: Python
```python
import requests

url = "http://localhost:8000/recordings/Hive 01"
headers = {
    "X-API-Key": "2f25bed8-edda-4040-abde-fdc5b87a180a"
}
files = {
    "file": ("recording.wav", open("recording.wav", "rb"), "audio/wav")
}

response = requests.post(url, headers=headers, files=files)
print(response.json())
```

### Example: Arduino/ESP32 (HTTP Client)
```cpp
#include <HTTPClient.h>

void uploadAudio(uint8_t* audioData, size_t length, String hiveName) {
  HTTPClient http;
  String url = "http://your-server.com/recordings/" + hiveName;
  
  http.begin(url);
  http.addHeader("X-API-Key", "2f25bed8-edda-4040-abde-fdc5b87a180a");
  
  // Create multipart form data
  String boundary = "----BoundaryString";
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  
  // Build multipart body with binary audio data
  String header = "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\n";
  header += "Content-Type: audio/wav\r\n\r\n";
  
  String footer = "\r\n--" + boundary + "--\r\n";
  
  // Send the request
  http.addHeader("Content-Length", String(header.length() + length + footer.length()));
  
  // Note: You may need to send in chunks for large files
  int httpResponseCode = http.POST(audioData, length);
  
  if (httpResponseCode == 201) {
    Serial.println("Audio upload successful!");
  } else {
    Serial.printf("Audio upload failed: %d\n", httpResponseCode);
  }
  
  http.end();
  
  // Device goes back to sleep immediately
  ESP.deepSleep(0);
}
```

---

## 🔄 Device Upload Workflow

**Recommended workflow for battery-powered IoT devices:**

1. **Wake up** from deep sleep (scheduled or event-triggered)
2. **Collect data** (record audio or read sensors)
3. **Connect to WiFi**
4. **Upload immediately** to the external repository
5. **Receive confirmation** (201 response)
6. **Disconnect WiFi**
7. **Go back to deep sleep** (conserve power)

The backend poller will asynchronously fetch and process your data later.

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "detail": "Only .csv files are supported"
}
```
**Cause**: Wrong file type uploaded

### 401 Unauthorized
```json
{
  "detail": "Invalid or missing API key"
}
```
**Cause**: Missing or incorrect `X-API-Key` header

### 403 Forbidden
```json
{
  "detail": "Access denied"
}
```
**Cause**: Path traversal attempt or security violation

### 500 Internal Server Error
```json
{
  "detail": "Failed to save file: [error details]"
}
```
**Cause**: Server-side error during file save

---

## 🌐 Server Configuration

### Local Testing
- **URL**: `http://localhost:8000`
- **Port**: 8000

### Production (with ngrok)
- **URL**: `https://your-subdomain.ngrok-free.app`
- **Port**: 443 (HTTPS)

---

## 📝 Notes for Device Developers

1. **Power Efficiency**: Upload and immediately sleep. Don't wait for backend processing.
2. **Timestamping**: Server automatically adds timestamps to filenames to prevent conflicts.
3. **File Naming**: Original filename is preserved in metadata but stored with timestamp.
4. **Retries**: Implement retry logic with exponential backoff for network failures.
5. **File Size**: Keep CSV files small (append to multiple files rather than one large file).
6. **Audio Quality**: Balance audio quality with file size for faster uploads.
7. **Security**: Keep API keys secure in device firmware (use secure storage if available).

---

## 🧪 Testing Your Integration

### Test CSV Upload
```bash
# Create test CSV
cat > test.csv << EOF
Date,Temperature,Humidity
2026-06-22 10:00:00,28.5*34.2*25.1,60.3*75.0*45.2
EOF

# Upload
curl -X POST "http://localhost:8000/conditions/hives/Test%20Hive/upload" \
  -H "X-API-Key: 2f25bed8-edda-4040-abde-fdc5b87a180a" \
  -F "file=@test.csv"
```

### Test Audio Upload
```bash
# Create test WAV file (requires ffmpeg)
ffmpeg -f lavfi -i "sine=frequency=1000:duration=1" test.wav

# Upload
curl -X POST "http://localhost:8000/recordings/Test%20Hive" \
  -H "X-API-Key: 2f25bed8-edda-4040-abde-fdc5b87a180a" \
  -F "file=@test.wav"
```

---

## 📚 Additional Resources

- **API Documentation**: Visit `/docs` on your server for interactive Swagger UI
- **Alternative Docs**: Visit `/redoc` for ReDoc documentation
- **Health Check**: `GET /health` returns `{"status": "ok"}`

---

## 🆘 Support

For issues or questions:
1. Check server logs: `docker compose logs farmer-sim`
2. Verify API key in `/data/api_keys.json`
3. Test with cURL before implementing in device firmware
4. Ensure network connectivity and correct server URL

---

**Last Updated**: June 22, 2026  
**API Version**: 1.0  
**Server**: BSADS Farmer External Data Repository
