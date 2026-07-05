#!/usr/bin/env python3
"""
Simple polling client for the Farmer External Data Source API.

This script continuously polls the API for new audio recordings and downloads them.

Usage:
    export FARMER_API_URL="https://your-server.ngrok-free.dev"
    export FARMER_API_KEY="your-api-key-here"
    python example_polling_client.py
"""

import os
import time
import json
import requests
from pathlib import Path
from datetime import datetime

# Configuration
BASE_URL = os.getenv("FARMER_API_URL", "http://localhost:8000")
API_KEY = os.getenv("FARMER_API_KEY")
DOWNLOAD_DIR = Path(os.getenv("DOWNLOAD_DIR", "./downloaded_recordings"))
STATE_FILE = Path("./download_state.json")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "60"))  # seconds

# Validate configuration
if not API_KEY:
    print("ERROR: FARMER_API_KEY environment variable is required")
    print("Example: export FARMER_API_KEY='your-api-key-here'")
    exit(1)

# Setup
DOWNLOAD_DIR.mkdir(exist_ok=True)
headers = {"X-API-Key": API_KEY}


def load_state():
    """Load the list of already downloaded files."""
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"downloaded": [], "last_poll": None}


def save_state(state):
    """Save the download state."""
    state["last_poll"] = datetime.utcnow().isoformat()
    STATE_FILE.write_text(json.dumps(state, indent=2))


def get_available_recordings():
    """Fetch list of available recordings from the server."""
    try:
        response = requests.get(f"{BASE_URL}/recordings", headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()["recordings"]
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            print("ERROR: Invalid API key. Please check your FARMER_API_KEY.")
            exit(1)
        print(f"HTTP Error fetching recordings list: {e}")
        return []
    except requests.exceptions.RequestException as e:
        print(f"Error fetching recordings list: {e}")
        return []


def download_recording(filename):
    """Download a single recording file."""
    try:
        url = f"{BASE_URL}/recordings/{filename}"
        response = requests.get(url, headers=headers, timeout=30, stream=True)
        response.raise_for_status()
        
        local_path = DOWNLOAD_DIR / filename
        with open(local_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        file_size = local_path.stat().st_size
        print(f"✓ Downloaded: {filename} ({file_size:,} bytes)")
        return True
    except requests.exceptions.RequestException as e:
        print(f"✗ Error downloading {filename}: {e}")
        return False


def poll_and_download():
    """Main polling loop."""
    state = load_state()
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"\n[{timestamp}] Polling for new recordings...")
    
    # Get available recordings
    available = get_available_recordings()
    if not available:
        print("No recordings available or error occurred.")
        return
    
    print(f"Server has {len(available)} recording(s) available")
    
    # Find new recordings
    new_files = [f for f in available if f not in state["downloaded"]]
    
    if not new_files:
        print(f"No new recordings. Already downloaded: {len(state['downloaded'])}")
        return
    
    print(f"Found {len(new_files)} new recording(s): {new_files}")
    
    # Download new files
    for filename in new_files:
        if download_recording(filename):
            state["downloaded"].append(filename)
            save_state(state)


def main():
    """Run the polling loop indefinitely."""
    print("=" * 70)
    print("Farmer External Data Source - Polling Client")
    print("=" * 70)
    print(f"Base URL:          {BASE_URL}")
    print(f"Download directory: {DOWNLOAD_DIR.absolute()}")
    print(f"Poll interval:     {POLL_INTERVAL} seconds")
    print(f"State file:        {STATE_FILE.absolute()}")
    print("=" * 70)
    print("\nPress Ctrl+C to stop\n")
    
    # Initial health check
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✓ Server is reachable\n")
        else:
            print(f"⚠ Server returned status {response.status_code}\n")
    except requests.exceptions.RequestException as e:
        print(f"⚠ Cannot reach server: {e}\n")
    
    while True:
        try:
            poll_and_download()
        except KeyboardInterrupt:
            print("\n\nStopping polling client...")
            print("Download state has been saved.")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
        
        print(f"Waiting {POLL_INTERVAL} seconds until next poll...")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
