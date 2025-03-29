const mongoose = require('mongoose');

const FacilitySchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a facility name'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Please add facility type'],
    enum: ['Hospital', 'Primary Health Center', 'Community Health Center', 'Sub-district Hospital', 'District Hospital', 'Medical College', 'Department']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  city: {
    type: String,
    required: [true, 'Please add a city']
  },
  district: {
    type: String,
    required: [true, 'Please add a district']
  },
  state: {
    type: String,
    required: [true, 'Please add a state']
  },
  pincode: {
    type: String,
    required: [true, 'Please add a pincode'],
    match: [/^[0-9]{6}$/, 'Please add a valid pincode']
  },
  contactPhone: {
    type: String,
    required: [true, 'Please add a contact phone number']
  },
  contactEmail: {
    type: String,
    required: [true, 'Please add a contact email']
  },
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Facility', FacilitySchema); 