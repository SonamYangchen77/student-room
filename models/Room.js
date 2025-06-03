const db = require('../config/db'); // database pool

// Function to create rooms table if it doesn't exist
async function ensureRoomsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      room_name VARCHAR(100) NOT NULL,
      gender VARCHAR(10) NOT NULL,
      hostel_id INTEGER REFERENCES hostels(id),
      is_available BOOLEAN DEFAULT true
    );
  `);
  console.log('✅ Rooms table ensured');
}

// Room model with methods
const Room = {
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

module.exports = {
  ensureRoomsTable,
  Room,
};
