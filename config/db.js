// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function ensureUsersTable() {
  // Create users table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  // Check and add is_verified column if missing
  const result = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_verified';
  `);

  if (result.rows.length === 0) {
    console.log("🔧 Adding missing 'is_verified' column...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    `);
  }

  console.log("✅ Ensured users table and is_verified column exist");
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  ensureUsersTable,
  pool,
};
