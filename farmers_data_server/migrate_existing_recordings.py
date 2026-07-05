#!/usr/bin/env python3
"""
Helper script to test uploading existing recordings from the recordings/ folder.
This simulates what your sensors will do in production.

Usage:
    # Test upload for a specific farmer and hive
    python migrate_existing_recordings.py 299d3ae3-59d9-410e-b3ee-f17508cfcaac "Hive 01"
    
    # Test upload all recordings for a farmer
    python migrate_existing_recordings.py 299d3ae3-59d9-410e-b3ee-f17508cfcaac
"""

import os
import sys
import json
import requests
from pathlib import Path

# Configuration
API_URL = os.getenv("FARMER_API_URL", "http://localhost:8000")
RECORDINGS_DIR = Path("recordings")
API_KEYS_FILE = Path("data/api_keys.json")

def load_api_keys():
    """Load API keys from the keys file."""
    if not API_KEYS_FILE.exists():
        print(f"❌ Error: {API_KEYS_FILE} not found")
        sys.exit(1)
    return json.loads(API_KEYS_FILE.read_text())

def get_farmer_recordings(api_key, hive_filter=None):
    """Get list of recordings for a specific farmer (from local folder)."""
    farmer_dir = RECORDINGS_DIR / api_key
    
    if not farmer_dir.exists():
        print(f"❌ Error: No recordings folder for API key {api_key}")
        return []
    
    recordings = []
    
    # Iterate through hive folders
    for hive_dir in farmer_dir.iterdir():
        if not hive_dir.is_dir():
            continue
        
        hive_name = hive_dir.name
        
        # Filter by hive if specified
        if hive_filter and hive_name != hive_filter:
            continue
        
        # Get all WAV files in this hive
        for wav_file in hive_dir.glob("*.wav"):
            recordings.append({
                'hive': hive_name,
                'file': wav_file,
                'filename': wav_file.name
            })
    
    return recordings

def test_upload(api_key, hive_name, file_path):
    """Test uploading a single recording."""
    url = f"{API_URL}/recordings/hives/{hive_name}/upload"
    headers = {"X-API-Key": api_key}
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'audio/wav')}
            response = requests.post(url, headers=headers, files=files, timeout=30)
        
        if response.status_code == 201:
            result = response.json()
            return True, f"✅ Uploaded: {result['filename']}"
        elif response.status_code == 409:
            return True, f"⚠️  Already exists: {file_path.name}"
        else:
            return False, f"❌ HTTP {response.status_code}: {response.text[:100]}"
    
    except requests.exceptions.ConnectionError:
        return False, f"❌ Cannot connect to {API_URL}"
    except Exception as e:
        return False, f"❌ Error: {e}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate_existing_recordings.py <api_key> [hive_name]")
        print("\nAvailable API keys:")
        
        keys = load_api_keys()
        for key, info in keys.items():
            farmer_dir = RECORDINGS_DIR / key
            if farmer_dir.exists():
                hives = [d.name for d in farmer_dir.iterdir() if d.is_dir()]
                print(f"  {key[:8]}... ({info['client_name']})")
                print(f"    Hives: {', '.join(hives)}")
        
        sys.exit(1)
    
    api_key = sys.argv[1]
    hive_filter = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Load and validate API key
    keys = load_api_keys()
    if api_key not in keys:
        print(f"❌ Error: API key not found in {API_KEYS_FILE}")
        print(f"\nAvailable keys:")
        for k, info in keys.items():
            print(f"  {k} ({info['client_name']})")
        sys.exit(1)
    
    farmer_info = keys[api_key]
    
    print("=" * 70)
    print("Farmer Recording Upload Test")
    print("=" * 70)
    print(f"Farmer:      {farmer_info['client_name']}")
    print(f"API Key:     {api_key}")
    print(f"Server:      {API_URL}")
    if hive_filter:
        print(f"Hive Filter: {hive_filter}")
    print("=" * 70)
    print()
    
    # Get recordings
    recordings = get_farmer_recordings(api_key, hive_filter)
    
    if not recordings:
        print("❌ No recordings found for this farmer/hive")
        sys.exit(1)
    
    print(f"Found {len(recordings)} recording(s) to test")
    print()
    
    # Test uploads
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    for i, rec in enumerate(recordings, 1):
        print(f"[{i}/{len(recordings)}] {rec['hive']}/{rec['filename']}")
        
        success, message = test_upload(api_key, rec['hive'], rec['file'])
        print(f"  {message}")
        
        if success:
            if "Already exists" in message:
                skip_count += 1
            else:
                success_count += 1
        else:
            fail_count += 1
        
        print()
    
    # Summary
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"✅ Uploaded:       {success_count}")
    print(f"⚠️  Already exists: {skip_count}")
    print(f"❌ Failed:         {fail_count}")
    print("=" * 70)
    
    if fail_count > 0:
        print("\n⚠️  Some uploads failed. Check server logs or connectivity.")
        sys.exit(1)
    else:
        print("\n🎉 All recordings processed successfully!")

if __name__ == "__main__":
    main()
