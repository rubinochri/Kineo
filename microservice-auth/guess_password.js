const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://admin:KineoDB2026@cluster0.0krkoks.mongodb.net/kineo_auth_db?retryWrites=true&w=majority&appName=Cluster0';

const guesses = [
  'admin',
  'password',
  'kineo',
  'Kineo2026',
  'KineoPassword',
  'admin2026',
  '123456',
  '12345678',
  'KineoDB2026',
  'Studente',
  'Admin',
  'admin123'
];

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Auth DB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('utentes');
    
    // Find admin@kineo.com
    const admin = await usersCollection.findOne({ email: 'admin@kineo.com' });
    if (!admin) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Admin hash:', admin.password);
    
    for (const guess of guesses) {
      const match = await bcrypt.compare(guess, admin.password);
      if (match) {
        console.log(`SUCCESS! The plain password is: "${guess}"`);
        return;
      }
    }
    console.log('None of the guesses matched.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
