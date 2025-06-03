const { pool } = require('../config/db');

const Room = {
  deleteRoom: async (roomName, hostelName) => {
    const query = `
      DELETE FROM rooms
      WHERE room_name = $1 AND hostel_name = $2
      RETURNING *;
    `;
    const values = [roomName, hostelName];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

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

module.exports = Room;
