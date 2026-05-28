const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/upload', isAuthenticated, portfolioController.getUpload);
router.post('/upload', isAuthenticated, upload.single('image'), portfolioController.postUpload);
router.get('/:id', portfolioController.getWork);
router.post('/:id/comment', isAuthenticated, portfolioController.postComment);
router.post('/:id/like', isAuthenticated, portfolioController.postLike);
router.get('/:id/edit', isAuthenticated, portfolioController.getEdit);
router.post('/:id/edit', isAuthenticated, portfolioController.postEdit);
router.post('/:id/delete', isAuthenticated, portfolioController.postDelete);

module.exports = router;
