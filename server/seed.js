const mongoose = require('mongoose');
const Video = require('./models/Video');
const Utente = require('./models/Utente');
const Commento = require('./models/Commento');

// Stringa di connessione (assicurati che sia la stessa di index.js)
const MONGO_URI = 'mongodb://127.0.0.1:27017/kineo'; 

const seedDatabase = async () => {
  try {
    // 1. Connessione al DB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connesso a MongoDB');

    // 2. Pulizia: Cancelliamo i vecchi dati per partire puliti
    await Video.deleteMany({});
    await Utente.deleteMany({});
    await Commento.deleteMany({});
    console.log('🗑️ Vecchi dati cancellati');

    // 3. Creazione di un VIDEO con SEGMENTI e APPROFONDIMENTI
    const video1 = await Video.create({
      titolo: "Learn English with Friends",
      copertina: "friends.jpg",
      descrizione: "Una scena divertente dalla serie TV.",
      url: "https://youtube.com/watch?v=12345",
      durataSecondi: 120,
      livelloDifficolta: "B1",
      segmenti: [
        {
          startTime: 0,
          endTime: 5000,
          testoInglese: "How you doin'?",
          testoItaliano: "Come va?",
          approfondimenti: [
            {
              token: "How you doin'",
              tipo: "Idioma",
              significato: "Tipico saluto informale di Joey."
            }
          ]
        },
        {
          startTime: 5000,
          endTime: 10000,
          testoInglese: "I am going to give up on this.",
          testoItaliano: "Ci rinuncerò.",
          approfondimenti: [
            {
              token: "give up",
              tipo: "Phrasal Verb",
              significato: "Arrendersi o smettere di fare qualcosa."
            }
          ]
        }
      ]
    });
    console.log('🎬 Video creato con successo');

    // --- PUNTO CRITICO: Recuperiamo l'ID di un approfondimento specifico ---
    // Vogliamo simulare che l'utente salvi "give up"
    const segmentoTarget = video1.segmenti[1]; 
    const approfondimentoTarget = segmentoTarget.approfondimenti[0]; // "give up"
    const idApprofondimentoReale = approfondimentoTarget._id;

    // 4. Creazione di un UTENTE con VOCABOLARIO collegato
    const studente = await Utente.create({
      nome: "Luca",
      cognome: "Rossi",
      email: "luca@test.com",
      password: "passwordSegreta123", // In futuro la cripteremo
      ruolo: "Studente",
      vocabolario: [
        {
          approfondimentoId: idApprofondimentoReale, // <--- RELAZIONE "ORIGINA" (Foreign Key)
          notePersonali: "Molto usato nel parlato",
          stato: "Da studiare"
        }
      ]
    });
    console.log('👤 Utente creato con parola salvata nel vocabolario');

    // 5. Creazione di un COMMENTO (Relazione Utente -> Video)
    await Commento.create({
      utenteId: studente._id,
      videoId: video1._id,
      testo: "Video utilissimo, grazie!"
    });
    console.log('💬 Commento inserito');

    console.log('🎉 TUTTO FUNZIONA! Database popolato correttamente.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    process.exit(1);
  }
};

seedDatabase();