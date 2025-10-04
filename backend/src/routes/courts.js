const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
// Get all courts (optionally filtered by active status)
router.get('/', courtController.getAllCourts);

// Get single court by ID
router.get('/:id', courtController.getCourtById);

// Get court availability for a specific date
router.get('/:id/availability', courtController.getCourtAvailability);

// Admin routes (require authentication)
// Create new court
router.post('/', authenticateAdmin, courtController.createCourt);

// Update court
router.put('/:id', authenticateAdmin, courtController.updateCourt);

// Delete court
router.delete('/:id', authenticateAdmin, courtController.deleteCourt);

// Toggle court active status
router.patch('/:id/toggle-status', authenticateAdmin, courtController.toggleCourtStatus);

module.exports = router;
