import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate(); //funzione per spostare l'utente tra le rotte
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); //gestisce l'errore
  const [success, setSuccess] = useState(''); //gestisce il successo

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setSuccess('');
    
    try {
      const res = await axios.post('http://localhost:5001/api/login', formData);
      
      // 1. Salvataggio dati utente e token
      const userData = res.data.user;
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setSuccess('Accesso effettuato! Reindirizzamento...');

      // 2. Logica di Reindirizzamento basata sul Ruolo
      setTimeout(() => {
        if (userData.ruolo === 'admin') {
          console.log("Utente Admin rilevato: Vado alla dashboard");
          navigate('/admin'); // <--- CORRETTO: Punta alla rotta /admin
        } else {
          console.log("Utente Standard rilevato: Vado ai video");
          navigate('/videos'); // Rotta Utente
        }
      }, 1500);

    } catch (err) {
      console.error("Errore Login:", err);
      setError(err.response?.data?.msg || 'Errore durante l\'accesso');
    }
  };

  return (
    <div className="hero-container">
      {/* --- SFONDO ANIMATO --- */}
      <div className="bg-animation-wrapper">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* --- CARD VETRO --- */}
      <div className="card-glass animate-enter">
        
        {/* Intestazione */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 className="title-gradient title-lg">
            Bentornato
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
            Inserisci le tue credenziali per accedere
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div style={{ padding: '15px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', marginBottom: '25px', textAlign:'center', fontWeight:'600', fontSize: '0.95rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '15px', borderRadius: '12px', background: '#dcfce7', color: '#166534', marginBottom: '25px', textAlign:'center', fontWeight:'600', fontSize: '0.95rem' }}>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              name="email" 
              type="email" 
              placeholder="mario.rossi@example.com" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <label className="form-label">Password</label>
            <input 
              className="form-input" 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            ACCEDI
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '1rem', color: '#6b7280' }}>
          Non hai un account? 
          <Link to="/register" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none', marginLeft: '6px' }}>
            Registrati ora
          </Link>
        </p>
      </div>
    </div>
  );
}