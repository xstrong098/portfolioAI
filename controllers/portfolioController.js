const path = require('path');
const fs = require('fs');
const Work = require('../models/Work');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');

/* controller per la gestione delle opere */
const portfolioController = {

  async getUpload(req, res) {
    const tags = await Tag.getAll();
    res.render('pages/upload', { title: 'Carica Opera', tags });
  },

  async postUpload(req, res) {
    if (!req.file) {
      req.flash('error', "Carica un'immagine.");
      return res.redirect('/portfolio/upload');
    }
    const { title, description, style_category, tools_used, is_public, tags } = req.body;
    const imagePath = '/uploads/' + req.file.filename;
    try {
      const workId = await Work.create({
        userId: req.session.user.id,
        title,
        description,
        imagePath,
        styleCategory: style_category,
        toolsUsed: tools_used,
        isPublic: is_public
      });
      if (tags) await Tag.attachToWork(workId, tags);
      req.flash('success', "Opera caricata! Usa l'AI per analizzarla.");
      res.redirect('/portfolio/' + workId);
    } catch (err) {
      console.error(err);
      req.flash('error', 'Errore durante il caricamento.');
      res.redirect('/portfolio/upload');
    }
  },

  async getWork(req, res) {
    try {
      const work = await Work.findById(req.params.id);
      if (!work) return res.redirect('/gallery');
      if (!work.is_public && (!req.session.user || req.session.user.id !== work.user_id)) {
        return res.redirect('/gallery');
      }
      const [tags, comments] = await Promise.all([
        Tag.getForWork(work.id),
        Comment.getForWork(work.id)
      ]);
      let palette = [];
      try { palette = work.color_palette ? JSON.parse(work.color_palette) : []; } catch (e) {}
      await Work.incrementViews(work.id);
      const related = await Work.getRelated(work.id);
      res.render('pages/work-detail', { title: work.title, work, tags, comments, palette, related });
    } catch (err) {
      console.error(err);
      res.redirect('/gallery');
    }
  },

  async postComment(req, res) {
    const { content } = req.body;
    if (!content?.trim()) return res.redirect('/portfolio/' + req.params.id);
    await Comment.create({ workId: req.params.id, userId: req.session.user.id, content });
    res.redirect('/portfolio/' + req.params.id + '#comments');
  },

  async postLike(req, res) {
    await Work.incrementLikes(req.params.id);
    res.json({ success: true });
  },

  async getEdit(req, res) {
    const work = await Work.findOwned(req.params.id, req.session.user.id);
    if (!work) return res.redirect('/gallery');
    const [allTags, selectedTags] = await Promise.all([
      Tag.getAll(),
      Tag.getSelectedIdsForWork(work.id)
    ]);
    res.render('pages/edit-work', { title: 'Modifica Opera', work, allTags, selectedTags });
  },

  async postEdit(req, res) {
    const { title, description, style_category, tools_used, is_public, tags } = req.body;
    await Work.update(req.params.id, req.session.user.id, {
      title, description,
      styleCategory: style_category,
      toolsUsed: tools_used,
      isPublic: is_public
    });
    await Tag.detachFromWork(req.params.id);
    if (tags) await Tag.attachToWork(req.params.id, tags);
    req.flash('success', 'Opera aggiornata!');
    res.redirect('/portfolio/' + req.params.id);
  },

  async postDelete(req, res) {
    const work = await Work.findOwned(req.params.id, req.session.user.id);
    if (work) {
      const imgPath = path.join(__dirname, '../public', work.image_path);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      await Work.delete(work.id);
      req.flash('success', 'Opera eliminata.');
    }
    res.redirect('/gallery');
  }
};

module.exports = portfolioController;
