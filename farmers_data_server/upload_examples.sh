#!/bin/bash
# Working upload examples for your existing farmers

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER="http://196.43.168.57:8086"

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}Farmer Data Source - Upload Examples${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""

# Example 1: Admin Ahaabwe
echo -e "${GREEN}Example 1: Upload to Admin Ahaabwe's Hive 01${NC}"
echo "Farmer: Admin Ahaabwe"
echo "API Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac"
echo "Target: recordings/299d3ae3-59d9-410e-b3ee-f17508cfcaac/Hive 01/"
echo ""
echo "Command:"
cat << 'EOF'
curl -X 'POST' \
  'http://196.43.168.57:8086/recordings/hives/Hive%2001/upload' \
  -H 'accept: application/json' \
  -H 'X-API-Key: 299d3ae3-59d9-410e-b3ee-f17508cfcaac' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@1-5996-A-6.wav;type=audio/wav'
EOF
echo ""
echo "---"
echo ""

# Example 2: Test User
echo -e "${GREEN}Example 2: Upload to Test User's Hive 07${NC}"
echo "Farmer: Test User"
echo "API Key: d706187a-86ed-4adf-97d2-b9522ce44e57"
echo "Target: recordings/d706187a-86ed-4adf-97d2-b9522ce44e57/Hive 07/"
echo ""
echo "Command:"
cat << 'EOF'
curl -X 'POST' \
  'http://196.43.168.57:8086/recordings/hives/Hive%2007/upload' \
  -H 'accept: application/json' \
  -H 'X-API-Key: d706187a-86ed-4adf-97d2-b9522ce44e57' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@250515_1056-01_segment_006.wav;type=audio/wav'
EOF
echo ""
echo "---"
echo ""

# Example 3: Local User
echo -e "${GREEN}Example 3: Upload to Local User's Hive 01${NC}"
echo "Farmer: Local User"
echo "API Key: 8361f43b-65bf-4f9e-b7ff-200a7d451577"
echo "Target: recordings/8361f43b-65bf-4f9e-b7ff-200a7d451577/Hive 01/"
echo ""
echo "Command:"
cat << 'EOF'
curl -X 'POST' \
  'http://196.43.168.57:8086/recordings/hives/Hive%2001/upload' \
  -H 'accept: application/json' \
  -H 'X-API-Key: 8361f43b-65bf-4f9e-b7ff-200a7d451577' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@pest%20infested%20hive%2028052026(3)_part23.wav;type=audio/wav'
EOF
echo ""
echo "---"
echo ""

# Example 4: Local Admin
echo -e "${GREEN}Example 4: Upload to Local Admin's Hive 02${NC}"
echo "Farmer: Local Admin"
echo "API Key: f31dccb4-8132-4bc1-8840-67b3c3fc3440"
echo "Target: recordings/f31dccb4-8132-4bc1-8840-67b3c3fc3440/Hive 02/"
echo ""
echo "Command:"
cat << 'EOF'
curl -X 'POST' \
  'http://196.43.168.57:8086/recordings/hives/Hive%2002/upload' \
  -H 'accept: application/json' \
  -H 'X-API-Key: f31dccb4-8132-4bc1-8840-67b3c3fc3440' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@250515_1056-04_segment_005.wav;type=audio/wav'
EOF
echo ""
echo ""

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}Notes:${NC}"
echo "1. The API key determines which folder (automatic)"
echo "2. You only specify the hive name (e.g., 'Hive 01')"
echo "3. File goes to: recordings/{api_key}/{hive_name}/filename.wav"
echo "4. Spaces in hive names are URL-encoded: 'Hive 01' → 'Hive%2001'"
echo "5. The API key you used (a76ed6fe...) is not in api_keys.json"
echo ""
echo "To verify uploads:"
echo "  curl -H 'X-API-Key: YOUR_KEY' $SERVER/recordings"
echo -e "${BLUE}==================================================================${NC}"
