import 'dotenv/config';
import sql from 'mssql';
import fs from 'fs/promises';

async function runMigration() {
  try {
    console.log('🚀 Starting Store Master Migration (Path B)...');
    
    const pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);
    console.log('✅ Connected to database');
    
    // 0) Ensure maintenance table exists
    console.log('📋 Setting up maintenance table...');
    await pool.request().batch(await fs.readFile('db/maintenance-flag.sql', 'utf8'));
    console.log('✅ Maintenance table ready');
    
    // 1) Load staging from embedded JSON
    console.log('📊 Loading stores from JSON...');
    const { execSync } = await import('child_process');
    execSync('node scripts/load-stores-from-json.mjs', { stdio: 'inherit' });
    console.log('✅ JSON data loaded to staging');
    
    // 2) Execute main Path B script up to remap
    console.log('🔄 Executing main migration script...');
    await pool.request().batch(await fs.readFile('db/pathB-reload.sql', 'utf8'));
    console.log('✅ Store master replaced and mapped');
    
    // 3) Remap children from config (in their own short transactions)
    console.log('🔗 Remapping child tables...');
    const config = JSON.parse(await fs.readFile('migration/store-child-tables.json', 'utf8'));
    
    for (const child of config.children) {
      const table = child.table;
      const column = child.column;
      
      console.log(`   📝 Remapping ${table}.${column}...`);
      
      const sqlText = `
        BEGIN TRAN;
        UPDATE T SET ${column} = M.new_store_id
        FROM ${table} T
        JOIN dbo.store_id_map M ON T.${column} = M.old_store_id
        WHERE M.new_store_id IS NOT NULL;
        COMMIT;
      `;
      
      const result = await pool.request().batch(sqlText);
      console.log(`   ✅ Remapped: ${table}.${column}`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Show summary
    const summary = await pool.request().query`
      SELECT 
        (SELECT COUNT(*) FROM dbo.store_master) as new_count,
        (SELECT COUNT(*) FROM dbo.store_master_prev) as old_count,
        (SELECT COUNT(*) FROM dbo.store_id_map WHERE new_store_id IS NOT NULL) as mapped_count
    `;
    
    const stats = summary.recordset[0];
    console.log('\n📊 Migration Summary:');
    console.log(`   New stores: ${stats.new_count}`);
    console.log(`   Old stores: ${stats.old_count}`);
    console.log(`   Mapped stores: ${stats.mapped_count}`);
    
    await pool.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
