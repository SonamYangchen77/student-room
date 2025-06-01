const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.get('/logout', authController.logout);

// Email verification routes
router.get('/verify-email', authController.verifyEmail);
router.get('/verify', authController.verifyEmail); // optional alias

// Forgot and Reset Password
router.post('/forgot-password', authController.forgotPassword);
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null, success: null });
});
// GET /reset-password?token=abc123


router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.render('reset-password', {
      error: 'All fields are required.',
      success: null,
      token
    });
  }

  if (password !== confirmPassword) {
    return res.render('reset-password', {
      error: 'Passwords do not match.',
      success: null,
      token
    });
  }

  try {
    // TODO: Validate token and update password in DB
    return res.render('reset-password', {
      error: null,
      success: 'Password has been reset successfully!',
      token: null
    });
  } catch (err) {
    console.error(err);
    return res.render('reset-password', {
      error: 'Failed to reset password. Try again.',
      success: null,
      token
    });
  }
});
router.get('/reset-password', (req, res) => {
  const token = req.query.token;

  res.render('reset-password', {
    error: null,
    success: null,
    token: token || ''
  });
});

module.exports = router;
