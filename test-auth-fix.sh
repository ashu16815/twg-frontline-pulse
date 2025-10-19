#!/bin/bash

echo "🔐 Testing Authentication Fix"
echo "=============================="

# Test 1: Check if login API is accessible
echo "1. Testing login API accessibility..."
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/auth/login" -X POST -H "Content-Type: application/json" -d '{"user_id":"test","password":"test"}')
if [ "$LOGIN_RESPONSE" = "401" ] || [ "$LOGIN_RESPONSE" = "400" ]; then
    echo "✅ Login API is accessible (returned $LOGIN_RESPONSE)"
else
    echo "❌ Login API issue (returned $LOGIN_RESPONSE)"
fi

# Test 2: Check if middleware is working (should redirect to login)
echo "2. Testing middleware protection..."
PROTECTED_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/reports")
if [ "$PROTECTED_RESPONSE" = "302" ] || [ "$PROTECTED_RESPONSE" = "307" ]; then
    echo "✅ Middleware is protecting routes (redirected with $PROTECTED_RESPONSE)"
else
    echo "❌ Middleware issue (returned $PROTECTED_RESPONSE)"
fi

# Test 3: Check if login page is accessible
echo "3. Testing login page accessibility..."
LOGIN_PAGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/login")
if [ "$LOGIN_PAGE_RESPONSE" = "200" ]; then
    echo "✅ Login page is accessible"
else
    echo "❌ Login page issue (returned $LOGIN_PAGE_RESPONSE)"
fi

# Test 4: Check if health API is accessible (should be public)
echo "4. Testing public API accessibility..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health API is accessible (public route)"
else
    echo "❌ Health API issue (returned $HEALTH_RESPONSE)"
fi

echo ""
echo "🎯 Authentication Fix Test Complete"
echo "=================================="
echo "If all tests show ✅, the authentication fix should work correctly."
echo "If any tests show ❌, there may be issues that need to be addressed."
