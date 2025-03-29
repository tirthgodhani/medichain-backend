const Department = require('../models/Department');
const Facility = require('../models/Facility');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create department
// @route   POST /api/departments
// @access  Private
exports.createDepartment = asyncHandler(async (req, res, next) => {
  // Check if facility exists
  const facility = await Facility.findById(req.body.facility);
  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.body.facility}`, 404));
  }

  const department = await Department.create(req.body);
  
  // Add department to facility
  await Facility.findByIdAndUpdate(req.body.facility, {
    $push: { departments: department._id }
  });
  
  res.status(201).json({ success: true, data: department });
});

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = asyncHandler(async (req, res, next) => {
  let query = {};
  
  // Filter by facility if provided
  if (req.query.facility) {
    query.facility = req.query.facility;
  }
  
  const departments = await Department.find(query).populate('facility', 'name type');
  res.status(200).json({ success: true, count: departments.length, data: departments });
});

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id).populate('facility', 'name type');
  
  if (!department) {
    return next(new ErrorResponse(`Department not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({ success: true, data: department });
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private
exports.updateDepartment = asyncHandler(async (req, res, next) => {
  let department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new ErrorResponse(`Department not found with id of ${req.params.id}`, 404));
  }
  
  // Check if user has access to this department's facility
  if (req.user.role !== 'super-admin' && 
      req.user.role !== 'state-admin' && 
      req.user.role !== 'district-admin') {
    if (department.facility.toString() !== req.user.facility.toString()) {
      return next(new ErrorResponse(`Not authorized to update this department`, 403));
    }
  }
  
  department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({ success: true, data: department });
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  
  if (!department) {
    return next(new ErrorResponse(`Department not found with id of ${req.params.id}`, 404));
  }
  
  // Check if user has access to this department's facility
  if (req.user.role !== 'super-admin' && 
      req.user.role !== 'state-admin' && 
      req.user.role !== 'district-admin') {
    if (department.facility.toString() !== req.user.facility.toString()) {
      return next(new ErrorResponse(`Not authorized to delete this department`, 403));
    }
  }
  
  await department.deleteOne();
  
  // Remove department from facility
  await Facility.findByIdAndUpdate(department.facility, {
    $pull: { departments: department._id }
  });
  
  res.status(200).json({ success: true, data: {} });
}); 