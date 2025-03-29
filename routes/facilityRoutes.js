const express = require('express');
const router = express.Router();
const {
  createFacility,
  getFacilities,
  getFacility,
  updateFacility,
  deleteFacility
} = require('../controllers/facilityController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/', createFacility);
router.get('/', getFacilities);
router.get('/:id', getFacility);

// Protected routes
router.put('/:id', protect, authorize('super-admin', 'state-admin', 'district-admin'), updateFacility);
router.delete('/:id', protect, authorize('super-admin'), deleteFacility);

module.exports = router; 