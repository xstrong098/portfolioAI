const User = require('../models/User');
const Work = require('../models/Work');
const Tag = require('../models/Tag');

/* controller per il pannello admin */
const adminController = {

  async getDashboard(req, res) {
    try {
      const [totalUsers, totalWorks, totalViews, recentUsers, recentWorks] = await Promise.all([
        User.count(),
        Work.count(),
        Work.totalViews(),
        User.getRecent(5),
        Work.getRecent(5)
      ]);
      res.render('pages/admin/dashboard', {
        title: 'Admin Dashboard',
        stats: { totalUsers, totalWorks, totalViews },
        recentUsers,
        recentWorks
      });
    } catch (err) {
      console.error(err);
      res.redirect('/gallery');
    }
  },

  async getUsers(req, res) {
    const users = await User.getAll();
    res.render('pages/admin/users', { title: 'Gestione Utenti', users });
  },

  async toggleUser(req, res) {
    await User.toggleActive(req.params.id);
    res.redirect('/admin/users');
  },

  async updateRole(req, res) {
    const { role } = req.body;
    if (['user', 'admin'].includes(role)) {
      await User.updateRole(req.params.id, role);
    }
    res.redirect('/admin/users');
  },

  async getWorks(req, res) {
    const works = await Work.getAll();
    res.render('pages/admin/works', { title: 'Gestione Opere', works });
  },

  async toggleFeatured(req, res) {
    await Work.toggleFeatured(req.params.id);
    res.redirect('/admin/works');
  },

  async deleteWork(req, res) {
    await Work.delete(req.params.id);
    res.redirect('/admin/works');
  },

  async getTags(req, res) {
    const tags = await Tag.getAllWithUsage();
    res.render('pages/admin/tags', { title: 'Gestione Tag', tags });
  },

  async createTag(req, res) {
    const { name, color } = req.body;
    try {
      await Tag.create({ name, color });
    } catch (e) {
      req.flash('error', 'Tag già esistente.');
    }
    res.redirect('/admin/tags');
  },

  async deleteTag(req, res) {
    await Tag.delete(req.params.id);
    res.redirect('/admin/tags');
  }
};

module.exports = adminController;
