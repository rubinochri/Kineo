const mongoose = require('mongoose');
const Video = require('./models/Video');
const User = require('./models/User');
require('dotenv').config();

// Dati di prova
const sampleVideo = {
  title: "Introduction to Business English",
  description: "Impara le basi per presentarti in un contesto lavorativo.",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
  cover: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  durationSeconds: 120,
  difficultyLevel: "A2",
  segments: [
    {
      startTimeMs: 0,
      endTimeMs: 5000,
      textEnglish: "Good morning everyone, and welcome to the meeting.",
      textItalian: "Buongiorno a tutti e benvenuti alla riunione.",
      insights: [
        {
          token: "Good morning",
          type: "Idioma",
          meaning: "Saluto formale usato al mattino"
        },
        {
          token: "meeting",
          type: "Vocabolo",
          meaning: "Riunione di lavoro"
        }
      ]
    },
    {
      startTimeMs: 5001,
      endTimeMs: 10000,
      textEnglish: "Today we are going to discuss the new project.",
      textItalian: "Oggi discuteremo del nuovo progetto.",
      insights: [
        {
          token: "discuss",
          type: "Vocabolo",
          meaning: "Discutere/Esaminare"
        }
      ]
    }
  ]
};

const sampleUser = {
  name: "Mario",
  surname: "Rossi",
  email: "mario.rossi@example.com",
  password: "password123", // In produzione andrebbe criptata
  role: "Studente",
  vocabulary: [
    {
      originalWord: "meeting",
      meaning: "Riunione",
      status: "Da studiare"
    }
  ]
};

// Funzione di caricamento
const seedDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/kineo');
    console.log('🔌 Connesso al DB');

    // Pulisce tutto il DB prima di inserire
    await Video.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Vecchi dati eliminati');

    // Inserisce i nuovi dati
    await Video.create(sampleVideo);
    await User.create(sampleUser);
    console.log('✅ Dati di prova inseriti con successo!');

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

seedDB();