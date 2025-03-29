const HealthData = require('../models/HealthData');
const Facility = require('../models/Facility');
const Department = require('../models/Department');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');

// @desc    Create new health data entry
// @route   POST /api/health-data
// @access  Private (hospital-admin, department-user)
exports.createHealthData = asyncHandler(async (req, res, next) => {
  try {
    console.log('Creating health data with request body:', req.body);
    
    // Add submittedBy to req.body
    req.body.submittedBy = req.user._id;
    
    // Validate department exists
    if (req.body.department) {
      const department = await Department.findById(req.body.department);
      if (!department) {
        return next(new ErrorResponse(`Department not found with id of ${req.body.department}`, 404));
      }
      console.log(`Department found: ${department.name}`);
    }
    
    // Add district and state from facility
    if (req.body.facility) {
      const facility = await Facility.findById(req.body.facility);
      if (facility) {
        req.body.district = facility.district;
        req.body.state = facility.state;
        console.log(`Facility found: ${facility.name}, District: ${facility.district}, State: ${facility.state}`);
      } else {
        return next(new ErrorResponse(`Facility not found with id of ${req.body.facility}`, 404));
      }
    }

    // Create health data
    const healthData = await HealthData.create(req.body);
    console.log('Health data created successfully:', healthData._id);

    res.status(201).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('Error creating health data:', error);
    return next(error);
  }
});

// @desc    Get all health data (with filtering options)
// @route   GET /api/health-data
// @access  Private
exports.getHealthData = asyncHandler(async (req, res, next) => {
  let query = {};
  
  // Filter by user role and access level
  if (req.user.role === 'hospital-admin') {
    // Hospital admins can see data from their facility
    query.facility = req.user.facility;
  } else if (req.user.role === 'department-user') {
    // Department users can see data from their department only
    query.department = req.user.department;
  } else if (req.user.role === 'district-admin') {
    // District admins can see data from their district
    query.district = req.user.district;
  } else if (req.user.role === 'state-admin') {
    // State admins can see data from their state
    query.state = req.user.state;
  }
  // Super admins can see all data (no filter)
  
  // Apply additional filters from query params
  if (req.query.year) {
    query['reportingPeriod.year'] = parseInt(req.query.year);
  }
  if (req.query.month) {
    query['reportingPeriod.month'] = parseInt(req.query.month);
  }
  if (req.query.quarter) {
    query['reportingPeriod.quarter'] = parseInt(req.query.quarter);
  }
  if (req.query.facility) {
    query.facility = req.query.facility;
  }
  if (req.query.department) {
    query.department = req.query.department;
  }
  if (req.query.district) {
    query.district = req.query.district;
  }
  if (req.query.state) {
    query.state = req.query.state;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Set up pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Execute query with pagination and populate references
  const healthData = await HealthData.find(query)
    .skip(startIndex)
    .limit(limit)
    .populate('facility', 'name type district state')
    .populate('department', 'name')
    .populate('submittedBy', 'name role')
    .populate('lastUpdatedBy', 'name role')
    .sort({ submittedAt: -1 });

  // Get total count
  const total = await HealthData.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: healthData.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: healthData
  });
});

// @desc    Get health data entry by ID
// @route   GET /api/health-data/:id
// @access  Private
exports.getHealthDataById = asyncHandler(async (req, res, next) => {
  try {
    console.log('Fetching health data report with ID:', req.params.id);
    
    const healthData = await HealthData.findById(req.params.id)
      .populate('facility', 'name district state')
      .populate('department', 'name')
      .populate('submittedBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role');

    if (!healthData) {
      console.log('Health data not found');
      return next(new ErrorResponse('Health data not found', 404));
    }

    // Check user permissions
    const user = req.user;
    if (user.role !== 'super-admin') {
      if (user.role === 'state-admin' && healthData.state !== user.state) {
        return next(new ErrorResponse('Not authorized to access this report', 403));
      }
      if (user.role === 'district-admin' && healthData.district !== user.district) {
        return next(new ErrorResponse('Not authorized to access this report', 403));
      }
      if (user.role === 'hospital-admin' && healthData.facility._id.toString() !== user.facility.toString()) {
        return next(new ErrorResponse('Not authorized to access this report', 403));
      }
      if (user.role === 'department-user' && 
          (healthData.facility._id.toString() !== user.facility.toString() || 
           healthData.department._id.toString() !== user.department.toString())) {
        return next(new ErrorResponse('Not authorized to access this report', 403));
      }
    }

    console.log('Successfully fetched health data report');
    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('Error in getHealthDataById:', error);
    next(error);
  }
});

// @desc    Update health data
// @route   PUT /api/health-data/:id
// @access  Private (hospital-admin, department-user)
exports.updateHealthData = asyncHandler(async (req, res, next) => {
  let healthData = await HealthData.findById(req.params.id);

  if (!healthData) {
    return next(new ErrorResponse(`Health data not found with id of ${req.params.id}`, 404));
  }

  // Check if user has permission to update this data
  if (
    req.user.role !== 'super-admin' && 
    (
      (req.user.role === 'hospital-admin' && healthData.facility.toString() !== req.user.facility.toString()) ||
      (req.user.role === 'department-user' && healthData.department.toString() !== req.user.department)
    )
  ) {
    return next(new ErrorResponse('Not authorized to update this health data', 403));
  }

  // Once data is submitted, only admins can change the status
  if (
    healthData.status !== 'draft' && 
    req.body.status && 
    !['super-admin', 'state-admin', 'district-admin'].includes(req.user.role)
  ) {
    delete req.body.status;
  }

  // Add lastUpdatedBy and lastUpdatedAt
  req.body.lastUpdatedBy = req.user._id;
  req.body.lastUpdatedAt = Date.now();

  // Update health data
  healthData = await HealthData.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    { 
      new: true, 
      runValidators: true 
    }
  );

  res.status(200).json({
    success: true,
    data: healthData
  });
});

// @desc    Delete health data
// @route   DELETE /api/health-data/:id
// @access  Private (super-admin only)
exports.deleteHealthData = asyncHandler(async (req, res, next) => {
  const healthData = await HealthData.findById(req.params.id);

  if (!healthData) {
    return next(new ErrorResponse(`Health data not found with id of ${req.params.id}`, 404));
  }

  await healthData.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get aggregated health data report
// @route   GET /api/health-data/report
// @access  Private
exports.getAggregatedReport = async (req, res) => {
  try {
    const { year, month, quarter, district, state, facility, department } = req.query;
    
    // Setup match stage based on user role and filters
    const matchStage = {};
    
    // Filter by user role and access level
    if (req.user.role !== 'super-admin') {
      if (req.user.role === 'hospital-admin') {
        matchStage.facility = mongoose.Types.ObjectId(req.user.facility);
      } else if (req.user.role === 'department-user') {
        matchStage.department = mongoose.Types.ObjectId(req.user.department);
      } else if (req.user.role === 'district-admin') {
        matchStage.district = req.user.district;
      } else if (req.user.role === 'state-admin') {
        matchStage.state = req.user.state;
      }
    }
    // Super admins can see all data (no filter)
    
    // Apply additional filters
    if (year) matchStage['reportingPeriod.year'] = parseInt(year);
    if (month) matchStage['reportingPeriod.month'] = parseInt(month);
    if (quarter) matchStage['reportingPeriod.quarter'] = parseInt(quarter);
    if (district) matchStage.district = district;
    if (state) matchStage.state = state;
    if (facility) matchStage.facility = mongoose.Types.ObjectId(facility);
    if (department) matchStage.department = mongoose.Types.ObjectId(department);
    
    // Only include approved data in reports
    matchStage.status = 'approved';
    
    // Aggregation pipeline
    const aggregatedData = await HealthData.aggregate([
      // Match stage
      { $match: matchStage },
      
      // Group stage
      { 
        $group: {
          _id: {
            district: '$district',
            state: '$state',
            year: '$reportingPeriod.year',
            month: '$reportingPeriod.month'
          },
          // Maternal Health aggregations
          antenatalRegistrations: { $sum: '$indicators.maternalHealth.antenatalRegistrations' },
          institutionalDeliveries: { $sum: '$indicators.maternalHealth.institutionalDeliveries' },
          homeDeliveries: { $sum: '$indicators.maternalHealth.homeDeliveries' },
          maternalDeaths: { $sum: '$indicators.maternalHealth.maternalDeaths' },
          highRiskPregnancies: { $sum: '$indicators.maternalHealth.highRiskPregnancies' },
          
          // Child Health aggregations
          newbornRegistered: { $sum: '$indicators.childHealth.newbornRegistered' },
          fullImmunization: { $sum: '$indicators.childHealth.fullImmunization' },
          lowBirthWeight: { $sum: '$indicators.childHealth.lowBirthWeight' },
          childDeaths: { $sum: '$indicators.childHealth.childDeaths' },
          malnutritionCases: { $sum: '$indicators.childHealth.malnutritionCases' },
          
          // Disease Control aggregations
          tbCasesDetected: { $sum: '$indicators.diseaseControl.tbCasesDetected' },
          tbCasesTreated: { $sum: '$indicators.diseaseControl.tbCasesTreated' },
          malariaPositive: { $sum: '$indicators.diseaseControl.malariaPositive' },
          denguePositive: { $sum: '$indicators.diseaseControl.denguePositive' },
          hivTestedPositive: { $sum: '$indicators.diseaseControl.hivTestedPositive' },
          
          // Outpatient aggregations
          totalOPDVisits: { $sum: '$indicators.outpatientServices.totalOPDVisits' },
          
          // Inpatient aggregations
          totalAdmissions: { $sum: '$indicators.inpatientServices.totalAdmissions' },
          totalDischarges: { $sum: '$indicators.inpatientServices.totalDischarges' },
          totalDeaths: { $sum: '$indicators.inpatientServices.totalDeaths' },
          
          // Surgeries aggregations
          majorSurgeries: { $sum: '$indicators.surgicalProcedures.majorSurgeries' },
          minorSurgeries: { $sum: '$indicators.surgicalProcedures.minorSurgeries' },
          
          // Lab tests aggregations
          totalLabTests: { $sum: '$indicators.laboratoryServices.totalLabTests' },
          
          // Resource aggregations
          doctorsAvailable: { $avg: '$indicators.resources.doctorsAvailable' },
          nursesAvailable: { $avg: '$indicators.resources.nursesAvailable' },
          totalBeds: { $avg: '$indicators.resources.totalBeds' },
          
          count: { $sum: 1 }
        }
      },
      
      // Project to reshape the output
      {
        $project: {
          _id: 0,
          district: '$_id.district',
          state: '$_id.state',
          year: '$_id.year',
          month: '$_id.month',
          maternalHealth: {
            antenatalRegistrations: '$antenatalRegistrations',
            institutionalDeliveries: '$institutionalDeliveries',
            homeDeliveries: '$homeDeliveries',
            maternalDeaths: '$maternalDeaths',
            highRiskPregnancies: '$highRiskPregnancies'
          },
          childHealth: {
            newbornRegistered: '$newbornRegistered',
            fullImmunization: '$fullImmunization',
            lowBirthWeight: '$lowBirthWeight',
            childDeaths: '$childDeaths',
            malnutritionCases: '$malnutritionCases'
          },
          diseaseControl: {
            tbCasesDetected: '$tbCasesDetected',
            tbCasesTreated: '$tbCasesTreated',
            malariaPositive: '$malariaPositive',
            denguePositive: '$denguePositive',
            hivTestedPositive: '$hivTestedPositive'
          },
          outpatientServices: {
            totalOPDVisits: '$totalOPDVisits'
          },
          inpatientServices: {
            totalAdmissions: '$totalAdmissions',
            totalDischarges: '$totalDischarges',
            totalDeaths: '$totalDeaths'
          },
          surgicalProcedures: {
            majorSurgeries: '$majorSurgeries',
            minorSurgeries: '$minorSurgeries'
          },
          laboratoryServices: {
            totalLabTests: '$totalLabTests'
          },
          resources: {
            doctorsAvailable: '$doctorsAvailable',
            nursesAvailable: '$nursesAvailable',
            totalBeds: '$totalBeds'
          },
          facilitiesReporting: '$count'
        }
      },
      
      // Sort by state and district
      { $sort: { state: 1, district: 1, year: 1, month: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      count: aggregatedData.length,
      data: aggregatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 