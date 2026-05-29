const User = require('../models/User');
const Work = require('../models/Work');
const Tag = require('../models/Tag');

/* controller per autenticazione, gallery e profilo */
const authController = {

  getLogin(req, res) {
    res.render('pages/login', { title: 'Login' });
  },

  async postLogin(req, res) {
    const { email, password } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        req.flash('error', 'Credenziali non valide.');
        return res.redirect('/login');
      }
      const match = await User.verifyPassword(password, user.password);
      if (!match) {
        req.flash('error', 'Credenziali non valide.');
        return res.redirect('/login');
      }
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar: user.avatar,
        role: user.role
      };
      req.flash('success', `Benvenuto, ${user.full_name || user.username}!`);
      res.redirect('/gallery');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Errore del server. Riprova.');
      res.redirect('/login');
    }
  },

  getRegister(req, res) {
    res.render('pages/register', { title: 'Registrati' });
  },

  async postRegister(req, res) {
    const { username, email, password, full_name } = req.body;
    try {
      const exists = await User.existsByEmailOrUsername(email, username);
      if (exists) {
        req.flash('error', 'Email o username già in uso.');
        return res.redirect('/register');
      }
      await User.create({ username, email, password, full_name });
      req.flash('success', 'Account creato! Ora puoi accedere.');
      res.redirect('/login');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Errore durante la registrazione.');
      res.redirect('/register');
    }
  },

  logout(req, res) {
    req.session.destroy();
    res.redirect('/login');
  },

  async getGallery(req, res) {
    try {
      const [works, tags] = await Promise.all([
        Work.getPublicWithTags(24),
        Tag.getAll()
      ]);
      res.render('pages/gallery', { title: 'Gallery', works, tags });
    } catch (err) {
      console.error(err);
      res.render('pages/gallery', { title: 'Gallery', works: [], tags: [] });
    }
  },

  async getProfile(req, res) {
    try {
      const profileUser = await User.findByUsername(req.params.username);
      if (!profileUser) return res.redirect('/gallery');
      const works = await Work.getByUser(profileUser.id, req.session.user?.id || 0);
      res.render('pages/profile', { title: profileUser.username, profileUser, works });
    } catch (err) {
      console.error(err);
      res.redirect('/gallery');
    }
  }
};

module.exports = authController;
