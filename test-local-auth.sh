#!/bin/bash

echo "🧪 Testing Local Authentication Fix"
echo "=================================="

# Wait for dev server to start
echo "⏳ Waiting for dev server to start..."
sleep 5

# Test 1: Check if login page loads
echo "1. Testing login page accessibility..."
LOGIN_PAGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/login")
if [ "$LOGIN_PAGE_RESPONSE" = "200" ]; then
    echo "✅ Login page is accessible"
else
    echo "❌ Login page issue (returned $LOGIN_PAGE_RESPONSE)"
fi

# Test 2: Check if home page redirects to login (since middleware is disabled)
echo "2. Testing home page (should show login form)..."
HOME_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/")
if [ "$HOME_RESPONSE" = "200" ]; then
    echo "✅ Home page loads (AuthGuard should handle redirects)"
else
    echo "❌ Home page issue (returned $HOME_RESPONSE)"
fi

# Test 3: Check if API endpoints are accessible
echo "3. Testing API endpoints..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/health")
if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API endpoints are accessible"
else
    echo "❌ API issue (returned $API_RESPONSE)"
fi

echo ""
echo "🎯 Local Authentication Test Complete"
echo "===================================="
echo "Open http://localhost:3000 in your browser to test manually:"
echo "1. Should see login form"
echo "2. Login with credentials"
echo "3. Should redirect to home page without loops"
echo "4. Try accessing /reports - should work if authenticated"
echo "5. Try logging out and accessing /reports - should redirect to login"
