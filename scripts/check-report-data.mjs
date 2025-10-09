import dotenv from 'dotenv';
import sql from 'mssql';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);

console.log('📊 Checking Executive Report Data...\n');

try {
  const result = await pool.request().query(`
    SELECT TOP 1 
      iso_week,
      LEN(narrative) as narrative_length,
      LEN(highlights) as highlights_length,
      LEN(whatWorking) as whatWorking_length,
      LEN(whatNotWorking) as whatNotWorking_length,
      LEN(themes) as themes_length,
      LEN(risks) as risks_length,
      LEN(actions) as actions_length,
      LEN(metrics) as metrics_length,
      created_at,
      narrative,
      highlights,
      whatWorking,
      whatNotWorking,
      themes,
      risks,
      actions,
      metrics
    FROM dbo.executive_report 
    ORDER BY created_at DESC
  `);

  if (result.recordset.length === 0) {
    console.log('❌ No executive reports found in database');
    process.exit(1);
  }

  const report = result.recordset[0];
  
  console.log(`Week: ${report.iso_week}`);
  console.log(`Created: ${report.created_at}`);
  console.log('\nField Lengths:');
  console.log(`  narrative: ${report.narrative_length} chars`);
  console.log(`  highlights: ${report.highlights_length} chars`);
  console.log(`  whatWorking: ${report.whatWorking_length} chars`);
  console.log(`  whatNotWorking: ${report.whatNotWorking_length} chars`);
  console.log(`  themes: ${report.themes_length} chars`);
  console.log(`  risks: ${report.risks_length} chars`);
  console.log(`  actions: ${report.actions_length} chars`);
  console.log(`  metrics: ${report.metrics_length} chars`);
  
  console.log('\nActual Content:');
  console.log('\nNarrative:');
  console.log(report.narrative || '(empty)');
  
  console.log('\nWhat Working:');
  console.log(report.whatWorking || '(empty)');
  
  console.log('\nWhat NOT Working:');
  console.log(report.whatNotWorking || '(empty)');
  
  console.log('\nThemes:');
  console.log(report.themes || '(empty)');
  
  console.log('\nRisks:');
  console.log(report.risks || '(empty)');
  
  console.log('\nActions:');
  console.log(report.actions || '(empty)');
  
  console.log('\nMetrics:');
  console.log(report.metrics || '(empty)');
  
  process.exit(0);
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}

