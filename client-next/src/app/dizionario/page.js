'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './DictionaryPage.css'; 

// --- COMPONENTE SCHEDA ---
const SchedaParola = ({ parola, suRimozione, suAggiornamento }) => {
  const [notaLocale, setNotaLocale] = useState(parola.notes || '');

  const gestisciBlur = () => {
    if (notaLocale !== parola.notes) {
      suAggiornamento(parola.id, { notes: notaLocale });
    }
  };

  const alternaImparato = () => {
    suAggiornamento(parola.id, { learned: !parola.learned });
  };

  return (
    <div className={`scheda-parola ${parola.learned ? 'stato-imparato' : 'stato-apprendimento'}`}>
      <div className="interno-scheda">
        <div className="principale-scheda">
            <div className="riga-intestazione-scheda">
                <h3 className="parola-originale">{parola.original}</h3>
                {parola.learned && <span className="badge-completato">COMPLETATA</span>}
            </div>
            <p className="traduzione-parola">{parola.translation}</p>
            <div className="wrapper-note">
                <textarea 
                    className="textarea-note"
                    value={notaLocale}
                    onChange={(e) => setNotaLocale(e.target.value)}
                    onBlur={gestisciBlur}
                    placeholder="Scrivi qui i tuoi appunti personali..."
                />
            </div>
        </div>
        <div className="azioni-scheda">
            <button onClick={alternaImparato} className={`bottone-scheda ${parola.learned ? 'bottone-alterna-apprendimento' : 'bottone-alterna-imparato'}`}>
                {parola.learned ? '↩️ Rimetti in studio' : 'Segna come fatta'}
            </button>
            <button onClick={() => suRimozione(parola.id)} className="bottone-scheda bottone-elimina">Elimina</button>
        </div>
      </div>
    </div>
  );
};

// --- PAGINA PRINCIPALE ---
const Dizionario = () => {
  const router = useRouter();
  const [filtro, setFiltro] = useState('TUTTE'); 
  const [paroleSalvate, setParoleSalvate] = useState([]);
  const [caricato, setCaricato] = useState(false);
  const [idUtenteCorrente, setIdUtenteCorrente] = useState(null);

  // 1. CARICAMENTO DATI UTENTE E PAROLE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const utenteStringa = localStorage.getItem('userData');
      if (!utenteStringa) {
        // Se non c'è utente, rimanda al login o mostra vuoto
        router.push('/login');
        return;
      }

      const utente = JSON.parse(utenteStringa);
      const idUtente = utente.id || utente._id;
      setIdUtenteCorrente(idUtente);

      // Carica le parole SPECIFICHE dell'utente
      // NOTA: Manteniamo la chiave 'savedWords_' in inglese per compatibilità con il Catalogo
      const salvate = localStorage.getItem(`savedWords_${idUtente}`);
      if (salvate) {
        setParoleSalvate(JSON.parse(salvate));
      }
      setCaricato(true);
    }
  }, [router]);

  // 2. FUNZIONE PER SALVARE (Con ID Utente)
  const aggiornaMemoria = (nuoveParole) => {
    setParoleSalvate(nuoveParole);
    if (idUtenteCorrente) {
        localStorage.setItem(`savedWords_${idUtenteCorrente}`, JSON.stringify(nuoveParole));
    }
  };

  const gestisciRimozioneParola = (id) => {
    if (window.confirm('Vuoi davvero eliminare questa parola?')) {
      const nuoveParole = paroleSalvate.filter(p => p.id !== id);
      aggiornaMemoria(nuoveParole);
    }
  };

  const gestisciAggiornamentoParola = (id, modifiche) => {
    const nuoveParole = paroleSalvate.map(p => p.id === id ? { ...p, ...modifiche } : p);
    aggiornaMemoria(nuoveParole);
  };

  const paroleFiltrate = paroleSalvate.filter(parola => {
    if (filtro === 'DA_RIPASSARE') return !parola.learned;
    if (filtro === 'IMPARATE') return parola.learned;
    return true;
  });

  const conteggi = {
      tutte: paroleSalvate.length,
      daRipassare: paroleSalvate.filter(p => !p.learned).length,
      imparate: paroleSalvate.filter(p => p.learned).length
  };

  if (!caricato) return <div className="contenitore-dizionario"><p>Caricamento...</p></div>;

  return (
    <div className="contenitore-dizionario animate-enter">
      <div className="contenuto-dizionario">
        
        <div className="intestazione-dizionario">
            <h1 className="titolo-pagina">Il mio Dizionario</h1>
            <Link href="/catalogo" className="link-indietro">← Torna ai Video</Link>
        </div>

        <div className="barra-filtri">
            {[
                { chiave: 'TUTTE', etichetta: 'Tutte', conteggio: conteggi.tutte }, 
                { chiave: 'DA_RIPASSARE', etichetta: 'Da Ripassare', conteggio: conteggi.daRipassare }, 
                { chiave: 'IMPARATE', etichetta: 'Già Imparate', conteggio: conteggi.imparate }
            ].map(scheda => (
                <button 
                    key={scheda.chiave} 
                    onClick={() => setFiltro(scheda.chiave)} 
                    className={`bottone-filtro ${filtro === scheda.chiave ? 'attivo' : 'inattivo'}`}
                >
                    {scheda.etichetta} ({scheda.conteggio})
                </button>
            ))}
        </div>

        {paroleSalvate.length === 0 ? (
            <div className="stato-vuoto">
                <h3>Il dizionario è vuoto</h3>
                <p>Guarda i video e clicca sulle parole per aggiungerle qui!</p>
                <Link href="/catalogo">
                    <button className="bottone-cta">Vai ai Video</button>
                </Link>
            </div>
        ) : (
            <div className="lista-parole">
                {paroleFiltrate.map((parola) => (
                    <SchedaParola 
                        key={parola.id} 
                        parola={parola} 
                        suRimozione={gestisciRimozioneParola} 
                        suAggiornamento={gestisciAggiornamentoParola} 
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dizionario;