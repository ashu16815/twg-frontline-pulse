#!/bin/bash

# Test the new production-ready system
echo "🧪 Testing Production-Ready Executive Reporting + AI Voice Assist System"
echo "=================================================================="

# Login and get session cookie
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"323905","password":"Ankit@1993"}')

echo "Login response: $LOGIN_RESPONSE"

# Test health endpoint
echo ""
echo "🏥 Testing Health Check..."
curl -s -b cookies.txt http://localhost:3001/api/health | jq .

# Test store search
echo ""
echo "🏪 Testing Store Search..."
curl -s -b cookies.txt "http://localhost:3001/api/stores/search?q=AKL" | jq .

# Test executive summary
echo ""
echo "📊 Testing Executive Summary..."
curl -s -b cookies.txt "http://localhost:3001/api/exec/summary" | jq .

# Test voice-to-form API
echo ""
echo "🎙️ Testing Voice-to-Form API..."
curl -s -b cookies.txt -X POST http://localhost:3001/api/feedback/voice \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Store AKL001 had great sales this week, positive feedback on customer service, but missed $500 on stock issues"}' | jq .

# Test feedback submission
echo ""
echo "📝 Testing Feedback Submission..."
curl -s -b cookies.txt -X POST http://localhost:3001/api/feedback/submit \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-$(date +%s)" \
  -d '{
    "store_id": "test-store-123",
    "region_code": "AKL",
    "iso_week": "2025-W12",
    "month_key": "2025-03",
    "top_positive": "Great customer service",
    "miss1": "Stock issues",
    "miss1_dollars": 500,
    "overall_mood": "pos",
    "freeform_comments": "Testing new system",
    "submitted_by": "323905"
  }' | jq .

echo ""
echo "✅ Testing complete!"
