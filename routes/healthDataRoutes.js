const express = require('express');
const router = express.Router();
const {
  createHealthData,
  getHealthData,
  getHealthDataById,
  updateHealthData,
  deleteHealthData,
  getAggregatedReport
} = require('../controllers/healthDataController');
const { protect, authorize } = require('../middleware/auth');

// Get aggregated report
router.get(
  '/report',
  protect,
  getAggregatedReport
);

// Create health data
router.post(
  '/',
  protect,
  authorize('hospital-admin', 'department-user', 'super-admin'),
  createHealthData
);

// Get all health data
router.get(
  '/',
  protect,
  getHealthData
);

// Get, update and delete health data by ID
router
  .route('/:id')
  .get(protect, getHealthDataById)
  .put(
    protect,
    authorize('hospital-admin', 'department-user', 'super-admin', 'state-admin', 'district-admin'),
    updateHealthData
  )
  .delete(
    protect,
    authorize('super-admin'),
    deleteHealthData
  );

module.exports = router; 