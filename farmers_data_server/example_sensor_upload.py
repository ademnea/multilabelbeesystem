#!/usr/bin/env python3
"""
Example script for beehive sensors to upload audio recordings to the farmer data source API.

This simulates how a sensor device would capture audio and upload it to the server.

Usage:
    export FARMER_API_URL="http://196.43.168.57:8086"
    export FARMER_API_KEY="your-api-key-here"
    export HIVE_NAME="Hive 01"
    
    python example_sensor_upload.py /path/to/recording.wav
"""

import os
import sys
import requests
from pathlib import Path
from datetime import datetime

# Configuration
BASE_URL = os.getenv("FARMER_API_URL", "http://localhost:8000")
API_KEY = os.getenv("FARMER_API_KEY")
HIVE_NAME = os.getenv("HIVE_NAME", "Hive 01")

# Validate configuration
if not API_KEY:
    print("ERROR: FARMER_API_KEY environment variable is required")
    print("Example: export FARMER_API_KEY='your-api-key-here'")
    sys.exit(1)


def upload_recording(file_path: str) -> bool:
    """
    Upload a WAV recording file to the server.
    
    Args:
        file_path: Path to the WAV file to upload
        
    Returns:
        True if upload succeeded, False otherwise
    """
    file_path = Path(file_path)
    
    # Validate file exists
    if not file_path.exists():
        print(f"❌ Error: File not found: {file_path}")
        return False
    
    # Validate file extension
    if not file_path.suffix.lower() == '.wav':
        print(f"❌ Error: Only .wav files are supported (got {file_path.suffix})")
        return False
    
    # Prepare upload
    url = f"{BASE_URL}/recordings/hives/{HIVE_NAME}/upload"
    headers = {"X-API-Key": API_KEY}
    
    print(f"📤 Uploading {file_path.name} to {HIVE_NAME}...")
    print(f"   Server: {BASE_URL}")
    print(f"   File size: {file_path.stat().st_size:,} bytes")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'audio/wav')}
            response = requests.post(url, headers=headers, files=files, timeout=60)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Filename: {result['filename']}")
            print(f"   Hive: {result['hive_name']}")
            print(f"   Size: {result['size_bytes']:,} bytes")
            print(f"   Uploaded at: {result['uploaded_at']}")
            return True
        
        elif response.status_code == 401:
            print(f"❌ Authentication failed: Invalid API key")
            return False
        
        elif response.status_code == 409:
            print(f"⚠️  File already exists on server")
            return False
        
        else:
            print(f"❌ Upload failed: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Cannot connect to server at {BASE_URL}")
        print(f"   Make sure the server is running and accessible")
        return False
    
    except requests.exceptions.Timeout:
        print(f"❌ Error: Upload timed out (file too large or connection too slow)")
        return False
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python example_sensor_upload.py <recording.wav>")
        print("\nEnvironment variables:")
        print("  FARMER_API_URL    - Server URL (default: http://localhost:8000)")
        print("  FARMER_API_KEY    - Your API key (required)")
        print("  HIVE_NAME         - Hive name (default: 'Hive 01')")
        print("\nExample:")
        print("  export FARMER_API_URL='http://196.43.168.57:8086'")
        print("  export FARMER_API_KEY='f47ac10b-58cc-4372-a567-0e02b2c3d479'")
        print("  export HIVE_NAME='Hive 01'")
        print("  python example_sensor_upload.py recording.wav")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    print("=" * 70)
    print("Beehive Sensor - Recording Upload")
    print("=" * 70)
    print(f"Server URL: {BASE_URL}")
    print(f"Hive Name:  {HIVE_NAME}")
    print(f"Timestamp:  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    print()
    
    success = upload_recording(file_path)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
