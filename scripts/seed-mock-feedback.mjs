import 'dotenv/config';
import sql from 'mssql';

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ AZURE_SQL_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

async function seedMockFeedback() {
  console.log('🔄 Seeding mock executive report feedback data...\n');
  
  try {
    const pool = await sql.connect(connectionString);
    console.log('✅ Connected to database\n');
    
    const W = 'FY26-W11'; // Current financial week
    const M = '2025-10';  // Current month
    
    const rows = [
      {
        region_code: 'North',
        region: 'North Region',
        store_id: 'ST-001',
        store_name: 'Henderson Store',
        store_code: 1001,
        banner: 'TWL',
        manager_email: 'manager001@example.com',
        top_positive: 'Promo compliance + strong conversion',
        miss1: 'Late deliveries Toys',
        miss1_dollars: -4500,
        miss2: 'Roster gaps Sun',
        miss2_dollars: -1800,
        miss3: 'Outdoor stock-outs',
        miss3_dollars: -2200,
        overall_mood: 'negative',
        freeform_comments: 'Toys DC delay Fri; queue times 15-20m; need 2x weekend shifts'
      },
      {
        region_code: 'Central',
        region: 'Central Region',
        store_id: 'ST-023',
        store_name: 'Auckland Central',
        store_code: 2023,
        banner: 'TWL',
        manager_email: 'manager023@example.com',
        top_positive: 'Audio/Tech uplifts',
        miss1: 'Fitting room queues',
        miss1_dollars: -1200,
        miss2: 'Signage missing in seasonal',
        miss2_dollars: -600,
        miss3: null,
        miss3_dollars: 0,
        overall_mood: 'neutral',
        freeform_comments: 'Seasonal reset late; staff sickness Tue'
      },
      {
        region_code: 'South',
        region: 'South Region',
        store_id: 'ST-045',
        store_name: 'Christchurch Store',
        store_code: 3045,
        banner: 'TWL',
        manager_email: 'manager045@example.com',
        top_positive: 'New layout improved ATV',
        miss1: 'Availability Womens Apparel',
        miss1_dollars: -3800,
        miss2: 'Price tags mismatch',
        miss2_dollars: -400,
        miss3: null,
        miss3_dollars: 0,
        overall_mood: 'negative',
        freeform_comments: 'Need size curve correction and replen rules'
      },
      {
        region_code: 'North',
        region: 'North Region',
        store_id: 'ST-012',
        store_name: 'Takapuna Store',
        store_code: 1012,
        banner: 'TWL',
        manager_email: 'manager012@example.com',
        top_positive: 'Customer service scores up',
        miss1: 'Inventory accuracy issues',
        miss1_dollars: -3200,
        miss2: 'Staff training gaps',
        miss2_dollars: -1500,
        miss3: 'Equipment maintenance delays',
        miss3_dollars: -800,
        overall_mood: 'positive',
        freeform_comments: 'Great team morale this week despite challenges'
      },
      {
        region_code: 'Central',
        region: 'Central Region',
        store_id: 'ST-034',
        store_name: 'Newmarket Store',
        store_code: 2034,
        banner: 'TWL',
        manager_email: 'manager034@example.com',
        top_positive: 'Digital sales channel growth',
        miss1: 'Store cleanliness standards',
        miss1_dollars: -900,
        miss2: 'Product knowledge gaps',
        miss2_dollars: -1100,
        miss3: null,
        miss3_dollars: 0,
        overall_mood: 'neutral',
        freeform_comments: 'Need more training on new product lines'
      }
    ];
    
    console.log(`📊 Inserting ${rows.length} mock feedback records...\n`);
    
    for (const r of rows) {
      await pool.request()
        .input('iso_week', W)
        .input('month_key', M)
        .input('region_code', r.region_code)
        .input('region', r.region)
        .input('store_id', r.store_id)
        .input('store_name', r.store_name)
        .input('store_code', r.store_code)
        .input('banner', r.banner)
        .input('manager_email', r.manager_email)
        .input('top_positive', r.top_positive)
        .input('miss1', r.miss1)
        .input('miss1_dollars', r.miss1_dollars)
        .input('miss2', r.miss2)
        .input('miss2_dollars', r.miss2_dollars)
        .input('miss3', r.miss3)
        .input('miss3_dollars', r.miss3_dollars)
        .input('overall_mood', r.overall_mood)
        .input('freeform_comments', r.freeform_comments)
        .query`
          insert into dbo.store_feedback(
            iso_week, month_key, region_code, region, store_id, store_name, store_code, banner, manager_email,
            top_positive, miss1, miss1_dollars, miss2, miss2_dollars, 
            miss3, miss3_dollars, overall_mood, freeform_comments
          ) 
          values(
            @iso_week, @month_key, @region_code, @region, @store_id, @store_name, @store_code, @banner, @manager_email,
            @top_positive, @miss1, @miss1_dollars, @miss2, @miss2_dollars,
            @miss3, @miss3_dollars, @overall_mood, @freeform_comments
          )
        `;
      
      console.log(`   ✓ ${r.store_id} (${r.region_code})`);
    }
    
    console.log('\n✅ Mock feedback data seeded successfully!');
    console.log(`   Week: ${W}`);
    console.log(`   Month: ${M}`);
    console.log(`   Records: ${rows.length}`);
    
    await pool.close();
    console.log('\n🎉 Seeding complete!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedMockFeedback();
