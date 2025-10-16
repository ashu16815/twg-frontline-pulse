import fs from 'fs/promises';
import path from 'path';
import xlsx from 'xlsx';

const INPUT = 'data/List of Stores.xlsx';
const OUTPUT = 'data/stores_master.json';

function slugifyName(n) { 
  return String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/^\d+/, ''); 
}

function inferEmail(name) { 
  const s = slugifyName(name); 
  if (!s) return null; 
  return `${s}.manager@twgroup.co.nz`; 
}

function normBool(v) { 
  if (typeof v === 'boolean') return v; 
  const s = String(v || '').trim().toLowerCase(); 
  return ['1', 'true', 'yes', 'y'].includes(s); 
}

function trim(v) { 
  return (v === undefined || v === null) ? null : String(v).trim(); 
}

(async () => {
  try {
    console.log('🔄 Reading Excel file:', INPUT);
    
    // Check if input file exists
    try {
      await fs.access(INPUT);
    } catch (error) {
      console.error(`❌ Excel file not found: ${INPUT}`);
      console.log('📋 Please place your Excel file at:', path.resolve(INPUT));
      console.log('📋 Expected format: Excel file with store data');
      process.exit(1);
    }

    const buf = await fs.readFile(INPUT);
    const wb = xlsx.read(buf, { type: 'buffer' });
    
    // Try to find a sheet with "store" in the name, or use the first sheet
    const wsname = wb.SheetNames.find(n => /store/i.test(n)) || wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: null });

    console.log(`📊 Found ${rows.length} rows in sheet: ${wsname}`);

    if (rows.length === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
    }

    // Heuristics for column name mapping
    const map = {
      code: ['store_code', 'code', 'store id', 'storeid', 'store code', 'store#', 'store_code'],
      name: ['store_name', 'name', 'store', 'storename', 'store name'],
      banner: ['banner', 'brand'],
      region: ['region', 'region_name', 'region name'],
      region_code: ['region_code', 'region code', 'region id', 'regionid', 'region_code'],
      email: ['manager_email', 'email', 'manager email', 'store_email', 'store email'],
      active: ['active', 'is_active', 'status']
    };

    // Find column mappings
    const cols = Object.fromEntries(Object.entries(map).map(([key, alts]) => {
      const found = Object.keys(rows[0] || {}).find(h => alts.includes(String(h).toLowerCase()));
      return [key, found];
    }));

    console.log('🔍 Column mappings found:');
    Object.entries(cols).forEach(([key, col]) => {
      console.log(`   ${key}: ${col || 'NOT FOUND'}`);
    });

    // Process rows
    const out = rows.map(r => {
      const store_code = trim(r[cols.code]);
      const store_name = trim(r[cols.name]);
      const banner = trim(r[cols.banner]) || 'TWL'; // Default to TWL if not specified
      const region = trim(r[cols.region]);
      const region_code = trim(r[cols.region_code]) || (region ? region.slice(0, 3).toUpperCase() : null);
      const manager_email = trim(r[cols.email]) || inferEmail(store_name);
      const active = cols.active ? normBool(r[cols.active]) : true;

      return {
        store_code: String(store_code || '').trim(),
        store_name,
        banner,
        region,
        region_code,
        manager_email,
        active
      };
    })
    .filter(r => r.store_code && r.store_name);

    console.log(`✅ Processed ${out.length} valid stores`);

    // Write output
    await fs.writeFile(OUTPUT, JSON.stringify(out, null, 2));
    console.log(`📝 Wrote ${out.length} stores to ${OUTPUT}`);

    // Show summary
    const regions = [...new Set(out.map(s => s.region_code).filter(Boolean))];
    const banners = [...new Set(out.map(s => s.banner).filter(Boolean))];
    
    console.log('\n📊 Summary:');
    console.log(`   Total stores: ${out.length}`);
    console.log(`   Regions: ${regions.join(', ')}`);
    console.log(`   Banners: ${banners.join(', ')}`);
    console.log(`   Active stores: ${out.filter(s => s.active).length}`);

  } catch (error) {
    console.error('❌ Excel conversion failed:', error.message);
    process.exit(1);
  }
})();
