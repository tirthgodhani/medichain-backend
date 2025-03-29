const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (super-admin, state-admin, district-admin, hospital-admin)
exports.getUsers = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'hospital-admin') {
      // Hospital admins can only see users from their facility
      query.facility = req.user.facility;
    } else if (req.user.role === 'district-admin') {
      // District admins can only see users from their district
      query.district = req.user.district;
    } else if (req.user.role === 'state-admin') {
      // State admins can only see users from their state
      query.state = req.user.state;
    }
    
    // Apply additional filters
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.facility) {
      query.facility = req.query.facility;
    }
    if (req.query.district) {
      query.district = req.query.district;
    }
    if (req.query.state) {
      query.state = req.query.state;
    }

    // Setup pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const users = await User.find(query)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .populate('facility', 'name type')
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (super-admin, state-admin, district-admin, hospital-admin)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('facility', 'name type');
      
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has permission to view this user
    if (req.user.role !== 'super-admin') {
      if (
        (req.user.role === 'hospital-admin' && 
          (!user.facility || user.facility._id.toString() !== req.user.facility.toString())) ||
        (req.user.role === 'district-admin' && user.district !== req.user.district) ||
        (req.user.role === 'state-admin' && user.state !== req.user.state)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this user'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (super-admin, state-admin, district-admin, hospital-admin)
exports.createUser = async (req, res) => {
  try {
    // Check if email is already taken
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    // Enforce role restrictions based on creating user's role
    if (req.user.role === 'hospital-admin') {
      // Hospital admins can only create department users for their facility
      if (!['department-user'].includes(req.body.role)) {
        return res.status(403).json({
          success: false,
          message: 'You can only create department users'
        });
      }
      // Set the facility to the admin's facility
      req.body.facility = req.user.facility;
      req.body.district = req.user.district;
      req.body.state = req.user.state;
    } else if (req.user.role === 'district-admin') {
      // District admins can create hospital admins and department users in their district
      if (!['hospital-admin', 'department-user'].includes(req.body.role)) {
        return res.status(403).json({
          success: false,
          message: 'You can only create hospital admins and department users'
        });
      }
      // Set the district to the admin's district
      req.body.district = req.user.district;
      req.body.state = req.user.state;
    } else if (req.user.role === 'state-admin') {
      // State admins can create district admins, hospital admins, and department users in their state
      if (!['district-admin', 'hospital-admin', 'department-user'].includes(req.body.role)) {
        return res.status(403).json({
          success: false,
          message: 'You can only create district admins, hospital admins, and department users'
        });
      }
      // Set the state to the admin's state
      req.body.state = req.user.state;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    
    // Create user
    const user = await User.create(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        facility: user.facility,
        district: user.district,
        state: user.state
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (super-admin, state-admin, district-admin, hospital-admin)
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has permission to update this user
    if (req.user.role !== 'super-admin') {
      if (
        (req.user.role === 'hospital-admin' && 
          (!user.facility || user.facility.toString() !== req.user.facility.toString())) ||
        (req.user.role === 'district-admin' && user.district !== req.user.district) ||
        (req.user.role === 'state-admin' && user.state !== req.user.state)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }
    }
    
    // Block role changes unless by higher-level admin
    if (req.body.role && req.body.role !== user.role) {
      if (
        (req.user.role === 'hospital-admin') ||
        (req.user.role === 'district-admin' && ['district-admin', 'state-admin', 'super-admin'].includes(req.body.role)) ||
        (req.user.role === 'state-admin' && ['state-admin', 'super-admin'].includes(req.body.role))
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change user to this role'
        });
      }
    }
    
    // Handle password update
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (super-admin, state-admin, district-admin, hospital-admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has permission to delete this user
    if (req.user.role !== 'super-admin') {
      if (
        // Hospital admins can only delete department users from their facility
        (req.user.role === 'hospital-admin' && 
          (user.role !== 'department-user' || 
            !user.facility || 
            user.facility.toString() !== req.user.facility.toString())) ||
        // District admins can delete hospital admins and department users from their district
        (req.user.role === 'district-admin' && 
          (!['hospital-admin', 'department-user'].includes(user.role) || 
            user.district !== req.user.district)) ||
        // State admins can delete district admins, hospital admins, and department users from their state
        (req.user.role === 'state-admin' && 
          (!['district-admin', 'hospital-admin', 'department-user'].includes(user.role) || 
            user.state !== req.user.state))
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this user'
        });
      }
    }
    
    await user.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 