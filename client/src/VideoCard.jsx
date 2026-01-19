import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import './App.css'; // Assicurati che gli stili siano importati

<<<<<<< HEAD
// 1. MODIFICA: Aggiungo savedWords e onToggleSave alle props
function VideoCard({ video, savedWords, onToggleSave }) {
=======
function VideoCard({ video, utenteId }) { // Assumo utenteId venga passato come prop o ottenuto dal context
>>>>>>> 956305a30c7d0b21eb0ba55aea21e968493df67f
  const playerRef = useRef(null);
  const containerRef = useRef(null); // Ref per il fullscreen
  
  const [tooltip, setTooltip] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  
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

<<<<<<< HEAD
  // 2. NUOVA FUNZIONE: Controlla se la parola è già nel dizionario (per colorare la stella)
  const isWordSaved = (text) => {
    if (!savedWords || !text) return false;
    return savedWords.some(w => w.original.toLowerCase() === text.toLowerCase());
  };
=======
  // --- SUBTITLE LOGIC ---
  // Filtra il segmento attivo in base al tempo corrente
  const currentSegment = video.segmenti?.find(
    seg => currentTime >= seg.startTime && currentTime <= seg.endTime
  );
>>>>>>> 956305a30c7d0b21eb0ba55aea21e968493df67f

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
      const res = await axios.get(`http://localhost:5001/api/comments/${video._id}`);
      setComments(res.data);
    } catch (err) {
      console.log("Mock: Impossibile recuperare commenti (Backend non connesso per questa route)");
      // Mock data per visualizzazione UI se backend fallisce
      setComments([
        { _id: 1, testo: "Ottimo video per imparare i phrasal verbs!", utente: "Mario", dataCreazione: new Date() },
        { _id: 2, testo: "Non ho capito il minuto 2:30", utente: "Luigi", dataCreazione: new Date() },
        { _id: 3, testo: "Davvero utile la funzione dizionario.", utente: "Anna", dataCreazione: new Date() },
        { _id: 4, testo: "Potreste aggiungere più video livello C1?", utente: "Marco", dataCreazione: new Date() },
        { _id: 5, testo: "Grazie per il contenuto!", utente: "Giulia", dataCreazione: new Date() }
      ]);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
        // Mock API Call
        await axios.post('http://localhost:5001/api/comments', {
            videoId: video._id,
            utenteId: utenteId || "guest_id", // Fallback se non autenticato
            testo: newComment
        });
        setNewComment("");
        fetchComments(); // Ricarica commenti
    } catch (err) {
        console.error("Errore invio commento", err);
        // Optimistic UI update per demo
        setComments(prev => [{ _id: Date.now(), testo: newComment, utente: "Me", dataCreazione: new Date() }, ...prev]);
        setNewComment("");
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
          
          {/* OVERLAY SOTTOTITOLI DINAMICI */}
          {currentSegment && (
              <div className="kineo-subtitle-overlay">
                  <div className="kineo-active-subtitle">
                      {renderInteractiveSubtitle(currentSegment.testoInglese, currentSegment.approfondimenti)}
                      {/* RIMOSSO SOTTOTITOLO ITALIANO */}
                  </div>
              </div>
          )}

          {/* PULSANTE FULLSCREEN CUSTOM */}
          <button className="kineo-fullscreen-btn" onClick={toggleFullscreen}>
             ⛶ Modalità Cinema
          </button>

          {/* VIDEO PLAYER */}
          {video.url ? (
              isDirectFile(video.url) ? (
                  <video 
                    ref={playerRef} 
                    src={video.url} 
                    controls 
                    width="100%" 
                    style={{ display: 'block', maxHeight: '100vh', width: '100%' }} 
                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
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
                  </div>
              )
          ) : (<div style={{padding: '50px', color: 'white'}}>URL mancante</div>)}
      </div>

      {/* SEZIONE COMMENTI */}
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
          <div className="comment-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {comments.map((comm) => (
                  <div key={comm._id} className="single-comment">
                      <div className="comment-header">
                          <strong>{comm.utente?.username || comm.utente || "Utente"}</strong>
                          <span>{new Date(comm.dataCreazione).toLocaleDateString()}</span>
                      </div>
                      <div className="comment-body">
                          {comm.testo}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

export default VideoCard;