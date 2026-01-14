import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TestRegister from './TestRegister';
import TestVideo from './TestVideo'; 

function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/videos')
      .then(response => {
        console.log("Dati ricevuti:", response.data);
        setVideos(response.data);
      })
      .catch(error => console.error("Errore:", error));
  }, []);

  // Riconosce se è un file fisico (.mp4, .mov, ecc.)
  const isDirectFile = (url) => {
    return url && url.match(/\.(mp4|webm|ogg|mov)$/i); 
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <h1>Kineo Player</h1>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <Link to="/test" style={btnStyle}>Test Registrazione</Link>
            <Link to="/test-video" style={{...btnStyle, background: '#28a745'}}>Test Carica Video</Link>
        </nav>
      </div>

      {videos.length === 0 ? (
        <p>Nessun video trovato. Usa "Test Carica Video" per aggiungerne uno.</p>
      ) : (
        videos.map(video => (
          <div key={video._id} style={{ marginBottom: '60px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            
            {/* Titolo e Difficoltà */}
            <h2>
              {video.titolo} 
              <span style={{fontSize:'0.6em', background:'#eee', padding:'2px 5px', marginLeft: '10px', borderRadius:'4px'}}>
                {video.livelloDifficolta}
              </span>
            </h2>

            {/* --- LOGICA DEL PLAYER --- */}
            <div style={{ width: '100%', maxWidth: '800px', margin: '20px 0', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                {video.url ? (
                    isDirectFile(video.url) ? (
                        /* CASO 1: File Diretto (.mp4) */
                        <video 
                            src={video.url} 
                            controls 
                            width="100%" 
                            style={{ display: 'block' }} 
                        />
                    ) : (
                        /* CASO 2: YouTube (o altri link) */
                        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                            <ReactPlayer 
                                key={video.url} /* CRUCIALE: Forza il refresh del player per ogni video */
                                url={video.url} 
                                controls={true} 
                                width="100%" 
                                height="100%" 
                                style={{ position: 'absolute', top: 0, left: 0 }}
                                config={{
                                  youtube: {
                                    playerVars: { 
                                        showinfo: 1,
                                        origin: window.location.origin // Risolve blocchi CORS su embed
                                    }
                                  }
                                }}
                            />
                        </div>
                    )
                ) : (
                    <div style={{padding: '20px', color: 'white', textAlign: 'center'}}>URL mancante</div>
                )}
            </div>

            {/* Descrizione */}
            {video.descrizione && <p><i>{video.descrizione}</i></p>}

            {/* Sottotitoli (Se presenti) */}
            {video.segmenti && video.segmenti.length > 0 && (
                <div style={{ height: '150px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
                {video.segmenti.map((seg, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: 'blue' }}>
                        [{Math.floor(seg.startTime)}]s:
                    </span> 
                    {" " + seg.testoInglese}
                    </div>
                ))}
                </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const btnStyle = { padding: '10px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' };

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestRegister />} />
        <Route path="/test-video" element={<TestVideo />} />
      </Routes>
    </Router>
  );
}

export default App;