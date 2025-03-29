require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');
const Facility = require('./models/Facility');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      // Find the first facility
      const facility = await Facility.findOne();
      
      if (!facility) {
        console.log('No facility found. Please create a facility first.');
        return;
      }
      
      console.log(`Found facility: ${facility.name} (${facility._id})`);
      
      // Create a new department
      const newDepartment = {
        name: 'Emergency Medicine',
        facility: facility._id,
        description: 'Emergency Medicine Department',
        head: {
          name: 'Dr. Johnson',
          designation: 'Head of Department',
          contactNumber: '555-123-4567',
          email: 'johnson@hospital.com'
        }
      };
      
      // Create the department
      const department = await Department.create(newDepartment);
      console.log(`Created department: ${department.name} (${department._id})`);
      
      // Add department to facility
      await Facility.findByIdAndUpdate(facility._id, {
        $addToSet: { departments: department._id }
      });
      
      console.log(`Added department to facility: ${facility.name}`);
      
      // List all departments for this facility
      const departments = await Department.find({ facility: facility._id });
      console.log(`\nDepartments for ${facility.name}:`);
      departments.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name} (${dept._id})`);
      });
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
  }); 