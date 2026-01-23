import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard'; 
import './VideoLibrary.css'; // Importa il CSS

export default function VideoLibrary({ savedWords, onToggleSave }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]); 
  const [user, setUser] = useState(null); 
  
  // UI & Filtri
  const [ricerca, setRicerca] = useState('');
  const [livelloDifficolta, setLivelloDifficolta] = useState('');
  const [viewMode, setViewMode] = useState('MOVIES'); // 'MOVIES' | 'SERIES'
  
  // Gestione Player e Serie
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [relatedEpisodes, setRelatedEpisodes] = useState([]); 

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchVideos();
    }
  }, [navigate]);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/videos');
      const sorted = res.data.sort((a, b) => new Date(b.dataCaricamento) - new Date(a.dataCaricamento));
      setVideos(sorted);
    } catch (err) {
      console.error("Errore caricamento video:", err);
    }
  };

  useEffect(() => {
    if (selectedVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedVideo]);

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

  if (!user) return null;

  const contentToDisplay = getContentToDisplay();

  return (
    <div className="library-container">
      
      {/* --- NAVBAR --- */}
      <nav className="library-nav">
        
       <div className="nav-section">
        <Link to="/dizionario" style={{ textDecoration: 'none' }}>
            <button className="btn-dictionary">
              <span></span> 
              <span>Il mio dizionario</span>
              <span className="badge-count">
                  {savedWords ? savedWords.length : 0}
              </span>
          </button>
        </Link>
       </div>

        <div className="nav-section nav-center">
            <div className="brand-text">Kineo</div>
        </div>

        <div className="nav-section nav-end">
            <Link to="/dashboard" className="user-profile-link">
              <span className="user-name">{user.name}</span>
              <div className="user-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </Link>
        </div>
      </nav>

      {/* --- BODY PRINCIPALE --- */}
      <div className="library-body">
        
        {/* HEADER CONTROLS */}
        {!selectedVideo && (
          <>
            <h2 className="controls-header">Catalogo Video</h2>
            
            <div className="search-container">
                 <input
                   type="text"
                   className="search-input"
                   value={ricerca}
                   onChange={(e) => setRicerca(e.target.value)}
                   placeholder={viewMode === 'MOVIES' ? "Cerca film..." : "Cerca serie..."}
                 />
            </div>

            {/* Switch Film/Serie */}
            <div className="toggle-container">
              <div className="toggle-track">
                {/* Lo slider ha bisogno di stile inline per la posizione dinamica */}
                <div 
                  className="toggle-slider" 
                  style={{ left: viewMode === 'MOVIES' ? '4px' : '50%' }}
                ></div>
                
                <button 
                  onClick={() => setViewMode('MOVIES')} 
                  className={`toggle-btn ${viewMode === 'MOVIES' ? 'active active-movies' : ''}`}
                >
                  Film
                </button>
                <button 
                  onClick={() => setViewMode('SERIES')} 
                  className={`toggle-btn ${viewMode === 'SERIES' ? 'active active-series' : ''}`}
                >
                  Serie TV
                </button>
              </div>
            </div>

            {/* Filtri Livello */}
            <div className="filters-container">
            <span className="filter-label">Livello:</span>
            <button
                onClick={() => setLivelloDifficolta('')}
                className={`btn-filter ${livelloDifficolta === '' ? 'active' : ''}`}
            >
                Tutti
            </button>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(livello => (
                <button
                key={livello}
                onClick={() => setLivelloDifficolta(livello)}
                className={`btn-filter ${livelloDifficolta === livello ? 'active' : ''}`}
                >
                {livello}
                </button>
            ))}
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
            <div className="video-grid">
              {contentToDisplay.map(item => (
                <div 
                  key={item._id} 
                  className="video-card"
                  onClick={() => handleCardClick(item)}
                >
                  {/* Badge SERIE */}
                  {item.type === 'SERIES' && (
                    <div className="badge-series">
                      SERIE • {item.count} EP
                    </div>
                  )}

                  <div 
                    className="card-thumbnail"
                    style={{ 
                      backgroundImage: item.mainVideo.copertina 
                        ? `url("${item.mainVideo.copertina}")` 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                      <div className="thumbnail-overlay"></div>
                      <span className="play-icon">
                        {item.type === 'SERIES' ? '≣' : '▶'}
                      </span>
                      <span className="badge-level">
                       {item.mainVideo.livelloDifficolta}
                      </span>
                  </div>
                  
                  <div className="card-info">
                    <h3 className="card-title">
                      {item.type === 'SERIES' ? item.serie : item.mainVideo.titolo}
                    </h3>
                    <p className="card-desc">
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
          <div className="modal-overlay">
            
            <button 
              onClick={() => setSelectedVideo(null)}
              className="modal-close-btn"
            >
              &times;
            </button>

            {/* Contenitore Bianco */}
            <div className="modal-content">
              
              <div className="player-layout">
                
                {/* COLONNA SINISTRA: Player e Info */}
                <div className="player-container">
                  <div className="player-wrapper">
                      <VideoCard 
                        key={selectedVideo._id} 
                        video={selectedVideo} 
                        savedWords={savedWords} 
                        onToggleSave={onToggleSave}
                      />
                  </div>
                </div>

                {/* COLONNA DESTRA: Lista Episodi (Solo se Serie) */}
                {relatedEpisodes.length > 0 && (
                  <div className="episodes-sidebar">
                    <div className="episodes-header">
                      <h3 className="episodes-title">Episodi</h3>
                      <span className="episodes-subtitle">{selectedVideo.serie}</span>
                    </div>
                    <div className="episodes-list">
                      {relatedEpisodes.map(ep => (
                        <div 
                          key={ep._id} 
                          onClick={() => setSelectedVideo(ep)}
                          className={`episode-item ${selectedVideo._id === ep._id ? 'active' : ''}`}
                        >
                          <div className="ep-number">{ep.episodio}.</div>
                          <div className="ep-info">
                             <div className="ep-title">{ep.titolo}</div>
                             <div className="ep-duration">{ep.durataSecondi ? `${Math.floor(ep.durataSecondi / 60)} min` : ''}</div>
                          </div>
                          {selectedVideo._id === ep._id && <span className="ep-playing-icon">▶</span>}
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