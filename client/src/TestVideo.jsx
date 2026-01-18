import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TestVideo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- CONTROLLO AUTENTICAZIONE ---
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser || storedUser === "undefined") {
      navigate('/login');
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      localStorage.removeItem('userData');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  // --- STATI FORM ---
  
  // 1. Nuovo Video (Inclusi campi Serie)
  const [videoData, setVideoData] = useState({
    titolo: '',
    url: '',
    copertina: '',
    livelloDifficolta: 'A1',
    descrizione: '',
    serie: '',     // NUOVO
    episodio: ''   // NUOVO
  });

  // 2. Sottotitoli
  const [subVideoId, setSubVideoId] = useState(''); 
  const [jsonSegmenti, setJsonSegmenti] = useState(''); 

  // 3. Modifica / Assegna Serie (Aggiornato)
  const [updateData, setUpdateData] = useState({
    id: '',
    serie: '',
    episodio: '',
    copertina: ''
  });

  // --- HANDLERS ---

  // Crea Video
  const handleChangeVideo = (e) => setVideoData({ ...videoData, [e.target.name]: e.target.value });
  
  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    try {
      // Pulizia dati opzionali
      const payload = { ...videoData };
      if (!payload.serie) delete payload.serie;
      if (!payload.episodio) delete payload.episodio;

      const res = await axios.post('http://localhost:5001/api/videos', payload);
      alert('✅ Video creato! ID: ' + res.data._id);
      
      setUpdateData(prev => ({ ...prev, id: res.data._id })); // Auto-compila update
      setSubVideoId(res.data._id); // Auto-compila sottotitoli
      
      // Reset form
      setVideoData({ 
        titolo: '', url: '', copertina: '', 
        livelloDifficolta: 'A1', descrizione: '', 
        serie: '', episodio: '' 
      });
    } catch (err) {
      alert('❌ Errore creazione: ' + (err.response?.data?.message || err.message));
    }
  };

  // Carica Sottotitoli
  const handleSubmitSottotitoli = async (e) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(jsonSegmenti);
      await axios.patch(`http://localhost:5001/api/videos/${subVideoId}/segmenti`, {
        segmenti: parsedData
      });
      alert('✅ Sottotitoli caricati!');
      setJsonSegmenti('');
    } catch (err) {
      alert('❌ Errore: ' + err.message);
    }
  };

  // Aggiorna Video (Serie o Copertina)
  const handleChangeUpdate = (e) => setUpdateData({ ...updateData, [e.target.name]: e.target.value });

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!updateData.id) return alert("Inserisci ID Video");
    
    try {
      // Costruiamo payload solo con campi compilati
      const payload = {};
      if (updateData.serie) payload.serie = updateData.serie;
      if (updateData.episodio) payload.episodio = updateData.episodio;
      if (updateData.copertina) payload.copertina = updateData.copertina;

      if (Object.keys(payload).length === 0) return alert("Compila almeno un campo da modificare.");

      await axios.patch(`http://localhost:5001/api/videos/${updateData.id}`, payload);
      alert('✅ Video aggiornato con successo!');
      setUpdateData({ id: '', serie: '', episodio: '', copertina: '' });
    } catch (err) {
      alert('❌ Errore aggiornamento: ' + err.message);
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Caricamento...</div>;
  if (!user) return null;

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(255, 255, 255, 0.95)', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Pannello Admin Video</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{color: '#555'}}>Ciao, <strong>{user.name}</strong></span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Esci</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* 1. CREA VIDEO */}
        <div style={{ flex: '1 1 300px' }}>
          <h2 style={{color: '#28a745'}}>1. Crea Nuovo Video</h2>
          <form onSubmit={handleSubmitVideo} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input name="titolo" placeholder="Titolo" value={videoData.titolo} onChange={handleChangeVideo} required style={inputStyle}/>
            <input name="url" placeholder="URL Video (YouTube o File)" value={videoData.url} onChange={handleChangeVideo} required style={inputStyle}/>
            <input name="copertina" placeholder="URL Copertina (Opzionale)" value={videoData.copertina} onChange={handleChangeVideo} style={inputStyle}/>
            
            {/* Campi Serie */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input name="serie" placeholder="Nome Serie (es. SpiderMan)" value={videoData.serie} onChange={handleChangeVideo} style={{...inputStyle, flex: 2}}/>
              <input name="episodio" type="number" placeholder="Ep. N." value={videoData.episodio} onChange={handleChangeVideo} style={{...inputStyle, flex: 1}}/>
            </div>

            <select name="livelloDifficolta" value={videoData.livelloDifficolta} onChange={handleChangeVideo} style={inputStyle}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <textarea name="descrizione" placeholder="Descrizione" value={videoData.descrizione} onChange={handleChangeVideo} style={{...inputStyle, height: '60px'}}/>
            <button type="submit" style={btnStyleGreen}>SALVA VIDEO</button>
          </form>
        </div>

        {/* 2. CARICA SOTTOTITOLI */}
        <div style={{ flex: '1 1 300px', borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
          <h2 style={{color: '#007bff'}}>2. Carica Sottotitoli</h2>
          <form onSubmit={handleSubmitSottotitoli} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input placeholder="ID Video" value={subVideoId} onChange={(e) => setSubVideoId(e.target.value)} required style={idStyle}/>
            <textarea placeholder='JSON Segmenti...' value={jsonSegmenti} onChange={(e) => setJsonSegmenti(e.target.value)} required style={{...inputStyle, height: '200px', fontFamily: 'monospace', fontSize: '12px'}} />
            <button type="submit" style={btnStyleBlue}>CARICA JSON</button>
          </form>
        </div>

        {/* 3. MODIFICA / ASSEGNA SERIE */}
        <div style={{ flex: '1 1 300px', borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
          <h2 style={{color: '#e0a800'}}>3. Modifica / Assegna Serie</h2>
          <p style={{fontSize: '0.9em', color: '#666'}}>Compila solo i campi che vuoi modificare.</p>
          <form onSubmit={handleUpdateVideo} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              name="id"
              placeholder="ID Video da modificare" 
              value={updateData.id} 
              onChange={handleChangeUpdate} 
              required 
              style={idStyle}
            />
            <input 
              name="serie"
              placeholder="Nome Serie (Nuovo o Esistente)" 
              value={updateData.serie} 
              onChange={handleChangeUpdate} 
              style={inputStyle}
            />
            <input 
              name="episodio"
              type="number"
              placeholder="Numero Episodio" 
              value={updateData.episodio} 
              onChange={handleChangeUpdate} 
              style={inputStyle}
            />
            <input 
              name="copertina"
              placeholder="Nuovo URL Copertina" 
              value={updateData.copertina} 
              onChange={handleChangeUpdate} 
              style={inputStyle}
            />
            <button type="submit" style={btnStyleYellow}>AGGIORNA DATI</button>
          </form>
        </div>

      </div>
    </div>
  );
}

// Stili
const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' };
const idStyle = { ...inputStyle, background: '#f8f9fa', fontFamily: 'monospace', fontWeight: 'bold' };
const btnStyleGreen = { padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const btnStyleBlue = { ...btnStyleGreen, background: '#007bff' };
const btnStyleYellow = { ...btnStyleGreen, background: '#e0a800', color: 'black' };