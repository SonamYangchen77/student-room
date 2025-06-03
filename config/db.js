const { Pool } = require('pg');

console.log('Connected to:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function ensureUsersTable() {
  // Step 1: Create table if not exists (without the new columns)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  // Step 2: Ensure 'is_verified' column exists
  const isVerifiedCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_verified';
  `);
  if (isVerifiedCheck.rows.length === 0) {
    console.log("🔧 Adding missing 'is_verified' column...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    `);
  }

  // Step 3: Ensure 'verification_token' column exists
  const verificationTokenCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verification_token';
  `);
  if (verificationTokenCheck.rows.length === 0) {
    console.log("🔧 Adding missing 'verification_token' column...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
    `);
  }

  console.log("✅ Ensured users table, is_verified, and verification_token columns exist");
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  ensureUsersTable,
  pool,
};
