#!/usr/bin/env node

/**
 * Apply Azure SQL Schema
 * Creates/updates tables from db/schema-azure.sql
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

console.log('📋 Applying Azure SQL Schema...\n');

async function applySchema() {
  try {
    const schemaPath = path.resolve(__dirname, '../db/schema-azure.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    const pool = await sql.connect(connectionString);
    
    console.log('Executing schema...');
    await pool.request().batch(schema);
    
    console.log('✅ Azure SQL schema applied successfully');
    
    await pool.close();
    process.exit(0);
    
  } catch (e) {
    console.error('❌ Schema apply error:', e.message);
    process.exit(1);
  }
}

applySchema();

