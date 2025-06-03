const pool = require('../config/db');  // Your PostgreSQL connection pool
const bcrypt = require('bcrypt');

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
