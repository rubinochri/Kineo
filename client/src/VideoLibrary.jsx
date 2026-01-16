import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard'; // Assicurati che questo file esista e funzioni

export default function VideoLibrary() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [commentiPerVideo, setCommentiPerVideo] = useState({});
  const [nuovoCommentoPerVideo, setNuovoCommentoPerVideo] = useState({});
  const [caricandoCommenti, setCaricandoCommenti] = useState({});
  const [risposteVisibili, setRisposteVisibili] = useState({});
  const [nuovaRispostaPerCommento, setNuovaRispostaPerCommento] = useState({});
  const [likedCommenti, setLikedCommenti] = useState({});
  const [ricerca, setRicerca] = useState('');
  const [livelloDifficolta, setLivelloDifficolta] = useState('');

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
      // Carica commenti per ogni video
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

  const handleInviaCommento = async (videoId, e) => {
    e.preventDefault();
    
    const testoCommento = nuovoCommentoPerVideo[videoId]?.trim();
    if (!testoCommento) {
      alert("Scrivi un commento!");
      return;
    }

    if (!user || !user.id) {
      alert("Devi essere loggato per commentare!");
      return;
    }

    try {
      const res = await axios.post('http://localhost:5001/api/commenti', {
        utenteId: user.id,
        videoId: videoId,
        testo: testoCommento
      });
      
      setCommentiPerVideo(prev => ({
        ...prev,
        [videoId]: [res.data, ...(prev[videoId] || [])]
      }));
      setNuovoCommentoPerVideo(prev => ({ ...prev, [videoId]: '' }));
    } catch (err) {
      console.error("Errore invio commento:", err);
      alert("Errore nell'invio del commento");
    }
  };

  const handleInviaRisposta = async (videoId, parentCommentoId, e) => {
    e.preventDefault();
    
    const testoRisposta = nuovaRispostaPerCommento[parentCommentoId]?.trim();
    if (!testoRisposta) {
      alert("Scrivi una risposta!");
      return;
    }

    if (!user || !user.id) {
      alert("Devi essere loggato per rispondere!");
      return;
    }

    try {
      const res = await axios.post('http://localhost:5001/api/commenti', {
        utenteId: user.id,
        videoId: videoId,
        testo: testoRisposta,
        parentCommentoId: parentCommentoId
      });
      
      setCommentiPerVideo(prev => {
        const updatedCommenti = prev[videoId].map(commento => {
          if (commento._id === parentCommentoId) {
            return {
              ...commento,
              risposte: [...(commento.risposte || []), res.data]
            };
          }
          return commento;
        });
        return { ...prev, [videoId]: updatedCommenti };
      });
      
      setNuovaRispostaPerCommento(prev => ({ ...prev, [parentCommentoId]: '' }));
    } catch (err) {
      console.error("Errore invio risposta:", err);
      alert("Errore nell'invio della risposta");
    }
  };

  const handleToggleLike = async (commentoId) => {
    if (!user || !user.id) {
      alert("Devi essere loggato per mettere like!");
      return;
    }

    try {
      const res = await axios.put(`http://localhost:5001/api/commenti/${commentoId}/like`, {
        utenteId: user.id
      });

      // Aggiorna lo stato globale
      setLikedCommenti(prev => ({
        ...prev,
        [commentoId]: !prev[commentoId]
      }));

      // Aggiorna il commento nel list
      setCommentiPerVideo(prev => {
        const newCommenti = {};
        for (const [videoId, commenti] of Object.entries(prev)) {
          newCommenti[videoId] = commenti.map(c => {
            if (c._id === commentoId) {
              return { ...c, like: res.data.like };
            }
            if (c.risposte) {
              return {
                ...c,
                risposte: c.risposte.map(r => r._id === commentoId ? { ...r, like: res.data.like } : r)
              };
            }
            return c;
          });
        }
        return newCommenti;
      });
    } catch (err) {
      console.error("Errore aggiornamento like:", err);
      alert("Errore nel mettere like");
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* --- NAVBAR --- */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '15px 30px', 
        background: 'white', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Kineo
        </div>

        {/* Bottone Profilo (Omino) */}
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.name}</span>
          <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </Link>
      </nav>

      {/* --- GRIGLIA VIDEO --- */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        <h2 style={{ marginBottom: '30px', color: '#1f2937', textAlign: 'center' }}>Video Disponibili</h2>
        
        {/* BARRA DI RICERCA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca video per titolo o descrizione..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '1em',
                fontFamily: 'Arial, sans-serif',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* FILTRO LIVELLO DIFFICOLTÀ */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', color: '#1f2937', alignSelf: 'center' }}>Filtra per livello:</span>
          <button
            onClick={() => setLivelloDifficolta('')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: livelloDifficolta === '' ? '2px solid #2563eb' : '2px solid #e5e7eb',
              backgroundColor: livelloDifficolta === '' ? '#2563eb' : 'white',
              color: livelloDifficolta === '' ? 'white' : '#1f2937',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95em',
              transition: 'all 0.3s'
            }}
          >
            Tutti
          </button>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(livello => (
            <button
              key={livello}
              onClick={() => setLivelloDifficolta(livello)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: livelloDifficolta === livello ? '2px solid #2563eb' : '2px solid #e5e7eb',
                backgroundColor: livelloDifficolta === livello ? '#2563eb' : 'white',
                color: livelloDifficolta === livello ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95em',
                transition: 'all 0.3s'
              }}
            >
              {livello}
            </button>
          ))}
        </div>
        
        {videos.length === 0 ? (
          <p>Nessun video trovato. Chiedi all'admin di caricarne uno!</p>
        ) : videos.filter(video => 
          (video.titolo.toLowerCase().includes(ricerca.toLowerCase()) ||
          (video.descrizione && video.descrizione.toLowerCase().includes(ricerca.toLowerCase()))) &&
          (livelloDifficolta === '' || video.livelloDifficolta === livelloDifficolta)
        ).length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>Nessun video corrisponde ai filtri selezionati</p>
        ) : (
          <div style={{ display: 'grid', gap: '30px' }}>
            {videos.filter(video => 
              (video.titolo.toLowerCase().includes(ricerca.toLowerCase()) ||
              (video.descrizione && video.descrizione.toLowerCase().includes(ricerca.toLowerCase()))) &&
              (livelloDifficolta === '' || video.livelloDifficolta === livelloDifficolta)
            ).map(video => (
              <div key={video._id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                {/* VIDEO CARD */}
                <div style={{ padding: '20px' }}>
                  <VideoCard video={video} />
                </div>

                {/* SEZIONE COMMENTI */}
                <div style={{ borderTop: '2px solid #e0e0e0', padding: '20px', backgroundColor: '#f9fafb' }}>
                  <h3 style={{ color: '#1f2937', marginBottom: '15px', marginTop: '0' }}>Commenti ({(commentiPerVideo[video._id] || []).length})</h3>
                  
                  {/* FORM PER NUOVO COMMENTO */}
                  <form onSubmit={(e) => handleInviaCommento(video._id, e)} style={{ marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    <textarea
                      value={nuovoCommentoPerVideo[video._id] || ''}
                      onChange={(e) => setNuovoCommentoPerVideo(prev => ({ ...prev, [video._id]: e.target.value }))}
                      placeholder="Scrivi un commento..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '0.95em',
                        resize: 'vertical',
                        minHeight: '80px',
                        boxSizing: 'border-box',
                        marginBottom: '10px'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95em',
                        transition: 'background-color 0.3s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                      Invia Commento
                    </button>
                  </form>

                  {/* LISTA COMMENTI */}
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {caricandoCommenti[video._id] ? (
                      <p style={{ color: '#999', textAlign: 'center' }}>Caricamento commenti...</p>
                    ) : (commentiPerVideo[video._id] || []).length === 0 ? (
                      <p style={{ color: '#999', textAlign: 'center', fontStyle: 'italic' }}>Nessun commento ancora. Sii il primo a commentare!</p>
                    ) : (
                      (commentiPerVideo[video._id] || []).map((commento) => (
                        <div key={commento._id}>
                          {/* COMMENTO PRINCIPALE */}
                          <div
                            style={{
                              backgroundColor: 'white',
                              padding: '12px',
                              marginBottom: '8px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb',
                              borderLeft: '4px solid #2563eb'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                {commento.utenteId?.nome || 'Utente Anonimo'}
                              </span>
                              <span style={{ fontSize: '0.85em', color: '#999' }}>
                                {new Date(commento.dataCreazione).toLocaleDateString('it-IT')}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 10px 0', color: '#4b5563', lineHeight: '1.5', wordWrap: 'break-word' }}>
                              {commento.testo}
                            </p>
                            
                            {/* LIKE E RISPOSTE */}
                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.9em' }}>
                              <button
                                onClick={() => handleToggleLike(commento._id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: likedCommenti[commento._id] ? '#ef4444' : '#999',
                                  cursor: 'pointer',
                                  padding: '0',
                                  fontWeight: likedCommenti[commento._id] ? '600' : '400',
                                  fontSize: '0.9em'
                                }}
                              >
                                ❤️ {commento.like?.length || 0}
                              </button>
                              <button
                                onClick={() => setRisposteVisibili(prev => ({ ...prev, [commento._id]: !prev[commento._id] }))}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  padding: '0',
                                  textDecoration: 'underline',
                                  fontSize: '0.9em'
                                }}
                              >
                                {risposteVisibili[commento._id] ? 'Nascondi risposte' : `Risposte (${(commento.risposte || []).length})`}
                              </button>
                            </div>
                          </div>

                          {/* RISPOSTE */}
                          {risposteVisibili[commento._id] && (
                            <div style={{ marginLeft: '20px', marginBottom: '12px' }}>
                              {/* FORM RISPOSTA */}
                              <form
                                onSubmit={(e) => handleInviaRisposta(video._id, commento._id, e)}
                                style={{
                                  backgroundColor: '#f3f4f6',
                                  padding: '10px',
                                  borderRadius: '6px',
                                  marginBottom: '10px',
                                  border: '1px solid #d1d5db'
                                }}
                              >
                                <textarea
                                  value={nuovaRispostaPerCommento[commento._id] || ''}
                                  onChange={(e) => setNuovaRispostaPerCommento(prev => ({ ...prev, [commento._id]: e.target.value }))}
                                  placeholder="Rispondi a questo commento..."
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #d1d5db',
                                    fontFamily: 'Arial, sans-serif',
                                    fontSize: '0.9em',
                                    resize: 'vertical',
                                    minHeight: '60px',
                                    boxSizing: 'border-box',
                                    marginBottom: '8px'
                                  }}
                                />
                                <button
                                  type="submit"
                                  style={{
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.85em',
                                    transition: 'background-color 0.3s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
                                >
                                  Invia Risposta
                                </button>
                              </form>

                              {/* LISTA RISPOSTE */}
                              {(commento.risposte || []).map((risposta) => (
                                <div
                                  key={risposta._id}
                                  style={{
                                    backgroundColor: 'white',
                                    padding: '10px',
                                    marginBottom: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #e5e7eb',
                                    borderLeft: '3px solid #059669',
                                    fontSize: '0.95em'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                      {risposta.utenteId?.nome || 'Utente Anonimo'}
                                    </span>
                                    <span style={{ fontSize: '0.8em', color: '#999' }}>
                                      {new Date(risposta.dataCreazione).toLocaleDateString('it-IT')}
                                    </span>
                                  </div>
                                  <p style={{ margin: '0 0 8px 0', color: '#4b5563', lineHeight: '1.5', wordWrap: 'break-word' }}>
                                    {risposta.testo}
                                  </p>
                                  <button
                                    onClick={() => handleToggleLike(risposta._id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: likedCommenti[risposta._id] ? '#ef4444' : '#999',
                                      cursor: 'pointer',
                                      padding: '0',
                                      fontWeight: likedCommenti[risposta._id] ? '600' : '400',
                                      fontSize: '0.85em'
                                    }}
                                  >
                                    ❤️ {risposta.like?.length || 0}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}