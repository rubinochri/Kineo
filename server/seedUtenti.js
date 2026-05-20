const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { fakerIT: faker } = require('@faker-js/faker'); // Usa locale Italiano

// --- DEFINIZIONE SCHEMI (Come fornito) ---

const ParolaSalvataSchema = new mongoose.Schema({
  original: { type: String, required: true },
  translation: { type: String, required: true },
  type: { type: String, default: 'Generic' },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  learned: { type: Boolean, default: false }
});

const ElementoVocabolarioSchema = new mongoose.Schema({
  approfondimentoId: { type: mongoose.Schema.Types.ObjectId, required: true },
  notePersonali: { type: String, trim: true },
  stato: { 
    type: String, 
    required: true,
    enum: ['Da studiare', 'Ripasso', 'Imparato'],
    default: 'Da studiare'
  },
  dataSalvataggio: { type: Date, default: Date.now }
});

const UtenteSchema = new mongoose.Schema({
  nome: { type: String, required: true, maxlength: 255 },
  cognome: { type: String, required: true, maxlength: 255 },
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  ruolo: { type: String, enum: ['Studente', 'Admin'], default: 'Studente' },
  dataRegistrazione: { type: Date, default: Date.now },
  dizionario: [ParolaSalvataSchema],
  vocabolario: [ElementoVocabolarioSchema]
});

// Recupera modello esistente o crea nuovo
const User = mongoose.models.Utente || mongoose.model('Utente', UtenteSchema);

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- MongoDB Connesso ---');

    // 1. Pulizia: Rimuovi solo gli studenti (preserva gli Admin)
    console.log('Pulizia vecchi studenti...');
    await User.deleteMany({ ruolo: 'Studente' });

    // 2. Preparazione Password (Hashata una sola volta per efficienza)
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('password', salt);

    const usersToInsert = [];
    const usedUsernames = new Set(); // Per evitare duplicati rari

    console.log('Generazione dati per 100 utenti...');

    while (usersToInsert.length < 100) {
      const nome = faker.person.firstName();
      const cognome = faker.person.lastName();

      // Pulizia stringhe per username/mail (rimuove spazi, accenti, apostrofi)
      const cleanNome = nome.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanCognome = cognome.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Logica Username: [cognome][primi 3 caratteri nome]
      // Es: Luca Netti -> nettiluc
      const suffix = cleanNome.substring(0, 3);
      let username = `${cleanCognome}${suffix}`;

      // Gestione collisioni username (aggiunge numero se esiste già nel batch)
      if (usedUsernames.has(username)) {
        username = `${username}${Math.floor(Math.random() * 1000)}`;
      }
      usedUsernames.add(username);

      // Logica Email: Nome@cognome.com
      const email = `${cleanNome}@${cleanCognome}.com`;

      usersToInsert.push({
        nome: nome,
        cognome: cognome,
        username: username,
        email: email,
        password: commonPasswordHash,
        ruolo: 'Studente',
        dizionario: [],
        vocabolario: []
      });
    }

    // 3. Inserimento massivo (Molto più veloce del ciclo for)
    await User.insertMany(usersToInsert);
    
    console.log(`✅ ${usersToInsert.length} studenti inseriti correttamente.`);

  } catch (error) {
    console.error('❌ Errore Critico:', error);
  } finally {
    await mongoose.connection.close();
    console.log('--- Operazione Conclusa ---');
    process.exit(0);
  }
};

seedUsers();