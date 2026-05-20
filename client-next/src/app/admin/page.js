'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; 
import './AdminDashboard.css';

export default function DashboardAmministratore() {
  const router = useRouter();
  
  // --- STATI GENERALI ---
  const [schedaAttiva, setSchedaAttiva] = useState('video');
  const [messaggio, setMessaggio] = useState({ testo: '', tipo: '' });
  const [autorizzato, setAutorizzato] = useState(false);
  
  // Dati
  const [listaVideo, setListaVideo] = useState([]);
  const [utenti, setUtenti] = useState([]);
  const [commenti, setCommenti] = useState([]);

  // --- STATI FORM VIDEO ---
  const [datiForm, setDatiForm] = useState({
    titolo: '', url: '', livelloDifficolta: 'A1', copertina: '', descrizione: '', serie: '', episodio: ''
  });
  const [datiSottotitoli, setDatiSottotitoli] = useState({ id: '', json: '' });
  const [inModifica, setInModifica] = useState(false);
  const [idModifica, setIdModifica] = useState(null);

  // --- INIT (Controllo Admin) ---
  useEffect(() => {
    const utenteStringa = localStorage.getItem('userData');
    if (!utenteStringa) {
        router.push('/login');
        return;
    }
    
    const utente = JSON.parse(utenteStringa);
    if (utente.ruolo !== 'admin') {
      alert('⛔️ Accesso Negato: Area riservata agli amministratori.');
      router.push('/catalogo');
      return;
    }

    setAutorizzato(true);
    caricaDati();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedaAttiva, router]);

  const caricaDati = () => {
    if (schedaAttiva === 'video') recuperaVideo();
    if (schedaAttiva === 'utenti') recuperaUtenti();
    if (schedaAttiva === 'commenti') recuperaCommenti();
  };

  // --- LOGOUT ADMIN ---
  const gestisciLogout = () => {
    // 1. Pulisce i dati di accesso per sicurezza
    localStorage.removeItem('userData');
    // 2. Manda alla Home Page
    router.push('/');
  };

  // --- CHIAMATE API ---
  const recuperaVideo = async () => {
    try { const risposta = await axios.get('http://localhost:5001/api/videos'); setListaVideo(risposta.data); } 
    catch (errore) { console.error(errore); }
  };
  const recuperaUtenti = async () => {
    try { const risposta = await axios.get('http://localhost:5001/api/users'); setUtenti(risposta.data); } 
    catch (errore) { console.error(errore); }
  };
  const recuperaCommenti = async () => {
    try { const risposta = await axios.get('http://localhost:5001/api/comments/all'); setCommenti(risposta.data); } 
    catch (errore) { console.error(errore); }
  };

  // --- GESTORI ---
  const gestisciCambioInput = (e) => setDatiForm({ ...datiForm, [e.target.name]: e.target.value });

  const gestisciInvioVideo = async (e) => {
    e.preventDefault();
    setMessaggio({ testo: '', tipo: '' });
    try {
      const payload = { ...datiForm };
      if (!payload.serie) delete payload.serie;
      if (!payload.episodio) delete payload.episodio;

      if (inModifica) {
        await axios.patch(`http://localhost:5001/api/videos/${idModifica}`, payload);
        setMessaggio({ testo: '✅ Video aggiornato!', tipo: 'success' });
      } else {
        const risposta = await axios.post('http://localhost:5001/api/videos', payload);
        setMessaggio({ testo: '✅ Video creato! ID: ' + risposta.data._id, tipo: 'success' });
        setDatiSottotitoli(prec => ({ ...prec, id: risposta.data._id }));
      }
      setDatiForm({ titolo: '', url: '', livelloDifficolta: 'A1', copertina: '', descrizione: '', serie: '', episodio: '' });
      setInModifica(false); setIdModifica(null); recuperaVideo();
    } catch (errore) { setMessaggio({ testo: '❌ Errore: ' + errore.message, tipo: 'error' }); }
  };

  const gestisciInvioSottotitoli = async (e) => {
    e.preventDefault();
    try {
      if (!datiSottotitoli.id) throw new Error("ID mancante.");
      let jsonParsato;
      try {
        jsonParsato = JSON.parse(datiSottotitoli.json);
      } catch (e) {
        throw new Error("JSON non valido. Controlla la sintassi.");
      }

      await axios.patch(`http://localhost:5001/api/videos/${datiSottotitoli.id}/segmenti`, { segmenti: jsonParsato });
      setMessaggio({ testo: '✅ Sottotitoli caricati con successo!', tipo: 'success' });
      setDatiSottotitoli({ id: '', json: '' });
    } catch (errore) { setMessaggio({ testo: '❌ Errore: ' + errore.message, tipo: 'error' }); }
  };

  const gestisciEliminazioneVideo = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo video?")) return;
    try { await axios.delete(`http://localhost:5001/api/videos/${id}`); recuperaVideo(); } catch (errore) {}
  };
  const gestisciEliminazioneUtente = async (id) => {
    if (!window.confirm("Eliminare utente?")) return;
    try { await axios.delete(`http://localhost:5001/api/user/${id}`); recuperaUtenti(); } catch (errore) { alert("Errore"); }
  };
  const gestisciEliminazioneCommento = async (id) => {
    if (!window.confirm("Eliminare commento?")) return;
    try { await axios.delete(`http://localhost:5001/api/admin/comments/${id}`); recuperaCommenti(); } catch (errore) { alert("Errore"); }
  };

  const gestisciModificaVideo = (video) => {
    setDatiForm({ 
      titolo: video.titolo, 
      url: video.url, 
      livelloDifficolta: video.livelloDifficolta, 
      copertina: video.copertina||'', 
      descrizione: video.descrizione||'', 
      serie: video.serie||'', 
      episodio: video.episodio||'' 
    });
    setInModifica(true); 
    setIdModifica(video._id); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!autorizzato) return <div style={{padding:50, textAlign:'center'}}>Verifica permessi...</div>;

  return (
    <div className="contenitore-hero wrapper-admin">
      <div className="scheda-vetro scheda-dashboard">
        
        {/* INTESTAZIONE & NAV */}
        <div className="intestazione-admin">
          <h2 className="titolo-gradiente titolo-lg" style={{margin:0}}>Dashboard Admin</h2>
          {/* TASTO LOGOUT */}
          <button onClick={gestisciLogout} className="bottone bottone-secondario bottone-logout">Esci</button>
        </div>

        {/* MENU SCHEDE */}
        <div className="contenitore-schede">
          <BottoneScheda etichetta="Gestione Video" attivo={schedaAttiva === 'video'} alClick={() => setSchedaAttiva('video')} />
          <BottoneScheda etichetta="Utenti" attivo={schedaAttiva === 'utenti'} alClick={() => setSchedaAttiva('utenti')} />
          <BottoneScheda etichetta="Moderazione Commenti" attivo={schedaAttiva === 'commenti'} alClick={() => setSchedaAttiva('commenti')} />
        </div>

        {/* MESSAGGI FEEDBACK */}
        {messaggio.testo && (
          <div className={`messaggio-feedback ${messaggio.tipo}`}>
            {messaggio.testo}
          </div>
        )}

        {/* --- SCHEDA: VIDEO --- */}
        {schedaAttiva === 'video' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
             <div className="sezione-admin">
                <h3 className="titolo-sezione">{inModifica ? '✏️ Modifica Video' : '➕ Aggiungi Nuovo Video'}</h3>
                <form onSubmit={gestisciInvioVideo} className="griglia-form">
                   <div className="col-span-8"><label className="etichetta-form">Titolo</label><input name="titolo" value={datiForm.titolo} onChange={gestisciCambioInput} className="input-form" required /></div>
                   <div className="col-span-4"><label className="etichetta-form">Livello</label><select name="livelloDifficolta" value={datiForm.livelloDifficolta} onChange={gestisciCambioInput} className="input-form">{['A1','A2','B1','B2','C1','C2'].map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                   <div className="col-span-12"><label className="etichetta-form">Descrizione</label><input name="descrizione" value={datiForm.descrizione} onChange={gestisciCambioInput} className="input-form" /></div>
                   <div className="col-span-6"><label className="etichetta-form">URL Video (File o Youtube)</label><input name="url" value={datiForm.url} onChange={gestisciCambioInput} className="input-form" required /></div>
                   <div className="col-span-6"><label className="etichetta-form">Copertina URL</label><input name="copertina" value={datiForm.copertina} onChange={gestisciCambioInput} className="input-form" /></div>
                   <div className="col-span-8"><label className="etichetta-form">Serie (Opzionale)</label><input name="serie" value={datiForm.serie} onChange={gestisciCambioInput} className="input-form" placeholder="Es. Friends" /></div>
                   <div className="col-span-4"><label className="etichetta-form">Episodio N.</label><input name="episodio" type="number" value={datiForm.episodio} onChange={gestisciCambioInput} className="input-form" /></div>
                   
                   <div className="col-span-12" style={{marginTop: '20px'}}>
                       <button type="submit" className={`bottone bottone-blocco ${inModifica?'bottone-secondario':'bottone-primario'}`}>
                           {inModifica ? 'Salva Modifiche' : 'Pubblica Video'}
                       </button>
                       {inModifica && <button type="button" className="bottone bottone-neutro" style={{marginLeft:10}} onClick={() => {setInModifica(false); setDatiForm({ titolo: '', url: '', livelloDifficolta: 'A1', copertina: '', descrizione: '', serie: '', episodio: '' });}}>Annulla</button>}
                   </div>
                </form>
             </div>

             <div className="sezione-admin">
                <h3 className="titolo-sezione">📝 Carica Sottotitoli (JSON)</h3>
                <form onSubmit={gestisciInvioSottotitoli} className="form-sottotitoli">
                  <input value={datiSottotitoli.id} onChange={e=>setDatiSottotitoli({...datiSottotitoli, id:e.target.value})} className="input-form input-mono" placeholder="ID Video (es. 65b3...)" required />
                  <textarea value={datiSottotitoli.json} onChange={e=>setDatiSottotitoli({...datiSottotitoli, json:e.target.value})} className="input-form input-json" placeholder='[{"start":0, "end":5, "text":"Hello world"}]' required rows={4} />
                  <button type="submit" className="bottone bottone-primario">Carica JSON</button>
                </form>
             </div>

             <Tabella intestazioni={['Titolo', 'Dettagli', 'Livello', 'Azioni']}>
               {listaVideo.map(v => (
                 <tr key={v._id}>
                   <td style={{fontWeight:'bold'}}>{v.titolo}</td>
                   <td>
                       {v.serie ? <span style={{color: '#2563eb'}}>📺 {v.serie} (Ep.{v.episodio})</span> : '🎬 Film'} 
                       <br/>
                       <small className="id-piccolo" onClick={() => {navigator.clipboard.writeText(v._id); alert('ID Copiato!')}} title="Clicca per copiare">ID: {v._id}</small>
                   </td>
                   <td><Badge testo={v.livelloDifficolta} /></td>
                   <td className="testo-destra">
                     <div className="riga-bottoni-azione">
                        <BottoneAzione icona="📝" titolo="Carica Subs" alClick={() => {setDatiSottotitoli({...datiSottotitoli, id:v._id}); window.scrollTo({top:500, behavior:'smooth'})}} />
                        <BottoneAzione icona="✏️" titolo="Modifica" alClick={() => gestisciModificaVideo(v)} />
                        <BottoneAzione icona="🗑️" titolo="Elimina" className="bottone-icona-pericolo" alClick={() => gestisciEliminazioneVideo(v._id)} />
                     </div>
                   </td>
                 </tr>
               ))}
             </Tabella>
          </div>
        )}

        {/* --- SCHEDA: UTENTI --- */}
        {schedaAttiva === 'utenti' && (
          <div>
            <h3 className="titolo-sezione">Utenti Registrati ({utenti.length})</h3>
            <Tabella intestazioni={['Nome', 'Username', 'Email', 'Ruolo', 'Azioni']}>
              {utenti.map(u => (
                <tr key={u._id}>
                  <td>{u.nome} {u.cognome}</td>
                  <td>@{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge-ruolo ${u.ruolo==='admin'?'ruolo-admin':'ruolo-utente'}`}>
                      {u.ruolo}
                    </span>
                  </td>
                  <td className="testo-destra">
                    {u.ruolo !== 'admin' && (
                      <BottoneAzione icona="🗑️" className="bottone-icona-pericolo" alClick={() => gestisciEliminazioneUtente(u._id)} />
                    )}
                  </td>
                </tr>
              ))}
            </Tabella>
          </div>
        )}

        {/* --- SCHEDA: COMMENTI --- */}
        {schedaAttiva === 'commenti' && (
          <div>
            <h3 className="titolo-sezione">Ultimi Commenti ({commenti.length})</h3>
            <Tabella intestazioni={['Autore', 'Commento', 'Video', 'Data', 'Azioni']}>
              {commenti.map(c => (
                <tr key={c._id}>
                  <td><strong>@{c.utenteId?.username || c.utente?.username || 'Eliminato'}</strong></td>
                  <td className="anteprima-commento">"{c.testo}"</td>
                  <td>{c.videoId?.titolo || 'Video rimosso'}</td>
                  <td>{new Date(c.dataCreazione).toLocaleDateString()}</td>
                  <td className="testo-destra">
                    <BottoneAzione icona="🗑️" className="bottone-icona-pericolo" alClick={() => gestisciEliminazioneCommento(c._id)} />
                  </td>
                </tr>
              ))}
            </Tabella>
          </div>
        )}

      </div>
    </div>
  );
}

// --- COMPONENTI UI RIUTILIZZABILI ---
const BottoneScheda = ({ etichetta, attivo, alClick }) => (
  <button onClick={alClick} className={`bottone-scheda ${attivo ? 'attivo' : ''}`}>
    {etichetta}
  </button>
);

const Tabella = ({ intestazioni, children }) => (
  <div className="wrapper-tabella">
    <table className="tabella-admin">
      <thead>
        <tr>
          {intestazioni.map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const Badge = ({ testo }) => {
    let colore = '#e5e7eb';
    if(testo === 'A1' || testo === 'A2') colore = '#dcfce7'; 
    if(testo === 'B1' || testo === 'B2') colore = '#fef9c3'; 
    if(testo === 'C1' || testo === 'C2') colore = '#fee2e2'; 
    return (
        <span className="badge" style={{backgroundColor: colore}}>
            {testo}
        </span>
    );
};

const BottoneAzione = ({ icona, alClick, className, titolo }) => (
  <button onClick={alClick} title={titolo} className={`bottone-azione ${className || ''}`}>
    {icona}
  </button>
);