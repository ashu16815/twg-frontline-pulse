# Comet Test Prompt - Long Feedback Fix

## Quick Test Prompt for Comet

```
Please test the Frontline Feedback submission form with long text inputs to verify the truncation bug has been fixed.

GO TO: /frontline/submit

TEST DATA:
1. Select Store: ST-001 Albany (North region)

2. POSITIVE FEEDBACK (paste this long text - should be ~500 chars):
"Grocery Food up $2134 on LY driven by our pantry and chilled and fresh areas. Big quantity of shares in inventory management and customer service focus. Staff scheduling improvements leading to better coverage during peak hours. Seasonal promotions performing well with strong customer engagement. Stock turns increasing across dairy, frozen, and bakery sections. New product lines showing strong initial performance with positive customer feedback."

3. Add 1 NEGATIVE FEEDBACK (paste this ~600 chars):
"Delays in electronic goods deliveries from suppliers causing out-of-stock situations. Several key items missing including popular smartphone models and gaming accessories. Customer complaints about online orders not being fulfilled in promised timeframes. Inventory system updates are not syncing properly between warehouse and floor display units. Need urgent attention from IT team to resolve system integration issues affecting sales. Multiple customer service tickets logged for same issues."

4. ESTIMATED IMPACT: $8500

5. NEXT ACTIONS (paste this long text):
"Schedule urgent meeting with IT team to resolve POS system issues and improve network stability. Hire additional part-time staff for evening shifts in apparel section to improve customer service during peak hours. Contact suppliers about delivery timelines and implement backorder communication system for popular electronics."

6. COMMENTS (paste this long text):
"Customer feedback indicates strong performance in grocery staples but need more variety in specialty items. Competitor across the street has launched new loyalty program and we're seeing some customer migration. Local university events are driving traffic but we need better coordination."

EXPECTED: 
- ✅ No truncation errors
- ✅ Submission succeeds  
- ✅ Full text saved (not cut off at 400 chars)
- ✅ Success message appears

VERIFY:
After submitting, check that the browser shows NO error messages containing "truncated" or "String or binary data would be truncated"

COMPARE TO PREVIOUS BEHAVIOR:
Before this fix, any text over 400 characters would cause this error:
"Error: String or binary data would be truncated in table 'redpulse.dbo.store_feedback', column 'top_positive'."
```

## Manual Verification SQL (Optional)

If you have database access, run this to verify full text was saved:

```sql
SELECT TOP 1 
  LEFT(top_positive, 100) as top_positive_preview,
  LEN(top_positive) as positive_length,
  LEN(top_negative_1) as negative1_length,
  LEN(next_actions) as actions_length,
  LEN(freeform_comments) as comments_length,
  created_at
FROM dbo.store_feedback 
ORDER BY created_at DESC;
```

If lengths are > 400, the fix worked! ✅

