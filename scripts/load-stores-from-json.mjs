import 'dotenv/config';
import sql from 'mssql';
import fs from 'fs/promises';

async function loadStoresFromJson() {
  try {
    console.log('🔄 Loading stores from JSON to staging table...');
    
    const pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);
    console.log('✅ Connected to database');
    
    // Create staging table
    const ddl = await fs.readFile('db/stores-staging.sql', 'utf8');
    await pool.request().batch(ddl);
    console.log('✅ Staging table created');
    
    // Load JSON data
    const jsonData = await fs.readFile('data/stores_master.json', 'utf8');
    const rows = JSON.parse(jsonData);
    
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('data/stores_master.json is empty or invalid');
    }
    
    console.log(`📊 Found ${rows.length} stores in JSON file`);
    
    // Create bulk insert table
    const table = new sql.Table('dbo.store_master_stg');
    table.create = false;
    table.columns.add('store_code', sql.NVarChar(50), { nullable: false });
    table.columns.add('store_name', sql.NVarChar(200), { nullable: false });
    table.columns.add('banner', sql.NVarChar(20), { nullable: true });
    table.columns.add('region', sql.NVarChar(100), { nullable: true });
    table.columns.add('region_code', sql.NVarChar(20), { nullable: true });
    table.columns.add('manager_email', sql.NVarChar(200), { nullable: true });
    table.columns.add('active', sql.Bit, { nullable: true });
    
    // Add rows to bulk insert
    for (const row of rows) {
      table.rows.add(
        row.store_code,
        row.store_name,
        row.banner || null,
        row.region || null,
        row.region_code || null,
        row.manager_email || null,
        (row.active ?? true)
      );
    }
    
    // Execute bulk insert
    await pool.request().bulk(table);
    console.log(`✅ Loaded ${rows.length} rows into dbo.store_master_stg`);
    
    await pool.close();
    console.log('🎉 JSON loading completed successfully!');
    
  } catch (error) {
    console.error('❌ JSON loading failed:', error.message);
    process.exit(1);
  }
}

loadStoresFromJson();
