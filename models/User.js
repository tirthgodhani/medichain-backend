const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['hospital-admin', 'department-user', 'super-admin', 'district-admin', 'state-admin'],
    default: 'department-user'
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: function() {
      return ['hospital-admin', 'department-user'].includes(this.role);
    }
  },
  district: {
    type: String,
    required: function() {
      return ['district-admin', 'hospital-admin', 'department-user'].includes(this.role);
    }
  },
  state: {
    type: String,
    required: function() {
      return ['state-admin', 'district-admin', 'hospital-admin', 'department-user'].includes(this.role);
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema); 