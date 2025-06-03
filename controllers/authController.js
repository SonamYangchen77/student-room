const pool = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');
require('dotenv').config();

// SIGNUP CONTROLLER WITH EXPIRY
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (email.trim() === process.env.ADMIN_EMAIL?.trim()) {
      return res.status(403).json({ error: 'This email is reserved and cannot be used.' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

    await pool.query(
      'INSERT INTO users (name, email, password, is_verified, verification_token, verification_token_expires) VALUES ($1, $2, $3, false, $4, $5)',
      [name, email, hashedPassword, token, expires]
    );

    const verificationLink = `${process.env.BASE_URL}/verify?token=${token}`;
    await sendVerificationEmail(email, verificationLink);

    return res.status(200).json({ success: 'Signup successful! Check your email for verification.' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during signup. Try again.' });
  }
};

// VERIFY EMAIL CONTROLLER
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).send('Invalid verification link.');

  try {
    const result = await pool.query(
      'SELECT id, verification_token_expires, is_verified FROM users WHERE verification_token = $1',
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).send('Verification token expired or invalid.');
    }

    if (user.is_verified) {
      return res.render('verify-success', {
        message: 'Email already verified. You can log in now.',
        loginUrl: '/landing'
      });
    }

    const now = new Date();
    if (user.verification_token_expires && now > user.verification_token_expires) {
      return res.status(400).send('Verification token expired. Please sign up again.');
    }

    await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
      [user.id]
    );

    return res.render('verify-success', {
      message: 'Email verified successfully! You can now log in.',
      loginUrl: '/landing'
    });
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).send('Server error during email verification.');
  }
};

// LOGIN CONTROLLER
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables');
    }

    if (
      email.trim() === adminEmail &&
      password.trim() === adminPassword
    ) {
      req.session.admin = true;
      res.cookie('userEmail', email, { httpOnly: true, maxAge: 86400000 });
      return res.status(200).json({ success: true, redirect: '/dashboard' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

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
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Unexpected server error. Please try again later.' });
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
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
      [token, expires, email]
    );

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;
    await sendResetPasswordEmail(email, resetLink);

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// RESET PASSWORD CONTROLLER
const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token) return res.status(400).json({ error: 'Token is required' });
  if (!password || !confirmPassword) return res.status(400).json({ error: 'Please fill in all fields' });
  if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });

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
