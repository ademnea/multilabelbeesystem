#!/bin/bash
# Quick local testing script - NO NGROK NEEDED

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}Local API Testing (No Ngrok Required)${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Check if docker is running
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if server is running
echo -e "${BLUE}[1/5] Checking if local server is running...${NC}"
if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is already running${NC}"
else
    echo -e "${YELLOW}⚠ Server not running. Starting it now...${NC}"
    echo ""
    echo "Run this in another terminal:"
    echo "  docker compose -f docker-compose.local.yml up --build"
    echo ""
    echo "Then run this script again."
    exit 1
fi
echo ""

# Test API key
API_KEY="299d3ae3-59d9-410e-b3ee-f17508cfcaac"
HIVE_NAME="Hive 01"

echo -e "${BLUE}[2/5] Testing API key...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  http://localhost:8000/recordings)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ API key is valid${NC}"
else
    echo -e "${RED}✗ API key validation failed (HTTP $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# List recordings
echo -e "${BLUE}[3/5] Listing current recordings...${NC}"
RECORDINGS=$(curl -s -H "X-API-Key: $API_KEY" \
  "http://localhost:8000/recordings?hive_name=Hive%2001")
COUNT=$(echo "$RECORDINGS" | jq -r '.recordings | length' 2>/dev/null || echo "0")
echo -e "${GREEN}Found $COUNT recording(s) in Hive 01${NC}"
echo ""

# Find a test file
echo -e "${BLUE}[4/5] Finding a test file to upload...${NC}"
TEST_FILE=$(find recordings/d706187a-86ed-4adf-97d2-b9522ce44e57 -name "*.wav" -type f | head -n1)

if [ -z "$TEST_FILE" ]; then
    echo -e "${YELLOW}⚠ No test files found in recordings folder${NC}"
    echo "Please add some .wav files to the recordings/ folder"
    exit 1
fi

echo -e "${GREEN}✓ Using test file: $(basename "$TEST_FILE")${NC}"
echo ""

# Test upload
echo -e "${BLUE}[5/5] Testing upload endpoint...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "http://localhost:8000/recordings/hives/Hive%2001/upload" \
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
    echo -e "${YELLOW}⚠ File already exists (this is OK - upload endpoint works!)${NC}"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Upload failed: HTTP $HTTP_CODE${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}✅ All local tests passed!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "${BLUE}Your upload endpoint is working correctly!${NC}"
echo ""
echo "Test URLs:"
echo "  Health:     http://localhost:8000/health"
echo "  API Docs:   http://localhost:8000/docs"
echo "  Recordings: http://localhost:8000/recordings"
echo ""
echo "To test with your own files:"
echo "  export FARMER_API_URL='http://localhost:8000'"
echo "  export FARMER_API_KEY='$API_KEY'"
echo "  export HIVE_NAME='Hive 01'"
echo "  python example_sensor_upload.py your_file.wav"
echo ""
