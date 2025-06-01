const pool = require('./config/db');

const testInsert = async () => {
  try {
    const result = await pool.query(
      `INSERT INTO applications (
        room_name, hostel_name, applicant_name, student_id,
        email, contact_number, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      ['Test Room', 'Test Hostel', 'John Doe', 'STD123', 'john@example.com', '1234567890', 'Test reason']
    );
    console.log('✅ Inserted:', result.rows[0]);
  } catch (err) {
    console.error('❌ Insert Error:', err);
  } finally {
    pool.end();
  }
};

testInsert();
