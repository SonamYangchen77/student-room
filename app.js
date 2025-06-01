require('dotenv').config();
const pool = require('./config/db'); 
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roomRoutes = require('./routes/roomRoutes');
const reportRoutes = require('./routes/reportRoutes');
const studentController = require('./controllers/studentController');
const applicationRoutes = require('./routes/applicationRoutes');
const dashboardController = require('./controllers/dashboardController');
const authController = require('./controllers/authController');



const app = express();

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 }
}));

// Routes
app.use('/auth', authRoutes);
app.use('/', availabilityRoutes);
app.use('/', adminRoutes);
app.use('/', studentRoutes); 
app.use('/', roomRoutes);
app.use('/', reportRoutes);
app.use('/api/hostels', require('./routes/hostelRoutes'));
app.use('/', applicationRoutes);
// Views
app.get('/dashboard', dashboardController.renderDashboard);
app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/home');
  res.render('landing', { error: null, success: null });
});

app.get('/dashboard', (req, res) => {
  if (!req.session.admin) return res.redirect('/');
  res.render('dashboard', { currentPage: 'dashboard' });
});

// other requires, middleware, routes above...

app.get('/home', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = userResult.rows[0].count;

    const hostelResult = await pool.query('SELECT COUNT(*) FROM hostels');
    const totalHostels = hostelResult.rows[0].count;

    res.render('home', {
      totalUsers,
      totalHostels,
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).send('Server error');
  }
});

// other routes or middleware below...

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Logout error:', err);
      return res.redirect('/home');
    }
    res.clearCookie('userEmail');
    res.redirect('/');
  });
});

app.get('/availability', (req, res) => {
  res.render('availability');
});
app.get('/student-management', studentController.getStudentManagementPage); // ✅ Uses controller
app.get('/manage-room', async (req, res) => {
  // Fetch hostels to populate dropdown
  const hostelsResult = await pool.query('SELECT id, name FROM hostels ORDER BY name');
  res.render('manage-room', { hostels: hostelsResult.rows });
});
//app.get('/verify', (req, res) => res.send('Verify route works!'));
app.get('/verify', authController.verifyEmail);
app.get('/reset-password', (req, res) => {
  res.redirect(`/auth/reset-password?token=${req.query.token || ''}`);
});
// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('landing', {
    error: 'Unexpected server error. Please try again later.',
    success: null
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
