const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or other SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send verification email
function sendVerificationEmail(to, token) {
  const verifyUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify?token=${token}`;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verify your email',
    html: `<p>Click to verify your account: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

// Send password reset email
async function sendResetPasswordEmail(email, token) {
  const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;

  const message = `
    <p>You requested a password reset</p>
    <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
    <p>If you did not request this, ignore this email.</p>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset',
    html: message,
  });
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
