const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from the server/.env file
require('dotenv').config();

async function run() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB successfully');

    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      rollNumber: String,
      role: String,
      faceEmbeddings: mongoose.Schema.Types.Mixed
    }));

    const students = await User.find({ role: 'student' });
    for (const student of students) {
      console.log(`\nStudent: ${student.firstName} ${student.lastName} (Roll: ${student.rollNumber})`);
      if (!student.faceEmbeddings) {
        console.log('  faceEmbeddings: undefined/null');
      } else if (Array.isArray(student.faceEmbeddings)) {
        console.log(`  faceEmbeddings count: ${student.faceEmbeddings.length}`);
        student.faceEmbeddings.forEach((fe, index) => {
          console.log(`  - Embedding ${index + 1}:`);
          if (Array.isArray(fe)) {
            console.log(`    Type: Array (Length: ${fe.length})`);
          } else {
            console.log(`    Type: Object`);
            console.log(`    Has embedding field: ${!!fe.embedding}`);
            if (fe.embedding) {
              console.log(`    Embedding field length: ${fe.embedding.length}`);
            }
            console.log(`    imageUrl: ${fe.imageUrl}`);
          }
        });
      } else {
        console.log('  faceEmbeddings: unusual format:', typeof student.faceEmbeddings);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
