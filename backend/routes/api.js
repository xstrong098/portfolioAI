const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/analyze/:workId', isAuthenticated, apiController.analyzeWork);
router.post('/generate-description', isAuthenticated, apiController.generateDescription);
router.get('/works/search', apiController.searchWorks);

module.exports = router;
