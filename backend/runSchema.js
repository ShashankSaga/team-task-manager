require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Railway / remote DBs
  });

  try {
    console.log('🔌 Connecting to database...');
    console.log('   Host:', new URL(process.env.DATABASE_URL).hostname);
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('📄 Running schema.sql...');
    await client.query(sql);
    console.log('✅ Schema applied successfully!\n');

    // Verify tables were created
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📋 Tables in database:');
    result.rows.forEach(row => console.log('   •', row.tablename));

  } catch (err) {
    console.error('\n❌ Error running schema:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

runSchema();
