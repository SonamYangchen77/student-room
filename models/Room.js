const db = require('../config/db');

const Room = {
  // Existing methods

  async getAvailableRooms() {
    const query = `
      SELECT rooms.*, hostels.name AS hostel_name
      FROM rooms
      JOIN hostels ON rooms.hostel_id = hostels.id
      WHERE rooms.is_available = TRUE
      ORDER BY rooms.id;
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async getRoomsFromDB(search) {
    const values = [];
    let idx = 1;

    let query = `
      SELECT rooms.*, hostels.name AS hostel_name
      FROM rooms
      JOIN hostels ON rooms.hostel_id = hostels.id
      WHERE 1=1
    `;

    if (search.gender) {
      query += ` AND rooms.gender = $${idx++}`;
      values.push(search.gender);
    }

    if (search.hostelPreference) {
      query += ` AND hostels.name = $${idx++}`;
      values.push(search.hostelPreference);
    }

    if (search.roomNumber) {
      query += ` AND rooms.room_name = $${idx++}`;
      values.push(search.roomNumber);
    }

    query += ` ORDER BY rooms.id;`;

    const { rows } = await db.query(query, values);
    return rows;
  },

  // New method to delete a room by room_name and hostel_name
  async deleteRoom(room_name, hostel_name) {
    const query = `
      DELETE FROM rooms
      USING hostels
      WHERE rooms.hostel_id = hostels.id
        AND rooms.room_name = $1
        AND hostels.name = $2
    `;
    await db.query(query, [room_name, hostel_name]);
  },
};

module.exports = Room;
