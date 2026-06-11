'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import './VideoCard.css'; 

function VideoCard({ video, savedWords, onToggleSave, showComments = true }) {
  
  // DEBUG: Verifica cosa arriva al componente
  console.log("--- DEBUG: VideoCard Render ---");
  console.log("Video ID:", video?._id);
  console.log("Video URL:", video?.url);

  // Mapping props
  const paroleSalvate = savedWords;
  const onToggleSalva = onToggleSave;
  const mostraCommenti = showComments;

  const playerRef = useRef(null);
  const wrapperRef = useRef(null); 

  // --- STATI ---
  const [tooltip, setTooltip] = useState(null);
  const [tempoCorrente, setTempoCorrente] = useState(0);
  const [inRiproduzione, setInRiproduzione] = useState(false);
  
  // --- STATI COMMENTI ---
  const [commenti, setCommenti] = useState([]);
  const [nuovoCommento, setNuovoCommento] = useState("");
  const [rispostaVisibile, setRispostaVisibile] = useState({});
  const [testoRisposta, setTestoRisposta] = useState({});
  const [idModifica, setIdModifica] = useState(null);
  const [testoModifica, setTestoModifica] = useState("");
  
  // --- LOGICA PLAYER ---
  const eFileDiretto = (url) => {
    const isDirect = url && url.match(/\.(mp4|webm|ogg|mov)$/i);
    // DEBUG: Verifica rilevamento tipo file
    if (url) console.log(`Is Direct File? ${!!isDirect} (URL: ${url})`);
    return isDirect;
  };

  const gestisciProgresso = (stato) => {
    setTempoCorrente(stato.playedSeconds);
  };

  useEffect(() => {
    let intervallo = null;
    if (inRiproduzione && eFileDiretto(video.url) && playerRef.current) {
      intervallo = setInterval(() => {
        if (playerRef.current) {
          setTempoCorrente(playerRef.current.currentTime);
        }
      }, 50); 
    }
    return () => {
      if (intervallo) clearInterval(intervallo);
    };
  }, [inRiproduzione, video.url]);

  const attivaSchermoIntero = () => {
    const elemento = wrapperRef.current; 
    if (!elemento) return;
    if (!document.fullscreenElement) {
      if (elemento.requestFullscreen) elemento.requestFullscreen().catch(console.error);
      else if (elemento.webkitRequestFullscreen) elemento.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const eParolaSalvata = (testo) => {
    if (!paroleSalvate || !testo) return false;
    return paroleSalvate.some(w => w.original.toLowerCase() === testo.toLowerCase());
  };

  // --- NORMALIZZAZIONE TEMPO ---
  const normalizzaTempo = (inizio, fine) => {
    if (typeof inizio === 'string' && inizio.includes(':')) {
        const parsa = (t) => {
            const [h, m, s] = t.split(':');
            return (parseFloat(h) * 3600) + (parseFloat(m) * 60) + parseFloat(s.replace(',', '.'));
        };
        return { s: parsa(inizio), e: parsa(fine) };
    }
    const s = parseFloat(inizio);
    const e = parseFloat(fine);
    const diff = e - s;
    if (diff > 50 || s > 10000) { 
        return { s: s / 1000, e: e / 1000 };
    }
    return { s, e };
  };

  const segmentoCorrente = video.segmenti?.find(seg => {
    const { s, e } = normalizzaTempo(seg.startTime, seg.endTime);
    return tempoCorrente >= (s - 0.1) && tempoCorrente <= (e + 0.1);
  });

  const richiediTraduzione = async (testo, tipo) => {
    setInRiproduzione(false); 
    setTooltip({
      tipo: tipo,
      testo: testo,
      traduzione: "Ricerca nel dizionario...",
      meta: tipo === 'GENERIC' ? 'Parola' : 'Selezione'
    });

    try {
      const res = await axios.post('http://localhost:8000/api/translate', { text: testo });
      setTooltip(prev => ({ ...prev, traduzione: res.data.translation }));
    } catch (err) {
      console.error("Errore traduzione:", err);
      setTooltip(prev => ({ ...prev, traduzione: "Errore: impossibile contattare il dizionario." }));
    }
  };

  const scappaRegExp = (stringa) => stringa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderizzaSottotitoloInterattivo = (testo, approfondimenti) => {
    if (!testo) return null;

    const dbTokens = approfondimenti || [];
    const sortedApps = [...dbTokens].sort((a, b) => b.token.length - a.token.length);

    let parti = [testo]; 

    sortedApps.forEach(app => {
        const pattern = new RegExp(`(${scappaRegExp(app.token)})`, 'gi');
        const nuoveParti = [];
        parti.forEach(parte => {
            if (typeof parte === 'string') {
                const split = parte.split(pattern);
                split.forEach(s => {
                    if (s.toLowerCase() === app.token.toLowerCase()) {
                        nuoveParti.push({ type: 'DB_TOKEN', contenuto: s, dati: app });
                    } else if (s !== "") {
                        nuoveParti.push(s);
                    }
                });
            } else {
                nuoveParti.push(parte);
            }
        });
        parti = nuoveParti;
    });

    return parti.map((parte, index) => {
        if (typeof parte === 'object' && parte.type === 'DB_TOKEN') {
            return (
                <span 
                    key={`db-${index}`}
                    className="kineo-db-token"
                    onClick={(e) => {
                        e.stopPropagation();
                        setInRiproduzione(false); 
                        setTooltip({
                            tipo: 'DB',
                            testo: parte.dati.token,
                            traduzione: parte.dati.significato,
                            meta: parte.dati.tipo
                        });
                    }}
                >
                    {parte.contenuto}
                </span>
            );
        }
        const parole = parte.split(/(\s+)/); 
        return parole.map((parola, wIndex) => {
            if (parola.match(/^\s+$/)) return <span key={`space-${index}-${wIndex}`}>{parola}</span>;
            if (parola === "") return null;
            return (
                <span
                    key={`word-${index}-${wIndex}`}
                    className="kineo-word"
                    onClick={(e) => { e.stopPropagation(); richiediTraduzione(parola, 'GENERIC'); }}
                >
                    {parola}
                </span>
            );
        });
    });
  };

  // --- LOGICA COMMENTI ---
  const caricaCommenti = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/commenti/video/${video._id}`);
      setCommenti(res.data);
    } catch (err) {
      console.error("Errore recupero commenti:", err);
      setCommenti([]);
    }
  };

  const gestisciInvioCommento = async () => {
    if (!nuovoCommento.trim()) return;
    if (!idUtenteCorrente) {
      alert("Devi essere loggato per pubblicare un commento");
      return;
    }
    try {
        const res = await axios.post('http://localhost:8000/api/commenti', {
            videoId: video._id,
            utenteId: idUtenteCorrente,
            testo: nuovoCommento
        });
        const commentoCreato = res.data;
        const utenteMock = {
          _id: idUtenteCorrente,
          id: idUtenteCorrente,
          username: utenteSalvato?.username,
          nome: utenteSalvato?.nome
        };
        commentoCreato.utente = commentoCreato.utente || utenteMock;
        commentoCreato.utenteId = typeof commentoCreato.utenteId === 'object' && commentoCreato.utenteId !== null
          ? { ...commentoCreato.utenteId, ...utenteMock }
          : utenteMock;

        setCommenti(prev => [commentoCreato, ...prev]);
        setNuovoCommento("");
        caricaCommenti(); 
    } catch (err) {
      console.error("Errore invio commento", err);
      alert("Errore nell'invio del commento");
    }
  };

  const utenteSalvato = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userData') || 'null') : null;
  const idUtenteCorrente = utenteSalvato?.id || utenteSalvato?._id || null;

  const alternaRisposta = (id) => {
    setRispostaVisibile(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const gestisciCambioRisposta = (id, valore) => {
    setTestoRisposta(prev => ({ ...prev, [id]: valore }));
  };
  const inviaRisposta = async (idPadre) => {
    const testo = (testoRisposta[idPadre] || '').trim();
    if (!testo) return;
    try {
      const res = await axios.post('http://localhost:8000/api/commenti', {
        videoId: video._id,
        utenteId: idUtenteCorrente || 'guest_id',
        testo,
        parentCommentoId: idPadre
      });
      const rispostaCreata = res.data;
      const utenteMock = {
        _id: idUtenteCorrente,
        id: idUtenteCorrente,
        username: utenteSalvato?.username,
        nome: utenteSalvato?.nome
      };
      rispostaCreata.utente = rispostaCreata.utente || utenteMock;
      rispostaCreata.utenteId = typeof rispostaCreata.utenteId === 'object' && rispostaCreata.utenteId !== null
        ? { ...rispostaCreata.utenteId, ...utenteMock }
        : utenteMock;

      setCommenti(prev => prev.map(comm => {
        if (comm._id === idPadre) {
          const risposteEsistenti = comm.risposte || [];
          return {
            ...comm,
            risposte: [...risposteEsistenti, rispostaCreata]
          };
        }
        return comm;
      }));
      setTestoRisposta(prev => ({ ...prev, [idPadre]: '' }));
      setRispostaVisibile(prev => ({ ...prev, [idPadre]: false }));
      caricaCommenti();
    } catch (err) { console.error('Errore invio risposta', err); }
  };
  const iniziaModifica = (comm) => {
    setIdModifica(comm._id);
    setTestoModifica(comm.testo || '');
  };
  const annullaModifica = () => {
    setIdModifica(null);
    setTestoModifica('');
  };
  const salvaModifica = async (id) => {
    try {
      await axios.put(`http://localhost:8000/api/commenti/${id}`, {
        utenteId: idUtenteCorrente || 'guest_id',
        testo: testoModifica
      });
      setIdModifica(null);
      setTestoModifica('');
      caricaCommenti();
    } catch (err) { console.error('Errore salvataggio', err); }
  };
  const eliminaCommento = async (id) => {
    if (!confirm('Eliminare questo commento?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/commenti/${id}`, { data: { utenteId: idUtenteCorrente || 'guest_id' } });
      caricaCommenti();
    } catch (err) { console.error('Errore eliminazione', err); }
  };
  const gestisciLikeCommento = async (idCommento) => {
    if (!idUtenteCorrente) { alert('Devi essere loggato per mettere like'); return; }
    try {
      const res = await axios.put(`http://localhost:8000/api/commenti/${idCommento}/like`, { utenteId: idUtenteCorrente });
      setCommenti(prev => prev.map(comm => {
        if (comm._id === idCommento) return { ...comm, like: res.data.like };
        if (comm.risposte) {
          return { ...comm, risposte: comm.risposte.map(r => r._id === idCommento ? { ...r, like: res.data.like } : r) };
        }
        return comm;
      }));
    } catch (err) { console.error('Errore like commento:', err); }
  };

  useEffect(() => {
    if (video?._id) caricaCommenti();
  }, [video]);

  return (
    <div className="card-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div className="kineo-player-wrapper" ref={wrapperRef} style={{ position: 'relative', background: '#000' }}>
          
          {tooltip && (
            <div className="kineo-tooltip-container" style={{ borderLeft: `6px solid ${tooltip.tipo === 'DB' ? '#fbc02d' : '#007bff'}` }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <span style={{ textTransform:'uppercase', fontSize:'0.7em', fontWeight:'bold', letterSpacing:'1px', color: tooltip.tipo === 'DB' ? '#f9a825' : '#007bff', backgroundColor: tooltip.tipo === 'DB' ? '#fff9c4' : '#e3f2fd', padding: '2px 8px', borderRadius: '10px' }}>{tooltip.meta}</span>
                <button onClick={() => setTooltip(null)} style={{border:'none', background:'transparent', cursor:'pointer', fontSize:'1.5em', lineHeight: '0.8', color: '#999'}}>&times;</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <h3 style={{margin:'0', color:'#333', fontSize: '1.3em'}}>"{tooltip.testo}"</h3>
                 <button 
                    onClick={() => onToggleSalva({ original: tooltip.testo, translation: tooltip.traduzione, type: tooltip.meta })}
                    className={`bottone-salva-stella ${eParolaSalvata(tooltip.testo) ? 'salvata' : 'non-salvata'}`}
                    title={eParolaSalvata(tooltip.testo) ? "Rimuovi dal dizionario" : "Salva nel dizionario"}
                 >
                    {eParolaSalvata(tooltip.testo) ? '★' : '☆'}
                 </button>
              </div>
              <p style={{margin:'5px 0 0', color:'#555', fontSize: '1em', lineHeight:'1.4'}}>{tooltip.traduzione}</p>
              {tooltip.tipo !== 'DB' && (<small style={{display:'block', marginTop:'10px', color:'#ccc', fontSize:'0.7em'}}>*Da Dizionario Locale</small>)}
            </div>
          )}

          <button className="kineo-fullscreen-btn" onClick={attivaSchermoIntero} title="Schermo intero">
             ⛶
          </button>

          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {video.url ? (
                eFileDiretto(video.url) ? (
                  <video 
                    ref={playerRef} 
                    src={video.url} 
                    controls 
                    controlsList="nodownload nofullscreen noremoteplayback" 
                    width="100%" 
                    style={{ maxHeight: '100vh', width: '100%' }} 
                    onTimeUpdate={(e) => setTempoCorrente(e.target.currentTime)}
                    onPlay={() => {
                        console.log("NATIVE VIDEO: Play started");
                        setInRiproduzione(true);
                    }}
                    onPause={() => {
                        console.log("NATIVE VIDEO: Paused");
                        setInRiproduzione(false);
                    }}
                    onLoadStart={() => console.log("NATIVE VIDEO: Load Start...")}
                    onLoadedMetadata={() => console.log("NATIVE VIDEO: Metadata Loaded")}
                    onCanPlay={() => console.log("NATIVE VIDEO: Can Play")}
                    onError={(e) => {
                        console.error("--- DEBUG ERROR: NATIVE VIDEO ---");
                        console.error("Event:", e);
                        console.error("Error Code:", e.target.error ? e.target.error.code : 'No Code');
                        console.error("Error Message:", e.target.error ? e.target.error.message : 'No Message');
                        console.error("Network State:", e.target.networkState);
                        console.error("Current Src:", e.target.currentSrc);
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                    <ReactPlayer 
                      ref={playerRef} 
                      key={video.url} 
                      url={video.url} 
                      controls={true} 
                      width="100%" 
                      height="100%" 
                      playing={inRiproduzione}
                      progressInterval={50} 
                      onPlay={() => {
                        console.log("REACT PLAYER: Play");
                        setInRiproduzione(true);
                      }}
                      onPause={() => {
                        console.log("REACT PLAYER: Pause");
                        setInRiproduzione(false);
                      }}
                      onProgress={gestisciProgresso}
                      onReady={() => console.log("REACT PLAYER: Ready")}
                      onStart={() => console.log("REACT PLAYER: Start")}
                      onError={(e) => {
                        console.error("--- DEBUG ERROR: REACT PLAYER ---");
                        console.error("Error Object:", e);
                      }}
                      style={{ position: 'absolute', top: 0, left: 0 }} 
                      config={{ 
                          file: { 
                              attributes: { 
                                  referrerPolicy: "no-referrer"
                              } 
                          },
                          youtube: { playerVars: { showinfo: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' }}
                      }} 
                    />
                  </div>
                )
              ) : (<div style={{padding: '50px', color: 'white'}}>URL mancante</div>)}
          </div>

          {segmentoCorrente && (
            <div className="kineo-subtitle-overlay">
              <div className="kineo-active-subtitle">
                {renderizzaSottotitoloInterattivo(segmentoCorrente.testoInglese, segmentoCorrente.approfondimenti)}
              </div>
            </div>
          )}
      </div>

      {mostraCommenti && (
        <div className="comments-section" style={{marginTop: '20px'}}>
          <h3>Discussione ({commenti.length})</h3>
          
          <div className="comment-input-area">
              <textarea 
                  className="comment-input" 
                  rows="3" 
                  placeholder="Scrivi un commento o fai una domanda..." 
                  value={nuovoCommento}
                  onChange={(e) => setNuovoCommento(e.target.value)}
              />
              <button className="btn-primary" onClick={gestisciInvioCommento}>Invia</button>
          </div>

          <div className="comment-list">
                {commenti.map((comm) => {
                    const idProprietarioRaw = comm.utenteId?._id ?? comm.utenteId ?? comm.utente;
                    const idProprietario = idProprietarioRaw != null ? idProprietarioRaw.toString() : null;
                    const eProprietario = idUtenteCorrente && idProprietario && idUtenteCorrente.toString() === idProprietario;
                    
                    return (
                    <div key={comm._id} className="single-comment">
                        <div className="comment-header">
                            <strong>{comm.utente?.username || comm.utente?.nome || comm.utenteId?.username || comm.utenteId?.nome || "Utente"}</strong>
                            <span>{new Date(comm.dataCreazione).toLocaleDateString()}</span>
                        </div>

                        <div className="comment-body">
                          {idModifica === comm._id ? (
                            <div>
                              <textarea value={testoModifica} onChange={(e) => setTestoModifica(e.target.value)} rows={3} style={{width: '100%'}} />
                              <div>
                                <button onClick={() => salvaModifica(comm._id)} className="btn-primary">Salva</button>
                                <button onClick={annullaModifica} style={{marginLeft:8}}>Annulla</button>
                              </div>
                            </div>
                          ) : (
                            <div>{comm.testo}</div>
                          )}
                        </div>

                        <div style={{marginTop:8, display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
                          <button
                            onClick={() => gestisciLikeCommento(comm._id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                              background: (comm.like || []).includes(idUtenteCorrente) ? '#ffe3e3' : '#f0f0f0',
                              color: (comm.like || []).includes(idUtenteCorrente) ? '#d32f2f' : '#666',
                              border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85em', fontWeight: '500'
                            }}
                          >
                            <span>{(comm.like || []).includes(idUtenteCorrente) ? '❤️' : '🤍'}</span>
                            <span>{(comm.like || []).length}</span>
                          </button>
                          <button onClick={() => alternaRisposta(comm._id)}>Rispondi</button>
                          {eProprietario && (
                            <>
                              <button onClick={() => iniziaModifica(comm)} style={{marginLeft:8}}>Modifica</button>
                              <button onClick={() => eliminaCommento(comm._id)} style={{marginLeft:8}}>Elimina</button>
                            </>
                          )}
                        </div>

                        {rispostaVisibile[comm._id] && (
                          <div style={{marginTop:8}}>
                            <textarea rows={2} value={testoRisposta[comm._id] || ''} onChange={(e) => gestisciCambioRisposta(comm._id, e.target.value)} style={{width:'100%'}} />
                            <div>
                              <button onClick={() => inviaRisposta(comm._id)} className="btn-primary">Invia risposta</button>
                              <button onClick={() => alternaRisposta(comm._id)} style={{marginLeft:8}}>Annulla</button>
                            </div>
                          </div>
                        )}

                        {Array.isArray(comm.risposte) && comm.risposte.length > 0 && (
                          <div style={{marginLeft:20, marginTop:12, borderLeft: '2px solid #eee', paddingLeft: '10px'}}>
                            {comm.risposte.map(r => {
                              const rIdProprietarioRaw = r.utenteId?._id ?? r.utenteId ?? r.utente;
                              const rIdProprietario = rIdProprietarioRaw != null ? rIdProprietarioRaw.toString() : null;
                              const rEProprietario = idUtenteCorrente && rIdProprietario && idUtenteCorrente.toString() === rIdProprietario;
                              return (
                                <div key={r._id} className="single-comment reply-comment" style={{marginBottom:10}}>
                                  <div className="comment-header">
                                    <strong>{r.utente?.username || r.utente?.nome || r.utenteId?.username || r.utenteId?.nome || "Utente"}</strong>
                                    <span style={{marginLeft:8}}>{new Date(r.dataCreazione).toLocaleDateString()}</span>
                                  </div>
                                  <div className="comment-body">
                                    {idModifica === r._id ? (
                                      <div>
                                        <textarea value={testoModifica} onChange={(e) => setTestoModifica(e.target.value)} rows={2} style={{width:'100%'}} />
                                        <div>
                                          <button onClick={() => salvaModifica(r._id)} className="btn-primary">Salva</button>
                                          <button onClick={annullaModifica} style={{marginLeft:8}}>Annulla</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>{r.testo}</div>
                                    )}
                                  </div>
                                  <div style={{marginTop:6, display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
                                    <button
                                      onClick={() => gestisciLikeCommento(r._id)}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                                        background: (r.like || []).includes(idUtenteCorrente) ? '#ffe3e3' : '#f0f0f0',
                                        color: (r.like || []).includes(idUtenteCorrente) ? '#d32f2f' : '#666',
                                        border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85em', fontWeight: '500'
                                      }}
                                    >
                                      <span>{(r.like || []).includes(idUtenteCorrente) ? '❤️' : '🤍'}</span>
                                      <span>{(r.like || []).length}</span>
                                    </button>
                                    <button onClick={() => alternaRisposta(r._id)}>Rispondi</button>
                                    {rEProprietario && (
                                      <>
                                        <button onClick={() => iniziaModifica(r)} style={{marginLeft:8}}>Modifica</button>
                                        <button onClick={() => eliminaCommento(r._id)} style={{marginLeft:8}}>Elimina</button>
                                      </>
                                    )}
                                  </div>

                                  {rispostaVisibile[r._id] && (
                                    <div style={{marginTop:8}}>
                                      <textarea rows={2} value={testoRisposta[r._id] || ''} onChange={(e) => gestisciCambioRisposta(r._id, e.target.value)} style={{width:'100%'}} />
                                      <div>
                                        <button onClick={() => inviaRisposta(r._id)} className="btn-primary">Invia risposta</button>
                                        <button onClick={() => alternaRisposta(r._id)} style={{marginLeft:8}}>Annulla</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  );
                })}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCard;