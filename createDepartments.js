require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');
const Facility = require('./models/Facility');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    const facilities = await Facility.find();
    console.log(`Found ${facilities.length} facilities`);
    
    if (facilities.length > 0) {
      for (const facility of facilities) {
        const deptCount = await Department.countDocuments({ facility: facility._id });
        console.log(`Facility ${facility.name} has ${deptCount} departments`);
        
        if (deptCount === 0) {
          console.log(`Creating departments for facility: ${facility.name} (${facility._id})`);
          
          try {
            // Create General Medicine Department
            const dept1 = await Department.create({
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
            console.log(`Created department: ${dept1.name}`);
            
            // Create Pediatrics Department
            const dept2 = await Department.create({
              name: 'Pediatrics',
              facility: facility._id,
              description: 'Pediatrics Department',
              head: {
                name: 'Dr. Johnson',
                designation: 'Head of Department',
                contactNumber: '123-456-7891',
                email: 'johnson@hospital.com'
              }
            });
            console.log(`Created department: ${dept2.name}`);
            
            // Create OB-GYN Department
            const dept3 = await Department.create({
              name: 'Obstetrics & Gynecology',
              facility: facility._id,
              description: 'OB-GYN Department',
              head: {
                name: 'Dr. Williams',
                designation: 'Head of Department',
                contactNumber: '123-456-7892',
                email: 'williams@hospital.com'
              }
            });
            console.log(`Created department: ${dept3.name}`);
            
            // Update facility with department references
            await Facility.findByIdAndUpdate(facility._id, {
              $push: { 
                departments: { 
                  $each: [dept1._id, dept2._id, dept3._id] 
                }
              }
            });
            
            console.log(`Added departments to facility: ${facility.name}`);
          } catch (error) {
            console.error(`Error creating departments for facility ${facility.name}:`, error);
          }
        } else {
          console.log(`Facility ${facility.name} already has ${deptCount} departments. Skipping.`);
        }
      }
    } else {
      console.log('No facilities found');
    }
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }); 