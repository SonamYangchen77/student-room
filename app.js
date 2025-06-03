require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const pool = require('./config/db'); // ✅ using only one pool from db.js

const authRoutes = require('./routes/authRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const roomRoutes = require('./routes/roomRoutes');
const reportRoutes = require('./routes/reportRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const studentController = require('./controllers/studentController');
const dashboardController = require('./controllers/dashboardController');
const authController = require('./controllers/authController');


const createUsersTableIfNotExists = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);
  console.log('✅ Ensured users table exists');
};

createUsersTableIfNotExists();

const app = express();

// ✅ Session setup using PostgreSQL store
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// ✅ EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// ✅ Routes
app.use('/auth', authRoutes);
app.use('/', availabilityRoutes);
app.use('/', adminRoutes);
app.use('/', studentRoutes);
app.use('/', roomRoutes);
app.use('/', reportRoutes);
app.use('/api/hostels', require('./routes/hostelRoutes'));
app.use('/', applicationRoutes);



// ✅ Views
app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/home');
  res.render('landing', { error: null, success: null });
});

app.get('/dashboard', (req, res) => {
  if (!req.session.admin) return res.redirect('/');
  res.render('dashboard', { currentPage: 'dashboard' });
});

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

app.get('/student-management', studentController.getStudentManagementPage);

app.get('/manage-room', async (req, res) => {
  try {
    const hostelsResult = await pool.query('SELECT id, name FROM hostels ORDER BY name');
    res.render('manage-room', { hostels: hostelsResult.rows });
  } catch (err) {
    console.error('Error fetching hostels:', err);
    res.status(500).send('Server error');
  }
});

app.get('/verify', authController.verifyEmail);

app.get('/reset-password', (req, res) => {
  res.redirect(`/auth/reset-password?token=${req.query.token || ''}`);
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('landing', {
    error: 'Unexpected server error. Please try again later.',
    success: null
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
