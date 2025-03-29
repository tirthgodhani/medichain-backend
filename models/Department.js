const mongoose = require('mongoose');

const DepartmentSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a department name'],
    trim: true
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  head: {
    name: String,
    designation: String,
    contactNumber: String,
    email: String
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique department names within a facility
DepartmentSchema.index({ name: 1, facility: 1 }, { unique: true });

module.exports = mongoose.model('Department', DepartmentSchema); 