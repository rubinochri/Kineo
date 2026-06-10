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
  'admin123',
  'password123',
  'password1234',
  'kineo123',
  'kineo2026',
  'dominga',
  'mario',
  'secret',
  'test',
  'test1234',
  '123'
];

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Auth DB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('utentes');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`Testing ${users.length} users...`);
    
    for (const u of users) {
      for (const guess of guesses) {
        const match = await bcrypt.compare(guess, u.password);
        if (match) {
          console.log(`MATCH FOUND! User: ${u.email}, Password: "${guess}", Role: ${u.ruolo}`);
        }
      }
    }
    console.log('Done testing.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
