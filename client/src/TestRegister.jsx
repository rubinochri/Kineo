// Importiamo l'hook 'useState' per gestire i dati variabili (lo stato) del componente
import { useState } from 'react';
// Importiamo 'axios', la libreria standard per effettuare richieste HTTP al backend
import axios from 'axios';

// Definizione del componente funzionale React (che verrà esportato per essere usato altrove)
export default function TestRegister() {
  
  // 1. INIZIALIZZAZIONE DELLO STATO (State)
  // 'formData': è l'oggetto che contiene i dati attuali del form.
  // 'setFormData': è la funzione magica che useremo per aggiornare 'formData' e ridisegnare la pagina.
  const [formData, setFormData] = useState({
    nome: '',      
    cognome: '',   
    username: '',
    email: '',
    password: ''
  });

  // 2. GESTIONE DELL'INPUT (handleChange)
  // Questa funzione parte ogni volta che digiti un carattere in QUALSIASI input.
  const handleChange = (e) => {
    setFormData({ 
      ...formData, // "Spread Operator": Copia tutti i vecchi dati presenti (es. se scrivo la mail, non voglio perdere il nome).
      [e.target.name]: e.target.value // Aggiorna dinamicamente SOLO il campo modificato. 
      // 'e.target.name' prende il "name" dell'input HTML (es. "email"), 'e.target.value' prende quello che hai scritto.
    });
  };

  // 3. INVIO DEL FORM (handleSubmit)
  // 'async' indica che questa funzione farà operazioni che richiedono tempo (chiamata al server)
  const handleSubmit = async (e) => {
    e.preventDefault(); // IMPORTANTE: Impedisce al browser di ricaricare la pagina (comportamento standard dei form HTML)
    
    try {
      // axios.post(URL, DATI): Invia una richiesta POST al backend.
      // 'await': Dice al codice "fermati qui e aspetta che il server risponda prima di continuare".
      const res = await axios.post('http://localhost:5001/api/register', formData);
      
      // Se il server risponde 200/201 (OK), stampiamo il messaggio di successo inviato dal backend (res.data.msg)
      alert('✅ Successo: ' + res.data.msg);
      
    } catch (err) {
      // Se c'è un errore (es. server spento, email doppia), entriamo qui.
      console.error(err);
      // Cerchiamo il messaggio di errore specifico mandato dal backend, altrimenti messaggio generico
      alert('❌ Errore: ' + (err.response?.data?.msg || 'Errore server'));
    }
  };

  // 4. LA GRAFICA (JSX)
  // Questo è ciò che vede l'utente. Sembra HTML ma è JSX (JavaScript XML).
  return (
    <div style={{ padding: '50px', color: 'black' }}>
      <h2>Test Registrazione Completa</h2>
      
      {/* Quando clicchi il bottone nel form, scatta l'evento onSubmit che chiama handleSubmit */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        
        {/* INPUT: 
            name="nome" -> Fondamentale, deve coincidere con la chiave nell'oggetto formData iniziale.
            onChange={handleChange} -> Collega la logica: ogni tasto premuto aggiorna lo stato.
        */}
        <input name="nome" placeholder="Nome" onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="cognome" placeholder="Cognome" onChange={handleChange} required style={{ padding: '8px' }} />
        
        <input name="username" placeholder="Username" onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={{ padding: '8px' }} />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ padding: '8px' }} />
        
        {/* Il button type="submit" fa scattare l'onSubmit del form */}
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          REGISTRA SU ATLAS
        </button>
      </form>
    </div>
  );
}