/**
 * Database Initialization Script
 * Creates all tables, indexes, and views from the schema
 */

import * as fs from 'fs';
import * as path from 'path';
import { query, closePool, healthCheck } from './db';

async function initializeDatabase(): Promise<void> {
    console.log('🚀 Starting database initialization...\n');

    // Check connection
    console.log('📡 Checking database connection...');
    const isHealthy = await healthCheck();
    if (!isHealthy) {
        throw new Error('Failed to connect to database. Check your .env configuration.');
    }
    console.log('✅ Database connection successful\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    console.log(`📄 Reading schema from: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('✅ Schema file loaded\n');

    // Execute schema
    console.log('🔨 Executing schema...');
    try {
        await query(schema);
        console.log('✅ Schema executed successfully\n');
    } catch (error) {
        // If tables already exist, that's okay
        if (error instanceof Error && error.message.includes('already exists')) {
            console.log('ℹ️  Some objects already exist (this is normal for re-runs)\n');
        } else {
            throw error;
        }
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tables = await query<{ tablename: string }>(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

    console.log('📋 Created tables:');
    tables.rows.forEach((row) => {
        console.log(`   - ${row.tablename}`);
    });

    // Verify views
    console.log('\n🔍 Verifying views...');
    const views = await query<{ viewname: string }>(`
    SELECT viewname 
    FROM pg_views 
    WHERE schemaname = 'public'
    ORDER BY viewname
  `);

    console.log('📋 Created views:');
    views.rows.forEach((row) => {
        console.log(`   - ${row.viewname}`);
    });

    console.log('\n✨ Database initialization complete!');
}

// Run initialization
initializeDatabase()
    .then(() => {
        console.log('\n👋 Closing connection...');
        return closePool();
    })
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Initialization failed:', error.message);
        closePool().then(() => process.exit(1));
    });
