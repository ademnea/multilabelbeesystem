# Folder Creation Flow with API Key (Token)

## 🎯 Quick Answer

The hive folder is created **automatically** using the API key (token) at these points:

1. **When BSADS creates a hive** → Calls `POST /recordings/hives/{hive_name}` with API key in header
2. **When sensor uploads first file** → Calls `POST /recordings/hives/{hive_name}/upload` with API key in header

The **API key in the request header** determines the folder location, NOT any parameter in the request body.

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. BSADS Creates Hive                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        POST http://196.43.168.57:8086/recordings/hives/Hive 01
        Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         Farmer Server Extracts API Key from Header             │
│                                                                 │
│  api_key = _require_api_key(x_api_key)                        │
│  # Returns: "299d3ae3-59d9-410e-b3ee-f17508cfcaac"            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Build Folder Path Using API Key                   │
│                                                                 │
│  def _hive_dir(api_key, hive_name, create=True):              │
│    # Step 1: Get API key root folder                          │
│    api_key_root = _api_key_root(api_key, create=True)        │
│    # = /home/farmer/recordings/299d3ae3.../                   │
│                                                                 │
│    # Step 2: Add hive name                                     │
│    hive_path = api_key_root / hive_name                       │
│    # = /home/farmer/recordings/299d3ae3.../Hive 01            │
│                                                                 │
│    # Step 3: Create folders                                    │
│    hive_path.mkdir(parents=True, exist_ok=True)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Folders Created on Filesystem                     │
│                                                                 │
│  /home/farmer/recordings/                                      │
│  └── 299d3ae3-59d9-410e-b3ee-f17508cfcaac/  ← API key folder  │
│      └── Hive 01/                            ← Hive folder     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Return Success Response                        │
│                                                                 │
│  {                                                              │
│    "hive_name": "Hive 01",                                     │
│    "path": "299d3ae3-59d9-410e-b3ee-f17508cfcaac/Hive 01"     │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Step-by-Step

### Step 1: BSADS Backend Creates Hive

When a user creates a hive in BSADS:

```python
# In bsads_backend_and_fast_api/api/routers/hives.py

# User's API key is stored in the database
current_user.api_key = "299d3ae3-59d9-410e-b3ee-f17508cfcaac"
current_user.server_url = "http://196.43.168.57:8086"

# BSADS calls the farmer server
api_config = {
    "api_base_url": current_user.server_url,
    "api_key": current_user.api_key  # ← This is the token!
}

# Call to create folder
from api.http_connector import create_hive_folder
result = create_hive_folder(api_config, hive_name="Hive 01")
```

### Step 2: HTTP Request Sent

```http
POST /recordings/hives/Hive%2001 HTTP/1.1
Host: 196.43.168.57:8086
X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac  ← Token in header!
```

**Important**: The API key is in the **header**, not in the URL or body!

### Step 3: Farmer Server Extracts API Key

```python
# In main.py on farmer server

@app.post("/recordings/hives/{hive_name}", status_code=201)
def create_hive_folder(hive_name: str, x_api_key: str = Header(...)):
    # Step 3a: Validate API key and get it
    api_key = _require_api_key(x_api_key)
    # Returns: "299d3ae3-59d9-410e-b3ee-f17508cfcaac"
    
    # Step 3b: Create folder using API key
    hive_path = _hive_dir(api_key, hive_name, create=True)
```

### Step 4: Build Folder Path

```python
def _hive_dir(api_key: str, hive_name: str, create: bool = False) -> Path:
    # Input:
    # - api_key = "299d3ae3-59d9-410e-b3ee-f17508cfcaac"
    # - hive_name = "Hive 01"
    # - create = True
    
    # Step 4a: Get the API key root folder
    api_key_root = _api_key_root(api_key, create=create)
    # Returns: /home/farmer/recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/
    
    # Step 4b: Append hive name
    hive_path = (api_key_root / hive_name).resolve()
    # Returns: /home/farmer/recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/Hive 01/
    
    # Step 4c: Create the folders
    if create:
        hive_path.mkdir(parents=True, exist_ok=True)
        # Creates both API key folder AND hive folder if they don't exist
    
    return hive_path
```

### Step 5: Folder Structure Created

```
/home/farmer/recordings/
└── 299d3ae3-59d9-410e-b3ee-f17508cfcaac/    ← Created from API key
    └── Hive 01/                              ← Created from hive_name parameter
```

---

## 🔑 Key Points

### 1. API Key (Token) Determines Folder Location

**The API key in the X-API-Key header determines which folder the hive goes into.**

```python
# Different API keys = Different folders
API_KEY_1 = "299d3ae3-59d9-410e-b3ee-f17508cfcaac"
API_KEY_2 = "d706187a-86ed-4adf-97d2-b9522ce44e57"

# Creates: /home/farmer/recordings/299d3ae3.../Hive 01/
POST /recordings/hives/Hive 01
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac

# Creates: /home/farmer/recordings/d706187a.../Hive 01/
POST /recordings/hives/Hive 01
Header: X-API-Key: d706187a-86ed-4adf-97d2-b9522ce44e57
```

### 2. Automatic Folder Creation

Folders are created **automatically** with `parents=True`:

```python
hive_path.mkdir(parents=True, exist_ok=True)
```

This creates:
1. `/home/farmer/recordings/` (if doesn't exist)
2. `/home/farmer/recordings/{api_key}/` (if doesn't exist)
3. `/home/farmer/recordings/{api_key}/{hive_name}/` (if doesn't exist)

### 3. Security: API Key Validation

The API key MUST exist in `data/api_keys.json`:

```python
def _require_api_key(x_api_key: str = Header(...)) -> str:
    keys = _load_keys()  # Loads data/api_keys.json
    if x_api_key not in keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return x_api_key
```

If the API key is not in `api_keys.json`, the request fails with **401 Unauthorized**.

---

## 📋 Two Ways Folders Get Created

### Method 1: Explicit Folder Creation (BSADS)

When BSADS creates a hive, it calls:

```bash
POST /recordings/hives/Hive 01
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac
```

**Result**: Folder created immediately
```
recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/Hive 01/
```

### Method 2: Implicit Folder Creation (Upload)

When a sensor uploads a file, the folder is created automatically:

```bash
POST /recordings/hives/Hive 02/upload
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac
Body: multipart/form-data with file

# In the upload endpoint:
# hive_path = _hive_dir(api_key, "Hive 02", create=True)
# ↑ This creates the folder if it doesn't exist
```

**Result**: Folder created when first file is uploaded
```
recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/Hive 02/file.wav
```

---

## 🎯 Real-World Examples

### Example 1: Multiple Farmers

**Farmer A** (API Key: `299d3ae3...`):
```bash
# Creates hive
POST /recordings/hives/Hive 01
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac

# Result:
recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/Hive 01/
```

**Farmer B** (API Key: `d706187a...`):
```bash
# Creates same hive name
POST /recordings/hives/Hive 01
Header: X-API-Key: d706187a-86ed-4adf-97d2-b9522ce44e57

# Result:
recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive 01/
```

**Both farmers have "Hive 01" but in different folders!**

### Example 2: One Farmer, Multiple Hives

**Farmer A** creates multiple hives:

```bash
# Hive 01
POST /recordings/hives/Hive 01
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac

# Hive 02
POST /recordings/hives/Hive 02
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac

# Hive 03
POST /recordings/hives/Hive 03
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac
```

**Result**:
```
recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/
├── Hive 01/
├── Hive 02/
└── Hive 03/
```

### Example 3: Upload Without Pre-Creating Folder

Sensor uploads directly without BSADS creating the folder first:

```bash
# No folder exists yet
POST /recordings/hives/Hive 05/upload
Header: X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac
Body: recording.wav

# The upload endpoint creates the folder automatically:
# hive_path = _hive_dir(api_key, "Hive 05", create=True)
```

**Result**:
```
recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/
└── Hive 05/
    └── recording.wav
```

---

## 🔍 Code Trace: Where Token Becomes Folder

### Location 1: `_api_key_root()` in main.py

```python
def _api_key_root(api_key: str, create: bool = False) -> Path:
    # This is where the API key (token) becomes a folder name!
    
    root = RECORDINGS_DIR.resolve()
    # = /home/farmer/recordings/
    
    api_key_root = (root / api_key).resolve()
    # = /home/farmer/recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/
    #                           ↑ API key becomes folder name here!
    
    if create:
        api_key_root.mkdir(parents=True, exist_ok=True)
        # Creates the folder
    
    return api_key_root
```

### Location 2: `_hive_dir()` in main.py

```python
def _hive_dir(api_key: str, hive_name: str, create: bool = False) -> Path:
    # Step 1: Get API key folder
    api_key_root = _api_key_root(api_key, create=create)
    # = /home/farmer/recordings/299d3ae3.../
    
    # Step 2: Append hive name
    hive_path = (api_key_root / hive_name).resolve()
    # = /home/farmer/recordings/299d3ae3.../Hive 01/
    #                                       ↑ hive_name parameter
    
    if create:
        hive_path.mkdir(parents=True, exist_ok=True)
        # Creates both API key folder AND hive folder
    
    return hive_path
```

---

## ✅ Summary

| Component | Source | Example |
|-----------|--------|---------|
| **Base Path** | Environment variable `RECORDINGS_DIR` | `/home/farmer/recordings/` |
| **API Key Folder** | `X-API-Key` header in request | `299d3ae3-59d9-410e-b3ee-f17508cfcaac/` |
| **Hive Folder** | `hive_name` URL parameter | `Hive 01/` |
| **Full Path** | Combination of above | `/home/farmer/recordings/299d3ae3.../Hive 01/` |

**The token (API key) in the request header determines the folder structure, NOT any ID in the request body or URL.**

---

## 🎯 Key Takeaway

**The API key IS the folder name!**

```
API Key (Token): 299d3ae3-59d9-410e-b3ee-f17508cfcaac
                 ↓
Folder:         recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/
                           ↑ Same as API key!
```

This provides **automatic isolation** between farmers - each API key gets its own folder, and farmers can't access each other's recordings.
