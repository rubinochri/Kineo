import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import './App.css'; 

function VideoCard({ video, savedWords, onToggleSave, showComments = true }) {
  const playerRef = useRef(null);
  const wrapperRef = useRef(null); 

  const [tooltip, setTooltip] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // --- STATI COMMENTI ---
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyVisible, setReplyVisible] = useState({});
  const [replyText, setReplyText] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  
  // --- PLAYER LOGIC ---
  const isDirectFile = (url) => url && url.match(/\.(mp4|webm|ogg|mov)$/i);

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);
  };

  // Aggiornamento frequente per file MP4
  useEffect(() => {
    let interval = null;
    if (isPlaying && isDirectFile(video.url) && playerRef.current) {
      interval = setInterval(() => {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.currentTime);
        }
      }, 50); 
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, video.url]);

  const toggleFullscreen = () => {
    const element = wrapperRef.current; 
    if (!element) return;
    if (!document.fullscreenElement) {
      if (element.requestFullscreen) element.requestFullscreen().catch(console.error);
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const isWordSaved = (text) => {
    if (!savedWords || !text) return false;
    return savedWords.some(w => w.original.toLowerCase() === text.toLowerCase());
  };

  // ============================================================
  // 🔥 FIX SINCRONIZZAZIONE INTELLIGENTE 🔥
  // ============================================================
  const normalizeTime = (start, end) => {
    // 1. Se sono stringhe con i due punti (00:00:05,500), le convertiamo in secondi
    if (typeof start === 'string' && start.includes(':')) {
        const parse = (t) => {
            const [h, m, s] = t.split(':');
            return (parseFloat(h) * 3600) + (parseFloat(m) * 60) + parseFloat(s.replace(',', '.'));
        };
        return { s: parse(start), e: parse(end) };
    }

    const s = parseFloat(start);
    const e = parseFloat(end);
    
    // 2. LOGICA DELLA DURATA:
    // Un sottotitolo dura di solito 2-5 secondi. Non dura mai 2000 secondi.
    // Se la differenza (e - s) è maggiore di 100, significa che siamo in Millisecondi.
    const diff = e - s;
    if (diff > 50 || s > 10000) { 
        // Se la differenza è > 50 (impossibile siano secondi) o lo start è enorme -> SONO MS
        return { s: s / 1000, e: e / 1000 };
    }
    
    // Altrimenti sono già Secondi
    return { s, e };
  };

  const currentSegment = video.segmenti?.find(seg => {
    const { s, e } = normalizeTime(seg.startTime, seg.endTime);
    // Buffer di 0.1s per "agganciare" meglio il tempo
    return currentTime >= (s - 0.1) && currentTime <= (e + 0.1);
  });
  // ============================================================

  const fetchTranslation = async (text, type) => {
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
                        setIsPlaying(false); 
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
      const res = await axios.get(`http://localhost:5001/api/commenti/video/${video._id}`);
      setComments(res.data);
    } catch (err) {
      console.error("Errore recupero commenti:", err);
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
        await axios.post('http://localhost:5001/api/commenti', {
            videoId: video._id,
            utenteId: currentUserId,
            testo: newComment
        });
        setNewComment("");
        fetchComments(); 
    } catch (err) {
      console.error("Errore invio commento", err);
      alert("Errore nell'invio del commento");
    }
  };

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
    } catch (err) { console.error('Errore invio risposta', err); }
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
    } catch (err) { console.error('Errore salvataggio', err); }
  };
  const deleteComment = async (id) => {
    if (!confirm('Eliminare questo commento?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/commenti/${id}`, { data: { utenteId: currentUserId || 'guest_id' } });
      fetchComments();
    } catch (err) { console.error('Errore eliminazione', err); }
  };
  const handleLikeComment = async (commentId) => {
    if (!currentUserId) { alert('Devi essere loggato per mettere like'); return; }
    try {
      const res = await axios.put(`http://localhost:5001/api/commenti/${commentId}/like`, { utenteId: currentUserId });
      setComments(prev => prev.map(comm => {
        if (comm._id === commentId) return { ...comm, like: res.data.like };
        if (comm.risposte) {
          return { ...comm, risposte: comm.risposte.map(r => r._id === commentId ? { ...r, like: res.data.like } : r) };
        }
        return comm;
      }));
    } catch (err) { console.error('Errore like commento:', err); }
  };

  useEffect(() => {
    if (video?._id) fetchComments();
  }, [video]);


  return (
    <div className="card-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div className="kineo-player-wrapper" ref={wrapperRef} style={{ position: 'relative', background: '#000' }}>
          
          {tooltip && (
            <div className="kineo-tooltip-container" style={{ borderLeft: `6px solid ${tooltip.type === 'DB' ? '#fbc02d' : '#007bff'}` }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <span style={{ textTransform:'uppercase', fontSize:'0.7em', fontWeight:'bold', letterSpacing:'1px', color: tooltip.type === 'DB' ? '#f9a825' : '#007bff', backgroundColor: tooltip.type === 'DB' ? '#fff9c4' : '#e3f2fd', padding: '2px 8px', borderRadius: '10px' }}>{tooltip.meta}</span>
                <button onClick={() => setTooltip(null)} style={{border:'none', background:'transparent', cursor:'pointer', fontSize:'1.5em', lineHeight: '0.8', color: '#999'}}>&times;</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <h3 style={{margin:'0', color:'#333', fontSize: '1.3em'}}>"{tooltip.text}"</h3>
                 <button 
                    onClick={() => onToggleSave({ original: tooltip.text, translation: tooltip.translation, type: tooltip.meta })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8em', color: isWordSaved(tooltip.text) ? '#fbc02d' : '#e0e0e0', transition: 'color 0.2s' }}
                    title={isWordSaved(tooltip.text) ? "Rimuovi dal dizionario" : "Salva nel dizionario"}
                 >
                    {isWordSaved(tooltip.text) ? '★' : '☆'}
                 </button>
              </div>
              <p style={{margin:'5px 0 0', color:'#555', fontSize: '1em', lineHeight:'1.4'}}>{tooltip.translation}</p>
              {tooltip.type !== 'DB' && (<small style={{display:'block', marginTop:'10px', color:'#ccc', fontSize:'0.7em'}}>*Da Dizionario Locale</small>)}
            </div>
          )}

          <button className="kineo-fullscreen-btn" onClick={toggleFullscreen} title="Schermo intero">
             ⛶
          </button>

          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {video.url ? (
                isDirectFile(video.url) ? (
                  <video 
                    ref={playerRef} 
                    src={video.url} 
                    controls 
                    controlsList="nodownload nofullscreen noremoteplayback" 
                    width="100%" 
                    style={{ maxHeight: '100vh', width: '100%' }} 
                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
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
                      playing={isPlaying}
                      /* Aggiorna ogni 50ms per fluidità massima */
                      progressInterval={50} 
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onProgress={handleProgress}
                      style={{ position: 'absolute', top: 0, left: 0 }} 
                      config={{ youtube: { playerVars: { showinfo: 1, origin: window.location.origin }}}} 
                    />
                  </div>
                )
              ) : (<div style={{padding: '50px', color: 'white'}}>URL mancante</div>)}
          </div>

          {currentSegment && (
            <div className="kineo-subtitle-overlay">
              <div className="kineo-active-subtitle">
                {renderInteractiveSubtitle(currentSegment.testoInglese, currentSegment.approfondimenti)}
              </div>
            </div>
          )}
      </div>

      {showComments && (
        <div className="comments-section" style={{marginTop: '20px'}}>
          <h3>Discussione ({comments.length})</h3>
          
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

          <div className="comment-list">
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
                              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                              background: (comm.like || []).includes(currentUserId) ? '#ffe3e3' : '#f0f0f0',
                              color: (comm.like || []).includes(currentUserId) ? '#d32f2f' : '#666',
                              border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85em', fontWeight: '500'
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

                        {Array.isArray(comm.risposte) && comm.risposte.length > 0 && (
                          <div style={{marginLeft:20, marginTop:12, borderLeft: '2px solid #eee', paddingLeft: '10px'}}>
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
                                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                                        background: (r.like || []).includes(currentUserId) ? '#ffe3e3' : '#f0f0f0',
                                        color: (r.like || []).includes(currentUserId) ? '#d32f2f' : '#666',
                                        border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85em', fontWeight: '500'
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
      )}
    </div>
  );
}

export default VideoCard;