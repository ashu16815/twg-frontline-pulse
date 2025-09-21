// Demo data for testing without database
export const demoData = {
  stores: [
    { id: '1', brand: 'TWL', brand_color: 'Red Store', code: '209', store_name: 'Airport', display_name: 'TWL Airport' },
    { id: '2', brand: 'WSL', brand_color: 'Blue Store', code: '338', store_name: 'Airport', display_name: 'WSL Airport' },
    { id: '3', brand: 'TWL', brand_color: 'Red Store', code: '220', store_name: 'Riccarton', display_name: 'TWL Riccarton' },
    { id: '4', brand: 'TWL', brand_color: 'Red Store', code: '185', store_name: 'Te Rapa', display_name: 'TWL Te Rapa' },
    { id: '5', brand: 'WSL', brand_color: 'Blue Store', code: '372', store_name: 'Te Rapa', display_name: 'WSL Te Rapa' }
  ],
  feedback: [
    {
      id: '1',
      iso_week: '2025-W399',
      store_id: 'ST-209',
      store_name: 'TWL Airport',
      region: 'North',
      issue1_cat: 'Apparel',
      issue1_text: 'Apparel down 9% due to late container arrival',
      issue1_impact: 'Sales',
      issue1_mood: 'neg',
      issue2_cat: 'Home',
      issue2_text: 'Bays blocked by bulky stock causing congestion',
      issue2_impact: 'Ops',
      issue2_mood: 'neg',
      issue3_cat: 'Toys',
      issue3_text: 'Promo lines missed launch due to supplier delay',
      issue3_impact: 'Sales',
      issue3_mood: 'neg',
      overall_mood: 'neg',
      themes: ['Late Delivery', 'Stockroom Ops', 'Promo On-Shelf'],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      iso_week: '2025-W39',
      store_id: 'ST-338',
      store_name: 'WSL Airport',
      region: 'North',
      issue1_cat: 'Electronics',
      issue1_text: 'TVs strong, up 3% with good availability',
      issue1_impact: 'Sales',
      issue1_mood: 'pos',
      issue2_cat: 'Apparel',
      issue2_text: 'Queues at peak due to fitting room staffing',
      issue2_impact: 'CX',
      issue2_mood: 'neg',
      issue3_cat: 'Outdoor',
      issue3_text: 'Pallets in aisle Sat PM due to bulky overflow',
      issue3_impact: 'Ops',
      issue3_mood: 'neg',
      overall_mood: 'neu',
      themes: ['Availability', 'Staffing Shortfall', 'Bulky Stock'],
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      iso_week: '2025-W39',
      store_id: 'ST-220',
      store_name: 'TWL Riccarton',
      region: 'South',
      issue1_cat: 'Apparel',
      issue1_text: 'Sizes 10/12 missing on key lines',
      issue1_impact: 'Sales',
      issue1_mood: 'neg',
      issue2_cat: 'People',
      issue2_text: 'Two sick on Sat causing staffing gaps',
      issue2_impact: 'Ops',
      issue2_mood: 'neg',
      issue3_cat: 'Systems',
      issue3_text: 'POS froze at 3:05pm during peak hour',
      issue3_impact: 'Ops',
      issue3_mood: 'neg',
      overall_mood: 'neg',
      themes: ['Size Gaps', 'Staffing Shortfall', 'POS Stability'],
      created_at: new Date().toISOString()
    }
  ],
  summaries: [
    {
      id: '1',
      iso_week: '2025-W39',
      region: 'North',
      summary: 'Late deliveries hitting Apparel; stockroom congestion; Toys promo delays. Actions: Supplier escalation, surge labour, planogram check.',
      top_themes: ['Late Delivery', 'Stockroom Ops', 'Promo On-Shelf'],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      iso_week: '2025-W39',
      region: 'South',
      summary: 'Size gaps in Apparel; staffing gaps Sat; POS stability concerns. Actions: Size allocation review, roster adjustments, IT investigation.',
      top_themes: ['Size Gaps', 'Staffing Shortfall', 'POS Stability'],
      created_at: new Date().toISOString()
    }
  ]
};

// Export for use in API routes
export default demoData;
