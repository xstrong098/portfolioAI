const db = require('../config/db');

/* modello commento - gestisce le query sui commenti delle opere */
class Comment {
  static async getForWork(workId) {
    const [rows] = await db.query(`
      SELECT c.*, u.username, u.avatar, u.full_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.work_id = ?
      ORDER BY c.created_at DESC
    `, [workId]);
    return rows;
  }

  static async create({ workId, userId, content }) {
    await db.query(
      'INSERT INTO comments (work_id, user_id, content) VALUES (?, ?, ?)',
      [workId, userId, content]
    );
  }
}

module.exports = Comment;
