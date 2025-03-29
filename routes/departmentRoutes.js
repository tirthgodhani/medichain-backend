const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.route('/')
  .post(protect, authorize('super-admin', 'state-admin', 'district-admin', 'hospital-admin'), createDepartment)
  .get(protect, getDepartments);

router.route('/:id')
  .get(protect, getDepartment)
  .put(protect, authorize('super-admin', 'state-admin', 'district-admin', 'hospital-admin'), updateDepartment)
  .delete(protect, authorize('super-admin', 'state-admin', 'district-admin', 'hospital-admin'), deleteDepartment);

module.exports = router; 