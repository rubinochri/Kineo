'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation'; 
import VideoCard from '../../components/VideoCard'; 
import './VideoLibrary.css';

export default function LibreriaVideo() {
  const router = useRouter();
  
  const [listaVideo, setListaVideo] = useState([]); 
  const [utente, setUtente] = useState(null); 
  const [paroleSalvate, setParoleSalvate] = useState([]);

  // UI & Filtri
  const [testoRicerca, setTestoRicerca] = useState('');
  const [livelloDifficolta, setLivelloDifficolta] = useState('');
  const [modalitaVisualizzazione, setModalitaVisualizzazione] = useState('FILM'); // 'FILM' o 'SERIE'
  const [videoSelezionato, setVideoSelezionato] = useState(null);
  const [episodiCorrelati, setEpisodiCorrelati] = useState([]); 

  // 1. CARICAMENTO UTENTE E VIDEO
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const utenteSalvato = localStorage.getItem('userData');
        if (!utenteSalvato) {
            router.push('/login'); 
        } else {
            const utenteParsato = JSON.parse(utenteSalvato);
            setUtente(utenteParsato);
            recuperaVideo();
            
            // CARICAMENTO DIZIONARIO SPECIFICO PER UTENTE DA API
            const idUtente = utenteParsato.id || utenteParsato._id;
            axios.get(`http://localhost:8000/api/user/${idUtente}/dizionario`)
                .then(res => {
                    setParoleSalvate(res.data);
                })
                .catch(err => {
                    console.error("Errore caricamento dizionario:", err);
                    setParoleSalvate([]);
                });
        }
    }
  }, [router]);

  // 2. LOGICA SALVATAGGIO SPECIFICA PER UTENTE DA API
  const gestisciSalvataggioParola = async (datiParola) => {
    if (!utente) return; // Sicurezza

    const idUtente = utente.id || utente._id;
    const esiste = paroleSalvate.some(p => p.original.toLowerCase() === datiParola.original.toLowerCase());
    
    if (esiste) {
      const parolaTrovata = paroleSalvate.find(p => p.original.toLowerCase() === datiParola.original.toLowerCase());
      if (parolaTrovata) {
        try {
          const res = await axios.delete(`http://localhost:8000/api/user/${idUtente}/dizionario/${parolaTrovata.id || parolaTrovata._id}`);
          setParoleSalvate(res.data);
        } catch (err) {
          console.error("Errore rimozione parola:", err);
        }
      }
    } else {
      try {
        const res = await axios.post(`http://localhost:8000/api/user/${idUtente}/dizionario`, {
          original: datiParola.original,
          translation: datiParola.translation,
          type: datiParola.type || 'GENERIC'
        });
        setParoleSalvate(res.data);
      } catch (err) {
        console.error("Errore salvataggio parola:", err);
      }
    }
  };

  const recuperaVideo = async () => {
    try {
      const risposta = await axios.get('http://localhost:8000/api/videos');
      const ordinati = risposta.data.sort((a, b) => new Date(b.dataCaricamento) - new Date(a.dataCaricamento));
      setListaVideo(ordinati);
    } catch (errore) {
      console.error("Errore caricamento video:", errore);
    }
  };

  useEffect(() => {
    if (videoSelezionato) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [videoSelezionato]);

  const ottieniContenutoDaMostrare = () => {
    const filtratiBase = listaVideo.filter(video => 
      (video.titolo.toLowerCase().includes(testoRicerca.toLowerCase()) ||
       (video.serie && video.serie.toLowerCase().includes(testoRicerca.toLowerCase())) ||
       (video.descrizione && video.descrizione.toLowerCase().includes(testoRicerca.toLowerCase()))) &&
      (livelloDifficolta === '' || video.livelloDifficolta === livelloDifficolta) 
    );

    if (modalitaVisualizzazione === 'FILM') {
      return filtratiBase
        .filter(v => !v.serie)
        .map(v => ({ type: 'VIDEO', ...v, videoPrincipale: v }));
    } else { 
      const gruppi = {};
      filtratiBase.filter(v => v.serie).forEach(video => {
        if (!gruppi[video.serie]) gruppi[video.serie] = [];
        gruppi[video.serie].push(video);
      });

      return Object.keys(gruppi).map(nomeSerie => {
        const episodi = gruppi[nomeSerie].sort((a, b) => a.episodio - b.episodio);
        return {
          type: 'SERIE', 
          _id: `serie-${nomeSerie}`,
          serie: nomeSerie,
          videoPrincipale: episodi[0],
          episodi: episodi,
          conteggio: episodi.length
        };
      });
    }
  };

  const gestisciClickCard = (elemento) => {
    if (elemento.type === 'SERIE') {
      setVideoSelezionato(elemento.episodi[0]); 
      setEpisodiCorrelati(elemento.episodi);
    } else {
      setVideoSelezionato(elemento.videoPrincipale);
      setEpisodiCorrelati([]);
    }
  };

  if (!utente) return null;

  const contenutoDaMostrare = ottieniContenutoDaMostrare();

  return (
    <div className="contenitore-libreria">
      
      {/* --- BARRA DI NAVIGAZIONE --- */}
      <nav className="navigazione-libreria">
        
       <div className="sezione-nav">
        <Link href="/dizionario" style={{ textDecoration: 'none' }}>
            <button className="bottone-dizionario">
              <span></span> 
              <span>Il mio dizionario</span>
              <span className="badge-conteggio">
                  {paroleSalvate ? paroleSalvate.length : 0}
              </span>
          </button>
        </Link>
       </div>

        <div className="sezione-nav nav-centro">
            <div className="testo-brand">Kineo</div>
        </div>

        <div className="sezione-nav nav-fine">
            <Link href="/dashboard" className="link-profilo-utente">
              <span className="nome-utente">{utente.name}</span>
              <div className="avatar-utente">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </Link>
        </div>
      </nav>

      <div className="corpo-libreria">
        
        {!videoSelezionato && (
          <>
            <h2 className="intestazione-controlli">Catalogo Video</h2>
            
            <div className="contenitore-ricerca">
                 <input
                   type="text"
                   className="input-ricerca"
                   value={testoRicerca}
                   onChange={(e) => setTestoRicerca(e.target.value)}
                   placeholder={modalitaVisualizzazione === 'FILM' ? "Cerca film..." : "Cerca serie..."}
                 />
            </div>

            <div className="contenitore-switch">
              <div className="traccia-switch">
                <div 
                  className="cursore-switch" 
                  style={{ left: modalitaVisualizzazione === 'FILM' ? '4px' : '50%' }}
                ></div>
                <button 
                  onClick={() => setModalitaVisualizzazione('FILM')} 
                  className={`bottone-switch ${modalitaVisualizzazione === 'FILM' ? 'attivo attivo-film' : ''}`}
                >
                  Film
                </button>
                <button 
                  onClick={() => setModalitaVisualizzazione('SERIE')} 
                  className={`bottone-switch ${modalitaVisualizzazione === 'SERIE' ? 'attivo attivo-serie' : ''}`}
                >
                  Serie TV
                </button>
              </div>
            </div>

            <div className="contenitore-filtri">
            <span className="etichetta-filtro">Livello:</span>
            <button onClick={() => setLivelloDifficolta('')} className={`bottone-filtro ${livelloDifficolta === '' ? 'attivo' : ''}`}>Tutti</button>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(livello => (
                <button key={livello} onClick={() => setLivelloDifficolta(livello)} className={`bottone-filtro ${livelloDifficolta === livello ? 'attivo' : ''}`}>
                {livello}
                </button>
            ))}
            </div>
          </>
        )}

        {!videoSelezionato && (
          contenutoDaMostrare.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
              {modalitaVisualizzazione === 'FILM' ? "Nessun video trovato." : "Nessuna serie trovata."}
            </p>
          ) : (
            <div className="griglia-video">
              {contenutoDaMostrare.map(elemento => (
                <div key={elemento._id} className="scheda-video" onClick={() => gestisciClickCard(elemento)}>
                  {elemento.type === 'SERIE' && (<div className="badge-serie">SERIE • {elemento.conteggio} EP</div>)}
                  <div className="miniatura-scheda" style={{ backgroundImage: elemento.videoPrincipale.copertina ? `url("${elemento.videoPrincipale.copertina}")` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <div className="overlay-miniatura"></div>
                      <span className="icona-play">{elemento.type === 'SERIE' ? '≣' : '▶'}</span>
                      <span className="badge-livello">{elemento.videoPrincipale.livelloDifficolta}</span>
                  </div>
                  <div className="info-scheda">
                    <h3 className="titolo-scheda">{elemento.type === 'SERIE' ? elemento.serie : elemento.videoPrincipale.titolo}</h3>
                    <p className="descrizione-scheda">{elemento.videoPrincipale.descrizione || "Nessuna descrizione."}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* MODALE PLAYER */}
        {videoSelezionato && (
          <div className="overlay-modale">
            <button onClick={() => setVideoSelezionato(null)} className="bottone-chiudi-modale">&times;</button>
            <div className="contenuto-modale">
              <div className="layout-player">
                <div className="contenitore-player">
                  <div className="wrapper-player">
                      <VideoCard key={videoSelezionato._id} video={videoSelezionato} savedWords={paroleSalvate} onToggleSave={gestisciSalvataggioParola} />
                  </div>
                </div>
                {episodiCorrelati.length > 0 && (
                  <div className="sidebar-episodi">
                    <div className="intestazione-episodi"><h3 className="titolo-episodi">Episodi</h3><span className="sottotitolo-episodi">{videoSelezionato.serie}</span></div>
                    <div className="lista-episodi">
                      {episodiCorrelati.map(ep => (
                        <div key={ep._id} onClick={() => setVideoSelezionato(ep)} className={`elemento-episodio ${videoSelezionato._id === ep._id ? 'attivo' : ''}`}>
                          <div className="numero-ep">{ep.episodio}.</div>
                          <div className="info-ep"><div className="titolo-ep">{ep.titolo}</div></div>
                          {videoSelezionato._id === ep._id && <span className="icona-play-ep">▶</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}