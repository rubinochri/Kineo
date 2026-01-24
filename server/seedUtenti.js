const mongoose = require('mongoose');
// MODIFICA IL PERCORSO SE NECESSARIO
const Utente = require('./models/Utente'); 
require('dotenv').config();

// CONFIGURAZIONE DB
mongoose.connect(process.env.MONGODB_URI) 

const nomi = [
  'Alessandro', 'Andrea', 'Antonio', 'Carlo', 'Claudio', 'Daniele', 'Davide', 'Domenico', 
  'Edoardo', 'Emanuele', 'Fabio', 'Federico', 'Filippo', 'Francesco', 'Gabriele', 'Giacomo', 
  'Gianluca', 'Giorgio', 'Giovanni', 'Giuseppe', 'Leonardo', 'Lorenzo', 'Luca', 'Luigi', 
  'Manuel', 'Marco', 'Massimo', 'Matteo', 'Mattia', 'Michele', 'Nicola', 'Paolo', 
  'Pasquale', 'Pietro', 'Raffaele', 'Riccardo', 'Roberto', 'Salvatore', 'Samuele', 'Simone', 
  'Stefano', 'Tommaso', 'Valerio', 'Vincenzo', 'Vittorio', 'Alice', 'Anna', 'Arianna', 
  'Aurora', 'Beatrice', 'Camilla', 'Caterina', 'Chiara', 'Claudia', 'Cristina', 'Daniela', 
  'Debora', 'Elena', 'Eleonora', 'Elisa', 'Elisabetta', 'Erica', 'Eva', 'Federica', 
  'Francesca', 'Gaia', 'Giada', 'Giorgia', 'Giulia', 'Greta', 'Ilaria', 'Irene', 
  'Laura', 'Letizia', 'Linda', 'Lisa', 'Lucia', 'Ludovica', 'Maddalena', 'Manuela', 
  'Maria', 'Marta', 'Martina', 'Michela', 'Monica', 'Nicole', 'Noemi', 'Paola', 
  'Rebecca', 'Roberta', 'Sara', 'Serena', 'Silvia', 'Simona', 'Sofia', 'Stefania', 
  'Teresa', 'Valentina', 'Vanessa', 'Veronica', 'Viola'
];

const cognomi = [
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 
  'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 
  'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 
  'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 
  'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', 'D\'Angelo', 'Marchetti', 
  'Parisi', 'Villa', 'Conte', 'Ferraro', 'Ferri', 'Fabbri', 'Bianco', 'Marini', 
  'Grasso', 'Valentini', 'Messina', 'Sala', 'De Angelis', 'Gatti', 'Pellegrini', 'Palumbo', 
  'Sanna', 'Farina', 'Riva', 'Monti', 'Cattaneo', 'Morelli', 'Amato', 'Silvestri', 
  'Mazza', 'Testa', 'Grassi', 'Pellegrino', 'Carbone', 'Giuliani', 'Benedetti', 'Barone', 
  'Rossetti', 'Caputo', 'Montanari', 'Guerra', 'Palmieri', 'Bernardi', 'Martino', 'Fiore', 
  'De Rosa', 'Ferretti', 'Bellini', 'Basile', 'Riva', 'Donati', 'Piras', 'Vitali', 
  'Battaglia', 'Sartori', 'Neri', 'Costantini', 'Milani', 'Pagano', 'Ruggiero', 'Sorrentino', 
  'D\'Amico', 'Orlando', 'Damico', 'Negri'
];

const generateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB...');

    // Opzionale: Pulisce la collezione prima di popolare
    await Utente.deleteMany({});
    console.log('Collezione utenti svuotata.');

    const users = [];
    const usedUsernames = new Set();
    const usedEmails = new Set();
    let count = 0;

    while (count < 100) {
      // Selezione random
      const nome = nomi[Math.floor(Math.random() * nomi.length)];
      const cognome = cognomi[Math.floor(Math.random() * cognomi.length)];

      // Logica Username: [cognomenom] -> nettiluc
      // Prendo cognome intero + prime 3 lettere del nome
      const suffix = nome.substring(0, 3).toLowerCase();
      let rawUsername = `${cognome.toLowerCase()}${suffix}`;

      // Logica Email: Nome@cognome.com
      let email = `${nome}@${cognome.toLowerCase()}.com`;

      // Controllo univocità (dato che username e email sono unique nel DB)
      if (!usedUsernames.has(rawUsername) && !usedEmails.has(email)) {
        
        users.push({
          nome: nome,
          cognome: cognome,
          username: rawUsername,
          email: email,
          password: 'password', // Come richiesto
          ruolo: 'Studente'
        });

        usedUsernames.add(rawUsername);
        usedEmails.add(email);
        count++;
      }
    }

    await Utente.insertMany(users);
    console.log(`Inseriti con successo ${users.length} utenti.`);

    process.exit(0);
  } catch (error) {
    console.error('Errore durante il seeding:', error);
    process.exit(1);
  }
};

generateUsers();