# BSADS Backend Integration Fixes

## 🔍 Issues Identified

Based on your error messages, there are 3 main problems:

### 1. **Connection Timeout**
```json
"folder_creation_error": "Connection failed: HTTPConnectionPool(host='196.43.168.57', port=8086): 
Max retries exceeded with url: /recordings/hives/Hive%2001 
(Caused by ConnectTimeoutError...Connection to 196.43.168.57 timed out. (connect timeout=10)'))"
```

**Problem**: BSADS backend can't reach the farmer data source server at `196.43.168.57:8086`

**Possible causes**:
- ✅ Server is not running
- ✅ Firewall blocking port 8086
- ✅ Wrong IP/port configuration
- ✅ Server not accessible from BSADS backend location

### 2. **Invalid API Key (401)**
```json
"folder_creation_error": "Invalid API key (401 Unauthorized)"
```

**Problem**: The API keys in users' profiles don't match the API keys in `data/api_keys.json`

**Evidence from your data**:
- User has `owner_id`: `74e46290-131b-4878-ab47-7e61e93bf08c` (from request)
- But response shows `owner_id`: `5dba5a92-b002-4ba9-8a9b-05c68361f6e7` (different!)
- API key used: `8f7d0156-d089-423c-b98a-317bad874253` (not in your api_keys.json)

### 3. **Hive Created Even When Folder Creation Fails**
```json
{
  "hive_id": "b6fac8d9-637d-4fff-b420-a95a38d553e8",  // ← Hive created
  "folder_created": false,                             // ← But folder failed
  "folder_creation_error": "Connection failed: ..."    // ← With error
}
```

**Problem**: The code creates the hive in the database BEFORE attempting to create the folder, not as a transaction.

---

## ✅ Solutions

### Solution 1: Fix Server Connectivity

The farmer data source server needs to be accessible from the BSADS backend.

#### Check if server is running:

```bash
# On the server (196.43.168.57)
ssh ademneadev@196.43.168.57
docker ps | grep farmer-data-source

# Should show running container
```

#### Test connectivity from BSADS backend:

```bash
# From the machine running BSADS backend
curl http://196.43.168.57:8086/health

# Should return: {"status":"ok"}
```

#### If connection fails, check firewall:

```bash
# On the server (196.43.168.57)
sudo ufw status
sudo ufw allow 8086/tcp
```

#### **Recommended**: Use ngrok URL instead of direct IP

Since you have ngrok set up, the BSADS backend should use the ngrok URL instead:

```
https://jockstrap-boxlike-revisable.ngrok-free.dev
```

This bypasses firewall issues and works from anywhere.

---

### Solution 2: Fix API Key Mismatch

The users in your BSADS database need to have the correct API keys that match your farmer data source server.

#### Step 1: Check user API keys in BSADS database

```sql
-- Connect to BSADS database
SELECT user_id, username, email, server_url, api_key 
FROM users 
WHERE api_key IS NOT NULL;
```

#### Step 2: Check API keys in farmer data source

```bash
# Check your farmer data source API keys
cat data/api_keys.json | jq
```

#### Step 3: Update users with correct API keys

The API keys you have in `data/api_keys.json`:
- `299d3ae3-59d9-410e-b3ee-f17508cfcaac` (Admin Ahaabwe)
- `d706187a-86ed-4adf-97d2-b9522ce44e57` (Test User)
- `8361f43b-65bf-4f9e-b7ff-200a7d451577` (Local User)
- `f31dccb4-8132-4bc1-8840-67b3c3fc3440` (Local Admin)
- `a76ed6fe-7963-43dc-81bd-ea18e0102868` (appears in your errors but NOT in api_keys.json!)

**Action needed**: Either:
1. Add the missing API key to the farmer server, or
2. Update the user in BSADS database to use an existing API key

```sql
-- Update user's API key in BSADS database
UPDATE users 
SET api_key = '299d3ae3-59d9-410e-b3ee-f17508cfcaac',
    server_url = 'https://jockstrap-boxlike-revisable.ngrok-free.dev'
WHERE user_id = 'a76ed6fe-7963-43dc-81bd-ea18e0102868';
```

Or create it on the farmer server:

```bash
curl -X POST http://196.43.168.57:8086/admin/keys \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"client_name": "BSADS User"}'
```

---

### Solution 3: Make Hive Creation Transactional

**Current behavior**: Hive is created in DB → Folder creation attempted → If fails, hive still exists

**Desired behavior**: Folder creation attempted → If succeeds, create hive in DB → If fails, no hive created

Here's the fix for `bsads_backend_and_fast_api/api/routers/hives.py`:



#### Changes Made:

1. **Test connection and create folder BEFORE creating hive in database**
2. **If connection fails → Return HTTP 503 error immediately (no hive created)**
3. **If folder creation fails → Return HTTP 503 error immediately (no hive created)**
4. **Exception**: If endpoint returns 404 (not supported), treat as non-critical and continue

This ensures:
- ✅ Hive is only created if server is reachable
- ✅ Hive is only created if folder can be created (or endpoint not supported)
- ✅ No orphaned hives in database when farmer server is unreachable
- ✅ User gets clear error message explaining what went wrong

---

## 🧪 Testing the Fixes

### Test 1: Verify Farmer Server is Running

```bash
# Check server status
curl http://196.43.168.57:8086/health

# Expected: {"status":"ok"}
```

### Test 2: Verify API Key Works

```bash
# Test with your existing API key
curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
  http://196.43.168.57:8086/recordings

# Expected: {"recordings": [...]}
# NOT: 401 Unauthorized
```

### Test 3: Test Folder Creation Endpoint

```bash
# Test creating a hive folder
curl -X POST http://196.43.168.57:8086/recordings/hives/Test%20Hive \
  -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac"

# Expected: {"hive_name": "Test Hive", "path": "..."}
# Status: 201 Created
```

### Test 4: Test Hive Creation with Fixed Code

```bash
# Make sure user has correct server_url and api_key in BSADS database first!

curl -X 'POST' \
  'http://196.43.168.57:8085/bsads-api-db/hives' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "hive_location": "COCIS",
    "hive_type": "Langstroth",
    "hive_name": "Test Hive 05",
    "installation_date": "2026-06-18",
    "latitude": 0.332394,
    "longitude": 32.570352
  }'
```

**Expected successful response**:
```json
{
  "hive_id": "...",
  "owner_id": "...",
  "hive_name": "Test Hive 05",
  "folder_created": true,
  "folder_creation_error": null,
  "suggested_remote_folder": "/home/farmer/recordings/YOUR_API_KEY/Test Hive 05"
}
```

**Expected failure response** (if server unreachable):
```json
{
  "error": "Cannot connect to farmer data source server",
  "details": "Connection failed: ...",
  "server_url": "http://196.43.168.57:8086",
  "suggestion": "Check that your server is running and accessible"
}
```

---

## 📋 Complete Setup Checklist

### Step 1: Verify Farmer Data Source Server

- [ ] Server is running: `docker ps | grep farmer-data-source`
- [ ] Health endpoint works: `curl http://196.43.168.57:8086/health`
- [ ] API docs accessible: http://196.43.168.57:8086/docs
- [ ] Firewall allows port 8086: `sudo ufw allow 8086/tcp`

### Step 2: Fix User Credentials in BSADS Database

```sql
-- Check current users
SELECT user_id, username, server_url, api_key FROM users;

-- Update user with correct credentials
UPDATE users 
SET 
  server_url = 'http://196.43.168.57:8086',  -- or ngrok URL
  api_key = '299d3ae3-59d9-410e-b3ee-f17508cfcaac'  -- valid API key
WHERE user_id = 'YOUR_USER_ID';
```

Or use ngrok URL (recommended):
```sql
UPDATE users 
SET 
  server_url = 'https://jockstrap-boxlike-revisable.ngrok-free.dev',
  api_key = '299d3ae3-59d9-410e-b3ee-f17508cfcaac'
WHERE user_id = 'YOUR_USER_ID';
```

### Step 3: Verify API Keys Match

```bash
# List API keys on farmer server
cat data/api_keys.json | jq 'keys'

# Should include the API key you set in BSADS database
```

If API key doesn't exist, create it:
```bash
curl -X POST http://196.43.168.57:8086/admin/keys \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"client_name": "BSADS User Name"}'

# Copy the returned api_key and update BSADS database
```

### Step 4: Apply Code Changes

- [ ] Updated `bsads_backend_and_fast_api/api/routers/hives.py` with transactional logic
- [ ] Restart BSADS backend:
  ```bash
  cd bsads_backend_and_fast_api
  docker compose restart
  # or
  ./start.sh
  ```

### Step 5: Test Integration

- [ ] Create a test hive via BSADS API
- [ ] Verify hive created in database
- [ ] Verify folder created on farmer server
- [ ] Check logs for any errors

---

## 🔧 Configuration Examples

### User Configuration in BSADS Database

**Option 1: Direct IP (requires firewall open)**
```sql
UPDATE users SET 
  server_url = 'http://196.43.168.57:8086',
  api_key = '299d3ae3-59d9-410e-b3ee-f17508cfcaac'
WHERE user_id = 'a76ed6fe-7963-43dc-81bd-ea18e0102868';
```

**Option 2: Ngrok URL (recommended, works everywhere)**
```sql
UPDATE users SET 
  server_url = 'https://jockstrap-boxlike-revisable.ngrok-free.dev',
  api_key = '299d3ae3-59d9-410e-b3ee-f17508cfcaac'
WHERE user_id = 'a76ed6fe-7963-43dc-81bd-ea18e0102868';
```

### Folder Structure After Fix

When hive is created successfully:
```
/home/farmer/recordings/
└── 299d3ae3-59d9-410e-b3ee-f17508cfcaac/  ← User's API key
    ├── Hive 01/                             ← Auto-created
    ├── Hive 02/                             ← Auto-created
    ├── Hive 03/                             ← Auto-created
    └── Test Hive 05/                        ← Auto-created
```

---

## 🚨 Common Errors & Solutions

### Error: "Connection failed: HTTPConnectionPool..."

**Cause**: Can't reach farmer server

**Solutions**:
1. Check server is running: `docker ps`
2. Check firewall: `sudo ufw allow 8086/tcp`
3. Use ngrok URL instead of direct IP
4. Test from BSADS backend machine: `curl http://196.43.168.57:8086/health`

### Error: "Invalid API key (401 Unauthorized)"

**Cause**: API key in BSADS database doesn't match farmer server

**Solutions**:
1. Check API keys match:
   ```bash
   # On farmer server
   cat data/api_keys.json | jq
   
   # In BSADS database
   SELECT user_id, api_key FROM users;
   ```
2. Either update user's API key in BSADS, or create the API key on farmer server

### Error: "Endpoint not supported - farmer should create folder manually"

**Cause**: Old version of farmer server without upload endpoint

**Solution**: 
- ✅ This is now handled gracefully - hive will still be created
- ✅ Folder will be created automatically on first upload
- ✅ Or deploy the updated farmer server code with upload endpoint

### Error: Hive created but folder_created=false

**Before fix**: Hive exists in DB but folder failed to create

**After fix**: Hive creation fails entirely if folder can't be created (except for "endpoint not supported")

---

## 📊 Monitoring

### Check BSADS System Logs

```sql
SELECT * FROM system_logs 
WHERE event_type = 'http_api' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Farmer Server Logs

```bash
docker logs farmer-data-source --tail 50
```

### Check Hive Status

```sql
SELECT 
  h.hive_id,
  h.hive_name,
  h.owner_id,
  u.username,
  u.server_url,
  u.api_key,
  fds.is_active,
  fds.connection_config
FROM hives h
JOIN users u ON h.owner_id = u.user_id
LEFT JOIN farmer_data_sources fds ON h.hive_id = fds.hive_id
WHERE h.is_deleted = FALSE;
```

---

## ✅ Success Criteria

After applying all fixes, you should see:

1. **Connection Test**: ✅ Can reach farmer server from BSADS backend
   ```bash
   curl http://196.43.168.57:8086/health
   # Returns: {"status":"ok"}
   ```

2. **API Key Test**: ✅ API key works
   ```bash
   curl -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
     http://196.43.168.57:8086/recordings
   # Returns: {"recordings": [...]}
   ```

3. **Hive Creation**: ✅ Hive created successfully
   ```json
   {
     "hive_id": "...",
     "hive_name": "Test Hive",
     "folder_created": true,
     "folder_creation_error": null
   }
   ```

4. **Folder Exists**: ✅ Folder created on server
   ```bash
   ls recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/
   # Shows: Hive 01  Hive 02  Test Hive
   ```

5. **Upload Works**: ✅ Can upload recordings to hive
   ```bash
   curl -X POST http://196.43.168.57:8086/recordings/hives/Test%20Hive/upload \
     -H "X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac" \
     -F "file=@test.wav"
   # Returns: 201 Created
   ```

---

## 🎯 Quick Fix Summary

1. **Server Connectivity**
   - ✅ Ensure farmer server is running and accessible
   - ✅ Open firewall port 8086 or use ngrok URL

2. **API Key Mismatch**
   - ✅ Update users in BSADS database with correct API keys
   - ✅ Or create missing API keys on farmer server

3. **Transactional Hive Creation**
   - ✅ Applied code fix to test folder creation before creating hive
   - ✅ Hive only created if server is reachable and folder can be created
   - ✅ Clear error messages when something fails

---

**Next Steps**: 
1. Verify farmer server is accessible
2. Fix API key mismatches
3. Test hive creation
4. Monitor logs for any issues
