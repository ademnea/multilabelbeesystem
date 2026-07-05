# import json
# import os
# import uuid
# from datetime import datetime, timezone
# from pathlib import Path

# from fastapi import FastAPI, Header, HTTPException, status
# from fastapi.responses import FileResponse
# from fastapi.openapi.docs import get_swagger_ui_html
# from pydantic import BaseModel

# app = FastAPI(
#     title="Farmer External Data Source",
#     docs_url=None,  # Disable default docs
#     redoc_url=None  # Disable default redoc
# )

# RECORDINGS_DIR = Path(os.getenv("RECORDINGS_DIR", "/home/farmer/recordings"))
# KEYS_FILE = Path(os.getenv("KEYS_FILE", "/data/api_keys.json"))
# ADMIN_KEY = os.getenv("ADMIN_KEY", "admin-secret-changeme")


# # ---------------------------------------------------------------------------
# # Key store helpers
# # ---------------------------------------------------------------------------

# def _load_keys() -> dict:
#     if not KEYS_FILE.exists():
#         return {}
#     return json.loads(KEYS_FILE.read_text())


# def _save_keys(keys: dict):
#     KEYS_FILE.parent.mkdir(parents=True, exist_ok=True)
#     KEYS_FILE.write_text(json.dumps(keys, indent=2))


# # ---------------------------------------------------------------------------
# # Auth
# # ---------------------------------------------------------------------------

# def _require_admin(x_admin_key: str = Header(...)):
#     if x_admin_key != ADMIN_KEY:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin key")


# def _require_api_key(x_api_key: str = Header(...)) -> str:
#     """Validate API key and return it for use in getting user-specific data."""
#     keys = _load_keys()
#     if x_api_key not in keys:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
#     return x_api_key


# def _get_user_recordings_dir(api_key: str) -> Path:
#     """Get the recordings directory for a specific user based on their API key."""
#     user_dir = RECORDINGS_DIR / api_key
#     user_dir.mkdir(parents=True, exist_ok=True)
#     return user_dir


# # ---------------------------------------------------------------------------
# # Admin endpoints
# # ---------------------------------------------------------------------------

# class NewKeyRequest(BaseModel):
#     client_name: str


# @app.post("/admin/keys", status_code=201)
# def create_key(body: NewKeyRequest, x_admin_key: str = Header(...)):
#     _require_admin(x_admin_key)
#     keys = _load_keys()
#     new_key = str(uuid.uuid4())
#     keys[new_key] = {
#         "client_name": body.client_name,
#         "created_at": datetime.now(timezone.utc).isoformat(),
#     }
#     _save_keys(keys)
#     return {"api_key": new_key, "client_name": body.client_name}


# @app.get("/admin/keys")
# def list_keys(x_admin_key: str = Header(...)):
#     _require_admin(x_admin_key)
#     keys = _load_keys()
#     return {"keys": [{"api_key": k, **v} for k, v in keys.items()]}


# @app.delete("/admin/keys/{key}")
# def revoke_key(key: str, x_admin_key: str = Header(...)):
#     _require_admin(x_admin_key)
#     keys = _load_keys()
#     if key not in keys:
#         raise HTTPException(status_code=404, detail="Key not found")
#     client_name = keys.pop(key)["client_name"]
#     _save_keys(keys)
#     return {"revoked": key, "client_name": client_name}


# # ---------------------------------------------------------------------------
# # Data endpoints
# # ---------------------------------------------------------------------------

# @app.get("/recordings")
# def list_recordings(x_api_key: str = Header(...)):
#     api_key = _require_api_key(x_api_key)
#     user_dir = _get_user_recordings_dir(api_key)
#     files = [f.name for f in user_dir.glob("*.wav")]
#     return {"recordings": files}


# @app.get("/recordings/{filename}")
# def get_recording(filename: str, x_api_key: str = Header(...)):
#     api_key = _require_api_key(x_api_key)
#     user_dir = _get_user_recordings_dir(api_key)
#     path = user_dir / filename

#     # Security: Ensure the path is within the user's directory
#     if not path.resolve().is_relative_to(user_dir.resolve()):
#         raise HTTPException(status_code=403, detail="Access denied")

#     if not path.exists() or not path.is_file():
#         raise HTTPException(status_code=404, detail="Recording not found")
#     return FileResponse(path, media_type="audio/wav", filename=filename)


# @app.get("/health")
# def health():
#     return {"status": "ok"}


# # Custom Swagger UI with alternative CDN
# @app.get("/docs", include_in_schema=False)
# async def custom_swagger_ui_html():
#     return get_swagger_ui_html(
#         openapi_url=app.openapi_url,
#         title=app.title + " - Swagger UI",
#         swagger_js_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
#         swagger_css_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css",
#     )


# @app.get("/redoc", include_in_schema=False)
# async def redoc_html():
#     from fastapi.openapi.docs import get_redoc_html
#     return get_redoc_html(
#         openapi_url=app.openapi_url,
#         title=app.title + " - ReDoc",
#         redoc_js_url="https://unpkg.com/redoc@latest/bundles/redoc.standalone.js",
#     )


import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, status, UploadFile, File
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.responses import HTMLResponse

app = FastAPI(
    title="Farmer External Data Source",
    docs_url=None,
    redoc_url=None,
)

# Base path now starts at /home/farmer/recordings
# Final hive folder shape: /home/farmer/recordings/{api_key}/{hive_name}
RECORDINGS_DIR = Path(os.getenv("RECORDINGS_DIR", "/home/farmer/recordings"))
HIVE_CONDITIONS_DIR = Path(os.getenv("HIVE_CONDITIONS_DIR", "/home/farmer/hive_conditions"))
KEYS_FILE = Path(os.getenv("KEYS_FILE", "/data/api_keys.json"))
ADMIN_KEY = os.getenv("ADMIN_KEY", "admin-secret-changeme")


# ---------------------------------------------------------------------------
# Key store helpers
# ---------------------------------------------------------------------------


def _load_keys() -> dict:
    if not KEYS_FILE.exists():
        return {}
    return json.loads(KEYS_FILE.read_text())


def _save_keys(keys: dict):
    KEYS_FILE.parent.mkdir(parents=True, exist_ok=True)
    KEYS_FILE.write_text(json.dumps(keys, indent=2))


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


def _require_admin(x_admin_key: str = Header(...)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin key",
        )


def _require_api_key(x_api_key: str = Header(...)) -> str:
    keys = _load_keys()
    if x_api_key not in keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return x_api_key


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------


def _recordings_root() -> Path:
    return RECORDINGS_DIR.resolve()


def _api_key_root(api_key: str, create: bool = False) -> Path:
    api_key = api_key.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="api_key is required")

    root = _recordings_root()
    api_key_root = (root / api_key).resolve()
    if not api_key_root.is_relative_to(root):
        raise HTTPException(status_code=403, detail="Access denied")
    if create:
        api_key_root.mkdir(parents=True, exist_ok=True)
    return api_key_root


def _hive_dir(api_key: str, hive_name: str, create: bool = False) -> Path:
    hive_name = hive_name.strip()
    if not hive_name:
        raise HTTPException(status_code=400, detail="hive_name is required")
    if "/" in hive_name or "\\" in hive_name:
        raise HTTPException(status_code=400, detail="Invalid hive_name")

    api_key_root = _api_key_root(api_key, create=create)
    hive_path = (api_key_root / hive_name).resolve()
    if not hive_path.is_relative_to(api_key_root):
        raise HTTPException(status_code=403, detail="Access denied")
    if create:
        hive_path.mkdir(parents=True, exist_ok=True)
    return hive_path


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


class NewKeyRequest(BaseModel):
    client_name: str


@app.post("/admin/keys", status_code=201)
def create_key(body: NewKeyRequest, x_admin_key: str = Header(...)):
    _require_admin(x_admin_key)
    keys = _load_keys()
    new_key = str(uuid.uuid4())
    keys[new_key] = {
        "client_name": body.client_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _save_keys(keys)
    return {"api_key": new_key, "client_name": body.client_name}


@app.get("/admin/keys")
def list_keys(x_admin_key: str = Header(...)):
    _require_admin(x_admin_key)
    keys = _load_keys()
    return {"keys": [{"api_key": k, **v} for k, v in keys.items()]}


@app.delete("/admin/keys/{key}")
def revoke_key(key: str, x_admin_key: str = Header(...)):
    _require_admin(x_admin_key)
    keys = _load_keys()
    if key not in keys:
        raise HTTPException(status_code=404, detail="Key not found")
    client_name = keys.pop(key)["client_name"]
    _save_keys(keys)
    return {"revoked": key, "client_name": client_name}


# ---------------------------------------------------------------------------
# Data endpoints
# ---------------------------------------------------------------------------


@app.get("/recordings")
def list_recordings(
    x_api_key: str = Header(...),
    hive_name: Optional[str] = None,
    hive_id: Optional[str] = None,  # optional backward compatibility
):
    api_key = _require_api_key(x_api_key)

    selected_hive = (hive_name or hive_id or "").strip()
    if selected_hive:
        hive_path = _hive_dir(api_key, selected_hive)
        if not hive_path.exists():
            return {"recordings": []}
        files = [
            f"{selected_hive}/{f.name}" for f in hive_path.glob("*.wav") if f.is_file()
        ]
        return {"recordings": sorted(files)}

    # If no hive filter is provided, return all hives for this API key
    root = _api_key_root(api_key)
    if not root.exists():
        return {"recordings": []}
    files = [
        str(p.relative_to(root)).replace("\\", "/")
        for p in root.rglob("*.wav")
        if p.is_file()
    ]
    return {"recordings": sorted(files)}


@app.get("/recordings/hives", response_model=dict)
def list_hive_folders(x_api_key: str = Header(...)):
    """
    List all hive folders for the authenticated user (based on API key).
    
    Returns:
        {
            "api_key": "299d3ae3-...",
            "hives": [
                {
                    "hive_name": "Hive 01",
                    "recording_count": 5,
                    "path": "299d3ae3-.../Hive 01"
                },
                {
                    "hive_name": "Hive 02",
                    "recording_count": 3,
                    "path": "299d3ae3-.../Hive 02"
                }
            ],
            "total_hives": 2,
            "total_recordings": 8
        }
    """
    api_key = _require_api_key(x_api_key)
    api_key_root = _api_key_root(api_key)
    
    # If user's folder doesn't exist yet, return empty list
    if not api_key_root.exists():
        return {
            "api_key": api_key,
            "hives": [],
            "total_hives": 0,
            "total_recordings": 0
        }
    
    hives = []
    total_recordings = 0
    
    # Iterate through all directories in the user's folder
    for hive_dir in sorted(api_key_root.iterdir()):
        if not hive_dir.is_dir():
            continue
        
        hive_name = hive_dir.name
        
        # Count WAV files in this hive
        wav_files = list(hive_dir.glob("*.wav"))
        recording_count = len(wav_files)
        total_recordings += recording_count
        
        hives.append({
            "hive_name": hive_name,
            "recording_count": recording_count,
            "path": str(hive_dir.relative_to(_recordings_root())).replace("\\", "/")
        })
    
    return {
        "api_key": api_key,
        "hives": hives,
        "total_hives": len(hives),
        "total_recordings": total_recordings
    }


@app.post("/recordings/hives/{hive_name}", status_code=201)
def create_hive_folder(hive_name: str, x_api_key: str = Header(...)):
    api_key = _require_api_key(x_api_key)
    hive_path = _hive_dir(api_key, hive_name, create=True)
    
    # Also create the corresponding folder in hive_conditions
    hive_name = hive_name.strip()
    if not hive_name:
        raise HTTPException(status_code=400, detail="hive_name is required")
    if "/" in hive_name or "\\" in hive_name:
        raise HTTPException(status_code=400, detail="Invalid hive_name")

    conditions_base = HIVE_CONDITIONS_DIR.resolve()
    conditions_base.mkdir(parents=True, exist_ok=True)

    api_key_dir = (conditions_base / api_key).resolve()
    if not api_key_dir.is_relative_to(conditions_base):
        raise HTTPException(status_code=403, detail="Access denied")
    api_key_dir.mkdir(parents=True, exist_ok=True)

    hive_dir = (api_key_dir / hive_name).resolve()
    if not hive_dir.is_relative_to(api_key_dir):
        raise HTTPException(status_code=403, detail="Access denied")
    hive_dir.mkdir(parents=True, exist_ok=True)
    
    return {
        "hive_name": hive_name,
        "path": str(hive_path.relative_to(_recordings_root())).replace("\\", "/"),
    }


@app.post("/conditions/hives/{hive_name}", status_code=201)
def create_hive_conditions_folder(hive_name: str, x_api_key: str = Header(...)):
    """
    Create a hive folder for conditions data on the farmer's server.
    
    Files will be stored in: /hive_conditions/{api_key}/{hive_name}/
    """
    api_key = _require_api_key(x_api_key)
    hive_name = hive_name.strip()
    if not hive_name:
        raise HTTPException(status_code=400, detail="hive_name is required")
    if "/" in hive_name or "\\" in hive_name:
        raise HTTPException(status_code=400, detail="Invalid hive_name")

    # Create directory structure: /hive_conditions/{api_key}/{hive_name}/
    conditions_base = HIVE_CONDITIONS_DIR.resolve()
    conditions_base.mkdir(parents=True, exist_ok=True)

    api_key_dir = (conditions_base / api_key).resolve()
    if not api_key_dir.is_relative_to(conditions_base):
        raise HTTPException(status_code=403, detail="Access denied")
    api_key_dir.mkdir(parents=True, exist_ok=True)

    hive_dir = (api_key_dir / hive_name).resolve()
    if not hive_dir.is_relative_to(api_key_dir):
        raise HTTPException(status_code=403, detail="Access denied")
    hive_dir.mkdir(parents=True, exist_ok=True)

    return {
        "hive_name": hive_name,
        "path": f"{api_key}/{hive_name}",
    }


@app.post("/recordings/hives/{hive_name}/upload", status_code=201)
async def upload_recording(
    hive_name: str,
    file: UploadFile = File(...),
    x_api_key: str = Header(...),
):
    """
    Upload a WAV recording file to a specific hive.
    The hive folder will be created automatically if it doesn't exist.
    """
    api_key = _require_api_key(x_api_key)
    
    # Validate file type
    if not file.filename.lower().endswith('.wav'):
        raise HTTPException(
            status_code=400,
            detail="Only .wav files are supported"
        )
    
    # Create hive directory if it doesn't exist
    hive_path = _hive_dir(api_key, hive_name, create=True)
    
    # Save the file
    file_path = hive_path / file.filename
    
    # Check if file already exists
    if file_path.exists():
        raise HTTPException(
            status_code=409,
            detail=f"File {file.filename} already exists in {hive_name}"
        )
    
    # Write file in chunks
    try:
        with open(file_path, "wb") as f:
            while chunk := await file.read(8192):  # Read in 8KB chunks
                f.write(chunk)
    except Exception as e:
        # Clean up partial file if upload failed
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    
    file_size = file_path.stat().st_size
    
    return {
        "filename": file.filename,
        "hive_name": hive_name,
        "size_bytes": file_size,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "path": f"{api_key}/{hive_name}/{file.filename}"
    }


@app.post("/conditions/hives/{hive_name}/upload", status_code=201)
async def upload_conditions(
    hive_name: str,
    file: UploadFile = File(...),
    x_api_key: str = Header(...),
):
    """
    Upload CSV file with hive condition data (temperature & humidity readings).
    
    CSV Format:
    Date,Temperature,Humidity
    2026-06-19 21:42:00,28.5*34.2*25.1,60.3*75.0*45.2
    
    Temperature format: honey*brood*exterior
    Humidity format: honey*brood*exterior
    
    Files are stored in: /hive_conditions/{api_key}/{hive_name}/filename_timestamp.csv
    The device sends this file and immediately goes back to sleep.
    The backend poller will fetch and process it asynchronously.
    """
    api_key = _require_api_key(x_api_key)
    
    # Validate file type
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only .csv files are supported"
        )
    
    # Create directory structure: /hive_conditions/{api_key}/{hive_name}/
    conditions_base = HIVE_CONDITIONS_DIR.resolve()
    conditions_base.mkdir(parents=True, exist_ok=True)
    
    api_key_dir = (conditions_base / api_key).resolve()
    if not api_key_dir.is_relative_to(conditions_base):
        raise HTTPException(status_code=403, detail="Access denied")
    api_key_dir.mkdir(parents=True, exist_ok=True)
    
    hive_dir = (api_key_dir / hive_name).resolve()
    if not hive_dir.is_relative_to(api_key_dir):
        raise HTTPException(status_code=403, detail="Access denied")
    hive_dir.mkdir(parents=True, exist_ok=True)
    
    # Add timestamp to filename to avoid conflicts on multiple uploads
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    base_name = Path(file.filename).stem
    new_filename = f"{base_name}_{timestamp}.csv"
    file_path = hive_dir / new_filename
    
    # Write file in chunks
    try:
        with open(file_path, "wb") as f:
            while chunk := await file.read(8192):  # Read in 8KB chunks
                f.write(chunk)
    except Exception as e:
        # Clean up partial file if upload failed
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    
    file_size = file_path.stat().st_size
    
    return {
        "filename": new_filename,
        "original_filename": file.filename,
        "hive_name": hive_name,
        "size_bytes": file_size,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "path": f"{api_key}/{hive_name}/{new_filename}"
    }


@app.get("/conditions")
def list_conditions(
    x_api_key: str = Header(...),
    hive_name: Optional[str] = None,
):
    """List all CSV condition files for the authenticated user"""
    api_key = _require_api_key(x_api_key)
    
    conditions_base = HIVE_CONDITIONS_DIR.resolve()
    api_key_dir = (conditions_base / api_key).resolve()
    
    if not api_key_dir.exists():
        return {"conditions": []}
    
    if hive_name:
        hive_dir = (api_key_dir / hive_name).resolve()
        if not hive_dir.exists() or not hive_dir.is_relative_to(api_key_dir):
            return {"conditions": []}
        files = [
            f"{hive_name}/{f.name}" for f in hive_dir.glob("*.csv") if f.is_file()
        ]
        return {"conditions": sorted(files)}
    
    # Return all CSV files for this API key
    files = [
        str(p.relative_to(api_key_dir)).replace("\\", "/")
        for p in api_key_dir.rglob("*.csv")
        if p.is_file()
    ]
    return {"conditions": sorted(files)}


@app.get("/conditions/{file_path:path}")
def get_condition_file(file_path: str, x_api_key: str = Header(...)):
    """Download a specific CSV condition file"""
    api_key = _require_api_key(x_api_key)
    
    conditions_base = HIVE_CONDITIONS_DIR.resolve()
    api_key_dir = (conditions_base / api_key).resolve()
    
    if not api_key_dir.exists():
        raise HTTPException(status_code=404, detail="Condition file not found")
    
    file_full_path = (api_key_dir / file_path).resolve()
    
    if not file_full_path.is_relative_to(api_key_dir):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not file_full_path.exists() or not file_full_path.is_file():
        raise HTTPException(status_code=404, detail="Condition file not found")
    
    return FileResponse(file_full_path, media_type="text/csv", filename=file_full_path.name)


@app.delete("/conditions/{file_path:path}")
def delete_condition_file(file_path: str, x_api_key: str = Header(...)):
    """Delete a specific CSV condition file after it has been processed"""
    api_key = _require_api_key(x_api_key)
    
    conditions_base = HIVE_CONDITIONS_DIR.resolve()
    api_key_dir = (conditions_base / api_key).resolve()
    
    if not api_key_dir.exists():
        raise HTTPException(status_code=404, detail="Condition file not found")
    
    file_full_path = (api_key_dir / file_path).resolve()
    
    if not file_full_path.is_relative_to(api_key_dir):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not file_full_path.exists() or not file_full_path.is_file():
        raise HTTPException(status_code=404, detail="Condition file not found")
    
    file_full_path.unlink()
    
    return {"detail": "File deleted successfully", "file_path": file_path}


@app.get("/recordings/{file_path:path}")
def get_recording(file_path: str, x_api_key: str = Header(...)):
    api_key = _require_api_key(x_api_key)
    root = _api_key_root(api_key)

    if not root.exists():
        raise HTTPException(status_code=404, detail="Recording not found")

    path = (root / file_path).resolve()
    if not path.is_relative_to(root):
        raise HTTPException(status_code=403, detail="Access denied")

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Recording not found")

    return FileResponse(path, media_type="audio/wav", filename=path.name)

@app.get("/", response_class=HTMLResponse)
def root_page():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/light.css">
        <title>BSADS FARMER'S SIMULATION SERVER ENDPOINT API</title>
    </head>
    <body>
        <h1>Welcome to BSADS Farmer's Data External Repository Server API Endpoints</h1>
        <p>To access the documents, visit <a href="/docs">/docs</a> or <a href="/redoc">/redoc</a>.</p>
    </body>
    </html>
    """

@app.get("/health") 
def health():
    return {"status": "ok"}


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css",
    )


@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title + " - ReDoc",
        redoc_js_url="https://unpkg.com/redoc@latest/bundles/redoc.standalone.js",
    )
