import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import './App.css'; // Assicurati che gli stili siano importati

// 1. MODIFICA: Aggiungo savedWords e onToggleSave alle props
function VideoCard({ video, savedWords, onToggleSave, showComments = true }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null); // Ref per il fullscreen
  
  const [tooltip, setTooltip] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyVisible, setReplyVisible] = useState({});
  const [replyText, setReplyText] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const subtitleRef = useRef(null);
  
  // --- PLAYER LOGIC ---
  const isDirectFile = (url) => url && url.match(/\.(mp4|webm|ogg|mov)$/i);

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Gestione fullscreen per mantenere i sottotitoli visibili anche se l'utente preme
  // il pulsante fullscreen nativo del video (che può mettere in fullscreen l'elemento <video>
  // invece del wrapper). Se il fullscreen è applicato direttamente al <video>, usiamo
  // un fallback che sposta il fullscreen sul wrapper per mantenere i sottotitoli come discendenti.
  useEffect(() => {
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      const overlay = subtitleRef.current;
      if (!overlay) return;

      if (fsEl) {
        // In fullscreen: mantieni l'overlay visibile posizionandolo fixed su viewport.
        try {
          if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
          overlay.style.position = 'fixed';
          overlay.style.left = '50%';
          overlay.style.transform = 'translateX(-50%)';
          overlay.style.bottom = '80px';
          overlay.style.zIndex = '99999';
          overlay.style.width = 'auto';
        } catch (e) { /* ignore */ }
      } else {
        // Uscita fullscreen: riporta l'overlay dentro il wrapper principale e rimuove stili inline
        try {
          if (containerRef.current && overlay.parentElement !== containerRef.current) {
            containerRef.current.appendChild(overlay);
          }
          overlay.style.position = '';
          overlay.style.left = '';
          overlay.style.transform = '';
          overlay.style.bottom = '';
          overlay.style.zIndex = '';
          overlay.style.width = '';
        } catch (e) { /* ignore */ }
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // 2. NUOVA FUNZIONE: Controlla se la parola è già nel dizionario (per colorare la stella)
  const isWordSaved = (text) => {
    if (!savedWords || !text) return false;
    return savedWords.some(w => w.original.toLowerCase() === text.toLowerCase());
  };

  // --- SUBTITLE LOGIC ---
  // Filtra il segmento attivo in base al tempo corrente
  // (IMPORTANTE: La manteniamo perché serve per visualizzare i sottotitoli sotto al video)
  const currentSegment = video.segmenti?.find(
    seg => currentTime >= seg.startTime && currentTime <= seg.endTime
  );

  const fetchTranslation = async (text, type) => {
    // Mette in pausa il video quando si cerca una parola
    setIsPlaying(false);
    
    setTooltip({
      type: type,
      text: text,
      translation: "Ricerca nel dizionario...",
      meta: type === 'GENERIC' ? 'Parola' : 'Selezione'
    });

    try {
      const res = await axios.post('http://localhost:5001/api/translate', { text });
      setTooltip(prev => ({ ...prev, translation: res.data.translation }));
    } catch (err) {
      console.error(err);
      setTooltip(prev => ({ ...prev, translation: "Errore: impossibile contattare il dizionario." }));
    }
  };

  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderInteractiveSubtitle = (text, approfondimenti) => {
    if (!text) return null;
    const dbTokens = approfondimenti || [];
    const sortedApps = [...dbTokens].sort((a, b) => b.token.length - a.token.length);
    let parts = [text]; 

    // Logic di parsing dei token DB
    sortedApps.forEach(app => {
        const pattern = new RegExp(`(${escapeRegExp(app.token)})`, 'gi');
        const newParts = [];
        parts.forEach(part => {
            if (typeof part === 'string') {
                const split = part.split(pattern);
                split.forEach(s => {
                    if (s.toLowerCase() === app.token.toLowerCase()) {
                        newParts.push({ type: 'DB_TOKEN', content: s, data: app });
                    } else if (s !== "") {
                        newParts.push(s);
                    }
                });
            } else {
                newParts.push(part);
            }
        });
        parts = newParts;
    });

    return parts.map((part, index) => {
        if (typeof part === 'object' && part.type === 'DB_TOKEN') {
            return (
                <span 
                    key={`db-${index}`}
                    className="kineo-db-token"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(false); // Pausa al click
                        setTooltip({
                            type: 'DB',
                            text: part.data.token,
                            translation: part.data.significato,
                            meta: part.data.tipo
                        });
                    }}
                >
                    {part.content}
                </span>
            );
        }
        // Parsing parole generiche
        const words = part.split(/(\s+)/); 
        return words.map((word, wIndex) => {
            if (word.match(/^\s+$/)) return <span key={`space-${index}-${wIndex}`}>{word}</span>;
            if (word === "") return null;
            return (
                <span
                    key={`word-${index}-${wIndex}`}
                    className="kineo-word"
                    onClick={(e) => { e.stopPropagation(); fetchTranslation(word, 'GENERIC'); }}
                >
                    {word}
                </span>
            );
        });
    });
  };

  // --- COMMENTS LOGIC ---
  const fetchComments = async () => {
    try {
      // Mock API call - Sostituire con endpoint reale
      const res = await axios.get(`http://localhost:5001/api/commenti/video/${video._id}`);
      setComments(res.data);
      console.debug('Fetched comments:', res.data);
    } catch (err) {
      console.error("Errore recupero commenti:", err);
      // Non impostare dati mock; manteniamo lista vuota in caso di errore di rete/server
      setComments([]);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    if (!currentUserId) {
      alert("Devi essere loggato per pubblicare un commento");
      return;
    }
    
    try {
        // API Call
        await axios.post('http://localhost:5001/api/commenti', {
            videoId: video._id,
            utenteId: currentUserId,
            testo: newComment
        });
        setNewComment("");
        fetchComments(); // Ricarica commenti
    } catch (err) {
      console.error("Errore invio commento", err);
      alert("Errore nell'invio del commento: " + (err.response?.data?.message || err.message));
    }
  };

  // Current user (dal localStorage se presente)
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userData') || 'null') : null;
  const currentUserId = storedUser?.id || storedUser?._id || null;

  const toggleReply = (id) => {
    setReplyVisible(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReplyChange = (id, value) => {
    setReplyText(prev => ({ ...prev, [id]: value }));
  };

  const submitReply = async (parentId) => {
    const testo = (replyText[parentId] || '').trim();
    if (!testo) return;
    try {
      await axios.post('http://localhost:5001/api/commenti', {
        videoId: video._id,
        utenteId: currentUserId || 'guest_id',
        testo,
        parentCommentoId: parentId
      });
      setReplyText(prev => ({ ...prev, [parentId]: '' }));
      setReplyVisible(prev => ({ ...prev, [parentId]: false }));
      fetchComments();
    } catch (err) {
      console.error('Errore invio risposta', err);
    }
  };

  const startEdit = (comm) => {
    setEditingId(comm._id);
    setEditingText(comm.testo || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:5001/api/commenti/${id}`, {
        utenteId: currentUserId || 'guest_id',
        testo: editingText
      });
      setEditingId(null);
      setEditingText('');
      fetchComments();
    } catch (err) {
      console.error('Errore salvataggio commento', err);
    }
  };

  const deleteComment = async (id) => {
    if (!confirm('Eliminare questo commento?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/commenti/${id}`, { data: { utenteId: currentUserId || 'guest_id' } });
      fetchComments();
    } catch (err) {
      console.error('Errore eliminazione commento', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!currentUserId) {
      alert('Devi essere loggato per mettere like');
      return;
    }
    try {
      const res = await axios.put(`http://localhost:5001/api/commenti/${commentId}/like`, {
        utenteId: currentUserId
      });
      // Aggiorna lo stato locale dei commenti
      setComments(prev => prev.map(comm => {
        if (comm._id === commentId) {
          return { ...comm, like: res.data.like };
        }
        // Aggiorna anche nelle risposte nidificate
        if (comm.risposte) {
          return {
            ...comm,
            risposte: comm.risposte.map(r => 
              r._id === commentId ? { ...r, like: res.data.like } : r
            )
          };
        }
        return comm;
      }));
    } catch (err) {
      console.error('Errore like commento:', err);
    }
  };

  useEffect(() => {
    if (video?._id) {
        fetchComments();
    }
  }, [video]);


  return (
    <div className="card-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* TOOLTIP (MODALE DEFINIZIONI) */}
      {tooltip && (
        <div style={{ 
            position: 'fixed', bottom: '20px', right: '20px', width: '300px', 
            backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', 
            borderRadius: '10px', padding: '20px', 
            borderLeft: `6px solid ${tooltip.type === 'DB' ? '#fbc02d' : '#007bff'}`, 
            zIndex: 9999, animation: 'slideIn 0.3s ease-out' 
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
            <span style={{ textTransform:'uppercase', fontSize:'0.7em', fontWeight:'bold', letterSpacing:'1px', color: tooltip.type === 'DB' ? '#f9a825' : '#007bff', backgroundColor: tooltip.type === 'DB' ? '#fff9c4' : '#e3f2fd', padding: '2px 8px', borderRadius: '10px' }}>{tooltip.meta}</span>
            <button onClick={() => setTooltip(null)} style={{border:'none', background:'transparent', cursor:'pointer', fontSize:'1.5em', lineHeight: '0.8', color: '#999'}}>&times;</button>
          </div>
          
          {/* 3. MODIFICA: Titolo della parola + Bottone Stella */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <h3 style={{margin:'0', color:'#333', fontSize: '1.3em'}}>"{tooltip.text}"</h3>
             
             <button 
                onClick={() => onToggleSave({ 
                    original: tooltip.text, 
                    translation: tooltip.translation, 
                    type: tooltip.meta 
                })}
                style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '1.8em',
                    // Se la parola è salvata diventa GIALLA, altrimenti GRIGIA
                    color: isWordSaved(tooltip.text) ? '#fbc02d' : '#e0e0e0',
                    transition: 'color 0.2s'
                }}
                title={isWordSaved(tooltip.text) ? "Rimuovi dal dizionario" : "Salva nel dizionario"}
             >
                {/* Mostra stella piena o vuota */}
                {isWordSaved(tooltip.text) ? '★' : '☆'}
             </button>
          </div>

          <p style={{margin:'5px 0 0', color:'#555', fontSize: '1em', lineHeight:'1.4'}}>{tooltip.translation}</p>
          {tooltip.type !== 'DB' && (<small style={{display:'block', marginTop:'10px', color:'#ccc', fontSize:'0.7em'}}>*Da Dizionario Locale</small>)}
        </div>
      )}

      {/* WRAPPER PRINCIPALE (GESTISCE IL FULLSCREEN) */}
      <div className="kineo-player-wrapper" ref={containerRef}>
          
          <div className="video-with-comments">
            <div className="video-column">
              {/* SOTTOTITOLI: overlay classica in basso sul video */}

              {/* PULSANTE FULLSCREEN CUSTOM */}
              <button className="kineo-fullscreen-btn" onClick={toggleFullscreen}>
                 ⛶ Modalità Cinema
              </button>

              {/* VIDEO PLAYER */}
              {video.url ? (
                isDirectFile(video.url) ? (
                  <div style={{ position: 'relative' }}>
                    <video 
                      ref={playerRef} 
                      src={video.url} 
                      controls 
                      width="100%" 
                      style={{ display: 'block', maxHeight: '80vh', width: '100%' }} 
                      onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {currentSegment && (
                      <div className="kineo-subtitle-overlay" ref={subtitleRef}>
                        <div className="kineo-active-subtitle">
                          {renderInteractiveSubtitle(currentSegment.testoInglese, currentSegment.approfondimenti)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <ReactPlayer 
                      ref={playerRef} 
                      key={video.url} 
                      url={video.url} 
                      controls={true} 
                      width="100%" 
                      height="100%" 
                      playing={isPlaying}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onProgress={handleProgress}
                      style={{ position: 'absolute', top: 0, left: 0 }} 
                      config={{ youtube: { playerVars: { showinfo: 1, origin: window.location.origin }}}} 
                    />
                    {currentSegment && (
                      <div className="kineo-subtitle-overlay" ref={subtitleRef}>
                        <div className="kineo-active-subtitle">
                          {renderInteractiveSubtitle(currentSegment.testoInglese, currentSegment.approfondimenti)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div style={{padding: '50px', color: 'white'}}>URL mancante</div>
              )}
            </div>

            {showComments && (
            <div className="comments-column">
              <div className="comments-section">
                <h3>Discussione ({comments.length})</h3>
                
                {/* Input Commento */}
                <div className="comment-input-area">
                    <textarea 
                        className="comment-input" 
                        rows="3" 
                        placeholder="Scrivi un commento o fai una domanda..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button className="btn-primary" onClick={handlePostComment}>Invia</button>
                </div>

                {/* Lista Commenti CON SCROLL */}
                <div className="comment-list" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
                      {comments.map((comm) => {
                          const ownerIdRaw = comm.utenteId?._id ?? comm.utenteId ?? comm.utente;
                          const ownerId = ownerIdRaw != null ? ownerIdRaw.toString() : null;
                          const isOwner = currentUserId && ownerId && currentUserId.toString() === ownerId;
                          return (
                          <div key={comm._id} className="single-comment">
                              <div className="comment-header">
                                  <strong>{comm.utenteId?.username || comm.utente?.username || comm.utente || "Utente"}</strong>
                                  <span>{new Date(comm.dataCreazione).toLocaleDateString()}</span>
                              </div>

                              <div className="comment-body">
                                {editingId === comm._id ? (
                                  <div>
                                    <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={3} style={{width: '100%'}} />
                                    <div>
                                      <button onClick={() => saveEdit(comm._id)} className="btn-primary">Salva</button>
                                      <button onClick={cancelEdit} style={{marginLeft:8}}>Annulla</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>{comm.testo}</div>
                                )}
                              </div>

                              <div style={{marginTop:8, display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
                                <button
                                  onClick={() => handleLikeComment(comm._id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    background: (comm.like || []).includes(currentUserId) ? '#ffe3e3' : '#f0f0f0',
                                    color: (comm.like || []).includes(currentUserId) ? '#d32f2f' : '#666',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontSize: '0.85em',
                                    fontWeight: '500'
                                  }}
                                >
                                  <span>{(comm.like || []).includes(currentUserId) ? '❤️' : '🤍'}</span>
                                  <span>{(comm.like || []).length}</span>
                                </button>
                                <button onClick={() => toggleReply(comm._id)}>Rispondi</button>
                                {isOwner && (
                                  <>
                                    <button onClick={() => startEdit(comm)} style={{marginLeft:8}}>Modifica</button>
                                    <button onClick={() => deleteComment(comm._id)} style={{marginLeft:8}}>Elimina</button>
                                  </>
                                )}
                              </div>

                              {replyVisible[comm._id] && (
                                <div style={{marginTop:8}}>
                                  <textarea rows={2} value={replyText[comm._id] || ''} onChange={(e) => handleReplyChange(comm._id, e.target.value)} style={{width:'100%'}} />
                                  <div>
                                    <button onClick={() => submitReply(comm._id)} className="btn-primary">Invia risposta</button>
                                    <button onClick={() => toggleReply(comm._id)} style={{marginLeft:8}}>Annulla</button>
                                  </div>
                                </div>
                              )}

                              {/* Risposte nidificate */}
                              {Array.isArray(comm.risposte) && comm.risposte.length > 0 && (
                                <div style={{marginLeft:20, marginTop:12}}>
                                  {comm.risposte.map(r => {
                                    const rOwnerIdRaw = r.utenteId?._id ?? r.utenteId ?? r.utente;
                                    const rOwnerId = rOwnerIdRaw != null ? rOwnerIdRaw.toString() : null;
                                    const rIsOwner = currentUserId && rOwnerId && currentUserId.toString() === rOwnerId;
                                    return (
                                      <div key={r._id} className="single-comment reply-comment" style={{marginBottom:10}}>
                                        <div className="comment-header">
                                          <strong>{r.utenteId?.username || r.utente || 'Utente'}</strong>
                                          <span style={{marginLeft:8}}>{new Date(r.dataCreazione).toLocaleDateString()}</span>
                                        </div>
                                        <div className="comment-body">
                                          {editingId === r._id ? (
                                            <div>
                                              <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={2} style={{width:'100%'}} />
                                              <div>
                                                <button onClick={() => saveEdit(r._id)} className="btn-primary">Salva</button>
                                                <button onClick={cancelEdit} style={{marginLeft:8}}>Annulla</button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>{r.testo}</div>
                                          )}
                                        </div>
                                        <div style={{marginTop:6, display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
                                          <button
                                            onClick={() => handleLikeComment(r._id)}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '4px 10px',
                                              background: (r.like || []).includes(currentUserId) ? '#ffe3e3' : '#f0f0f0',
                                              color: (r.like || []).includes(currentUserId) ? '#d32f2f' : '#666',
                                              border: 'none',
                                              borderRadius: '12px',
                                              cursor: 'pointer',
                                              fontSize: '0.85em',
                                              fontWeight: '500'
                                            }}
                                          >
                                            <span>{(r.like || []).includes(currentUserId) ? '❤️' : '🤍'}</span>
                                            <span>{(r.like || []).length}</span>
                                          </button>
                                          <button onClick={() => toggleReply(r._id)}>Rispondi</button>
                                          {rIsOwner && (
                                            <>
                                              <button onClick={() => startEdit(r)} style={{marginLeft:8}}>Modifica</button>
                                              <button onClick={() => deleteComment(r._id)} style={{marginLeft:8}}>Elimina</button>
                                            </>
                                          )}
                                        </div>

                                        {replyVisible[r._id] && (
                                          <div style={{marginTop:8}}>
                                            <textarea rows={2} value={replyText[r._id] || ''} onChange={(e) => handleReplyChange(r._id, e.target.value)} style={{width:'100%'}} />
                                            <div>
                                              <button onClick={() => submitReply(r._id)} className="btn-primary">Invia risposta</button>
                                              <button onClick={() => toggleReply(r._id)} style={{marginLeft:8}}>Annulla</button>
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
            </div>
            )}
          </div>
      </div>
    </div>
  );
}

export default VideoCard;