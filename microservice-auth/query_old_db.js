const mongoose = require('mongoose');

const uri = 'mongodb+srv://admin:KineoDB2026@cluster0.0krkoks.mongodb.net/kineo?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to Old MongoDB kineo');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in old DB:', collections.map(c => c.name));
    
    const usersCollection = db.collection('utentes');
    const users = await usersCollection.find({}).toArray();
    console.log('Total users in old DB:', users.length);
    
    const admins = users.filter(u => u.ruolo && u.ruolo.toLowerCase() === 'admin');
    console.log('Admin users in old DB:', admins.length);
    for (const a of admins) {
      console.log(`ID: ${a._id}, Email: ${a.email}, Username: ${a.username}, PasswordHash: ${a.password}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
