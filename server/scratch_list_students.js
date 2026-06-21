const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      rollNumber: String,
      role: String,
      email: String
    }));
    
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students:`);
    students.forEach(s => {
      console.log(`- ID: ${s._id}, Name: ${s.firstName} ${s.lastName}, Roll: ${s.rollNumber}, Email: ${s.email}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
