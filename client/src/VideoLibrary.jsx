import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard'; 

export default function VideoLibrary() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  
  // Stato per la gestione dei commenti
  const [commentiPerVideo, setCommentiPerVideo] = useState({});
  const [nuovoCommentoPerVideo, setNuovoCommentoPerVideo] = useState({});
  const [caricandoCommenti, setCaricandoCommenti] = useState({});
  const [risposteVisibili, setRisposteVisibili] = useState({});
  const [nuovaRispostaPerCommento, setNuovaRispostaPerCommento] = useState({});
  const [likedCommenti, setLikedCommenti] = useState({});
  
  // Stato per filtri e UI
  const [ricerca, setRicerca] = useState('');
  const [livelloDifficolta, setLivelloDifficolta] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  // 1. Controllo Login
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchVideos();
    }
  }, [navigate]);

  // 2. Carica Video dal DB
  const fetchVideos = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/videos');
      setVideos(res.data);
      res.data.forEach(video => {
        fetchCommenti(video._id);
      });
    } catch (err) {
      console.error("Errore caricamento video:", err);
    }
  };

  const fetchCommenti = async (videoId) => {
    try {
      setCaricandoCommenti(prev => ({ ...prev, [videoId]: true }));
      const res = await axios.get(`http://localhost:5001/api/commenti/video/${videoId}`);
      setCommentiPerVideo(prev => ({ ...prev, [videoId]: res.data }));
    } catch (err) {
      console.error("Errore caricamento commenti:", err);
    } finally {
      setCaricandoCommenti(prev => ({ ...prev, [videoId]: false }));
    }
  };

  // --- GESTIONE INVIO COMMENTI E LIKE ---
  const handleInviaCommento = async (videoId, e) => {
    e.preventDefault();
    const testoCommento = nuovoCommentoPerVideo[videoId]?.trim();
    if (!testoCommento) return alert("Scrivi un commento!");
    if (!user || !user.id) return alert("Devi essere loggato!");

    try {
      const res = await axios.post('http://localhost:5001/api/commenti', {
        utenteId: user.id, videoId: videoId, testo: testoCommento
      });
      setCommentiPerVideo(prev => ({ ...prev, [videoId]: [res.data, ...(prev[videoId] || [])] }));
      setNuovoCommentoPerVideo(prev => ({ ...prev, [videoId]: '' }));
    } catch (err) { console.error(err); alert("Errore invio commento"); }
  };

  const handleInviaRisposta = async (videoId, parentCommentoId, e) => {
    e.preventDefault();
    const testoRisposta = nuovaRispostaPerCommento[parentCommentoId]?.trim();
    if (!testoRisposta) return alert("Scrivi una risposta!");
    if (!user || !user.id) return alert("Devi essere loggato!");

    try {
      const res = await axios.post('http://localhost:5001/api/commenti', {
        utenteId: user.id, videoId: videoId, testo: testoRisposta, parentCommentoId: parentCommentoId
      });
      setCommentiPerVideo(prev => {
        const updated = prev[videoId].map(c => c._id === parentCommentoId ? { ...c, risposte: [...(c.risposte || []), res.data] } : c);
        return { ...prev, [videoId]: updated };
      });
      setNuovaRispostaPerCommento(prev => ({ ...prev, [parentCommentoId]: '' }));
    } catch (err) { console.error(err); alert("Errore invio risposta"); }
  };

  const handleToggleLike = async (commentoId) => {
    if (!user || !user.id) return alert("Devi essere loggato!");
    try {
      const res = await axios.put(`http://localhost:5001/api/commenti/${commentoId}/like`, { utenteId: user.id });
      setLikedCommenti(prev => ({ ...prev, [commentoId]: !prev[commentoId] }));
      setCommentiPerVideo(prev => {
        const newCommenti = {};
        for (const [vId, commenti] of Object.entries(prev)) {
          newCommenti[vId] = commenti.map(c => {
            if (c._id === commentoId) return { ...c, like: res.data.like };
            if (c.risposte) return { ...c, risposte: c.risposte.map(r => r._id === commentoId ? { ...r, like: res.data.like } : r) };
            return c;
          });
        }
        return newCommenti;
      });
    } catch (err) { console.error(err); }
  };

  // --- FILTRO VIDEO ---
  const filteredVideos = videos.filter(video => 
    (video.titolo.toLowerCase().includes(ricerca.toLowerCase()) ||
    (video.descrizione && video.descrizione.toLowerCase().includes(ricerca.toLowerCase()))) &&
    (livelloDifficolta === '' || video.livelloDifficolta === livelloDifficolta)
  );

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* --- NAVBAR --- */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 90 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Kineo
        </div>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.name}</span>
          <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </Link>
      </nav>

      {/* --- CONTENUTO PRINCIPALE --- */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        
        {!selectedVideo && (
          <>
            <h2 style={{ marginBottom: '30px', color: '#1f2937', textAlign: 'center' }}>Video Disponibili</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
              <input
                type="text"
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                placeholder="Cerca video..."
                style={{ width: '100%', maxWidth: '500px', padding: '12px 16px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => setLivelloDifficolta('')} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: livelloDifficolta === '' ? '#2563eb' : '#e5e7eb', color: livelloDifficolta === '' ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '600' }}>Tutti</button>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                  <button key={lvl} onClick={() => setLivelloDifficolta(lvl)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: livelloDifficolta === lvl ? '#2563eb' : '#e5e7eb', color: livelloDifficolta === lvl ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '600' }}>{lvl}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* --- GRID VIDEO --- */}
        {!selectedVideo && (
            filteredVideos.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>Nessun video trovato.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                {filteredVideos.map(video => (
                  <div 
                    key={video._id} 
                    onClick={() => setSelectedVideo(video)}
                    style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* --- COPERTINA (MODIFICATO QUI) --- */}
                    <div style={{ 
                      height: '160px', 
                      // Se esiste la copertina la usa, altrimenti usa il gradiente
                      background: video.copertina 
                        ? `url("${video.copertina}") center/cover no-repeat` 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                       {/* Overlay scuro leggero se c'è l'immagine per far risaltare il play */}
                       {video.copertina && <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)'}}></div>}
                       
                       <span style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.8)', zIndex: 2 }}>▶</span>
                       
                       <span style={{ 
                         position: 'absolute', 
                         top: '10px', 
                         right: '10px', 
                         backgroundColor: 'rgba(0,0,0,0.6)', 
                         color: 'white', 
                         padding: '4px 8px', 
                         borderRadius: '4px', 
                         fontSize: '0.8rem', 
                         fontWeight: 'bold',
                         zIndex: 2
                       }}>
                         {video.livelloDifficolta}
                       </span>
                    </div>
                    
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#1f2937' }}>{video.titolo}</h3>
                      <p style={{ margin: '0', fontSize: '0.9rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {video.descrizione || "Nessuna descrizione disponibile."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* --- MODAL PLAYER (Visibile solo se selectedVideo esiste) --- */}
        {selectedVideo && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '40px',
            paddingBottom: '40px'
          }}>
            
            <button 
              onClick={() => setSelectedVideo(null)}
              style={{
                position: 'fixed',
                top: '20px',
                right: '30px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                zIndex: 1001
              }}
            >
              &times;
            </button>

            <div style={{ width: '90%', maxWidth: '1000px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
              
              <div style={{ backgroundColor: '#000', padding: '0' }}>
                 <VideoCard video={selectedVideo} />
              </div>

              <div style={{ padding: '30px' }}>
                <div style={{ marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{selectedVideo.titolo}</h2>
                      <span style={{ backgroundColor: '#2563eb', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {selectedVideo.livelloDifficolta}
                      </span>
                   </div>
                   <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{selectedVideo.descrizione}</p>
                </div>

                <h3 style={{ color: '#1f2937', marginBottom: '20px' }}>Commenti ({(commentiPerVideo[selectedVideo._id] || []).length})</h3>
                
                <form onSubmit={(e) => handleInviaCommento(selectedVideo._id, e)} style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={nuovoCommentoPerVideo[selectedVideo._id] || ''}
                    onChange={(e) => setNuovoCommentoPerVideo(prev => ({ ...prev, [selectedVideo._id]: e.target.value }))}
                    placeholder="Aggiungi un commento..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', minHeight: '80px', fontFamily: 'inherit' }}
                  />
                  <button type="submit" style={{ alignSelf: 'flex-end', backgroundColor: '#2563eb', color: 'white', padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Invia</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {caricandoCommenti[selectedVideo._id] ? (
                    <p>Caricamento...</p>
                  ) : (commentiPerVideo[selectedVideo._id] || []).map((commento) => (
                    <div key={commento._id} style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: '#111827' }}>{commento.utenteId?.nome || 'Utente'}</span>
                          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{new Date(commento.dataCreazione).toLocaleDateString()}</span>
                        </div>
                        <p style={{ marginTop: 0, color: '#374151' }}>{commento.testo}</p>
                        
                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', marginTop: '10px' }}>
                          <button onClick={() => handleToggleLike(commento._id)} style={{ background: 'none', border: 'none', color: likedCommenti[commento._id] ? '#ef4444' : '#6b7280', cursor: 'pointer' }}>❤️ {commento.like?.length || 0}</button>
                          <button onClick={() => setRisposteVisibili(p => ({ ...p, [commento._id]: !p[commento._id] }))} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
                             {risposteVisibili[commento._id] ? 'Chiudi' : `Rispondi (${(commento.risposte || []).length})`}
                          </button>
                        </div>

                        {risposteVisibili[commento._id] && (
                          <div style={{ marginTop: '15px', paddingLeft: '20px', borderLeft: '2px solid #e5e7eb' }}>
                             <form onSubmit={(e) => handleInviaRisposta(selectedVideo._id, commento._id, e)} style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                                <input 
                                  type="text" 
                                  value={nuovaRispostaPerCommento[commento._id] || ''}
                                  onChange={(e) => setNuovaRispostaPerCommento(p => ({ ...p, [commento._id]: e.target.value }))}
                                  placeholder="Scrivi una risposta..."
                                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                                <button type="submit" style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Invia</button>
                             </form>
                             {(commento.risposte || []).map(r => (
                               <div key={r._id} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{r.utenteId?.nome}</div>
                                 <div style={{ fontSize: '0.95rem', color: '#4b5563' }}>{r.testo}</div>
                               </div>
                             ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}