import { useState, useEffect } from 'react';
import axios from 'axios'; 
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'; 

// Pagine
import Home from './Home';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import VideoLibrary from './VideoLibrary'; 
import DictionaryPage from './DictionaryPage';

// Importa la Dashboard Admin
// NOTA: Se il file è in src/pages/, cambia in: from "./pages/AdminDashboard";
import AdminDashboard from "./AdminDashboard"; 

function AppContent() {
  const [savedWords, setSavedWords] = useState([]);
  const [userId, setUserId] = useState(null);
  
  const location = useLocation(); 

  // --- 1. CARICAMENTO DATI ---
  useEffect(() => {
    const checkUserAndFetch = async () => {
      const storedData = localStorage.getItem('userData');
      
      if (storedData) {
        const user = JSON.parse(storedData);
        
        if (user.id !== userId) {
          setUserId(user.id);
          try {
            const res = await axios.get(`http://localhost:5001/api/user/${user.id}/dizionario`);
            const words = res.data.map(w => ({ ...w, id: w._id }));
            setSavedWords(words);
          } catch (err) {
            console.error("Errore caricamento dizionario:", err);
          }
        }
      } else {
        if (userId !== null) {
            setSavedWords([]);
            setUserId(null);
        }
      }
    };
    
    checkUserAndFetch();
  }, [location, userId]); 

  // --- 2. AZIONI (CRUD) ---

  const toggleSaveWord = async (wordData) => {
    if (!userId) {
      alert("Devi essere loggato per salvare le parole!");
      return;
    }
    const existingWord = savedWords.find(w => w.original.toLowerCase() === wordData.original.toLowerCase());

    try {
      if (existingWord) {
        const res = await axios.delete(`http://localhost:5001/api/user/${userId}/dizionario/${existingWord.id}`);
        setSavedWords(res.data.map(w => ({ ...w, id: w._id })));
      } else {
        const res = await axios.post(`http://localhost:5001/api/user/${userId}/dizionario`, {
           original: wordData.original,
           translation: wordData.translation,
           type: wordData.type || 'Generic',
           notes: '',    
           learned: false 
        });
        setSavedWords(res.data.map(w => ({ ...w, id: w._id })));
      }
    } catch (err) {
      console.error("Errore salvataggio parola:", err);
      alert("Errore di connessione col dizionario.");
    }
  };

  const removeWord = async (id) => {
    if (!userId) return;
    try {
       const res = await axios.delete(`http://localhost:5001/api/user/${userId}/dizionario/${id}`);
       setSavedWords(res.data.map(w => ({ ...w, id: w._id })));
    } catch (err) {
       console.error("Errore rimozione parola:", err);
    }
  };

  const updateWord = async (id, updates) => {
    if (!userId) return;
    setSavedWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));

    try {
        await axios.put(`http://localhost:5001/api/user/${userId}/dizionario/${id}`, updates);
    } catch (err) {
        console.error("Errore aggiornamento parola:", err);
        alert("Impossibile salvare le modifiche.");
    }
  };

  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Area Utente */}
        <Route path="/videos" element={
            <VideoLibrary savedWords={savedWords} onToggleSave={toggleSaveWord} />
        } />
        <Route path="/dizionario" element={
            <DictionaryPage 
                savedWords={savedWords} 
                onRemoveWord={removeWord} 
                onUpdateWord={updateWord} 
            />
        } />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Area Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;