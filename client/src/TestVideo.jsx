import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TestVideo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Stato per gestire il caricamento

  // --- 1. CONTROLLO AUTENTICAZIONE ROBUSTO ---
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    
    if (!storedUser || storedUser === "undefined") {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error("Errore lettura dati utente:", error);
      // Se i dati sono corrotti, pulisci e rimanda al login
      localStorage.removeItem('userData');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // --- 2. HANDLER LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  // Stati del form
  const [videoData, setVideoData] = useState({
    titolo: '',
    url: '',
    livelloDifficolta: 'A1',
    descrizione: ''
  });
  const [videoId, setVideoId] = useState(''); 
  const [jsonSegmenti, setJsonSegmenti] = useState(''); 

  // Handlers
  const handleChangeVideo = (e) => setVideoData({ ...videoData, [e.target.name]: e.target.value });

  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/videos', videoData);
      alert('✅ Video creato! ID: ' + res.data._id);
      setVideoId(res.data._id); 
      setVideoData({ titolo: '', url: '', livelloDifficolta: 'A1', descrizione: '' });
    } catch (err) {
      alert('❌ Errore creazione: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmitSottotitoli = async (e) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(jsonSegmenti);
      await axios.patch(`http://localhost:5001/api/videos/${videoId}/segmenti`, {
        segmenti: parsedData
      });
      alert('✅ Sottotitoli caricati con successo!');
      setJsonSegmenti('');
    } catch (err) {
      alert('❌ Errore (JSON non valido o Server): ' + err.message);
    }
  };

  // --- RENDER ---
  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px', fontSize: '1.2rem' }}>Caricamento profilo in corso...</div>;
  if (!user) return null;

  return (
    // Aggiunto sfondo bianco e min-height per leggibilità
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(255, 255, 255, 0.95)', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* HEADER UTENTE */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px', 
        paddingBottom: '20px', 
        borderBottom: '2px solid #eee' 
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>Pannello Admin Video</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{color: '#555'}}>Ciao, <strong>{user.name || user.email}</strong></span>
          <button 
            onClick={handleLogout} 
            style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Esci
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* COLONNA 1 */}
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{color: '#28a745'}}>1. Crea Nuovo Video</h2>
          <form onSubmit={handleSubmitVideo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input name="titolo" placeholder="Titolo Video" value={videoData.titolo} onChange={handleChangeVideo} required style={inputStyle}/>
            <input name="url" placeholder="URL Video (mp4/yt)" value={videoData.url} onChange={handleChangeVideo} required style={inputStyle}/>
            <select name="livelloDifficolta" value={videoData.livelloDifficolta} onChange={handleChangeVideo} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <textarea name="descrizione" placeholder="Descrizione breve" value={videoData.descrizione} onChange={handleChangeVideo} style={{...inputStyle, height: '80px'}}/>
            <button type="submit" style={btnStyleGreen}>SALVA VIDEO</button>
          </form>
        </div>

        {/* COLONNA 2 */}
        <div style={{ flex: '1 1 400px', borderLeft: '1px solid #eee', paddingLeft: '40px' }}>
          <h2 style={{color: '#007bff'}}>2. Carica Sottotitoli (JSON)</h2>
          <p style={{fontSize: '0.9em', color: '#666', marginBottom: '15px'}}>
            Associa i sottotitoli a un video esistente tramite ID.
          </p>
          
          <form onSubmit={handleSubmitSottotitoli} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              placeholder="Incolla qui l'ID del Video" 
              value={videoId} 
              onChange={(e) => setVideoId(e.target.value)} 
              required 
              style={{...inputStyle, background: '#f8f9fa', fontFamily: 'monospace', fontWeight: 'bold'}}
            />
            
            <textarea 
              placeholder='Struttura attesa: [ { "startTime": 0, "endTime": 5, "testoInglese": "...", "approfondimenti": [] } ]' 
              value={jsonSegmenti} 
              onChange={(e) => setJsonSegmenti(e.target.value)} 
              required 
              style={{...inputStyle, height: '250px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.4'}} 
            />
            
            <button type="submit" style={btnStyleBlue}>CARICA JSON</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Stili Inline Semplificati
const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' };
const btnStyleGreen = { padding: '15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' };
const btnStyleBlue = { ...btnStyleGreen, background: '#007bff' };