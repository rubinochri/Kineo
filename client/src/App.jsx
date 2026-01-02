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

            {/* Player Video */}
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