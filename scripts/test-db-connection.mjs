#!/usr/bin/env node

import 'dotenv/config';
import sql from 'mssql';

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ AZURE_SQL_CONNECTION_STRING environment variable is not set');
  process.exit(1);
}

console.log('🔗 Testing Azure SQL Database connection...');
console.log('📋 Connection string preview:', connectionString.substring(0, 50) + '...');

async function testConnection() {
  try {
    console.log('⏳ Attempting to connect...');
    
    // Parse connection string to show what we're connecting to
    const config: any = {};
    const pairs = connectionString.split(';');
    
    for (const pair of pairs) {
      if (pair.trim()) {
        const [key, value] = pair.split('=');
        if (key && value) {
          const cleanKey = key.trim().toLowerCase();
          const cleanValue = value.trim();
          
          switch (cleanKey) {
            case 'server':
              config.server = cleanValue;
              break;
            case 'database':
              config.database = cleanValue;
              break;
            case 'user id':
            case 'userid':
              config.user = cleanValue;
              break;
            case 'password':
              config.password = cleanValue;
              break;
            case 'encrypt':
              config.encrypt = cleanValue.toLowerCase() === 'true';
              break;
            case 'trustservercertificate':
              config.trustServerCertificate = cleanValue.toLowerCase() === 'true';
              break;
            case 'connection timeout':
              config.connectionTimeout = parseInt(cleanValue) || 30;
              break;
          }
        }
      }
    }
    
    console.log('🔍 Parsed connection config:');
    console.log('   Server:', config.server);
    console.log('   Database:', config.database);
    console.log('   User:', config.user);
    console.log('   Has Password:', !!config.password);
    console.log('   Encrypt:', config.encrypt);
    console.log('   Trust Server Certificate:', config.trustServerCertificate);
    console.log('   Connection Timeout:', config.connectionTimeout);
    
    // Test connection
    const pool = await sql.connect(connectionString);
    console.log('✅ Connected successfully!');
    
    // Test a simple query
    console.log('🔍 Testing basic query...');
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('✅ Query successful!');
    console.log('📊 SQL Server version:', result.recordset[0].version.substring(0, 50) + '...');
    
    // Test table existence
    console.log('🔍 Checking for required tables...');
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    const tables = tablesResult.recordset.map((r: any) => r.TABLE_NAME);
    console.log('📋 Found tables:', tables);
    
    // Check for specific tables we need
    const requiredTables = ['app_users', 'store_master', 'store_feedback'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing required tables:', missingTables);
    } else {
      console.log('✅ All required tables found!');
    }
    
    await pool.close();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName,
      procName: error.procName,
      lineNumber: error.lineNumber
    });
    
    if (error.message.includes('firewall')) {
      console.log('\n💡 FIREWALL ISSUE DETECTED:');
      console.log('   Your IP address is not allowed to access the Azure SQL server.');
      console.log('   Please add your IP to the Azure SQL firewall rules.');
      console.log('   Go to: Azure Portal → SQL Databases → redpulse → Networking');
    }
    
    if (error.message.includes('login')) {
      console.log('\n💡 AUTHENTICATION ISSUE DETECTED:');
      console.log('   Check your username and password in the connection string.');
    }
    
    if (error.message.includes('database')) {
      console.log('\n💡 DATABASE ISSUE DETECTED:');
      console.log('   Check if the database name is correct and exists.');
    }
    
    process.exit(1);
  }
}

testConnection();
