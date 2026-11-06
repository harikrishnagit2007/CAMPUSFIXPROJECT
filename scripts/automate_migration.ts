import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

/**
 * CampusFix Database Migration Runner
 * 
 * This script automates the verification and setup of the MySQL schema.
 * It performs the following:
 * 1. Establishes a secure connection to the database.
 * 2. Executes idenpotent SQL migrations (creates tables IF NOT EXISTS).
 * 3. Dynamically injects foreign key constraints if they are missing.
 * 4. Provides a detailed status report of the operation.
 */
async function runAutomatedMigration() {
  const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'campusfix_db',
    multipleStatements: true,
    connectTimeout: 10000
  };

  console.log('\n🚀 Starting Automated Database Migration...');
  console.log(`📡 Connecting to: ${dbConfig.host} | DB: ${dbConfig.database}`);

  let connection;

  try {
    // 1. Connection Phase
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection established successfully.');

    // 2. Read Migration Source
    const migrationFilePath = path.join(process.cwd(), 'scripts', 'mysql_migration.sql');
    if (!fs.existsSync(migrationFilePath)) {
      throw new Error(`Migration source file not found at: ${migrationFilePath}`);
    }
    const sqlScript = fs.readFileSync(migrationFilePath, 'utf8');

    // 3. Execution Phase
    console.log('📝 Executing schema verification and constraint injection...');
    await connection.query(sqlScript);

    // 4. Verification Phase (Self-Audit)
    console.log('\n📊 Migration Summary & Schema Status:');
    
    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableList = (tables as any[]).map(t => Object.values(t)[0]);
    
    const requiredTables = ['roles', 'user_accounts', 'complaints'];
    requiredTables.forEach(table => {
      const exists = tableList.includes(table);
      console.log(`   - Table [${table.padEnd(15)}]: ${exists ? '✅ OK' : '❌ MISSING'}`);
    });

    // Check constraints
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`, 
      [dbConfig.database]
    );
    const constraintList = (constraints as any[]).map(c => c.CONSTRAINT_NAME);
    
    const requiredFKs = ['fk_user_role', 'fk_complaint_student', 'fk_complaint_staff'];
    requiredFKs.forEach(fk => {
      const exists = constraintList.includes(fk);
      console.log(`   - Constraint [${fk.padEnd(15)}]: ${exists ? '✅ ACTIVE' : '❌ FAILED TO INJECT'}`);
    });

    console.log('\n✨ Database Migration Completed Successfully.\n');

  } catch (error: any) {
    console.error('\n❌ MIGRATION CRITICAL FAILURE:');
    console.error(`   Reason: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Hint: Ensure your MySQL server is running and accessible.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`   💡 Hint: The database "${dbConfig.database}" does not exist. Create it first.`);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Direct execution guard
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('automate_migration.ts')) {
  runAutomatedMigration();
}

export default runAutomatedMigration;
