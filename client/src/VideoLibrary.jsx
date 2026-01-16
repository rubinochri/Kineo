import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard'; 

export default function VideoLibrary({ savedWords, onToggleSave }) {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);

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
      setVideos(res.data);
    } catch (err) {
      console.error("Errore caricamento video:", err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* --- NAVBAR MODIFICATA --- */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', // Distribuisce gli elementi
        alignItems: 'center', 
        padding: '15px 30px', 
        background: 'white', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        
        {/* 1. SINISTRA: Tasto Dizionario (Stile Dorato) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <Link to="/dizionario" style={{ textDecoration: 'none' }}>
                <button style={{
                    // Stile Dorato (Gradient)
                    background: 'linear-gradient(180deg, #eebb58 0%, #c49128 100%)', 
                    color: '#2d1e0f', // Testo marrone scuro per contrasto
                    border: '1px solid #b68523',
                    padding: '10px 20px',
                    borderRadius: '50px', // Molto arrotondato (Pill shape)
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)', // Ombra leggera
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                >
                    📖 Il mio dizionario
                    {/* Badge contatore parole */}
                    <span style={{ 
                        backgroundColor: '#fff', 
                        color: '#c49128', 
                        borderRadius: '50%', 
                        padding: '2px 6px', 
                        fontSize: '0.8rem',
                        fontWeight: '800'
                    }}>
                        {savedWords ? savedWords.length : 0}
                    </span>
                </button>
            </Link>
        </div>

        {/* 2. CENTRO: Logo Kineo */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                background: 'linear-gradient(to right, #2563eb, #9333ea)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px'
            }}>
              Kineo
            </div>
        </div>

        {/* 3. DESTRA: Profilo Utente */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user.name}</span>
              <div style={{ 
                  width: '40px', height: '40px', 
                  background: '#e0e7ff', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#4338ca', border: '1px solid #c7d2fe'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </Link>
        </div>

      </nav>

      {/* GRIGLIA VIDEO */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Video Disponibili</h2>
        {videos.length === 0 ? (
          <p>Nessun video trovato.</p>
        ) : (
          <div style={{ display: 'grid', gap: '30px' }}>
            {videos.map(video => (
              <VideoCard 
                 key={video._id} 
                 video={video} 
                 savedWords={savedWords} 
                 onToggleSave={onToggleSave} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}