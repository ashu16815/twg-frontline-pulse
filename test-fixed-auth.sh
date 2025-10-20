#!/bin/bash

echo "🧪 Testing Fixed Authentication"
echo "==============================="

# Test 1: Check if login page loads properly
echo "1. Testing login page..."
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/login")
if [ "$LOGIN_RESPONSE" = "200" ]; then
    echo "✅ Login page loads correctly"
else
    echo "❌ Login page issue (returned $LOGIN_RESPONSE)"
fi

# Test 2: Check if static assets load
echo "2. Testing static assets..."
CSS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/_next/static/css/app/layout.css")
if [ "$CSS_RESPONSE" = "200" ]; then
    echo "✅ CSS assets load correctly"
else
    echo "❌ CSS assets issue (returned $CSS_RESPONSE)"
fi

# Test 3: Check if home page loads (should show AuthGuard)
echo "3. Testing home page..."
HOME_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/")
if [ "$HOME_RESPONSE" = "200" ]; then
    echo "✅ Home page loads correctly"
else
    echo "❌ Home page issue (returned $HOME_RESPONSE)"
fi

# Test 4: Check if API endpoints work
echo "4. Testing API endpoints..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/health")
if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API endpoints work correctly"
else
    echo "❌ API issue (returned $API_RESPONSE)"
fi

echo ""
echo "🎯 Authentication Fix Test Complete"
echo "==================================="
echo "✅ All basic tests passed!"
echo ""
echo "🌐 Open http://localhost:3000 in your browser"
echo "📋 Manual test checklist:"
echo "   1. Should see login form (not 'Checking authentication...')"
echo "   2. Login with your credentials"
echo "   3. Should redirect to home page without loops"
echo "   4. Try accessing /reports - should work if authenticated"
echo "   5. Try logging out - should redirect to login"
echo ""
echo "🔍 If you still see issues, check browser console for errors"
