#!/bin/bash
# Test script for sensor upload functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${FARMER_API_URL:-http://localhost:8000}"
API_KEY="${FARMER_API_KEY}"
HIVE_NAME="${HIVE_NAME:-Hive 01}"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}Farmer Data Source - Upload Test${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Check if API key is provided
if [ -z "$API_KEY" ]; then
    echo -e "${RED}ERROR: FARMER_API_KEY environment variable is required${NC}"
    echo ""
    echo "Usage:"
    echo "  export FARMER_API_URL='http://196.43.168.57:8086'"
    echo "  export FARMER_API_KEY='your-api-key-here'"
    echo "  export HIVE_NAME='Hive 01'"
    echo "  ./test_upload.sh [file.wav]"
    echo ""
    exit 1
fi

# Check if file is provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}No file provided. Creating a test WAV file...${NC}"
    
    # Create a test WAV file (1 second of silence)
    if command -v ffmpeg &> /dev/null; then
        TEST_FILE="test_upload_$(date +%Y%m%d_%H%M%S).wav"
        ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1 "$TEST_FILE" -y 2>/dev/null
        echo -e "${GREEN}✓ Created test file: $TEST_FILE${NC}"
    else
        echo -e "${RED}ERROR: Please provide a WAV file or install ffmpeg to generate one${NC}"
        exit 1
    fi
else
    TEST_FILE="$1"
    
    # Check if file exists
    if [ ! -f "$TEST_FILE" ]; then
        echo -e "${RED}ERROR: File not found: $TEST_FILE${NC}"
        exit 1
    fi
    
    # Check if file is WAV
    if [[ ! "$TEST_FILE" =~ \.wav$ ]]; then
        echo -e "${YELLOW}WARNING: File doesn't have .wav extension${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Server URL:  $API_URL"
echo "  Hive Name:   $HIVE_NAME"
echo "  Test File:   $TEST_FILE"
echo "  File Size:   $(du -h "$TEST_FILE" | cut -f1)"
echo ""

# Test 1: Health check
echo -e "${BLUE}[1/4] Testing server connectivity...${NC}"
if curl -sf "$API_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ Server is reachable${NC}"
else
    echo -e "${RED}✗ Cannot connect to server at $API_URL${NC}"
    echo "  Make sure the server is running and the URL is correct"
    exit 1
fi
echo ""

# Test 2: Verify API key
echo -e "${BLUE}[2/4] Verifying API key...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: $API_KEY" "$API_URL/recordings")
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ API key is valid${NC}"
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}✗ Invalid API key${NC}"
    echo "  Please check your FARMER_API_KEY"
    exit 1
else
    echo -e "${YELLOW}⚠ Unexpected response: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 3: Upload file
echo -e "${BLUE}[3/4] Uploading recording...${NC}"
HIVE_ENCODED=$(printf %s "$HIVE_NAME" | jq -sRr @uri)
UPLOAD_URL="$API_URL/recordings/hives/$HIVE_ENCODED/upload"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$UPLOAD_URL" \
    -H "X-API-Key: $API_KEY" \
    -F "file=@$TEST_FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Upload successful!${NC}"
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" -eq 409 ]; then
    echo -e "${YELLOW}⚠ File already exists on server${NC}"
    echo "$BODY"
elif [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${RED}✗ Bad request${NC}"
    echo "$BODY"
    exit 1
else
    echo -e "${RED}✗ Upload failed: HTTP $HTTP_CODE${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 4: Verify file appears in listing
echo -e "${BLUE}[4/4] Verifying file in recordings list...${NC}"
FILENAME=$(basename "$TEST_FILE")
RECORDINGS=$(curl -s -H "X-API-Key: $API_KEY" "$API_URL/recordings?hive_name=$HIVE_ENCODED")

if echo "$RECORDINGS" | jq -e ".recordings[] | select(contains(\"$FILENAME\"))" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ File found in recordings list${NC}"
    echo ""
    echo "Your recordings:"
    echo "$RECORDINGS" | jq '.recordings[]' 2>/dev/null || echo "$RECORDINGS"
else
    echo -e "${YELLOW}⚠ File not found in recordings list (may take a moment)${NC}"
    echo ""
    echo "All recordings:"
    echo "$RECORDINGS" | jq '.' 2>/dev/null || echo "$RECORDINGS"
fi
echo ""

# Clean up test file if we created it
if [ $# -eq 0 ] && [ -f "$TEST_FILE" ]; then
    echo -e "${BLUE}Cleaning up test file...${NC}"
    rm "$TEST_FILE"
    echo -e "${GREEN}✓ Test file removed${NC}"
    echo ""
fi

echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}✅ All tests passed! Your sensor is ready to upload recordings.${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Configure your sensors with these credentials"
echo "  2. Use example_sensor_upload.py for automated uploads"
echo "  3. Monitor uploads at: $API_URL/docs"
echo ""
