#!/bin/bash

echo "🧪 Testing Executive Summary API Debug"
echo "====================================="

# Test with verbose output
echo "Testing executive summary API..."
curl -v -b cookies.txt "http://localhost:3001/api/exec/summary" 2>&1 | head -20

echo ""
echo "Testing with specific week..."
curl -v -b cookies.txt "http://localhost:3001/api/exec/summary?iso_week=FY26-W12" 2>&1 | head -20

echo ""
echo "Testing database connection directly..."
curl -s -b cookies.txt "http://localhost:3001/api/health" | jq .details.sql
