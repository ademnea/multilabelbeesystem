#!/bin/bash
# Diagnostic script to check BSADS <-> Farmer Server integration

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}BSADS Integration Diagnostic${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Configuration
FARMER_SERVER="http://196.43.168.57:8086"
TEST_API_KEY="299d3ae3-59d9-410e-b3ee-f17508cfcaac"

echo -e "${BLUE}Configuration:${NC}"
echo "  Farmer Server: $FARMER_SERVER"
echo "  Test API Key:  $TEST_API_KEY"
echo ""

# Test 1: Server Reachability
echo -e "${BLUE}[1/5] Testing farmer server reachability...${NC}"
if curl -sf "$FARMER_SERVER/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Farmer server is reachable${NC}"
else
    echo -e "${RED}✗ Cannot reach farmer server at $FARMER_SERVER${NC}"
    echo "  Solutions:"
    echo "    1. Check if server is running: docker ps | grep farmer-data-source"
    echo "    2. Check firewall: sudo ufw allow 8086/tcp"
    echo "    3. Try ngrok URL instead"
    exit 1
fi
echo ""

# Test 2: API Key Validation
echo -e "${BLUE}[2/5] Testing API key authentication...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-API-Key: $TEST_API_KEY" \
  "$FARMER_SERVER/recordings")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ API key is valid${NC}"
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}✗ API key is invalid (401 Unauthorized)${NC}"
    echo "  Solutions:"
    echo "    1. Check data/api_keys.json on farmer server"
    echo "    2. Create API key: curl -X POST $FARMER_SERVER/admin/keys ..."
    echo "    3. Update BSADS database with correct API key"
    exit 1
else
    echo -e "${YELLOW}⚠ Unexpected response: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 3: List API Keys
echo -e "${BLUE}[3/5] Checking available API keys on farmer server...${NC}"
if [ -f "data/api_keys.json" ]; then
    echo -e "${GREEN}✓ Found data/api_keys.json${NC}"
    echo ""
    echo "Available API keys:"
    cat data/api_keys.json | jq -r 'to_entries[] | "  \(.key) - \(.value.client_name)"' 2>/dev/null || {
        echo -e "${YELLOW}  (jq not installed, showing raw)${NC}"
        cat data/api_keys.json
    }
else
    echo -e "${RED}✗ data/api_keys.json not found${NC}"
    echo "  Are you running this from the farmer data source directory?"
fi
echo ""

# Test 4: Test Folder Creation Endpoint
echo -e "${BLUE}[4/5] Testing folder creation endpoint...${NC}"
TEST_HIVE="Diagnostic Test $(date +%Y%m%d_%H%M%S)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "X-API-Key: $TEST_API_KEY" \
  "$FARMER_SERVER/recordings/hives/$(echo "$TEST_HIVE" | jq -sRr @uri)")

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Folder creation endpoint works${NC}"
    echo "  Created test folder: $TEST_HIVE"
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${YELLOW}⚠ Endpoint not found (404)${NC}"
    echo "  The server may be running an old version without upload support"
    echo "  Folders will be created automatically on first upload"
elif [ "$HTTP_CODE" -eq 409 ]; then
    echo -e "${GREEN}✓ Endpoint works (folder already exists)${NC}"
else
    echo -e "${RED}✗ Folder creation failed: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Test 5: Check Recordings Structure
echo -e "${BLUE}[5/5] Checking recordings folder structure...${NC}"
if [ -d "recordings/$TEST_API_KEY" ]; then
    echo -e "${GREEN}✓ API key folder exists${NC}"
    echo ""
    echo "Hive folders for this API key:"
    ls -1 "recordings/$TEST_API_KEY/" 2>/dev/null | while read hive; do
        file_count=$(ls "recordings/$TEST_API_KEY/$hive"/*.wav 2>/dev/null | wc -l)
        echo "  - $hive ($file_count recordings)"
    done
else
    echo -e "${YELLOW}⚠ No folder for API key $TEST_API_KEY${NC}"
    echo "  This is normal if no hives have been created yet"
fi
echo ""

# Summary
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}Diagnostic Complete${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. If server is unreachable, check firewall or use ngrok URL"
echo "  2. If API key is invalid, sync keys between BSADS and farmer server"
echo "  3. Test hive creation from BSADS backend"
echo "  4. Monitor logs: docker logs farmer-data-source"
echo ""
echo "Documentation:"
echo "  - BSADS_INTEGRATION_FIXES.md"
echo "  - SENSOR_UPLOAD_GUIDE.md"
echo ""
