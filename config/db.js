const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // from Render
  ssl: { rejectUnauthorized: false } // needed for Render PostgreSQL
});

module.exports = pool;
