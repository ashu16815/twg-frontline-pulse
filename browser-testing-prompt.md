# Complete Browser Testing Prompt for Win In Store Application

## 🎯 Testing Objective
Perform comprehensive end-to-end testing of the Win In Store application to ensure all functionality works correctly before production deployment.

## 📋 Test Scenarios

### 1. Authentication & Login Flow
```
Test the complete authentication system:
1. Navigate to http://localhost:3000
2. Verify login page loads correctly
3. Enter valid credentials (test with admin user)
4. Verify successful login and redirect to dashboard
5. Check that user session persists on page refresh
6. Test logout functionality
7. Verify redirect to login page after logout
8. Test invalid credentials (should show error)
9. Test empty form submission (should show validation errors)
```

### 2. Homepage & Navigation
```
Test the main dashboard and navigation:
1. Verify homepage loads with "Frontline Feedback: Your Store's Voice" title
2. Check that the executive insights card shows real data (not "coming soon")
3. Verify all navigation buttons work:
   - "Submit Store Report" → /frontline/submit
   - "View Reports" → /reports
   - "Executive Report" → /exec-report
   - "Ask Questions" → /ceo
4. Test responsive design on mobile viewport
5. Verify maintenance banner appears if system is in maintenance mode
```

### 3. Store Feedback Submission
```
Test the frontline feedback submission process:
1. Navigate to /frontline/submit
2. Verify form loads with all required fields
3. Test store search functionality:
   - Type "west" and verify autocomplete suggestions
   - Select a store from dropdown
4. Fill out feedback form:
   - Select positive/negative mood
   - Enter "What's working well" text
   - Enter "What's not working" text
   - Enter "Additional comments" text
   - Test voice recording buttons (if available)
5. Submit form and verify success message
6. Check that feedback appears in reports
7. Test form validation (empty required fields)
8. Test autosave functionality (fill partial form, refresh page)
```

### 4. Reports Dashboard
```
Test the reports and analytics section:
1. Navigate to /reports
2. Verify reports page loads with AI-powered insights
3. Check that executive summary shows real data:
   - Top opportunities with dollar impact
   - Recommended actions with owners and timelines
   - Risk assessments with mitigations
4. Test filter functionality:
   - Change scope (Network/Region/Store)
   - Enter scope key (e.g., "AKL")
   - Select ISO week or month
   - Select area filter (Availability, Supply Chain, etc.)
5. Click "⚡ Generate AI Report" button
6. Verify job status updates (queued → processing → succeeded)
7. Check that new insights appear after generation
8. Test refresh button functionality
9. Verify detailed feedback section expands/collapses correctly
```

### 5. Executive Report Pages
```
Test both executive report pages:
1. Navigate to /exec-report
2. Verify page loads with "Executive Report" title
3. Check that all sections display correctly:
   - KPI cards (Feedback Volume, Missed Sales, Mood Index)
   - Executive Narrative
   - Top Actions
   - Opportunities chart
   - Risks & Mitigations
   - Regional Impact chart
   - Volume trends
4. Test all filter controls work correctly
5. Click "⚡ Generate AI Report" and verify job processing
6. Test "🔄 Refresh" button
7. Navigate to /exec and verify identical functionality
8. Test expandable "Detailed Feedback Data" section:
   - Click "🔽 Show Details"
   - Verify executive-friendly format (not raw JSON)
   - Check color-coded sections (blue opportunities, green actions, red risks)
   - Click "🔼 Hide Details" to collapse
```

### 6. CEO Chat Interface
```
Test the CEO question-answering system:
1. Navigate to /ceo
2. Verify chat interface loads correctly
3. Ask a test question: "What are the top risks in westcity?"
4. Verify question is processed and answer is returned
5. Test with different question types:
   - "Show me opportunities in Auckland region"
   - "What actions should we take this week?"
   - "How is customer mood trending?"
6. Verify answers are relevant and data-driven
7. Test error handling (ask invalid questions)
```

### 7. Admin Panel
```
Test administrative functionality:
1. Navigate to /admin/health
2. Verify health dashboard loads
3. Check system status indicators
4. Navigate to /admin/users
5. Verify user management interface
6. Test any admin-specific functionality
```

### 8. Performance & Error Handling
```
Test application performance and error scenarios:
1. Test page load times (should be under 3 seconds)
2. Test with slow network connection (throttle to 3G)
3. Test error scenarios:
   - Disconnect from internet and try to submit feedback
   - Try to access protected routes without authentication
   - Test with invalid API responses
4. Verify error messages are user-friendly
5. Test browser back/forward navigation
6. Test page refresh on all major pages
```

### 9. Data Consistency & Real-time Updates
```
Test data consistency across the application:
1. Submit new feedback from /frontline/submit
2. Immediately check /reports to see if data appears
3. Generate new AI report and verify insights update
4. Check homepage insights card updates automatically
5. Verify timestamps are accurate and consistent
6. Test that filters work correctly across all pages
7. Verify KPI calculations are accurate
```

### 10. Mobile Responsiveness
```
Test mobile and tablet compatibility:
1. Switch to mobile viewport (375px width)
2. Test all major pages on mobile:
   - Homepage navigation
   - Feedback submission form
   - Reports dashboard
   - Executive reports
3. Verify touch interactions work correctly
4. Check that charts and tables are readable on mobile
5. Test landscape orientation on tablet
6. Verify all buttons and forms are accessible on touch devices
```

## 🔍 Specific Test Cases

### Critical Path Testing
```
1. Login → Submit Feedback → View Reports → Generate AI Report → Check Executive Summary
2. Login → View Executive Report → Expand Details → Verify Data Format
3. Login → Ask CEO Question → Verify Answer Quality
4. Login → Check Homepage → Verify Real-time Insights Display
```

### Edge Cases
```
1. Submit feedback with very long text (test character limits)
2. Generate AI report while another is processing
3. Navigate between pages rapidly during AI processing
4. Test with special characters in feedback text
5. Submit multiple feedback entries quickly
6. Test with empty database (no existing data)
```

### Browser Compatibility
```
Test on multiple browsers:
1. Chrome (latest)
2. Firefox (latest)
3. Safari (if on Mac)
4. Edge (if on Windows)
5. Mobile browsers (iOS Safari, Chrome Mobile)
```

## ✅ Success Criteria

### Functional Requirements
- [ ] All authentication flows work correctly
- [ ] Feedback submission processes successfully
- [ ] AI reports generate and display properly
- [ ] Executive insights show real data (not "coming soon")
- [ ] All navigation links work correctly
- [ ] Filters and search functionality work
- [ ] Real-time updates function properly
- [ ] Error handling is graceful and user-friendly

### Performance Requirements
- [ ] Page load times under 3 seconds
- [ ] AI report generation completes within 30 seconds
- [ ] Smooth scrolling and interactions
- [ ] No memory leaks or performance degradation

### User Experience Requirements
- [ ] Intuitive navigation and clear user flows
- [ ] Responsive design works on all devices
- [ ] Executive-friendly data presentation (no raw JSON)
- [ ] Clear error messages and loading states
- [ ] Consistent visual design across all pages

### Data Integrity Requirements
- [ ] Submitted feedback appears in reports
- [ ] AI insights are accurate and relevant
- [ ] Timestamps are correct and consistent
- [ ] KPI calculations are accurate
- [ ] Filters work correctly across all pages

## 🚨 Red Flags to Watch For
- Any "coming soon" or placeholder text in production
- Raw JSON data visible to executives
- Broken navigation or authentication loops
- AI reports failing to generate
- Data not updating in real-time
- Mobile layout issues
- Performance problems or slow loading
- Error messages that aren't user-friendly

## 📝 Test Execution Notes
- Record any bugs or issues found
- Note performance metrics (load times, response times)
- Document any user experience improvements needed
- Verify all success criteria are met before production deployment
- Test with realistic data volumes and user scenarios

## 🎯 Final Verification
Before marking testing complete, ensure:
1. All critical user journeys work end-to-end
2. No placeholder or "coming soon" text remains
3. Executive reports show professional, readable data
4. Real-time updates work across all pages
5. Mobile experience is fully functional
6. Performance meets requirements
7. Error handling is robust and user-friendly

This comprehensive testing will ensure the application is production-ready and provides an excellent user experience for all stakeholders.
