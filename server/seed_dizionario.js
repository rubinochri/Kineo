const mongoose = require('mongoose');
const fs = require('fs');
const Dizionario = require('./models/Dizionario');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('🔌 Connesso al DB...');

    try {
      // 1. LEGGI IL FILE JSON
      const rawData = fs.readFileSync('parole.json');
      const parole = JSON.parse(rawData);
      console.log(`📂 File parole.json letto. Trovate ${parole.length} parole.`);

      // 2. PULISCI IL DB (Facoltativo: se vuoi aggiungere senza cancellare, rimuovi questa riga)
      await Dizionario.deleteMany({});
      console.log('🗑️ Vecchio dizionario pulito.');

      // 3. INSERIMENTO MASSIVO (Gestisce duplicati saltandoli)
      // Usiamo insertMany con ordered: false per continuare anche se una parola esiste già
      try {
        await Dizionario.insertMany(parole, { ordered: false });
      } catch (e) {
        // Ignora errori di duplicati (E11000)
        if (e.code !== 11000) console.log("⚠️ Alcuni duplicati saltati.");
      }
      
      console.log(`✅ Dizionario aggiornato con successo!`);
      
    } catch (error) {
      console.error('❌ Errore durante il seed:', error.message);
    }

    process.exit();
  })
  .catch(err => {
    console.error('❌ Errore connessione:', err);
    process.exit(1);
  });