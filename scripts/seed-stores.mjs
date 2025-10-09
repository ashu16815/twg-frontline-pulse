#!/usr/bin/env node

/**
 * Seed Store Master from CSV
 * Merges data from data/store-master.csv into store_master table
 */

import dotenv from 'dotenv';
import sql from 'mssql';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ AZURE_SQL_CONNECTION_STRING is required');
  process.exit(1);
}

console.log('📦 Seeding Store Master from CSV...\n');

async function seedStores() {
  try {
    const pool = await sql.connect(connectionString);
    const csvPath = path.resolve(__dirname, '../data/store-master.csv');
    
    try {
      const text = await fs.readFile(csvPath, 'utf8');
      const lines = text.trim().split(/\r?\n/);
      const headers = lines.shift();
      
      if (!headers) {
        throw new Error('CSV is empty');
      }
      
      const cols = headers.split(',').map(c => c.trim().toLowerCase());
      const idx = (name) => cols.findIndex(c => c === name);
      
      const i_id = idx('store_id');
      const i_code = idx('store_code');
      const i_name = idx('store_name');
      const i_banner = idx('banner');
      const i_region = idx('region');
      const i_rc = idx('region_code');
      const i_mgr = idx('manager_email');
      const i_act = idx('active');
      
      let count = 0;
      console.log('Processing stores...');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const c = line.split(',');
        const store_id = c[i_id]?.trim();
        const store_code = c[i_code]?.trim() ? Number(c[i_code].trim()) : null;
        const store_name = c[i_name]?.trim();
        const banner = c[i_banner]?.trim() || null;
        const region = c[i_region]?.trim();
        const region_code = c[i_rc]?.trim();
        const manager_email = c[i_mgr]?.trim() || null;
        const active = (c[i_act]?.trim() || '1') === '1' ? 1 : 0;
        
        if (!store_id || !store_name || !region || !region_code) {
          console.warn(`⚠️  Skipping incomplete row: ${line}`);
          continue;
        }
        
        await pool.request()
          .input('store_id', sql.NVarChar(20), store_id)
          .input('store_code', sql.Int, store_code)
          .input('store_name', sql.NVarChar(200), store_name)
          .input('banner', sql.NVarChar(50), banner)
          .input('region', sql.NVarChar(100), region)
          .input('region_code', sql.NVarChar(10), region_code)
          .input('manager_email', sql.NVarChar(200), manager_email)
          .input('active', sql.Bit, active)
          .query(`
            MERGE dbo.store_master AS t
            USING (SELECT @store_id AS sid) AS s
            ON t.store_id = s.sid
            WHEN MATCHED THEN
              UPDATE SET 
                store_code = @store_code,
                store_name = @store_name,
                banner = @banner,
                region = @region,
                region_code = @region_code,
                manager_email = @manager_email,
                active = @active,
                updated_at = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
              INSERT (store_id, store_code, store_name, banner, region, region_code, manager_email, active)
              VALUES (@store_id, @store_code, @store_name, @banner, @region, @region_code, @manager_email, @active);
          `);
        
        console.log(`   ✓ ${store_id} - ${store_name} (${region_code})`);
        count++;
      }
      
      console.log(`\n✅ Seeded ${count} stores from CSV`);
      
    } catch (e) {
      console.error('❌ Error reading/parsing CSV:', e.message);
      process.exit(1);
    }
    
    await pool.close();
    process.exit(0);
    
  } catch (e) {
    console.error('❌ Database error:', e.message);
    process.exit(1);
  }
}

seedStores();

