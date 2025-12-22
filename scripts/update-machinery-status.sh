#!/bin/bash

# Script to update machinery status
# Usage: ./scripts/update-machinery-status.sh <machineNumber> <status> [latitude] [longitude]

set -e

MACHINE_NUMBER="${1:-M0019}"
STATUS="${2:-IDLE}"
LATITUDE="${3:-36.934308}"
LONGITUDE="${4:-30.777931}"

# Get API URL from environment or use default
API_BASE_URL="${API_BASE_URL:-https://d31tialuhzl449.cloudfront.net}"

echo "🔄 Updating machinery status..."
echo "   Machine Number: $MACHINE_NUMBER"
echo "   Status: $STATUS"
echo "   Coordinates: $LATITUDE, $LONGITUDE"
echo "   API URL: $API_BASE_URL"
echo ""

# Make the API call
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "${API_BASE_URL}/machinery/${MACHINE_NUMBER}/status" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"${STATUS}\",
    \"latitude\": \"${LATITUDE}\",
    \"longitude\": \"${LONGITUDE}\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Success! Status updated."
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Error (HTTP $HTTP_CODE):"
  echo "$BODY"
  exit 1
fi

