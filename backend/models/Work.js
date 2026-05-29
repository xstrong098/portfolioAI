const db = require('../config/db');

/* modello opera - gestisce tutte le query sul db relative alle opere */
class Work {
  static async findById(id) {
    const [rows] = await db.query(`
      SELECT w.*, u.username, u.full_name, u.avatar, u.bio
      FROM works w JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `, [id]);
    return rows[0] || null;
  }

  /* trova un'opera solo se appartiene all'utente specificato */
  static async findOwned(id, userId) {
    const [rows] = await db.query('SELECT * FROM works WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] || null;
  }

  /* tutte le opere pubbliche con tag aggregati, per la gallery */
  static async getPublicWithTags(limit = 24) {
    const [rows] = await db.query(`
      SELECT w.*, u.username, u.full_name, u.avatar,
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ',') as tag_names,
        GROUP_CONCAT(t.color ORDER BY t.name SEPARATOR ',') as tag_colors
      FROM works w
      JOIN users u ON w.user_id = u.id
      LEFT JOIN work_tags wt ON w.id = wt.work_id
      LEFT JOIN tags t ON wt.tag_id = t.id
      WHERE w.is_public = 1
      GROUP BY w.id
      ORDER BY w.created_at DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }

  /* opere di un utente, con supporto per vedere anche le private se si è il proprietario */
  static async getByUser(userId, viewerId = 0) {
    const [rows] = await db.query(`
      SELECT w.*, GROUP_CONCAT(t.name SEPARATOR ',') as tag_names,
        GROUP_CONCAT(t.color SEPARATOR ',') as tag_colors
      FROM works w
      LEFT JOIN work_tags wt ON w.id = wt.work_id
      LEFT JOIN tags t ON wt.tag_id = t.id
      WHERE w.user_id = ? AND (w.is_public = 1 OR ? = w.user_id)
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `, [userId, viewerId]);
    return rows;
  }

  static async create({ userId, title, description, imagePath, styleCategory, toolsUsed, isPublic }) {
    const [result] = await db.query(`
      INSERT INTO works (user_id, title, description, image_path, style_category, tools_used, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, title, description, imagePath, styleCategory, toolsUsed, isPublic ? 1 : 0]);
    return result.insertId;
  }

  static async update(id, userId, { title, description, styleCategory, toolsUsed, isPublic }) {
    await db.query(
      'UPDATE works SET title=?, description=?, style_category=?, tools_used=?, is_public=? WHERE id=? AND user_id=?',
      [title, description, styleCategory, toolsUsed, isPublic ? 1 : 0, id, userId]
    );
  }

  static async delete(id) {
    await db.query('DELETE FROM works WHERE id = ?', [id]);
  }

  static async incrementViews(id) {
    await db.query('UPDATE works SET views = views + 1 WHERE id = ?', [id]);
  }

  static async incrementLikes(id) {
    await db.query('UPDATE works SET likes = likes + 1 WHERE id = ?', [id]);
  }

  /* opere simili basate sui tag in comune */
  static async getRelated(workId, limit = 4) {
    const [rows] = await db.query(`
      SELECT w.* FROM works w
      JOIN work_tags wt ON w.id = wt.work_id
      WHERE wt.tag_id IN (SELECT tag_id FROM work_tags WHERE work_id = ?)
        AND w.id != ? AND w.is_public = 1
      GROUP BY w.id LIMIT ?
    `, [workId, workId, limit]);
    return rows;
  }

  static async updateAiData(id, { aiDescription, aiTags, colorPalette }) {
    await db.query(
      'UPDATE works SET ai_description=?, ai_tags=?, color_palette=? WHERE id=?',
      [aiDescription, aiTags, JSON.stringify(colorPalette), id]
    );
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT w.*, u.username FROM works w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);
    return rows;
  }

  static async getRecent(limit = 5) {
    const [rows] = await db.query(`
      SELECT w.*, u.username FROM works w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC LIMIT ?
    `, [limit]);
    return rows;
  }

  static async toggleFeatured(id) {
    await db.query('UPDATE works SET is_featured = NOT is_featured WHERE id = ?', [id]);
  }

  static async count() {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM works');
    return total;
  }

  static async totalViews() {
    const [[{ total }]] = await db.query('SELECT COALESCE(SUM(views),0) as total FROM works');
    return total;
  }

  static async search({ q, tag, style }) {
    let query = `
      SELECT w.*, u.username, u.full_name FROM works w
      JOIN users u ON w.user_id = u.id
      WHERE w.is_public = 1
    `;
    const params = [];
    if (q) {
      query += ' AND (w.title LIKE ? OR w.description LIKE ? OR w.ai_description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (style) { query += ' AND w.style_category = ?'; params.push(style); }
    if (tag) {
      query += ' AND w.id IN (SELECT wt.work_id FROM work_tags wt JOIN tags t ON wt.tag_id = t.id WHERE t.slug = ?)';
      params.push(tag);
    }
    query += ' ORDER BY w.created_at DESC LIMIT 20';
    const [rows] = await db.query(query, params);
    return rows;
  }
}

module.exports = Work;
