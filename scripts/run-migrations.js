#!/usr/bin/env node

/**
 * Run Supabase migrations directly on the remote database
 * This script reads migration files from supabase/migrations and executes them
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}

// We'll use the anon key if service key is not available
// Note: This may have limitations for certain operations
const supabaseKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: No Supabase key found. Please set either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, supabaseKey);

async function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort by filename to ensure correct order
    
    return sqlFiles.map(file => ({
      name: file,
      path: path.join(migrationsDir, file)
    }));
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    return [];
  }
}

async function runMigration(migration) {
  console.log(`\nRunning migration: ${migration.name}`);
  console.log('━'.repeat(50));
  
  try {
    const sql = await fs.readFile(migration.path, 'utf8');
    
    // Split by semicolon to handle multiple statements
    // Filter out empty statements and comments
    const statements = sql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/) // Split by semicolon not inside quotes
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing statement: ${statement.substring(0, 50)}...`);
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).single();
        
        if (error) {
          // If RPC doesn't exist, try alternative approach
          if (error.message?.includes('exec_sql')) {
            console.log('Note: Direct SQL execution not available. This migration needs to be run manually in Supabase dashboard.');
            console.log('SQL to execute:');
            console.log(statement);
            console.log('\n');
          } else {
            throw error;
          }
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log(`✓ Migration ${migration.name} completed`);
    return true;
  } catch (error) {
    console.error(`✗ Error running migration ${migration.name}:`, error.message);
    return false;
  }
}

async function checkMigrationTable() {
  console.log('Checking for existing tables...');
  
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  if (error && error.message.includes('relation "public.users" does not exist')) {
    console.log('Database appears to be empty. Ready to run migrations.');
    return false;
  } else if (error) {
    console.log('Warning: Could not check database state:', error.message);
    return false;
  } else {
    console.log('Warning: Database may already contain tables. Proceed with caution.');
    return true;
  }
}

async function main() {
  console.log('═'.repeat(50));
  console.log('Supabase Migration Runner');
  console.log('═'.repeat(50));
  console.log(`Database: ${SUPABASE_URL}`);
  console.log(`Using key type: ${SUPABASE_SERVICE_KEY ? 'Service Role' : 'Anonymous'}`);
  
  // Check if tables already exist
  const hasExistingTables = await checkMigrationTable();
  
  if (hasExistingTables) {
    console.log('\n⚠️  WARNING: Database may already contain tables.');
    console.log('Running migrations on an existing database may cause errors.');
    console.log('Consider backing up your database before proceeding.\n');
  }
  
  // Get migration files
  const migrations = await getMigrationFiles();
  
  if (migrations.length === 0) {
    console.log('No migration files found.');
    return;
  }
  
  console.log(`\nFound ${migrations.length} migration(s):`);
  migrations.forEach(m => console.log(`  - ${m.name}`));
  
  // Since we can't execute SQL directly without service role key,
  // we'll output the SQL for manual execution
  if (!SUPABASE_SERVICE_KEY) {
    console.log('\n' + '⚠️'.repeat(25));
    console.log('\n⚠️  IMPORTANT: Service role key not found.');
    console.log('⚠️  You need to run these migrations manually in the Supabase dashboard.');
    console.log('⚠️  Go to: https://app.supabase.com/project/qzcjbmsrroolbkxodgbo/editor');
    console.log('\n' + '⚠️'.repeat(25));
    
    console.log('\n\nCopy and paste the following SQL into the SQL Editor:\n');
    console.log('═'.repeat(50));
    
    for (const migration of migrations) {
      const sql = await fs.readFile(migration.path, 'utf8');
      console.log(`\n-- Migration: ${migration.name}`);
      console.log('-- ' + '-'.repeat(47));
      console.log(sql);
      console.log('\n');
    }
    
    console.log('═'.repeat(50));
    console.log('\nAfter running the migrations, you can verify the tables were created');
    console.log('by checking the Table Editor in your Supabase dashboard.');
    
  } else {
    console.log('\n⚠️  Note: Direct SQL execution requires database permissions.');
    console.log('If migrations fail, you may need to run them manually in Supabase dashboard.\n');
    
    // Attempt to run migrations
    let successCount = 0;
    for (const migration of migrations) {
      const success = await runMigration(migration);
      if (success) successCount++;
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log(`Completed: ${successCount}/${migrations.length} migrations`);
    
    if (successCount < migrations.length) {
      console.log('\nSome migrations failed. Please check the Supabase dashboard');
      console.log('and run any failed migrations manually.');
    }
  }
}

// Run the script
main().catch(console.error);