'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; 
import './Dashboard.css'; 

function Dashboard() {
  const router = useRouter();
  
  // STATO
  const [utenteLoggato, setUtenteLoggato] = useState(null);
  
  const [datiUtente, setDatiUtente] = useState(null);
  const [datiModificati, setDatiModificati] = useState(null);
  const [inModifica, setInModifica] = useState(false);
  const [messaggio, setMessaggio] = useState('');
  const [caricamento, setCaricamento] = useState(true);
  const [errori, setErrori] = useState({});
  const [commentiUtente, setCommentiUtente] = useState([]);
  const [mostraCommenti, setMostraCommenti] = useState(false);
  const [caricamentoCommenti, setCaricamentoCommenti] = useState(false);

  // 1. CONTROLLO LOGIN
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const utenteSalvato = localStorage.getItem('userData');
      if (!utenteSalvato) {
        router.push('/login');
      } else {
        setUtenteLoggato(JSON.parse(utenteSalvato));
      }
    }
  }, [router]);

  // 2. RECUPERO DATI
  useEffect(() => {
    if (utenteLoggato?.id) {
      recuperaDatiUtente();
    }
  }, [utenteLoggato]);

  const recuperaDatiUtente = async () => {
    try {
      setCaricamento(true);
      const risposta = await axios.get(`http://localhost:8000/api/user/${utenteLoggato.id}`);
      setDatiUtente(risposta.data);
      setDatiModificati(risposta.data);
      setMessaggio('');
    } catch (errore) {
      console.error(errore);
      setMessaggio(`Errore nel caricamento: ${errore.response?.data?.msg || 'Server off'}`);
    } finally {
      setCaricamento(false);
    }
  };

  const gestisciCambioInput = (e) => {
    const { name, value } = e.target;
    setDatiModificati(prec => ({ ...prec, [name]: value }));
    if (errori[name]) setErrori(prec => ({ ...prec, [name]: '' }));
  };

  const validaForm = () => {
    const nuoviErrori = {};
    if (!datiModificati.nome?.trim()) nuoviErrori.nome = 'Nome obbligatorio';
    if (!datiModificati.cognome?.trim()) nuoviErrori.cognome = 'Cognome obbligatorio';
    if (!datiModificati.username?.trim()) nuoviErrori.username = 'Username obbligatorio';
    if (!datiModificati.email?.trim()) {
      nuoviErrori.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datiModificati.email)) {
      nuoviErrori.email = 'Email non valida';
    }
    setErrori(nuoviErrori);
    return Object.keys(nuoviErrori).length === 0;
  };

  const gestisciSalvataggio = async () => {
    if (!validaForm()) return;

    try {
      setCaricamento(true);
      const risposta = await axios.put(`http://localhost:8000/api/user/${utenteLoggato.id}`, {
        nome: datiModificati.nome,
        cognome: datiModificati.cognome,
        username: datiModificati.username,
        email: datiModificati.email
      });

      setDatiUtente(risposta.data.user);
      setDatiModificati(risposta.data.user);
      
      const utenteAggiornato = {
        ...utenteLoggato,
        nome: risposta.data.user.nome,
        username: risposta.data.user.username,
        email: risposta.data.user.email
      };
      localStorage.setItem('userData', JSON.stringify(utenteAggiornato));

      setInModifica(false);
      setMessaggio('✅ Dati aggiornati con successo!');
      setTimeout(() => setMessaggio(''), 3000);
    } catch (errore) {
      console.error(errore);
      setMessaggio(`Errore: ${errore.response?.data?.msg || 'Errore salvataggio'}`);
    } finally {
      setCaricamento(false);
    }
  };

  const gestisciAnnullamento = () => {
    setDatiModificati(datiUtente);
    setInModifica(false);
    setErrori({});
    setMessaggio('');
  };

  // --- LOGOUT MODIFICATO (VAI ALLA HOME) ---
  const gestisciLogout = () => {
    localStorage.removeItem('userData'); // Pulisce i dati
    router.push('/'); // Reindirizza alla Home
  };

  const recuperaCommentiUtente = async () => {
    try {
      setCaricamentoCommenti(true);
      const risposta = await axios.get(`http://localhost:8000/api/user/${utenteLoggato.id}/commenti`);
      setCommentiUtente(risposta.data);
      setMostraCommenti(true);
    } catch (errore) {
      console.error(errore);
      setMessaggio(`Errore caricamento commenti`);
    } finally {
      setCaricamentoCommenti(false);
    }
  };

  const gestisciLikeCommento = async (idCommento) => {
    try {
      const risposta = await axios.put(`http://localhost:8000/api/commenti/${idCommento}/like`, {
        utenteId: utenteLoggato.id
      });
      setCommentiUtente(prec => prec.map(c => c._id === idCommento ? { ...c, like: risposta.data.like } : c));
    } catch (errore) {
      console.error(errore);
    }
  };

  const gestisciEliminazioneProfilo = async () => {
    if (!window.confirm('⚠️ ATTENZIONE: Azione irreversibile. Confermi?')) return;
    if (!window.confirm('Sicuro al 100%?')) return;

    try {
      setCaricamento(true);
      await axios.delete(`http://localhost:8000/api/user/${utenteLoggato.id}`);
      localStorage.removeItem('userData');
      setMessaggio('Profilo eliminato');
      setTimeout(() => router.push('/'), 1500); 
    } catch (errore) {
      setMessaggio(`Errore eliminazione`);
      setCaricamento(false);
    }
  };

  if (!utenteLoggato || (caricamento && !datiUtente)) {
    return (
        <div className="contenitore-dashboard" style={{ marginTop: '100px' }}>
            <p>Caricamento profilo...</p>
        </div>
    );
  }

  return (
    <div className="contenitore-dashboard animate-enter">
      
      {/* HEADER */}
      <div className="intestazione-dashboard">
        <h2 className="titolo-gradiente titolo-lg" style={{ margin: 0, fontSize: '2rem' }}>
          Dashboard Profilo
        </h2>
        <button onClick={gestisciLogout} className="bottone bottone-pericolo bottone-piccolo">
          Esci
        </button>
      </div>

      {/* FEEDBACK */}
      {messaggio && (
        <div className={`box-avviso ${messaggio.startsWith('✅') ? 'avviso-successo' : 'avviso-errore'}`}>
          {messaggio}
        </div>
      )}

      {/* FORM DATI */}
      <div className="scheda-dashboard">
        <h3 className="titolo-sezione">Informazioni Personali</h3>

        <div className="gruppo-input">
          <label className="etichetta-input">Nome</label>
          <input
            className={`input-dashboard ${errori.nome ? 'input-errore' : ''}`}
            name="nome"
            value={datiModificati.nome || ''}
            onChange={gestisciCambioInput}
            disabled={!inModifica}
          />
          {errori.nome && <span className="msg-errore">{errori.nome}</span>}
        </div>

        <div className="gruppo-input">
          <label className="etichetta-input">Cognome</label>
          <input
            className={`input-dashboard ${errori.cognome ? 'input-errore' : ''}`}
            name="cognome"
            value={datiModificati.cognome || ''}
            onChange={gestisciCambioInput}
            disabled={!inModifica}
          />
          {errori.cognome && <span className="msg-errore">{errori.cognome}</span>}
        </div>

        <div className="gruppo-input">
          <label className="etichetta-input">Username</label>
          <input
            className={`input-dashboard ${errori.username ? 'input-errore' : ''}`}
            name="username"
            value={datiModificati.username || ''}
            onChange={gestisciCambioInput}
            disabled={!inModifica}
          />
          {errori.username && <span className="msg-errore">{errori.username}</span>}
        </div>

        <div className="gruppo-input">
          <label className="etichetta-input">Email</label>
          <input
            type="email"
            className={`input-dashboard ${errori.email ? 'input-errore' : ''}`}
            name="email"
            value={datiModificati.email || ''}
            onChange={gestisciCambioInput}
            disabled={!inModifica}
          />
          {errori.email && <span className="msg-errore">{errori.email}</span>}
        </div>

        <div className="gruppo-input">
          <label className="etichetta-input">Ruolo</label>
          <input
            className="input-dashboard"
            value={datiUtente.ruolo || 'Studente'}
            disabled
          />
        </div>

        <div className="gruppo-input">
          <label className="etichetta-input">Data Registrazione</label>
          <input
            className="input-dashboard"
            value={datiUtente.dataRegistrazione ? new Date(datiUtente.dataRegistrazione).toLocaleDateString('it-IT') : ''}
            disabled
          />
        </div>

        <div className="bottoni-azione">
          {!inModifica ? (
            <button onClick={() => setInModifica(true)} className="bottone bottone-primario" style={{ width: '100%' }}>
              Modifica Dati
            </button>
          ) : (
            <>
              <button onClick={gestisciSalvataggio} disabled={caricamento} className="bottone bottone-successo" style={{ flex: 1 }}>
                {caricamento ? '...' : 'Salva'}
              </button>
              <button onClick={gestisciAnnullamento} disabled={caricamento} className="bottone bottone-neutro" style={{ flex: 1 }}>
                Annulla
              </button>
            </>
          )}
        </div>
        
        {!inModifica && (
          <div className="box-info">
            <p><strong>Info:</strong> Stai visualizzando i dati di <strong>{utenteLoggato?.nome}</strong>.</p>
          </div>
        )}
      </div>

      {/* COMMENTI */}
      <div className="scheda-dashboard">
        <div className="intestazione-commenti">
          <h4 className="titolo-sezione" style={{ marginBottom: 0 }}>I Tuoi Commenti</h4>
          <button
            onClick={() => mostraCommenti ? setMostraCommenti(false) : recuperaCommentiUtente()}
            disabled={caricamentoCommenti}
            className="bottone bottone-secondario bottone-piccolo"
          >
            {caricamentoCommenti ? 'Caricamento...' : mostraCommenti ? 'Nascondi' : 'Visualizza'}
          </button>
        </div>

        {mostraCommenti && (
          <div className="lista-commenti">
            {commentiUtente.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Nessun commento trovato.</p>
            ) : (
              commentiUtente.map((commento) => {
                const haMessoLike = commento.like?.includes(utenteLoggato.id);
                return (
                  <div key={commento._id} className="elemento-commento">
                    <div className="meta-commento">
                      <strong>Video: {commento.videoId?.titolo || 'Video rimosso'}</strong>
                      <span>{new Date(commento.dataCreazione).toLocaleDateString('it-IT')}</span>
                    </div>
                    <p className="testo-commento">{commento.testo}</p>
                    
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <button
                        onClick={() => gestisciLikeCommento(commento._id)}
                        className={`bottone-like ${haMessoLike ? 'piaciuto' : ''}`}
                      >
                        <span>{haMessoLike ? '❤️' : '🤍'}</span>
                        <span>{commento.like?.length || 0}</span>
                      </button>
                      {commento.parentCommentoId && (
                        <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>↳ Risposta</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ZONA PERICOLOSA */}
      <div className="zona-pericolosa">
        <h4 className="titolo-pericolo">Zona Pericolosa</h4>
        <p className="descrizione-pericolo">
          L'eliminazione del profilo è permanente. Tutti i tuoi dati verranno persi per sempre.
        </p>
        <button onClick={gestisciEliminazioneProfilo} disabled={caricamento} className="bottone-outline-pericolo">
          Elimina Profilo Definitivamente
        </button>
      </div>

    </div>
  );
}

export default Dashboard;