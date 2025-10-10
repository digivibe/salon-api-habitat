const express = require('express');
const router = express.Router();
const manageController = require('../controllers/manageController');
const { requireAdmin } = require('../middlewares/adminAuth');

// Apply admin authentication to all routes
router.use(requireAdmin);

// Statistics
router.get('/stats', manageController.getStatistics);

// Exposants CRUD
router.get('/exposants', manageController.getAllExposants);
router.get('/exposants/:id', manageController.getExposantById);
router.post('/exposants', manageController.createExposant);
router.put('/exposants/:id', manageController.updateExposant);
router.delete('/exposants/:id', manageController.deleteExposant);

// Permissions & Status management
router.patch('/exposants/:id/permissions', manageController.updateExposantPermissions);
router.patch('/exposants/:id/status', manageController.updateExposantStatus);

module.exports = router;
