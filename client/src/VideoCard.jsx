import { useState, useRef } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';

// 1. MODIFICA: Aggiungo savedWords e onToggleSave alle props
function VideoCard({ video, savedWords, onToggleSave }) {
  const playerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const isDirectFile = (url) => url && url.match(/\.(mp4|webm|ogg|mov)$/i);

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

  // 2. NUOVA FUNZIONE: Controlla se la parola è già nel dizionario (per colorare la stella)
  const isWordSaved = (text) => {
    if (!savedWords || !text) return false;
    return savedWords.some(w => w.original.toLowerCase() === text.toLowerCase());
  };

  const fetchTranslation = async (text, type) => {
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

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText.length > 1) {
      fetchTranslation(selectedText, 'SELECTION');
    }
  };

  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderInteractiveText = (text, approfondimenti) => {
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
                    onClick={(e) => {
                        e.stopPropagation();
                        setTooltip({
                            type: 'DB',
                            text: part.data.token,
                            translation: part.data.significato,
                            meta: part.data.tipo
                        });
                    }}
                    style={{ cursor: 'pointer', backgroundColor: '#fff9c4', borderBottom: '2px solid #fbc02d', fontWeight: 'bold', margin: '0 2px', padding: '0 2px', borderRadius: '3px' }}
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
                    onClick={(e) => { e.stopPropagation(); fetchTranslation(word, 'GENERIC'); }}
                    style={{ cursor: 'pointer', transition: 'color 0.2s' }}
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
      <h2>{video.titolo} <span style={{fontSize:'0.6em', background:'#eee', padding:'2px 5px', marginLeft: '10px', borderRadius:'4px'}}>{video.livelloDifficolta}</span></h2>
      
      {tooltip && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '300px', backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', borderRadius: '10px', padding: '20px', borderLeft: `6px solid ${tooltip.type === 'DB' ? '#fbc02d' : '#007bff'}`, zIndex: 1000, fontFamily: 'Arial, sans-serif', animation: 'slideIn 0.3s ease-out' }}>
          
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

      <div style={{ width: '100%', maxWidth: '800px', margin: '20px 0', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
          {video.url ? (
              isDirectFile(video.url) ? (
                  <video ref={playerRef} src={video.url} controls width="100%" style={{ display: 'block' }} />
              ) : (
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                      <ReactPlayer ref={playerRef} key={video.url} url={video.url} controls={true} width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} config={{ youtube: { playerVars: { showinfo: 1, origin: window.location.origin }}}} />
                  </div>
              )
          ) : (<div style={{padding: '20px', color: 'white', textAlign: 'center'}}>URL mancante</div>)}
      </div>
      {video.descrizione && <p><i>{video.descrizione}</i></p>}
      {video.segmenti && video.segmenti.length > 0 && (
          <div onMouseUp={handleTextSelection} style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '15px', marginTop: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          {video.segmenti.map((seg, index) => (
              <div key={index} style={{ marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span onClick={() => handleSeek(seg.startTime)} style={{ fontWeight: 'bold', color: '#007bff', minWidth: '50px', fontSize: '0.9em', cursor: 'pointer', textDecoration: 'underline' }}>[{Math.floor(seg.startTime)}]s</span>
                  <span style={{ fontSize: '1.1em', color: '#333', marginLeft: '8px', lineHeight: '1.6' }}>{renderInteractiveText(seg.testoInglese, seg.approfondimenti)}</span>
              </div>
              {seg.testoItaliano && (<div style={{ marginLeft: '58px', marginTop: '4px', color: '#666', fontStyle: 'italic', fontSize: '0.95em' }}>{seg.testoItaliano}</div>)}
              </div>
          ))}
          </div>
      )}
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
export default VideoCard;