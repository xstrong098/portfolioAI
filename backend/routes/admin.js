const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

router.get('/', isAdmin, adminController.getDashboard);
router.get('/users', isAdmin, adminController.getUsers);
router.post('/users/:id/toggle', isAdmin, adminController.toggleUser);
router.post('/users/:id/role', isAdmin, adminController.updateRole);
router.get('/works', isAdmin, adminController.getWorks);
router.post('/works/:id/featured', isAdmin, adminController.toggleFeatured);
router.post('/works/:id/delete', isAdmin, adminController.deleteWork);
router.get('/tags', isAdmin, adminController.getTags);
router.post('/tags/create', isAdmin, adminController.createTag);
router.post('/tags/:id/delete', isAdmin, adminController.deleteTag);

module.exports = router;
