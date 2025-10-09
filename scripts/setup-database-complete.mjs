#!/usr/bin/env node

/**
 * Complete Database Setup Script for Win In Store
 * Creates all tables and populates with comprehensive test data
 */

import sql from 'mssql';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ AZURE_SQL_CONNECTION_STRING is required in .env.local');
  process.exit(1);
}

// Helper function to get ISO week
function weekKey(d) {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  const onejan = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil((((t - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${t.getUTCFullYear()}-W${w}`;
}

const currentWeek = weekKey(new Date());
const lastWeek = weekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

console.log('🚀 Win In Store - Complete Database Setup\n');
console.log('═══════════════════════════════════════════════════════════\n');

async function setupDatabase() {
  let pool;
  
  try {
    console.log('📡 Connecting to Azure SQL Database...');
    pool = await sql.connect(connectionString);
    console.log('✅ Connected successfully\n');
    
    // ============================================
    // STEP 1: DROP EXISTING TABLES (Clean slate)
    // ============================================
    console.log('🗑️  Step 1: Cleaning existing tables...');
    const dropTables = [
      'audit_log',
      'executive_report',
      'weekly_summary',
      'store_feedback',
      'wis_docs',
      'store_master'
    ];
    
    for (const table of dropTables) {
      try {
        await pool.request().query(`IF OBJECT_ID('dbo.${table}', 'U') IS NOT NULL DROP TABLE dbo.${table}`);
        console.log(`   ✓ Dropped ${table}`);
      } catch (err) {
        console.log(`   ℹ ${table} doesn't exist (OK)`);
      }
    }
    console.log('');
    
    // ============================================
    // STEP 2: CREATE TABLES
    // ============================================
    console.log('📋 Step 2: Creating tables...\n');
    
    // Table 1: store_master
    console.log('   Creating store_master...');
    await pool.request().query(`
      CREATE TABLE dbo.store_master (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        store_id NVARCHAR(20) NOT NULL UNIQUE,
        store_name NVARCHAR(200) NOT NULL,
        region NVARCHAR(100) NOT NULL,
        manager_email NVARCHAR(200) NULL,
        active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      )
    `);
    console.log('   ✅ store_master created');
    
    // Table 2: store_feedback
    console.log('   Creating store_feedback...');
    await pool.request().query(`
      CREATE TABLE dbo.store_feedback (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        iso_week NVARCHAR(10) NOT NULL,
        store_id NVARCHAR(20) NOT NULL,
        store_name NVARCHAR(200) NOT NULL,
        region NVARCHAR(100) NOT NULL,
        manager_email NVARCHAR(200) NULL,
        
        -- Performance
        hit_target BIT NULL,
        target_variance_pct FLOAT NULL,
        variance_dollars FLOAT NULL,
        
        -- Frontline Feedback
        top_positive NVARCHAR(400) NULL,
        top_positive_impact FLOAT NULL,
        top_negative_1 NVARCHAR(400) NULL,
        top_negative_1_impact FLOAT NULL,
        top_negative_2 NVARCHAR(400) NULL,
        top_negative_2_impact FLOAT NULL,
        top_negative_3 NVARCHAR(400) NULL,
        top_negative_3_impact FLOAT NULL,
        next_actions NVARCHAR(MAX) NULL,
        freeform_comments NVARCHAR(MAX) NULL,
        estimated_dollar_impact FLOAT NULL,
        
        -- Legacy issue fields
        miss1 NVARCHAR(400) NULL,
        miss1_dollars FLOAT NULL,
        miss2 NVARCHAR(400) NULL,
        miss2_dollars FLOAT NULL,
        miss3 NVARCHAR(400) NULL,
        miss3_dollars FLOAT NULL,
        
        -- Priorities
        priority1 NVARCHAR(300) NULL,
        priority1_horizon NVARCHAR(40) NULL,
        priority2 NVARCHAR(300) NULL,
        priority2_horizon NVARCHAR(40) NULL,
        priority3 NVARCHAR(300) NULL,
        priority3_horizon NVARCHAR(40) NULL,
        
        -- AI Analysis
        overall_mood NVARCHAR(16) NULL,
        themes NVARCHAR(1000) NULL,
        
        INDEX ix_store_feedback_week (iso_week),
        INDEX ix_store_feedback_store (store_id),
        INDEX ix_store_feedback_region (region)
      )
    `);
    console.log('   ✅ store_feedback created');
    
    // Table 3: weekly_summary
    console.log('   Creating weekly_summary...');
    await pool.request().query(`
      CREATE TABLE dbo.weekly_summary (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        iso_week NVARCHAR(10) NOT NULL,
        region NVARCHAR(100) NOT NULL,
        summary NVARCHAR(MAX) NOT NULL,
        top_themes NVARCHAR(1000) NULL,
        total_reported_impact FLOAT NULL,
        top_drivers NVARCHAR(MAX) NULL,
        
        INDEX ix_weekly_summary_week (iso_week),
        INDEX ix_weekly_summary_region (region)
      )
    `);
    console.log('   ✅ weekly_summary created');
    
    // Table 4: executive_report
    console.log('   Creating executive_report...');
    await pool.request().query(`
      CREATE TABLE dbo.executive_report (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        iso_week NVARCHAR(10) NOT NULL,
        narrative NVARCHAR(MAX) NOT NULL,
        highlights NVARCHAR(MAX) NOT NULL,
        themes NVARCHAR(MAX) NOT NULL,
        risks NVARCHAR(MAX) NOT NULL,
        actions NVARCHAR(MAX) NOT NULL,
        
        INDEX ix_executive_report_week (iso_week)
      )
    `);
    console.log('   ✅ executive_report created');
    
    // Table 5: wis_docs (RAG)
    console.log('   Creating wis_docs...');
    await pool.request().query(`
      CREATE TABLE dbo.wis_docs (
        doc_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        title NVARCHAR(300) NOT NULL,
        region NVARCHAR(100) NULL,
        content NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        
        INDEX ix_wis_docs_region (region)
      )
    `);
    console.log('   ✅ wis_docs created');
    console.log('   ℹ  VECTOR column skipped (preview feature not enabled)');
    
    // Table 6: audit_log
    console.log('   Creating audit_log...');
    await pool.request().query(`
      CREATE TABLE dbo.audit_log (
        id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        actor NVARCHAR(200) NULL,
        action NVARCHAR(100) NOT NULL,
        meta NVARCHAR(MAX) NULL,
        
        INDEX ix_audit_log_action (action),
        INDEX ix_audit_log_created (created_at)
      )
    `);
    console.log('   ✅ audit_log created\n');
    
    // ============================================
    // STEP 3: POPULATE DATA
    // ============================================
    console.log('📊 Step 3: Populating test data...\n');
    
    // Stores
    console.log('   Populating stores...');
    const stores = [
      { id: 'ST-001', name: 'TWG Albany', region: 'North', email: 'albany@twg.co.nz' },
      { id: 'ST-014', name: 'TWG Manukau', region: 'Central', email: 'manukau@twg.co.nz' },
      { id: 'ST-027', name: 'TWG Dunedin', region: 'South', email: 'dunedin@twg.co.nz' },
      { id: 'ST-033', name: 'TWG Riccarton', region: 'South', email: 'riccarton@twg.co.nz' },
      { id: 'ST-042', name: 'TWG Wellington', region: 'Central', email: 'wellington@twg.co.nz' },
      { id: 'ST-055', name: 'TWG Hamilton', region: 'North', email: 'hamilton@twg.co.nz' },
      { id: 'ST-068', name: 'TWG Palmerston North', region: 'Central', email: 'palmerstonnorth@twg.co.nz' },
      { id: 'ST-079', name: 'TWG Christchurch', region: 'South', email: 'christchurch@twg.co.nz' }
    ];
    
    for (const store of stores) {
      await pool.request()
        .input('store_id', sql.NVarChar(20), store.id)
        .input('store_name', sql.NVarChar(200), store.name)
        .input('region', sql.NVarChar(100), store.region)
        .input('manager_email', sql.NVarChar(200), store.email)
        .query(`
          INSERT INTO dbo.store_master (store_id, store_name, region, manager_email, active)
          VALUES (@store_id, @store_name, @region, @manager_email, 1)
        `);
      console.log(`      ✓ ${store.id} - ${store.name}`);
    }
    
    // Store Feedback - Current Week
    console.log('\n   Populating store feedback (current week)...');
    const feedbackCurrentWeek = [
      {
        week: currentWeek, storeId: 'ST-001', storeName: 'TWG Albany', region: 'North',
        email: 'albany@twg.co.nz', hitTarget: 0, variancePct: -6, varianceDollars: -14500,
        topPositive: 'Electronics sales exceeded targets by 15%', topPositiveImpact: 8000,
        negative1: 'Apparel sizes missing in key categories', negative1Impact: 8000,
        negative2: 'Saturday roster shortage affecting service', negative2Impact: 4000,
        negative3: 'Toy promotion arrived 3 days late', negative3Impact: 2500,
        nextActions: 'Need expedited supplier communication for Toys, additional weekend staffing',
        comments: 'Competitor opened new store 2km away, seeing some traffic impact',
        estimatedImpact: -6500,
        priority1: 'Lock supplier ETAs for promotional items', priority1H: 'Next Month',
        priority2: 'Backfill Saturday roster gaps', priority2H: 'Next Month',
        priority3: 'Review apparel range depth', priority3H: 'Next Quarter',
        mood: 'neg', themes: 'Availability,Roster,Supplier'
      },
      {
        week: currentWeek, storeId: 'ST-014', storeName: 'TWG Manukau', region: 'Central',
        email: 'manukau@twg.co.nz', hitTarget: 1, variancePct: 3, varianceDollars: 7200,
        topPositive: 'Audio & Tech category strong performance', topPositiveImpact: 9000,
        negative1: 'Fitting room queues during peak hours', negative1Impact: 1200,
        negative2: 'Bulky stock overflow in backroom', negative2Impact: 1000,
        negative3: null, negative3Impact: null,
        nextActions: 'Add weekend fitting room coverage, coordinate DC for overflow plan',
        comments: 'Overall positive week, minor operational improvements needed',
        estimatedImpact: 5000,
        priority1: 'Weekend FR coverage roster', priority1H: 'Next Month',
        priority2: 'DC overflow handling protocol', priority2H: 'Next Quarter',
        priority3: null, priority3H: null,
        mood: 'pos', themes: 'Operations,Space,CustomerExperience'
      },
      {
        week: currentWeek, storeId: 'ST-027', storeName: 'TWG Dunedin', region: 'South',
        email: 'dunedin@twg.co.nz', hitTarget: 1, variancePct: 2, varianceDollars: 3500,
        topPositive: 'Homewares category growth', topPositiveImpact: 5000,
        negative1: 'Late apparel deliveries impacting range', negative1Impact: 2000,
        negative2: null, negative2Impact: null,
        negative3: null, negative3Impact: null,
        nextActions: 'Expedite apparel freight, follow up with DC',
        comments: 'Good week overall, weather helped foot traffic',
        estimatedImpact: 3500,
        priority1: 'Expedite apparel freight', priority1H: 'Next Month',
        priority2: null, priority2H: null,
        priority3: null, priority3H: null,
        mood: 'pos', themes: 'Supplier,Availability'
      },
      {
        week: currentWeek, storeId: 'ST-033', storeName: 'TWG Riccarton', region: 'South',
        email: 'riccarton@twg.co.nz', hitTarget: 1, variancePct: 5, varianceDollars: 12000,
        topPositive: 'Excellent kids apparel performance', topPositiveImpact: 15000,
        negative1: 'POS system slow during peak', negative1Impact: 3000,
        negative2: null, negative2Impact: null,
        negative3: null, negative3Impact: null,
        nextActions: 'IT to investigate POS performance',
        comments: 'Strong week, Back to School promo successful',
        estimatedImpact: 12000,
        priority1: 'POS system health check', priority1H: 'Next Month',
        priority2: null, priority2H: null,
        priority3: null, priority3H: null,
        mood: 'pos', themes: 'Technology,Operations'
      },
      {
        week: currentWeek, storeId: 'ST-042', storeName: 'TWG Wellington', region: 'Central',
        email: 'wellington@twg.co.nz', hitTarget: 0, variancePct: -3, varianceDollars: -8000,
        topPositive: 'Home category steady', topPositiveImpact: 2000,
        negative1: 'Stockout on promotional TV model', negative1Impact: 5000,
        negative2: 'Staff sickness affecting trading hours', negative2Impact: 3000,
        negative3: null, negative3Impact: null,
        nextActions: 'Better stock forecasting for promos, backup roster plan',
        comments: 'Flu season hitting team hard',
        estimatedImpact: -6000,
        priority1: 'Promo stock safety buffer', priority1H: 'Next Month',
        priority2: 'Backup roster protocol', priority2H: 'Next Month',
        priority3: null, priority3H: null,
        mood: 'neg', themes: 'Availability,Roster,Health'
      }
    ];
    
    for (const fb of feedbackCurrentWeek) {
      await pool.request()
        .input('iso_week', sql.NVarChar(10), fb.week)
        .input('store_id', sql.NVarChar(20), fb.storeId)
        .input('store_name', sql.NVarChar(200), fb.storeName)
        .input('region', sql.NVarChar(100), fb.region)
        .input('manager_email', sql.NVarChar(200), fb.email)
        .input('hit_target', sql.Bit, fb.hitTarget)
        .input('target_variance_pct', sql.Float, fb.variancePct)
        .input('variance_dollars', sql.Float, fb.varianceDollars)
        .input('top_positive', sql.NVarChar(400), fb.topPositive)
        .input('top_positive_impact', sql.Float, fb.topPositiveImpact)
        .input('top_negative_1', sql.NVarChar(400), fb.negative1)
        .input('top_negative_1_impact', sql.Float, fb.negative1Impact)
        .input('top_negative_2', sql.NVarChar(400), fb.negative2)
        .input('top_negative_2_impact', sql.Float, fb.negative2Impact)
        .input('top_negative_3', sql.NVarChar(400), fb.negative3)
        .input('top_negative_3_impact', sql.Float, fb.negative3Impact)
        .input('next_actions', sql.NVarChar(sql.MAX), fb.nextActions)
        .input('freeform_comments', sql.NVarChar(sql.MAX), fb.comments)
        .input('estimated_dollar_impact', sql.Float, fb.estimatedImpact)
        .input('priority1', sql.NVarChar(300), fb.priority1)
        .input('priority1_horizon', sql.NVarChar(40), fb.priority1H)
        .input('priority2', sql.NVarChar(300), fb.priority2)
        .input('priority2_horizon', sql.NVarChar(40), fb.priority2H)
        .input('priority3', sql.NVarChar(300), fb.priority3)
        .input('priority3_horizon', sql.NVarChar(40), fb.priority3H)
        .input('overall_mood', sql.NVarChar(16), fb.mood)
        .input('themes', sql.NVarChar(1000), fb.themes)
        .query(`
          INSERT INTO dbo.store_feedback (
            iso_week, store_id, store_name, region, manager_email,
            hit_target, target_variance_pct, variance_dollars,
            top_positive, top_positive_impact,
            top_negative_1, top_negative_1_impact,
            top_negative_2, top_negative_2_impact,
            top_negative_3, top_negative_3_impact,
            next_actions, freeform_comments, estimated_dollar_impact,
            priority1, priority1_horizon,
            priority2, priority2_horizon,
            priority3, priority3_horizon,
            overall_mood, themes
          ) VALUES (
            @iso_week, @store_id, @store_name, @region, @manager_email,
            @hit_target, @target_variance_pct, @variance_dollars,
            @top_positive, @top_positive_impact,
            @top_negative_1, @top_negative_1_impact,
            @top_negative_2, @top_negative_2_impact,
            @top_negative_3, @top_negative_3_impact,
            @next_actions, @freeform_comments, @estimated_dollar_impact,
            @priority1, @priority1_horizon,
            @priority2, @priority2_horizon,
            @priority3, @priority3_horizon,
            @overall_mood, @themes
          )
        `);
      console.log(`      ✓ ${fb.storeId} - ${fb.storeName}`);
    }
    
    // Weekly Summaries
    console.log('\n   Populating weekly summaries...');
    const summaries = [
      {
        week: currentWeek, region: 'North',
        summary: 'North region had mixed performance this week. Albany missed target primarily due to supplier delays and staffing gaps, offset partially by strong electronics. Key action items: expedite supplier ETAs and strengthen weekend roster coverage.',
        themes: 'Availability,Roster,Supplier,Electronics',
        totalImpact: -6500,
        drivers: JSON.stringify([
          { driver: 'Supplier Delays', dollars: -10500, count: 2 },
          { driver: 'Roster Gaps', dollars: -4000, count: 1 },
          { driver: 'Electronics Growth', dollars: 8000, count: 1 }
        ])
      },
      {
        week: currentWeek, region: 'Central',
        summary: 'Central region performing above target. Manukau exceeded expectations with strong tech sales. Wellington missed due to promotional stockout and staff sickness. Overall positive trajectory with operational improvements needed.',
        themes: 'Operations,Technology,Availability,Roster',
        totalImpact: -1000,
        drivers: JSON.stringify([
          { driver: 'Tech Sales', dollars: 9000, count: 1 },
          { driver: 'Stockouts', dollars: -5000, count: 1 },
          { driver: 'Roster/Health', dollars: -3000, count: 1 }
        ])
      },
      {
        week: currentWeek, region: 'South',
        summary: 'South region outperforming with both stores above target. Dunedin had strong homewares, Riccarton excelled in kids apparel. Minor supplier delays noted but did not materially impact results. POS performance to be monitored.',
        themes: 'CategoryPerformance,Supplier,Technology',
        totalImpact: 15500,
        drivers: JSON.stringify([
          { driver: 'Category Performance', dollars: 20000, count: 2 },
          { driver: 'Supplier Delays', dollars: -2000, count: 1 },
          { driver: 'Technology', dollars: -3000, count: 1 }
        ])
      }
    ];
    
    for (const sum of summaries) {
      await pool.request()
        .input('iso_week', sql.NVarChar(10), sum.week)
        .input('region', sql.NVarChar(100), sum.region)
        .input('summary', sql.NVarChar(sql.MAX), sum.summary)
        .input('top_themes', sql.NVarChar(1000), sum.themes)
        .input('total_reported_impact', sql.Float, sum.totalImpact)
        .input('top_drivers', sql.NVarChar(sql.MAX), sum.drivers)
        .query(`
          INSERT INTO dbo.weekly_summary (iso_week, region, summary, top_themes, total_reported_impact, top_drivers)
          VALUES (@iso_week, @region, @summary, @top_themes, @total_reported_impact, @top_drivers)
        `);
      console.log(`      ✓ ${sum.region} region summary`);
    }
    
    // RAG Documents
    console.log('\n   Populating RAG documents...');
    const docs = [
      {
        title: 'Ops Playbook — Availability North',
        region: 'North',
        content: 'Ensure core size depth on apparel, especially during promotional periods. Use surge roster for Saturday peaks. Monitor Electronics stock levels weekly. Escalate backorder issues to DC within 24 hours. Maintain safety stock for top 20 SKUs.'
      },
      {
        title: 'Promo Launch Checklist',
        region: 'Company',
        content: 'Check on-shelf availability by Friday before promo launch. Expedite late containers with urgent flag. Swap space if needed to prioritize promotional products. Verify promotional signage is correct and visible. Brief team on key offers before store opening Monday.'
      },
      {
        title: 'Fitting Room Standards',
        region: 'Central',
        content: 'Minimum 2 staff on FR duty during peak hours (11am-2pm, 5pm-7pm). Clear queues every 15 minutes. Maintain tidy change rooms with regular checks. Monitor wait times and escalate if exceeding 10 minutes. Weekend surge coverage essential.'
      },
      {
        title: 'DC Escalation Process',
        region: 'South',
        content: 'For urgent stock issues: Email DC Manager with store code, product code, and customer impact. CC Regional Manager. Follow up within 24 hours if no response. Use "URGENT" flag for promotional stock. Document all escalations in system.'
      },
      {
        title: 'POS Health Monitoring',
        region: 'Company',
        content: 'Check POS response times daily during opening checks. Report any transaction taking >5 seconds. Clear cache and restart terminals if slow. Escalate persistent issues to IT immediately. Peak period monitoring critical during promotional weekends.'
      },
      {
        title: 'Roster Management — Weekend Coverage',
        region: 'Company',
        content: 'Ensure adequate coverage for Saturday peaks. Maintain backup staff list for call-ins. Peak hours require minimum 80% of full team. Cross-train staff for fitting rooms and checkout. Plan roster 2 weeks ahead for promotional weekends.'
      }
    ];
    
    for (const doc of docs) {
      await pool.request()
        .input('title', sql.NVarChar(300), doc.title)
        .input('region', sql.NVarChar(100), doc.region)
        .input('content', sql.NVarChar(sql.MAX), doc.content)
        .query(`
          INSERT INTO dbo.wis_docs (title, region, content)
          VALUES (@title, @region, @content)
        `);
      console.log(`      ✓ ${doc.title}`);
    }
    
    // Audit Log
    console.log('\n   Creating audit log entries...');
    const auditEntries = [
      { actor: 'system', action: 'database-setup', meta: JSON.stringify({ version: '1.0', date: new Date().toISOString() }) },
      { actor: 'store-manager', action: 'weekly-submit', meta: JSON.stringify({ store: 'ST-001', week: currentWeek }) },
      { actor: 'store-manager', action: 'weekly-submit', meta: JSON.stringify({ store: 'ST-014', week: currentWeek }) },
      { actor: 'admin', action: 'report-generate', meta: JSON.stringify({ week: currentWeek, type: 'executive' }) }
    ];
    
    for (const audit of auditEntries) {
      await pool.request()
        .input('actor', sql.NVarChar(200), audit.actor)
        .input('action', sql.NVarChar(100), audit.action)
        .input('meta', sql.NVarChar(sql.MAX), audit.meta)
        .query(`
          INSERT INTO dbo.audit_log (actor, action, meta)
          VALUES (@actor, @action, @meta)
        `);
    }
    console.log(`      ✓ ${auditEntries.length} audit entries created\n`);
    
    // ============================================
    // STEP 4: VERIFY DATA
    // ============================================
    console.log('🔍 Step 4: Verifying data...\n');
    
    const counts = await Promise.all([
      pool.request().query('SELECT COUNT(*) as cnt FROM dbo.store_master'),
      pool.request().query('SELECT COUNT(*) as cnt FROM dbo.store_feedback'),
      pool.request().query('SELECT COUNT(*) as cnt FROM dbo.weekly_summary'),
      pool.request().query('SELECT COUNT(*) as cnt FROM dbo.wis_docs'),
      pool.request().query('SELECT COUNT(*) as cnt FROM dbo.audit_log')
    ]);
    
    console.log('   Data counts:');
    console.log(`      Stores: ${counts[0].recordset[0].cnt}`);
    console.log(`      Feedback: ${counts[1].recordset[0].cnt}`);
    console.log(`      Summaries: ${counts[2].recordset[0].cnt}`);
    console.log(`      RAG Docs: ${counts[3].recordset[0].cnt}`);
    console.log(`      Audit Logs: ${counts[4].recordset[0].cnt}\n`);
    
    // ============================================
    // SUCCESS!
    // ============================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DATABASE SETUP COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   • 6 tables created`);
    console.log(`   • ${stores.length} stores`);
    console.log(`   • ${feedbackCurrentWeek.length} feedback submissions`);
    console.log(`   • ${summaries.length} regional summaries`);
    console.log(`   • ${docs.length} RAG documents`);
    console.log(`   • Test data for week: ${currentWeek}\n`);
    console.log('🚀 Next steps:');
    console.log('   1. Restart your dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/reports');
    console.log('   3. Test report generation');
    console.log('   4. Submit new feedback\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await pool.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during setup:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ELOGIN') {
      console.error('\n💡 Login failed. Check:');
      console.error('   - Connection string in .env.local');
      console.error('   - Username and password are correct');
      console.error('   - Your IP is in Azure SQL firewall rules');
    } else if (error.code === 'ETIMEOUT') {
      console.error('\n💡 Connection timeout. Check:');
      console.error('   - Azure SQL server is running');
      console.error('   - Firewall rules allow your IP');
      console.error('   - Network connectivity');
    }
    
    if (pool) await pool.close();
    process.exit(1);
  }
}

setupDatabase();

