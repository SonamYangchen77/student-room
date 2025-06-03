const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // this is what Render sets
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
