const db = require('../config/db');

/* modello tag - gestisce le query sui tag e sulle associazioni con le opere */
class Tag {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM tags ORDER BY name');
    return rows;
  }

  /* tutti i tag con quante opere li usano, per la pagina admin */
  static async getAllWithUsage() {
    const [rows] = await db.query(`
      SELECT t.*, COUNT(wt.work_id) as usage_count
      FROM tags t
      LEFT JOIN work_tags wt ON t.id = wt.tag_id
      GROUP BY t.id
      ORDER BY t.name
    `);
    return rows;
  }

  static async getForWork(workId) {
    const [rows] = await db.query(`
      SELECT t.* FROM tags t
      JOIN work_tags wt ON t.id = wt.tag_id
      WHERE wt.work_id = ?
    `, [workId]);
    return rows;
  }

  /* ritorna solo gli id dei tag selezionati, serve per la pagina di modifica */
  static async getSelectedIdsForWork(workId) {
    const [rows] = await db.query('SELECT tag_id FROM work_tags WHERE work_id = ?', [workId]);
    return rows.map(r => r.tag_id);
  }

  static async attachToWork(workId, tagIds) {
    const arr = Array.isArray(tagIds) ? tagIds : [tagIds];
    for (const tagId of arr) {
      await db.query('INSERT IGNORE INTO work_tags (work_id, tag_id) VALUES (?, ?)', [workId, tagId]);
    }
  }

  static async detachFromWork(workId) {
    await db.query('DELETE FROM work_tags WHERE work_id = ?', [workId]);
  }

  static async create({ name, color }) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await db.query('INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)', [name, slug, color || '#6c757d']);
  }

  static async delete(id) {
    await db.query('DELETE FROM tags WHERE id = ?', [id]);
  }
}

module.exports = Tag;
