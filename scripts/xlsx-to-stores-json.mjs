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
    
    console.log(`📊 Found sheet: ${wsname}`);

    // Get all cell values from column A
    const cells = [];
    for (let i = 1; i <= 200; i++) {
      const cell = ws[`A${i}`];
      if (cell && cell.v) {
        cells.push(cell.v);
      }
    }

    console.log(`📊 Found ${cells.length} cells with data`);

    if (cells.length === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
    }

    // Process the data - looking for store entries
    const stores = [];
    
    for (const cellValue of cells) {
      const str = String(cellValue).trim();
      
      // Skip header rows and empty cells
      if (!str || str.toLowerCase().includes('xstore') || str.toLowerCase().includes('store')) {
        continue;
      }
      
      // Parse format like "1103-TWL Westcity" or "1103 TWL Westcity"
      const match = str.match(/^(\d+)[\s-]+(TWL|Noel)?[\s-]*(.+)$/i);
      
      if (match) {
        const storeCode = match[1];
        const banner = match[2] || 'TWL';
        const storeName = match[3].trim();
        
        // Infer region from store name (basic heuristics)
        let region = 'Auckland';
        let regionCode = 'AKL';
        
        if (storeName.toLowerCase().includes('christchurch') || 
            storeName.toLowerCase().includes('riccarton') ||
            storeName.toLowerCase().includes('ashburton') ||
            storeName.toLowerCase().includes('timaru')) {
          region = 'Canterbury - Westcoast';
          regionCode = 'CAN-WTC';
        } else if (storeName.toLowerCase().includes('wellington') ||
                   storeName.toLowerCase().includes('lower hutt') ||
                   storeName.toLowerCase().includes('porirua') ||
                   storeName.toLowerCase().includes('johnsonville')) {
          region = 'Wellington - Wairarapa';
          regionCode = 'WGN-WPA';
        } else if (storeName.toLowerCase().includes('tauranga') ||
                   storeName.toLowerCase().includes('rotorua') ||
                   storeName.toLowerCase().includes('papamoa') ||
                   storeName.toLowerCase().includes('mount maunganui')) {
          region = 'Bay of Plenty';
          regionCode = 'BOP';
        }
        
        stores.push({
          store_code: storeCode,
          store_name: storeName,
          banner: banner,
          region: region,
          region_code: regionCode,
          manager_email: inferEmail(storeName),
          active: true
        });
      }
    }

    console.log(`✅ Processed ${stores.length} valid stores`);

    if (stores.length === 0) {
      console.error('❌ No valid stores found in Excel file');
      process.exit(1);
    }

    // Write output
    await fs.writeFile(OUTPUT, JSON.stringify(stores, null, 2));
    console.log(`📝 Wrote ${stores.length} stores to ${OUTPUT}`);

    // Show summary
    const regions = [...new Set(stores.map(s => s.region_code).filter(Boolean))];
    const banners = [...new Set(stores.map(s => s.banner).filter(Boolean))];
    
    console.log('\n📊 Summary:');
    console.log(`   Total stores: ${stores.length}`);
    console.log(`   Regions: ${regions.join(', ')}`);
    console.log(`   Banners: ${banners.join(', ')}`);
    console.log(`   Active stores: ${stores.filter(s => s.active).length}`);

    // Show first few stores as examples
    console.log('\n📋 First 5 stores:');
    stores.slice(0, 5).forEach(store => {
      console.log(`   ${store.store_code}: ${store.store_name} (${store.region_code})`);
    });

  } catch (error) {
    console.error('❌ Excel conversion failed:', error.message);
    process.exit(1);
  }
})();