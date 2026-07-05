#!/bin/bash
# Quick test script for the Farmer External Data Source API
# Usage: ./test_client.sh <base_url> <api_key>

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <base_url> <api_key>"
    echo "Example: $0 https://your-server.ngrok-free.dev f47ac10b-58cc-4372-a567-0e02b2c3d479"
    exit 1
fi

BASE_URL=$1
API_KEY=$2

echo "=========================================="
echo "Farmer API Client Test"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "API Key:  ${API_KEY:0:8}...${API_KEY: -8}"
echo "=========================================="
echo ""

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
echo "GET $BASE_URL/health"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Server is healthy"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - HTTP $HTTP_CODE"
    echo "Response: $BODY"
    exit 1
fi
echo ""

# Test 2: List recordings
echo -e "${YELLOW}Test 2: List Recordings${NC}"
echo "GET $BASE_URL/recordings"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "X-API-Key: $API_KEY" "$BASE_URL/recordings")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Successfully retrieved recordings list"
    echo "Response: $BODY"
    
    # Extract first recording filename if available
    FIRST_FILE=$(echo "$BODY" | grep -o '"[^"]*\.wav"' | head -1 | tr -d '"')
    
    if [ -n "$FIRST_FILE" ]; then
        echo ""
        echo -e "${YELLOW}Test 3: Download Recording${NC}"
        echo "GET $BASE_URL/recordings/$FIRST_FILE"
        
        # Create temp directory
        TEMP_DIR=$(mktemp -d)
        OUTPUT_FILE="$TEMP_DIR/$FIRST_FILE"
        
        HTTP_CODE=$(curl -s -w "%{http_code}" -H "X-API-Key: $API_KEY" \
            "$BASE_URL/recordings/$FIRST_FILE" -o "$OUTPUT_FILE")
        
        if [ "$HTTP_CODE" -eq 200 ] && [ -f "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
            echo -e "${GREEN}✓ PASSED${NC} - Successfully downloaded recording"
            echo "File: $OUTPUT_FILE"
            echo "Size: $FILE_SIZE bytes"
            
            # Verify it's a WAV file
            FILE_TYPE=$(file -b "$OUTPUT_FILE")
            if [[ "$FILE_TYPE" == *"WAVE"* ]] || [[ "$FILE_TYPE" == *"WAV"* ]]; then
                echo -e "${GREEN}✓ File is a valid WAV audio file${NC}"
            else
                echo -e "${YELLOW}⚠ Warning: File type is '$FILE_TYPE'${NC}"
            fi
            
            # Cleanup
            rm -rf "$TEMP_DIR"
        else
            echo -e "${RED}✗ FAILED${NC} - HTTP $HTTP_CODE"
            rm -rf "$TEMP_DIR"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠ No recordings available to test download${NC}"
    fi
else
    echo -e "${RED}✗ FAILED${NC} - HTTP $HTTP_CODE"
    echo "Response: $BODY"
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        echo ""
        echo "Possible issues:"
        echo "  - Invalid API key"
        echo "  - API key has been revoked"
        echo "  - Missing X-API-Key header"
    fi
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=========================================="
echo ""
echo "Your API key is working correctly."
echo "You can now use the polling client:"
echo ""
echo "  export FARMER_API_URL=\"$BASE_URL\""
echo "  export FARMER_API_KEY=\"$API_KEY\""
echo "  python example_polling_client.py"
echo ""
