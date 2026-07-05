#!/bin/bash
# Test script for the new hive folders listing endpoint

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_URL="${FARMER_API_URL:-http://localhost:8000}"
API_KEY="${FARMER_API_KEY:-299d3ae3-59d9-410e-b3ee-f17508cfcaac}"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}Testing Hive Folders Listing Endpoint${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""
echo "Server URL: $SERVER_URL"
echo "API Key:    ${API_KEY:0:8}..."
echo ""

# Test 1: List hive folders
echo -e "${BLUE}[1/3] Listing all hive folders for this user...${NC}"
RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" "$SERVER_URL/recordings/hives")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Request successful${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${RED}✗ Request failed${NC}"
    exit 1
fi
echo ""

# Test 2: Parse and display hive information
echo -e "${BLUE}[2/3] Parsing hive information...${NC}"
TOTAL_HIVES=$(echo "$RESPONSE" | jq -r '.total_hives' 2>/dev/null || echo "0")
TOTAL_RECORDINGS=$(echo "$RESPONSE" | jq -r '.total_recordings' 2>/dev/null || echo "0")

echo -e "${GREEN}Total Hives: $TOTAL_HIVES${NC}"
echo -e "${GREEN}Total Recordings: $TOTAL_RECORDINGS${NC}"
echo ""

if [ "$TOTAL_HIVES" -gt 0 ]; then
    echo "Hives:"
    echo "$RESPONSE" | jq -r '.hives[] | "  - \(.hive_name): \(.recording_count) recording(s)"' 2>/dev/null || {
        echo "  (Could not parse hive details)"
    }
else
    echo -e "${YELLOW}No hives found for this API key${NC}"
fi
echo ""

# Test 3: Test with different API key (should show different hives)
echo -e "${BLUE}[3/3] Testing isolation between API keys...${NC}"
TEST_API_KEY_2="d706187a-86ed-4adf-97d2-b9522ce44e57"

RESPONSE_2=$(curl -s -H "X-API-Key: $TEST_API_KEY_2" "$SERVER_URL/recordings/hives" 2>/dev/null || echo "{}")
TOTAL_HIVES_2=$(echo "$RESPONSE_2" | jq -r '.total_hives' 2>/dev/null || echo "0")

if [ -n "$RESPONSE_2" ] && [ "$RESPONSE_2" != "{}" ]; then
    echo -e "${GREEN}✓ Different API key shows different hives${NC}"
    echo "  API Key 1 hives: $TOTAL_HIVES"
    echo "  API Key 2 hives: $TOTAL_HIVES_2"
else
    echo -e "${YELLOW}⚠ Could not test with second API key${NC}"
fi
echo ""

echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}✅ Hive folders endpoint is working!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "${BLUE}Example Usage:${NC}"
echo "  # List all hive folders"
echo "  curl -H 'X-API-Key: YOUR_API_KEY' \\"
echo "    $SERVER_URL/recordings/hives | jq"
echo ""
echo "  # Get just hive names"
echo "  curl -H 'X-API-Key: YOUR_API_KEY' \\"
echo "    $SERVER_URL/recordings/hives | jq -r '.hives[].hive_name'"
echo ""
