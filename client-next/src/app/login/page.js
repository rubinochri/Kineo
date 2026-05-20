'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import './Login.css'; 

export default function Login() {
  const router = useRouter();
  
  // Variabili di stato tradotte
  const [datiModulo, setDatiModulo] = useState({ email: '', password: '' });
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');

  const gestisciCambioInput = (e) => setDatiModulo({ ...datiModulo, [e.target.name]: e.target.value });

  const gestisciInvio = async (e) => {
    e.preventDefault();
    setErrore(''); 
    setSuccesso('');
    
    try {
      const risposta = await axios.post('http://localhost:5001/api/login', datiModulo);
    
      const datiUtente = risposta.data.user;
      
      // Salvataggio nel localStorage (chiave 'userData' rimane in inglese per compatibilità con altre pagine)
      localStorage.setItem('userData', JSON.stringify(datiUtente));
      
      setSuccesso('Accesso effettuato! Reindirizzamento...');

      setTimeout(() => {
        if (datiUtente.ruolo === 'admin') {
          router.push('/admin'); 
        } else {
          router.push('/catalogo'); 
        }
      }, 1500);

    } catch (err) {
      console.error("Errore Login:", err);
      setErrore(err.response?.data?.msg || 'Errore durante l\'accesso');
    }
  };

  return (
    <div className="contenitore-hero">
      
      <div className="scheda-vetro animate-enter">
        
        {/* Intestazione */}
        <div className="intestazione-login">
          <h2 className="titolo-gradiente titolo-lg">
            Bentornato
          </h2>
          <p className="sottotitolo-login">
            Inserisci le tue credenziali per accedere
          </p>
        </div>

        {/* Feedback */}
        {errore && <div className="box-avviso avviso-errore">{errore}</div>}
        {successo && <div className="box-avviso avviso-successo">{successo}</div>}

        {/* Form */}
        <form onSubmit={gestisciInvio}>
          
          <div className="gruppo-form">
            <label className="etichetta-form">Email</label>
            <input 
              className="input-form" 
              name="email" 
              type="email" 
              placeholder="mario.rossi@example.com" 
              onChange={gestisciCambioInput} 
              required 
            />
          </div>
          
          <div className="gruppo-form-ultimo">
            <label className="etichetta-form">Password</label>
            <input 
              className="input-form" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              onChange={gestisciCambioInput} 
              required 
            />
          </div>
          
          <button type="submit" className="bottone bottone-primario bottone-pieno">
            ACCEDI
          </button>
        </form>

        {/* Footer */}
        <p className="footer-login">
          Non hai un account? 
          <Link href="/register" className="link-evidenziato">
            Registrati ora
          </Link>
        </p>
      </div>
    </div>
  );
}