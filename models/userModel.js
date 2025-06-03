const pool = require('../config/db');  // Your PostgreSQL connection pool
const bcrypt = require('bcrypt');

const createUsersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log('✅ users table created');
    process.exit();
  } catch (err) {
    console.error('❌ Error creating users table:', err);
    process.exit(1);
  }
};

createUsersTable();


exports.createUser = async (name, email, password) => {
  // Hash the plain text password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user details into the users table
  const result = await pool.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
    [name, email, hashedPassword]
  );

  // Return the newly created user record
  return result.rows[0];
};

exports.findUserByEmail = async (email) => {
  // Find a user by email address
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  // Return the user record, or undefined if not found
  return result.rows[0];
};
