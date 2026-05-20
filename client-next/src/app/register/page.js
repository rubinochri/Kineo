'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './Register.css'; 

export default function Registrazione() {
  const router = useRouter();
  
  const [datiModulo, setDatiModulo] = useState({
    nome: '',
    cognome: '',
    username: '',
    email: '',
    password: ''
  });
  
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');

  const gestisciCambioInput = (e) => { 
    setDatiModulo({ ...datiModulo, [e.target.name]: e.target.value });
  };

  const gestisciInvio = async (e) => {
    e.preventDefault();
    setErrore('');
    setSuccesso('');
    
    try {
      // 1. REGISTRAZIONE UTENTE
      await axios.post('http://localhost:5001/api/register', datiModulo);
      
      // 2. AUTO-LOGIN IMMEDIATO
      const rispostaLogin = await axios.post('http://localhost:5001/api/login', {
        email: datiModulo.email,
        password: datiModulo.password
      });

      setSuccesso('Account creato! Accesso automatico in corso...');
      
      // 3. SALVATAGGIO SESSIONE
      localStorage.setItem('userData', JSON.stringify(rispostaLogin.data.user));

      // 4. REINDIRIZZAMENTO
      setTimeout(() => {
        router.push('/catalogo');
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrore(err.response?.data?.msg || 'Errore durante la registrazione');
    }
  };

  return (
    <div className="contenitore-hero">
      
      <div className="scheda-vetro animate-enter">
        
        {/* Intestazione */}
        <div className="intestazione-registrazione">
          <h2 className="titolo-gradiente titolo-lg">
            Crea account
          </h2>
          <p className="sottotitolo-registrazione">
            Unisciti a Kineo e inizia ad imparare
          </p>
        </div>

        {/* Feedback Messaggi */}
        {errore && <div className="box-avviso avviso-errore">{errore}</div>}
        {successo && <div className="box-avviso avviso-successo">{successo}</div>}

        {/* Form */}
        <form onSubmit={gestisciInvio}>
          
          {/* Griglia per Nome e Cognome */}
          <div className="griglia-form-2">
            <div>
              <label className="etichetta-form">Nome</label>
              <input 
                className="input-form" 
                name="nome" 
                placeholder="Mario" 
                onChange={gestisciCambioInput} 
                required 
              />
            </div>
            <div>
              <label className="etichetta-form">Cognome</label>
              <input 
                className="input-form" 
                name="cognome" 
                placeholder="Rossi" 
                onChange={gestisciCambioInput} 
                required 
              />
            </div>
          </div>

          <div className="gruppo-form">
            <label className="etichetta-form">Username</label>
            <input 
              className="input-form" 
              name="username" 
              placeholder="mariorossi99" 
              onChange={gestisciCambioInput} 
              required 
            />
          </div>

          <div className="gruppo-form">
            <label className="etichetta-form">Email</label>
            <input 
              className="input-form" 
              name="email" 
              type="email" 
              placeholder="mario.rossi@email.com" 
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
              placeholder="Crea una password sicura" 
              onChange={gestisciCambioInput} 
              required 
            />
          </div>
          
          <button type="submit" className="bottone bottone-primario bottone-pieno">
            REGISTRATI
          </button>
        </form>

        {/* Footer */}
        <p className="footer-registrazione">
          Hai già un account? 
          <Link href="/login" className="link-evidenziato">
            Accedi qui
          </Link>
        </p>
      </div>
    </div>
  );
}