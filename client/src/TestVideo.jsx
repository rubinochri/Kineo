import { useState } from 'react';
import axios from 'axios';

export default function TestVideo() {
  // Stato creazione video
  const [videoData, setVideoData] = useState({
    titolo: '',
    url: '',
    livelloDifficolta: 'A1',
    descrizione: ''
  });

  // Stato aggiunta sottotitoli
  const [videoId, setVideoId] = useState(''); // ID del video a cui aggiungere i sub
  const [jsonSegmenti, setJsonSegmenti] = useState(''); // Il testo JSON

  // --- HANDLERS CREAZIONE VIDEO ---
  const handleChangeVideo = (e) => {
    setVideoData({ ...videoData, [e.target.name]: e.target.value });
  };

  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/videos', videoData);
      alert('✅ Video creato! ID copiato nel form sotto: ' + res.data._id);
      setVideoId(res.data._id); // Auto-compila il campo ID sotto
      setVideoData({ titolo: '', url: '', livelloDifficolta: 'A1', descrizione: '' });
    } catch (err) {
      alert('❌ Errore creazione: ' + (err.response?.data?.message || err.message));
    }
  };

  // --- HANDLERS AGGIUNTA SOTTOTITOLI ---
  const handleSubmitSottotitoli = async (e) => {
    e.preventDefault();
    try {
      // Parsing del testo per assicurarsi che sia JSON valido prima di inviarlo
      const parsedData = JSON.parse(jsonSegmenti);
      
      await axios.patch(`http://localhost:5001/api/videos/${videoId}/segmenti`, {
        segmenti: parsedData
      });
      
      alert('✅ Sottotitoli caricati con successo!');
      setJsonSegmenti('');
    } catch (err) {
      console.error(err);
      alert('❌ Errore (JSON non valido o Server): ' + err.message);
    }
  };

  return (
    <div style={{ padding: '50px', display: 'flex', gap: '50px' }}>
      
      {/* COLONNA 1: CREA VIDEO BASE */}
      <div style={{ flex: 1 }}>
        <h2>1. Crea Video</h2>
        <form onSubmit={handleSubmitVideo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="titolo" placeholder="Titolo" value={videoData.titolo} onChange={handleChangeVideo} required style={{padding:'10px'}}/>
          <input name="url" placeholder="URL Video" value={videoData.url} onChange={handleChangeVideo} required style={{padding:'10px'}}/>
          <select name="livelloDifficolta" value={videoData.livelloDifficolta} onChange={handleChangeVideo} style={{padding:'10px'}}>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <textarea name="descrizione" placeholder="Descrizione" value={videoData.descrizione} onChange={handleChangeVideo} style={{padding:'10px'}}/>
          <button type="submit" style={{padding:'15px', background:'#28a745', color:'white'}}>SALVA VIDEO</button>
        </form>
      </div>

      {/* COLONNA 2: AGGIUNGI SOTTOTITOLI */}
      <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '50px' }}>
        <h2>2. Carica Sottotitoli (JSON)</h2>
        <p style={{fontSize: '0.8em', color: '#666'}}>Incolla qui l'array JSON dei segmenti.</p>
        
        <form onSubmit={handleSubmitSottotitoli} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            placeholder="ID del Video (es. 65a4...)" 
            value={videoId} 
            onChange={(e) => setVideoId(e.target.value)} 
            required 
            style={{padding:'10px', background: '#f9f9f9', fontFamily: 'monospace'}}
          />
          
          <textarea 
            placeholder='[ { "startTime": 0, "endTime": 5, "testoInglese": "Hello...", "approfondimenti": [] } ]' 
            value={jsonSegmenti} 
            onChange={(e) => setJsonSegmenti(e.target.value)} 
            required 
            style={{padding:'10px', height: '300px', fontFamily: 'monospace', fontSize: '12px'}} 
          />
          
          <button type="submit" style={{padding:'15px', background:'#007bff', color:'white'}}>CARICA JSON</button>
        </form>
      </div>

    </div>
  );
}