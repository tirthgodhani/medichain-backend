const Facility = require('../models/Facility');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create facility
// @route   POST /api/facilities
// @access  Public
exports.createFacility = asyncHandler(async (req, res, next) => {
  const facility = await Facility.create(req.body);
  res.status(201).json({ success: true, data: facility });
});

// @desc    Get all facilities
// @route   GET /api/facilities
// @access  Public
exports.getFacilities = asyncHandler(async (req, res, next) => {
  const facilities = await Facility.find();
  res.status(200).json({ success: true, count: facilities.length, data: facilities });
});

// @desc    Get single facility
// @route   GET /api/facilities/:id
// @access  Public
exports.getFacility = asyncHandler(async (req, res, next) => {
  const facility = await Facility.findById(req.params.id);
  
  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({ success: true, data: facility });
});

// @desc    Update facility
// @route   PUT /api/facilities/:id
// @access  Private
exports.updateFacility = asyncHandler(async (req, res, next) => {
  let facility = await Facility.findById(req.params.id);
  
  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }
  
  facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({ success: true, data: facility });
});

// @desc    Delete facility
// @route   DELETE /api/facilities/:id
// @access  Private
exports.deleteFacility = asyncHandler(async (req, res, next) => {
  const facility = await Facility.findById(req.params.id);
  
  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }
  
  await facility.deleteOne();
  
  res.status(200).json({ success: true, data: {} });
}); 