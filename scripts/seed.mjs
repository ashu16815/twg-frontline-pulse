import sql from 'mssql';

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ AZURE_SQL_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

function weekKey(d) {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  const onejan = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil((((t - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${t.getUTCFullYear()}-W${w}`;
}

const isoWeek = weekKey(new Date());

// Demo stores
const stores = [
  ['ST-001', 'TWG Albany', 'North', 'albany@twg.co.nz', 1],
  ['ST-014', 'TWG Manukau', 'Central', 'manukau@twg.co.nz', 1],
  ['ST-027', 'TWG Dunedin', 'South', 'dunedin@twg.co.nz', 1],
  ['ST-033', 'TWG Riccarton', 'South', 'riccarton@twg.co.nz', 1],
  ['ST-042', 'TWG Wellington', 'Central', 'wellington@twg.co.nz', 1]
];

// Demo feedback
const feedback = [
  [
    isoWeek, 'ST-001', 'TWG Albany', 'North', null,
    0, -6, -14500,
    'Electronics up, Womens AV gaps',
    'Womens sizes missing', -8000,
    'Sat roster short', -4000,
    'Toy promo late', -2500,
    'Lock Toy ETAs', 'Next Month',
    'Backfill Sat roster', 'Next Month',
    'Denim size depth', 'Next Quarter',
    'neg', 'Availability,Roster,Supplier'
  ],
  [
    isoWeek, 'ST-014', 'TWG Manukau', 'Central', null,
    1, 3, 7200,
    'Audio availability strong',
    'FR queues at peak', -1200,
    'Bulky overflow', -1000,
    null, null,
    'Add weekend FR coverage', 'Next Month',
    'Overflow plan with DC', 'Next Quarter',
    null, null,
    'neu', 'Availability,Fitting Rooms,Space'
  ],
  [
    isoWeek, 'ST-027', 'TWG Dunedin', 'South', 'dunedin@twg.co.nz',
    1, 2, 3500,
    'Strong Homewares category performance',
    'Late apparel deliveries impacting range', -2000,
    null, null,
    null, null,
    'Expedite apparel freight', 'Next Month',
    null, null,
    null, null,
    'pos', 'Supplier,Availability'
  ]
];

// Demo RAG docs
const docs = [
  ['Ops Playbook — Availability North', 'North', 'Ensure core size depth on Womens denim; use surge roster for Sat peaks. Monitor Electronics stock levels weekly. Escalate backorder issues to DC immediately.'],
  ['Promo Launch Checklist', 'Company', 'Check on-shelf by Friday; expedite late containers; swap space if needed. Verify promotional signage is correct. Brief team on key offers before store opening.'],
  ['Fitting Room Standards', 'Central', 'Minimum 2 staff on FR duty during peak hours (11am-2pm, 5pm-7pm). Clear queues every 15 minutes. Maintain tidy change rooms with regular checks.'],
  ['DC Escalation Process', 'South', 'For urgent stock issues: Email DC Manager with store code, product code, and customer impact. CC Regional Manager. Follow up within 24 hours if no response.']
];

async function seed() {
  console.log('🌱 Seeding Win In Store database...\n');
  
  try {
    console.log('⏳ Connecting to Azure SQL Database...');
    const pool = await sql.connect(connectionString);
    console.log('✅ Connected successfully\n');
    
    // Seed stores
    console.log('📦 Seeding stores...');
    for (const s of stores) {
      await pool.request()
        .input('store_id', sql.NVarChar(20), s[0])
        .input('store_name', sql.NVarChar(200), s[1])
        .input('region', sql.NVarChar(100), s[2])
        .input('manager_email', sql.NVarChar(200), s[3])
        .input('active', sql.Bit, s[4])
        .query`
          MERGE dbo.store_master AS target
          USING (SELECT @store_id AS store_id) AS source
          ON target.store_id = source.store_id
          WHEN NOT MATCHED THEN
            INSERT (store_id, store_name, region, manager_email, active)
            VALUES (@store_id, @store_name, @region, @manager_email, @active);
        `;
      console.log(`   ✓ ${s[0]} - ${s[1]}`);
    }
    
    // Seed feedback
    console.log('\n📝 Seeding feedback...');
    for (const f of feedback) {
      await pool.request()
        .input('iso_week', sql.NVarChar(10), f[0])
        .input('store_id', sql.NVarChar(20), f[1])
        .input('store_name', sql.NVarChar(200), f[2])
        .input('region', sql.NVarChar(100), f[3])
        .input('manager_email', sql.NVarChar(200), f[4])
        .input('hit_target', sql.Bit, f[5])
        .input('target_variance_pct', sql.Float, f[6])
        .input('variance_dollars', sql.Float, f[7])
        .input('top_positive', sql.NVarChar(400), f[8])
        .input('miss1', sql.NVarChar(400), f[9])
        .input('miss1_dollars', sql.Float, f[10])
        .input('miss2', sql.NVarChar(400), f[11])
        .input('miss2_dollars', sql.Float, f[12])
        .input('miss3', sql.NVarChar(400), f[13])
        .input('miss3_dollars', sql.Float, f[14])
        .input('priority1', sql.NVarChar(300), f[15])
        .input('priority1_horizon', sql.NVarChar(40), f[16])
        .input('priority2', sql.NVarChar(300), f[17])
        .input('priority2_horizon', sql.NVarChar(40), f[18])
        .input('priority3', sql.NVarChar(300), f[19])
        .input('priority3_horizon', sql.NVarChar(40), f[20])
        .input('overall_mood', sql.NVarChar(16), f[21])
        .input('themes', sql.NVarChar(1000), f[22])
        .query`
          INSERT INTO dbo.store_feedback (
            iso_week, store_id, store_name, region, manager_email,
            hit_target, target_variance_pct, variance_dollars,
            top_positive, miss1, miss1_dollars, miss2, miss2_dollars,
            miss3, miss3_dollars, priority1, priority1_horizon,
            priority2, priority2_horizon, priority3, priority3_horizon,
            overall_mood, themes
          ) VALUES (
            @iso_week, @store_id, @store_name, @region, @manager_email,
            @hit_target, @target_variance_pct, @variance_dollars,
            @top_positive, @miss1, @miss1_dollars, @miss2, @miss2_dollars,
            @miss3, @miss3_dollars, @priority1, @priority1_horizon,
            @priority2, @priority2_horizon, @priority3, @priority3_horizon,
            @overall_mood, @themes
          );
        `;
      console.log(`   ✓ ${f[1]} - ${f[2]}`);
    }
    
    // Seed RAG docs
    console.log('\n📚 Seeding RAG documents...');
    for (const d of docs) {
      await pool.request()
        .input('title', sql.NVarChar(300), d[0])
        .input('region', sql.NVarChar(100), d[1])
        .input('content', sql.NVarChar(sql.MAX), d[2])
        .query`
          INSERT INTO dbo.wis_docs (title, region, content)
          VALUES (@title, @region, @content);
        `;
      console.log(`   ✓ ${d[0]}`);
    }
    
    console.log(`\n✅ Seeded demo data for ${isoWeek}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - ${stores.length} stores`);
    console.log(`   - ${feedback.length} feedback submissions`);
    console.log(`   - ${docs.length} RAG documents`);
    
    await pool.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error seeding database:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

seed();

