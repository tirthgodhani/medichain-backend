require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    try {
      const departments = await Department.find().populate('facility', 'name');
      
      console.log(`Total departments: ${departments.length}`);
      
      if (departments.length > 0) {
        console.log('\nDepartments:');
        departments.forEach(dept => {
          console.log(`- ${dept.name} (Facility: ${dept.facility?.name || 'Unknown'}, ID: ${dept._id})`);
        });
      } else {
        console.log('No departments found');
        
        // If no departments, try creating some basic ones
        console.log('\nCreating default departments for testing...');
        
        // First check if we have facilities
        const Facility = require('./models/Facility');
        const facilities = await Facility.find();
        
        if (facilities.length > 0) {
          const facility = facilities[0];
          console.log(`Using facility: ${facility.name} (${facility._id})`);
          
          // Create a test department
          const dept = await Department.create({
            name: 'General Medicine',
            facility: facility._id,
            description: 'General Medicine Department',
            head: {
              name: 'Dr. Smith',
              designation: 'Head of Department',
              contactNumber: '123-456-7890',
              email: 'smith@hospital.com'
            }
          });
          
          console.log(`Created department: ${dept.name} (${dept._id})`);
          
          // Update facility with department reference
          await Facility.findByIdAndUpdate(facility._id, {
            $push: { departments: dept._id }
          });
          
          console.log('Added department to facility');
        } else {
          console.log('No facilities found. Cannot create departments.');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
    
    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }); 