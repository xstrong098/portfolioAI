const db = require('../config/db');
const bcrypt = require('bcryptjs');

/* modello utente - gestisce tutte le query sul db relative agli utenti */
class User {
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /* controlla se esiste già un utente con quella email o username */
  static async existsByEmailOrUsername(email, username) {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    return rows.length > 0;
  }

  static async create({ username, email, password, full_name }) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashed, full_name]
    );
    return result.insertId;
  }

  /* ritorna tutti gli utenti con il conteggio delle loro opere */
  static async getAll() {
    const [rows] = await db.query(`
      SELECT u.*, COUNT(w.id) as work_count
      FROM users u
      LEFT JOIN works w ON u.id = w.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return rows;
  }

  static async getRecent(limit = 5) {
    const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT ?', [limit]);
    return rows;
  }

  static async toggleActive(id) {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id = ? AND role != "admin"', [id]);
  }

  static async updateRole(id, role) {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  }

  static async count() {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM users');
    return total;
  }

  static async verifyPassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}

module.exports = User;
