import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard'; // Assicurati che questo file esista e funzioni

export default function VideoLibrary() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);

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
    } catch (err) {
      console.error("Errore caricamento video:", err);
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
        <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Video Disponibili</h2>
        
        {videos.length === 0 ? (
          <p>Nessun video trovato. Chiedi all'admin di caricarne uno!</p>
        ) : (
          <div style={{ display: 'grid', gap: '30px' }}>
            {videos.map(video => (
              // Qui usiamo il tuo componente VideoCard esistente
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}