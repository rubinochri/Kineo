import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard'; 

export default function VideoLibrary() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  
  // Stato Commenti
  const [commentiPerVideo, setCommentiPerVideo] = useState({});
  const [nuovoCommentoPerVideo, setNuovoCommentoPerVideo] = useState({});
  const [caricandoCommenti, setCaricandoCommenti] = useState({});
  const [risposteVisibili, setRisposteVisibili] = useState({});
  const [nuovaRispostaPerCommento, setNuovaRispostaPerCommento] = useState({});
  const [likedCommenti, setLikedCommenti] = useState({});
  
  // UI & Filtri
  const [ricerca, setRicerca] = useState('');
  const [livelloDifficolta, setLivelloDifficolta] = useState('');
  const [viewMode, setViewMode] = useState('MOVIES'); // 'MOVIES' | 'SERIES'
  
  // Gestione Player e Serie
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [relatedEpisodes, setRelatedEpisodes] = useState([]); 

  // 1. Init
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchVideos();
    }
  }, [navigate]);

  // 2. Fetch Data
  const fetchVideos = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/videos');
      const sorted = res.data.sort((a, b) => new Date(b.dataCaricamento) - new Date(a.dataCaricamento));
      setVideos(sorted);
      sorted.forEach(video => fetchCommenti(video._id));
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

  // --- LOGICA FILTRO E RAGGRUPPAMENTO ---
  const getContentToDisplay = () => {
    const filteredBase = videos.filter(video => 
      (video.titolo.toLowerCase().includes(ricerca.toLowerCase()) ||
       (video.serie && video.serie.toLowerCase().includes(ricerca.toLowerCase())) ||
       (video.descrizione && video.descrizione.toLowerCase().includes(ricerca.toLowerCase()))) &&
      (livelloDifficolta === '' || video.livelloDifficolta === livelloDifficolta)
    );

    if (viewMode === 'MOVIES') {
      return filteredBase
        .filter(v => !v.serie)
        .map(v => ({ type: 'VIDEO', ...v, mainVideo: v }));
    } else {
      const groups = {};
      filteredBase.filter(v => v.serie).forEach(video => {
        if (!groups[video.serie]) groups[video.serie] = [];
        groups[video.serie].push(video);
      });

      return Object.keys(groups).map(serieName => {
        const episodes = groups[serieName].sort((a, b) => a.episodio - b.episodio);
        return {
          type: 'SERIES',
          _id: `serie-${serieName}`,
          serie: serieName,
          mainVideo: episodes[0],
          episodes: episodes,
          count: episodes.length
        };
      });
    }
  };

  const handleCardClick = (item) => {
    if (item.type === 'SERIES') {
      setSelectedVideo(item.episodes[0]); 
      setRelatedEpisodes(item.episodes);
    } else {
      setSelectedVideo(item.mainVideo);
      setRelatedEpisodes([]);
    }
  };

  // --- COMMENTI ACTIONS ---
  const handleInviaCommento = async (videoId, e) => {
    e.preventDefault();
    const testoCommento = nuovoCommentoPerVideo[videoId]?.trim();
    if (!testoCommento) return alert("Scrivi un commento!");
    if (!user) return alert("Login necessario");

    try {
      const res = await axios.post('http://localhost:5001/api/commenti', {
        utenteId: user.id, videoId, testo: testoCommento
      });
      setCommentiPerVideo(prev => ({ ...prev, [videoId]: [res.data, ...(prev[videoId] || [])] }));
      setNuovoCommentoPerVideo(prev => ({ ...prev, [videoId]: '' }));
    } catch (err) { console.error(err); alert("Errore invio commento"); }
  };

  const handleInviaRisposta = async (videoId, parentId, e) => {
    e.preventDefault();
    const testo = nuovaRispostaPerCommento[parentId]?.trim();
    if (!testo) return;
    
    try {
      const res = await axios.post('http://localhost:5001/api/commenti', {
        utenteId: user.id, videoId, testo, parentCommentoId: parentId
      });
      setCommentiPerVideo(prev => {
        const updated = prev[videoId].map(c => c._id === parentId ? { ...c, risposte: [...(c.risposte || []), res.data] } : c);
        return { ...prev, [videoId]: updated };
      });
      setNuovaRispostaPerCommento(prev => ({ ...prev, [parentId]: '' }));
    } catch (err) { console.error(err); }
  };

  const handleToggleLike = async (commentoId) => {
    try {
      await axios.put(`http://localhost:5001/api/commenti/${commentoId}/like`, { utenteId: user.id });
      setLikedCommenti(prev => ({ ...prev, [commentoId]: !prev[commentoId] }));
    } catch (err) { console.error(err); }
  };

  if (!user) return null;

  const contentToDisplay = getContentToDisplay();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '15px 30px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 90 }}>
        
        {/* SINISTRA: Logo */}
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', width: 'fit-content' }}>
            Kineo
            </div>
        </div>

        {/* CENTRO: Titolo Catalogo */}
        <div style={{ flex: 1, textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold', color: '#374151' }}>
            Catalogo
        </div>

        {/* DESTRA: Profilo Utente */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.name}</span>
            <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                {/* Omino stilizzato SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* HEADER CONTROLS (Solo se no modale) */}
        {!selectedVideo && (
          <>
            {/* Titolo H2 rimosso come richiesto (spostato in navbar) */}
            
            {/* --- SLIDER TOGGLE --- */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '30px' }}>
              <div style={{ 
                position: 'relative', display: 'flex', backgroundColor: '#e5e7eb', 
                borderRadius: '30px', padding: '4px', width: '250px', height: '40px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  position: 'absolute', top: '4px', bottom: '4px', width: '50%',
                  left: viewMode === 'MOVIES' ? '4px' : '50%',
                  backgroundColor: 'white', borderRadius: '25px',
                  transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', 
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  zIndex: 1
                }}></div>
                
                <button 
                  onClick={() => setViewMode('MOVIES')} 
                  style={{ 
                    flex: 1, border: 'none', background: 'transparent', zIndex: 2, cursor: 'pointer',
                    fontWeight: viewMode === 'MOVIES' ? '700' : '500', 
                    color: viewMode === 'MOVIES' ? '#2563eb' : '#6b7280',
                    transition: 'color 0.3s'
                  }}
                >
                  Film
                </button>
                <button 
                  onClick={() => setViewMode('SERIES')} 
                  style={{ 
                    flex: 1, border: 'none', background: 'transparent', zIndex: 2, cursor: 'pointer',
                    fontWeight: viewMode === 'SERIES' ? '700' : '500', 
                    color: viewMode === 'SERIES' ? '#9333ea' : '#6b7280',
                    transition: 'color 0.3s'
                  }}
                >
                  Serie TV
                </button>
              </div>
            </div>

            {/* RICERCA & FILTRI */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
              <input
                type="text"
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                placeholder={viewMode === 'MOVIES' ? "Cerca film..." : "Cerca serie..."}
                style={{ width: '100%', maxWidth: '500px', padding: '12px 16px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => setLivelloDifficolta('')} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: livelloDifficolta === '' ? (viewMode === 'MOVIES' ? '#2563eb' : '#9333ea') : '#e5e7eb', color: livelloDifficolta === '' ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>Tutti</button>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                  <button key={lvl} onClick={() => setLivelloDifficolta(lvl)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: livelloDifficolta === lvl ? (viewMode === 'MOVIES' ? '#2563eb' : '#9333ea') : '#e5e7eb', color: livelloDifficolta === lvl ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>{lvl}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* GRID LAYOUT */}
        {!selectedVideo && (
          contentToDisplay.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
              {viewMode === 'MOVIES' ? "Nessun video trovato." : "Nessuna serie trovata."}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', animation: 'fadeIn 0.5s ease' }}>
              {contentToDisplay.map(item => (
                <div 
                  key={item._id} 
                  onClick={() => handleCardClick(item)}
                  style={{ 
                    backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Badge SERIE */}
                  {item.type === 'SERIES' && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: '#9333ea', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      SERIE • {item.count} EP
                    </div>
                  )}

                  <div style={{ 
                    height: '160px', 
                    background: item.mainVideo.copertina 
                      ? `url("${item.mainVideo.copertina}") center/cover no-repeat` 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                  }}>
                     <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)'}}></div>
                     <span style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.9)', zIndex: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        {item.type === 'SERIES' ? '≣' : '▶'}
                     </span>
                     <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 2 }}>
                       {item.mainVideo.livelloDifficolta}
                     </span>
                  </div>
                  
                  <div style={{ padding: '20px', flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#1f2937' }}>
                      {item.type === 'SERIES' ? item.serie : item.mainVideo.titolo}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.mainVideo.descrizione || "Nessuna descrizione."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* MODAL PLAYER & EPISODES */}
        {selectedVideo && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0'
          }}>
            
            <button 
              onClick={() => setSelectedVideo(null)}
              style={{ position: 'fixed', top: '20px', right: '30px', background: 'transparent', border: 'none', color: 'white', fontSize: '2.5rem', cursor: 'pointer', zIndex: 1002 }}
            >
              &times;
            </button>

            <div style={{ 
              width: '95%', maxWidth: '1200px', backgroundColor: 'white', borderRadius: '12px', 
              overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0',
              animation: 'slideUp 0.3s ease-out'
            }}>
              
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 900 ? 'column' : 'row' }}>
                
                {/* COLONNA SINISTRA: Player e Info */}
                <div style={{ flex: 3, borderRight: '1px solid #e5e7eb' }}>
                  <div style={{ backgroundColor: '#000' }}>
                     <VideoCard key={selectedVideo._id} video={selectedVideo} />
                  </div>
                  
                  <div style={{ padding: '30px' }}>
                    <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
                       {selectedVideo.serie && (
                         <div style={{ color: '#9333ea', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', textTransform: 'uppercase' }}>
                           {selectedVideo.serie} • Ep. {selectedVideo.episodio}
                         </div>
                       )}
                       <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>{selectedVideo.titolo}</h2>
                       <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{selectedVideo.descrizione}</p>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Commenti</h3>
                    <form onSubmit={(e) => handleInviaCommento(selectedVideo._id, e)} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <input 
                        value={nuovoCommentoPerVideo[selectedVideo._id] || ''}
                        onChange={(e) => setNuovoCommentoPerVideo(prev => ({ ...prev, [selectedVideo._id]: e.target.value }))}
                        placeholder="Aggiungi un commento..."
                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                      />
                      <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 20px', borderRadius: '6px', cursor: 'pointer' }}>Invia</button>
                    </form>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {(commentiPerVideo[selectedVideo._id] || []).map(c => (
                        <div key={c._id} style={{ marginBottom: '15px', background: '#f9fafb', padding: '10px', borderRadius: '8px' }}>
                           <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{c.utenteId?.nome || 'User'}</div>
                           <div style={{ margin: '4px 0', color: '#374151' }}>{c.testo}</div>
                           <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                             <span onClick={() => handleToggleLike(c._id)} style={{ cursor: 'pointer' }}>❤️ {c.like?.length || 0}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLONNA DESTRA: Lista Episodi (Solo se Serie) */}
                {relatedEpisodes.length > 0 && (
                  <div style={{ flex: 1, backgroundColor: '#f3f4f6', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', maxHeight: '100vh' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Episodi</h3>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{selectedVideo.serie}</span>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
                      {relatedEpisodes.map(ep => (
                        <div 
                          key={ep._id} 
                          onClick={() => setSelectedVideo(ep)}
                          style={{ 
                            padding: '10px', marginBottom: '10px', borderRadius: '6px', cursor: 'pointer',
                            backgroundColor: selectedVideo._id === ep._id ? '#e0e7ff' : 'white',
                            border: selectedVideo._id === ep._id ? '1px solid #6366f1' : '1px solid #e5e7eb',
                            display: 'flex', gap: '10px', alignItems: 'center'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', color: '#6b7280', fontSize: '0.9rem' }}>{ep.episodio}.</div>
                          <div style={{ flex: 1 }}>
                             <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>{ep.titolo}</div>
                             <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{ep.durataSecondi ? `${Math.floor(ep.durataSecondi / 60)} min` : ''}</div>
                          </div>
                          {selectedVideo._id === ep._id && <span style={{color: '#2563eb'}}>▶</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}