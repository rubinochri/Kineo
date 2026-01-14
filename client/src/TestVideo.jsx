import { useState } from 'react';
import axios from 'axios';

export default function TestVideo() {
  const [videoData, setVideoData] = useState({
    titolo: '',
    url: '', // Es. URL di YouTube o file mp4 diretto
    livelloDifficolta: 'A1',
    descrizione: ''
  });

  const handleChange = (e) => {
    setVideoData({
      ...videoData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/videos', videoData);
      alert('✅ Video salvato con ID: ' + res.data._id);
      // Reset form opzionale
      setVideoData({ titolo: '', url: '', livelloDifficolta: 'A1', descrizione: '' });
    } catch (err) {
      console.error(err);
      alert('❌ Errore: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h2>Test Caricamento Video</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
        
        <input 
          name="titolo" 
          placeholder="Titolo Video" 
          value={videoData.titolo}
          onChange={handleChange} 
          required 
          style={{ padding: '10px' }} 
        />

        <input 
          name="url" 
          placeholder="URL Video (YouTube/mp4)" 
          value={videoData.url}
          onChange={handleChange} 
          required 
          style={{ padding: '10px' }} 
        />

        <label>Livello Difficoltà:</label>
        <select 
          name="livelloDifficolta" 
          value={videoData.livelloDifficolta} 
          onChange={handleChange} 
          style={{ padding: '10px' }}
        >
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>

        <textarea 
          name="descrizione" 
          placeholder="Descrizione (opzionale)" 
          value={videoData.descrizione}
          onChange={handleChange} 
          style={{ padding: '10px', height: '80px' }} 
        />

        <button type="submit" style={{ padding: '15px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none' }}>
          SALVA VIDEO
        </button>
      </form>
    </div>
  );
}