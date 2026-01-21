import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    username: '',
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => { 
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // 1. REGISTRAZIONE UTENTE
      await axios.post('http://localhost:5001/api/register', formData);
      
      // 2. AUTO-LOGIN IMMEDIATO
      // Usiamo le stesse credenziali appena inserite per ottenere il token/sessione
      const loginRes = await axios.post('http://localhost:5001/api/login', {
        email: formData.email,
        password: formData.password
      });

      setSuccess('Account creato! Accesso automatico in corso...');
      
      // 3. SALVATAGGIO SESSIONE
      localStorage.setItem('userData', JSON.stringify(loginRes.data.user));

      // 4. REINDIRIZZAMENTO ALLA LIBRERIA VIDEO
      setTimeout(() => {
        navigate('/videos');
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Errore durante la registrazione');
    }
  };

  return (
    <div className="hero-container">
      
      <div className="card-glass animate-enter">
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 className="title-gradient title-lg">
            Crea account
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
            Unisciti a Kineo e inizia ad imparare
          </p>
        </div>

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

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">Nome</label>
              <input 
                className="form-input" 
                name="nome" 
                placeholder="Mario" 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label className="form-label">Cognome</label>
              <input 
                className="form-input" 
                name="cognome" 
                placeholder="Rossi" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Username</label>
            <input 
              className="form-input" 
              name="username" 
              placeholder="mariorossi99" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              name="email" 
              type="email" 
              placeholder="mario.rossi@email.com" 
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
              placeholder="Create a strong password" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            REGISTRATI
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '1rem', color: '#6b7280' }}>
          Hai già un account? 
          <Link to="/login" style={{ color: '#0071e3', fontWeight: '600', textDecoration: 'none', marginLeft: '6px' }}>
            Accedi qui
          </Link>
        </p>
      </div>
    </div>
  );
}