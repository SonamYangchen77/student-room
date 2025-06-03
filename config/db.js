const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hostelhub',
  password: 'yangchen',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
