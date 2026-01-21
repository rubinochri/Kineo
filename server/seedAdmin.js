const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configurazione Admin
const admins = [
  { 
    nome: 'Christian', 
    cognome: 'Rubino', 
    username: 'christian_admin', 
    email: 'christian.rubino@kineo.com', 
    password: 'passwordChristian1!' 
  },
  { 
    nome: 'Michele', 
    cognome: 'Nettis', 
    username: 'michele_admin', 
    email: 'michele.nettis@kineo.com', 
    password: 'passwordMichele1!' 
  },
  { 
    nome: 'Giuseppe', 
    cognome: 'Tucci', 
    username: 'giuseppe_admin', 
    email: 'giuseppe.tucci@kineo.com', 
    password: 'passwordGiuseppe1!' 
  }
];

// SCHEMA CORRETTO (Deve rispecchiare quello del DB Utente)
const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ruolo: { type: String, default: 'user' },
  dizionario: { type: Array, default: [] }, // Per compatibilità
  createdAt: { type: Date, default: Date.now }
});

// Usa il modello esistente o ne crea uno nuovo
const User = mongoose.models.Utente || mongoose.model('Utente', userSchema);

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- MongoDB Connesso ---');

    for (const admin of admins) {
      // 1. Pulizia: Elimina utente se esiste già (anche se malformato)
      await User.findOneAndDelete({ email: admin.email });
      // Elimina anche se esiste lo username per sicurezza
      await User.findOneAndDelete({ username: admin.username });

      // 2. Crittografia Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);

      // 3. Creazione
      await User.create({
        nome: admin.nome,
        cognome: admin.cognome,
        username: admin.username,
        email: admin.email,
        password: hashedPassword,
        ruolo: 'admin'
      });
      
      console.log(`✅ Admin creato: ${admin.nome} ${admin.cognome}`);
    }

  } catch (error) {
    console.error('❌ Errore Critico:', error);
  } finally {
    await mongoose.connection.close();
    console.log('--- Operazione Conclusa ---');
    process.exit(0);
  }
};

seedAdmins();