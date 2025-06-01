const pool = require('../config/db');

const Application = {
  createApplication: async (applicationData) => {
    const {
      room_name,
      hostel_name,
      applicant_name,
      student_id,
      email,
      contact_number,
      reason
    } = applicationData;

    const query = `
      INSERT INTO applications (
        room_name, hostel_name, applicant_name,
        student_id, email, contact_number, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      room_name,
      hostel_name,
      applicant_name,
      student_id,
      email,
      contact_number,
      reason
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  getAllApplications: async () => {
    const result = await pool.query(`
      SELECT id, room_name, hostel_name, applicant_name,
             student_id, email, contact_number, reason,
             status, created_at
      FROM applications
      ORDER BY created_at DESC;
    `);
    return result.rows;
  },

  updateStatus: async (applicationId, status) => {
    const query = `
      UPDATE applications
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const values = [status, applicationId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
};
const Room = {
  setRoomAvailability: async (roomName, isAvailable) => {
    const query = `
      UPDATE rooms
      SET is_available = $1
      WHERE room_name = $2
      RETURNING *;
    `;
    const values = [isAvailable, roomName];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
};

module.exports = { Application, Room };

module.exports = Application;
