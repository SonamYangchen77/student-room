const pool = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');
require('dotenv').config();

// SIGNUP CONTROLLER WITH EMAIL VERIFICATION
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Prevent registering with admin credentials
    if (email.trim() === process.env.ADMIN_EMAIL?.trim()) {
      return res.status(403).json({ error: 'This email is reserved and cannot be used.' });
    }

    // Check if user already exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');

    // Insert user with verification token and unverified status
    await pool.query(
      'INSERT INTO users (name, email, password, is_verified, verification_token) VALUES ($1, $2, $3, false, $4)',
      [name, email, hashedPassword, token]
    );

    // Send verification email
    await sendVerificationEmail(email, token);

    return res.status(200).json({ success: 'Signup successful! Check your email for verification.' });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Server error during signup. Try again.' });
  }
};

// EMAIL VERIFICATION CONTROLLER
const verifyEmail = async (req, res) => {
  const token = req.query.token;

  if (!token) return res.status(400).send('Invalid verification link.');

  try {
    const result = await pool.query(
      'UPDATE users SET is_verified = true, verification_token = null WHERE verification_token = $1 RETURNING *',
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).send('Verification token expired or invalid.');
    }

    // Render a success page or redirect with message
    return res.render('verify-success', {
      message: 'Email verified successfully! You can now log in.',
      loginUrl: '/landing' // Adjust this route if needed
    });

  } catch (err) {
    console.error('Email verification error:', err.message);
    return res.status(500).send('Server error during email verification.');
  }
};

// LOGIN CONTROLLER
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin login check
    if (
      email.trim() === process.env.ADMIN_EMAIL?.trim() &&
      password.trim() === process.env.ADMIN_PASSWORD?.trim()
    ) {
      req.session.admin = true;
      res.cookie('userEmail', email, { httpOnly: true, maxAge: 86400000 });
      return res.status(200).json({ success: true, redirect: '/dashboard' });
    }

    // User login check
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    res.cookie('userEmail', user.email, { httpOnly: true, maxAge: 86400000 });
    return res.status(200).json({ success: true, redirect: '/home' });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

// LOGOUT CONTROLLER
const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('userEmail');
    res.redirect('/');
  });
};

// FORGOT PASSWORD CONTROLLER
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // For security, always respond the same
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour expiry

    // Store token and expiry in DB
    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
      [token, expires, email]
    );

    // Send reset password email
    await sendResetPasswordEmail(email, token);

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// RESET PASSWORD CONTROLLER
const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  if (!password || !confirmPassword) {
    return res.status(400).json({ error: 'Please fill in all fields' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE password_reset_token = $2',
      [hashedPassword, token]
    );

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
