/*
import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactPlayer from 'react-player'

function App() {
  const [videos, setVideos] = useState([])

  // 1. Scarica i dati dal Backend appena si apre il sito
  useEffect(() => {
    axios.get('http://localhost:5001/api/videos')
      .then(response => {
        console.log("Dati ricevuti:", response.data)
        setVideos(response.data)
      })
      .catch(error => console.error("Errore:", error))
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Kineo Player</h1>

      {videos.length === 0 ? (
        <p>Caricamento video...</p>
      ) : (
        videos.map(video => (
          <div key={video._id} style={{ marginBottom: '40px', border: '1px solid #ddd', padding: '10px' }}>
            <h2>{video.title}</h2>

            {/* Player Video } */
            
            /*
            <div style={{ maxWidth: '640px' }}>
              <ReactPlayer url={video.url} controls width="100%" />
            </div>

            <h3>Sottotitoli Interattivi:</h3>
            <div style={{ height: '150px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
              {video.segments.map((seg, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: 'blue' }}>
                    [{Math.floor(seg.startTimeMs / 1000)}s]:
                  </span> 
                  {" " + seg.textEnglish}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default App

*/

import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Import necessario per le rotte
import TestRegister from './TestRegister'; // Assicurati che questo file esista in src/

// --- COMPONENTE HOME (La tua logica originale) ---
function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    // Nota: Assicurati che la porta 5001 sia quella corretta del tuo server backend
    axios.get('http://localhost:5001/api/videos')
      .then(response => {
        console.log("Dati ricevuti:", response.data);
        setVideos(response.data);
      })
      .catch(error => console.error("Errore:", error));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Kineo Player</h1>
        {/* Link temporaneo per andare alla registrazione */}
        <Link to="/test" style={{ padding: '10px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Vai a Test Registrazione
        </Link>
      </div>

      {videos.length === 0 ? (
        <p>Caricamento video...</p>
      ) : (
        videos.map(video => (
          <div key={video._id} style={{ marginBottom: '40px', border: '1px solid #ddd', padding: '10px' }}>
            <h2>{video.title}</h2>
            
            <div style={{ maxWidth: '640px' }}>
              <ReactPlayer url={video.url} controls width="100%" />
            </div>

            <h3>Sottotitoli Interattivi:</h3>
            <div style={{ height: '150px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
              {video.segments && video.segments.map((seg, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: 'blue' }}>
                    [{Math.floor(seg.startTimeMs / 1000)}s]:
                  </span> 
                  {" " + seg.textEnglish}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// --- APP PRINCIPALE (Gestione Rotte) ---
function App() {
  return (
    <Router>
      <Routes>
        {/* Rotta principale: mostra i video */}
        <Route path="/" element={<Home />} />
        
        {/* Rotta di test: mostra il form di registrazione */}
        <Route path="/test" element={<TestRegister />} />
      </Routes>
    </Router>
  );
}

export default App;