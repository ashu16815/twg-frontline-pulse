#!/bin/bash

echo "🧪 COMPREHENSIVE PRODUCTION SYSTEM TEST SUITE"
echo "============================================="
echo "Testing all functionality before production release"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_status" = "success" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL (Expected failure but got success)${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        if [ "$expected_status" = "failure" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
}

# Function to check API response
check_api_response() {
    local url="$1"
    local expected_field="$2"
    local expected_value="$3"
    
    local response=$(curl -s -b cookies.txt "$url")
    if echo "$response" | jq -e ".$expected_field == \"$expected_value\"" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check API response contains field
check_api_contains() {
    local url="$1"
    local expected_field="$2"
    
    local response=$(curl -s -b cookies.txt "$url")
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check API response is array
check_api_array() {
    local url="$1"
    
    local response=$(curl -s -b cookies.txt "$url")
    if echo "$response" | jq -e "type == \"array\"" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

echo "🔐 STEP 1: AUTHENTICATION TESTING"
echo "================================="

# Login and get session cookie
echo "Authenticating..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"323905","password":"Ankit@1993"}')

if [[ $LOGIN_RESPONSE == *"ok\":true"* ]]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Authentication failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🏥 STEP 2: HEALTH MONITORING TESTING"
echo "===================================="

run_test "Health Check API" "check_api_contains 'http://localhost:3001/api/health' 'ok'" "success"
run_test "SQL Health Status" "check_api_contains 'http://localhost:3001/api/health' 'details.sql.ok'" "success"
run_test "OpenAI Health Status" "check_api_contains 'http://localhost:3001/api/health' 'details.openai.ok'" "success"

echo ""
echo "🏪 STEP 3: STORE MANAGEMENT TESTING"
echo "=================================="

run_test "Store Search API" "check_api_array 'http://localhost:3001/api/stores/search?q='" "success"
run_test "Store Search with Query" "check_api_array 'http://localhost:3001/api/stores/search?q=Pukekohe'" "success"
run_test "Store Data Structure" "check_api_contains 'http://localhost:3001/api/stores/search?q=Pukekohe' '[0].store_id'" "success"

echo ""
echo "🎙️ STEP 4: VOICE-TO-FORM AI INTEGRATION TESTING"
echo "==============================================="

# Test voice-to-form API
echo "Testing voice transcription and AI form filling..."
VOICE_RESULT=$(curl -s -b cookies.txt -X POST http://localhost:3001/api/feedback/voice \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Store AKL001 had excellent customer service this week, positive feedback from customers, but missed $800 on stock issues and $300 on delivery delays"}')

if echo "$VOICE_RESULT" | jq -e '.ok == true and .data.store_code' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Voice-to-form AI integration working${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Voice-to-form AI integration failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test AI data extraction
if echo "$VOICE_RESULT" | jq -e '.data.miss1_dollars == 800' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AI correctly extracted dollar amounts${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ AI failed to extract dollar amounts correctly${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📊 STEP 5: EXECUTIVE SUMMARY AI TESTING"
echo "======================================"

run_test "Executive Summary API" "check_api_contains 'http://localhost:3001/api/exec-report/summary' 'ok'" "success"
run_test "AI Analysis Structure" "check_api_contains 'http://localhost:3001/api/exec-report/summary' 'analysis.top_opportunities'" "success"
run_test "AI Actions Structure" "check_api_contains 'http://localhost:3001/api/exec-report/summary' 'analysis.top_actions'" "success"
run_test "AI Risks Structure" "check_api_contains 'http://localhost:3001/api/exec-report/summary' 'analysis.risks'" "success"

echo ""
echo "📝 STEP 6: IDEMPOTENT FEEDBACK SUBMISSION TESTING"
echo "================================================"

# Test feedback submission
echo "Testing idempotent feedback submission..."
FEEDBACK_RESULT=$(curl -s -b cookies.txt -X POST http://localhost:3001/api/feedback/submit \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-$(date +%s)" \
  -d '{
    "store_id": "ST-1003",
    "region_code": "AKL",
    "iso_week": "FY26-W12",
    "month_key": "2025-03",
    "top_positive": "Excellent customer service",
    "miss1": "Stock issues",
    "miss1_dollars": 800,
    "miss2": "Delivery delays",
    "miss2_dollars": 300,
    "overall_mood": "pos",
    "freeform_comments": "Testing production-ready system",
    "submitted_by": "323905",
    "store_name": "Pukekohe",
    "region": "Auckland",
    "store_code": "1111",
    "banner": "TWL",
    "manager_email": "test@example.com"
  }')

if echo "$FEEDBACK_RESULT" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Feedback submission successful${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Feedback submission failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test duplicate prevention
echo "Testing duplicate prevention..."
DUPLICATE_KEY="duplicate-test-$(date +%s)"
DUPLICATE_RESULT=$(curl -s -b cookies.txt -X POST http://localhost:3001/api/feedback/submit \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $DUPLICATE_KEY" \
  -d '{
    "store_id": "ST-1003",
    "region_code": "AKL",
    "iso_week": "FY26-W12",
    "month_key": "2025-03",
    "top_positive": "Test duplicate",
    "miss1": "Test issue",
    "miss1_dollars": 100,
    "overall_mood": "pos",
    "freeform_comments": "Testing duplicate prevention",
    "submitted_by": "323905",
    "store_name": "Pukekohe",
    "region": "Auckland",
    "store_code": "1111",
    "banner": "TWL",
    "manager_email": "test@example.com"
  }')

# Submit the same data again with the SAME key
DUPLICATE_RESULT2=$(curl -s -b cookies.txt -X POST http://localhost:3001/api/feedback/submit \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $DUPLICATE_KEY" \
  -d '{
    "store_id": "ST-1003",
    "region_code": "AKL",
    "iso_week": "FY26-W12",
    "month_key": "2025-03",
    "top_positive": "Test duplicate",
    "miss1": "Test issue",
    "miss1_dollars": 100,
    "overall_mood": "pos",
    "freeform_comments": "Testing duplicate prevention",
    "submitted_by": "323905",
    "store_name": "Pukekohe",
    "region": "Auckland",
    "store_code": "1111",
    "banner": "TWL",
    "manager_email": "test@example.com"
  }')

if echo "$DUPLICATE_RESULT2" | jq -e '.duplicate == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Duplicate prevention working${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Duplicate prevention failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🖥️ STEP 7: UI PAGES TESTING"
echo "=========================="

run_test "Feedback Page Load" "curl -s -b cookies.txt 'http://localhost:3001/feedback' | grep -q 'SmartFeedbackForm'" "success"
run_test "Executive Dashboard Load" "curl -s -b cookies.txt 'http://localhost:3001/exec' | grep -q 'ExecDashboard'" "success"
run_test "Health Dashboard Load" "curl -s -b cookies.txt 'http://localhost:3001/admin/health' | grep -q 'HealthDashboard'" "success"

echo ""
echo "⚡ STEP 8: PERFORMANCE TESTING"
echo "============================"

# Test API response times
echo "Testing API response times..."

# Health check performance
HEALTH_TIME=$(curl -s -w "%{time_total}" -b cookies.txt -o /dev/null 'http://localhost:3001/api/health')
if (( $(echo "$HEALTH_TIME < 3.0" | bc -l) )); then
    echo -e "${GREEN}✅ Health API response time: ${HEALTH_TIME}s${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Health API too slow: ${HEALTH_TIME}s${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Store search performance
STORE_TIME=$(curl -s -w "%{time_total}" -b cookies.txt -o /dev/null 'http://localhost:3001/api/stores/search?q=Pukekohe')
if (( $(echo "$STORE_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✅ Store search response time: ${STORE_TIME}s${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Store search too slow: ${STORE_TIME}s${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🔒 STEP 9: SECURITY TESTING"
echo "=========================="

run_test "Unauthenticated Access Blocked" "curl -s 'http://localhost:3001/feedback' | grep -q 'login'" "success"
run_test "API Authentication Required" "curl -s -X POST 'http://localhost:3001/api/feedback/submit' -H 'Content-Type: application/json' -d '{}' | jq -e '.ok == false'" "success"

echo ""
echo "📊 FINAL TEST RESULTS"
echo "===================="

echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! SYSTEM READY FOR PRODUCTION! 🎉${NC}"
    echo ""
    echo "✅ Authentication working"
    echo "✅ Health monitoring operational"
    echo "✅ Store management functional"
    echo "✅ Voice-to-form AI integration working"
    echo "✅ Executive summary AI insights working"
    echo "✅ Idempotent feedback submission working"
    echo "✅ UI pages loading correctly"
    echo "✅ Performance within acceptable limits"
    echo "✅ Security measures in place"
    echo ""
    echo -e "${GREEN}🚀 PRODUCTION RELEASE APPROVED! 🚀${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED! SYSTEM NOT READY FOR PRODUCTION! ❌${NC}"
    echo ""
    echo "Please fix the failing tests before releasing to production."
    exit 1
fi
