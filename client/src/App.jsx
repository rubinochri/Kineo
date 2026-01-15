import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TestRegister from './TestRegister';
import TestVideo from './TestVideo'; 

// --- COMPONENTE VIDEOCARD ---
function VideoCard({ video }) {
  const playerRef = useRef(null);
  
  // STATO UNICO PER IL TOOLTIP
  const [tooltip, setTooltip] = useState(null);

  const isDirectFile = (url) => {
    return url && url.match(/\.(mp4|webm|ogg|mov)$/i); 
  };

  const handleSeek = (seconds) => {
    if (!playerRef.current) return;
    const timeToSeek = parseFloat(seconds);
    if (isDirectFile(video.url)) {
      playerRef.current.currentTime = timeToSeek;
      playerRef.current.play(); 
    } else {
      playerRef.current.seekTo(timeToSeek, 'seconds');
    }
  };

  // --- NUOVA FUNZIONE: CHIAMATA AL SERVER PER TRADUZIONE ---
  const fetchTranslation = async (text, type) => {
    // 1. Mostra stato di caricamento immediato
    setTooltip({
      type: type, // 'GENERIC' o 'SELECTION'
      text: text,
      translation: "Ricerca nel dizionario...",
      meta: type === 'GENERIC' ? 'Parola' : 'Selezione'
    });

    try {
      // 2. Chiamata al tuo Backend (Dizionario Locale)
      const res = await axios.post('http://localhost:5001/api/translate', { text });
      
      // 3. Aggiorna il tooltip con il risultato dal DB
      setTooltip(prev => ({
        ...prev,
        translation: res.data.translation
      }));
    } catch (err) {
      console.error(err);
      setTooltip(prev => ({
        ...prev,
        translation: "Errore: impossibile contattare il dizionario."
      }));
    }
  };

  // --- GESTIONE SELEZIONE TESTO ("STRISCIARE") ---
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Se c'è testo selezionato (> 1 carattere)
    if (selectedText.length > 1) {
      // Chiamiamo la funzione di traduzione reale
      fetchTranslation(selectedText, 'SELECTION');
    }
  };

  // --- HELPER PER REGEX ---
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // --- RENDERING AVANZATO DEL TESTO ---
  const renderInteractiveText = (text, approfondimenti) => {
    const dbTokens = approfondimenti || [];
    const sortedApps = [...dbTokens].sort((a, b) => b.token.length - a.token.length);

    let parts = [text]; 

    // A. PRIMO PASSAGGIO: Token del DB (Approfondimenti Video)
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

    // B. SECONDO PASSAGGIO: Parole Generiche
    return parts.map((part, index) => {
        // CASO 1: È un token del DB Video (Giallo) -> NON serve chiamare API, abbiamo già i dati
        if (typeof part === 'object' && part.type === 'DB_TOKEN') {
            return (
                <span 
                    key={`db-${index}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setTooltip({
                            type: 'DB',
                            text: part.data.token,
                            translation: part.data.significato,
                            meta: part.data.tipo
                        });
                    }}
                    style={{
                        cursor: 'pointer',
                        backgroundColor: '#fff9c4', 
                        borderBottom: '2px solid #fbc02d',
                        fontWeight: 'bold',
                        margin: '0 2px',
                        padding: '0 2px',
                        borderRadius: '3px'
                    }}
                >
                    {part.content}
                </span>
            );
        }

        // CASO 2: È una stringa normale -> Splittiamo parola per parola
        const words = part.split(/(\s+)/); 
        return words.map((word, wIndex) => {
            if (word.match(/^\s+$/)) return <span key={`space-${index}-${wIndex}`}>{word}</span>;
            if (word === "") return null;

            // Se è una parola generica -> Click chiama fetchTranslation
            return (
                <span
                    key={`word-${index}-${wIndex}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        fetchTranslation(word, 'GENERIC'); // <--- Chiamata API qui
                    }}
                    style={{
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#007bff'}
                    onMouseLeave={(e) => e.target.style.color = 'inherit'}
                >
                    {word}
                </span>
            );
        });
    });
  };

  return (
    <div style={{ marginBottom: '60px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', position: 'relative' }}>
      
      <h2>
        {video.titolo} 
        <span style={{fontSize:'0.6em', background:'#eee', padding:'2px 5px', marginLeft: '10px', borderRadius:'4px'}}>
          {video.livelloDifficolta}
        </span>
      </h2>

      {/* --- TOOLTIP UNIFICATO --- */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '300px',
          backgroundColor: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          borderRadius: '10px',
          padding: '20px',
          borderLeft: `6px solid ${tooltip.type === 'DB' ? '#fbc02d' : '#007bff'}`, 
          zIndex: 1000,
          fontFamily: 'Arial, sans-serif',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
            <span style={{
                textTransform:'uppercase', fontSize:'0.7em', fontWeight:'bold', letterSpacing:'1px', 
                color: tooltip.type === 'DB' ? '#f9a825' : '#007bff',
                backgroundColor: tooltip.type === 'DB' ? '#fff9c4' : '#e3f2fd',
                padding: '2px 8px', borderRadius: '10px'
            }}>
                {tooltip.meta}
            </span>
            <button 
                onClick={() => setTooltip(null)} 
                style={{border:'none', background:'transparent', cursor:'pointer', fontSize:'1.5em', lineHeight: '0.8', color: '#999'}}
            >
                &times;
            </button>
          </div>
          <h3 style={{margin:'0 0 8px 0', color:'#333', fontSize: '1.3em'}}>"{tooltip.text}"</h3>
          <p style={{margin:0, color:'#555', fontSize: '1em', lineHeight:'1.4'}}>{tooltip.translation}</p>
          
          {tooltip.type !== 'DB' && (
             <small style={{display:'block', marginTop:'10px', color:'#ccc', fontSize:'0.7em'}}>
               *Da Dizionario Locale
             </small>
          )}
        </div>
      )}

      {/* PLAYER */}
      <div style={{ width: '100%', maxWidth: '800px', margin: '20px 0', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
          {video.url ? (
              isDirectFile(video.url) ? (
                  <video ref={playerRef} src={video.url} controls width="100%" style={{ display: 'block' }} />
              ) : (
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                      <ReactPlayer 
                          ref={playerRef} 
                          key={video.url} url={video.url} controls={true} width="100%" height="100%" 
                          style={{ position: 'absolute', top: 0, left: 0 }}
                          config={{ youtube: { playerVars: { showinfo: 1, origin: window.location.origin }}}}
                      />
                  </div>
              )
          ) : (
              <div style={{padding: '20px', color: 'white', textAlign: 'center'}}>URL mancante</div>
          )}
      </div>

      {video.descrizione && <p><i>{video.descrizione}</i></p>}

      {/* --- SOTTOTITOLI INTERATTIVI --- */}
      {video.segmenti && video.segmenti.length > 0 && (
          <div 
            onMouseUp={handleTextSelection} 
            style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '15px', marginTop: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}
          >
          {video.segmenti.map((seg, index) => (
              <div key={index} style={{ marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
              
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span 
                    onClick={() => handleSeek(seg.startTime)}
                    style={{ fontWeight: 'bold', color: '#007bff', minWidth: '50px', fontSize: '0.9em', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    [{Math.floor(seg.startTime)}]s
                  </span>

                  <span style={{ fontSize: '1.1em', color: '#333', marginLeft: '8px', lineHeight: '1.6' }}>
                    {renderInteractiveText(seg.testoInglese, seg.approfondimenti)}
                  </span>
              </div>

              {seg.testoItaliano && (
                  <div style={{ marginLeft: '58px', marginTop: '4px', color: '#666', fontStyle: 'italic', fontSize: '0.95em' }}>
                    {seg.testoItaliano}
                  </div>
              )}

              </div>
          ))}
          </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// --- HOME PAGE ---
function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/videos')
      .then(response => {
        setVideos(response.data);
      })
      .catch(error => console.error("Errore:", error));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <h1>Kineo Player</h1>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <Link to="/test" style={btnStyle}>Test Registrazione</Link>
            <Link to="/test-video" style={{...btnStyle, background: '#28a745'}}>Test Carica Video</Link>
        </nav>
      </div>
      {videos.map(video => <VideoCard key={video._id} video={video} />)}
    </div>
  );
}

const btnStyle = { padding: '10px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' };

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestRegister />} />
        <Route path="/test-video" element={<TestVideo />} />
      </Routes>
    </Router>
  );
}

export default App;