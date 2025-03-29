const mongoose = require('mongoose');

const HealthDataSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: [true, 'Facility is required']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  district: {
    type: String,
    required: [true, 'District is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  reportingPeriod: {
    year: {
      type: Number,
      required: [true, 'Reporting year is required']
    },
    month: {
      type: Number,
      required: [true, 'Reporting month is required']
    },
    quarter: {
      type: Number
    }
  },
  // Health data indicators - structured by categories
  healthData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Health data is required']
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
    default: 'draft'
  },
  notes: {
    type: String,
    trim: true
  },
  // User tracking
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitter information is required']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Make sure facility, department, and reporting period combo is unique
HealthDataSchema.index({ 
  facility: 1, 
  department: 1, 
  'reportingPeriod.year': 1, 
  'reportingPeriod.month': 1 
}, { unique: true });

module.exports = mongoose.model('HealthData', HealthDataSchema); 