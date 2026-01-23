import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Riutilizziamo lo stile condiviso

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
      const loginRes = await axios.post('http://localhost:5001/api/login', {
        email: formData.email,
        password: formData.password
      });

      setSuccess('Account creato! Accesso automatico in corso...');
      
      // 3. SALVATAGGIO SESSIONE
      localStorage.setItem('userData', JSON.stringify(loginRes.data.user));

      // 4. REINDIRIZZAMENTO
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
        
        {/* Intestazione */}
        <div className="login-header">
          <h2 className="title-gradient title-lg">
            Crea account
          </h2>
          <p className="login-subtitle">
            Unisciti a Kineo e inizia ad imparare
          </p>
        </div>

        {/* Feedback Messaggi */}
        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Griglia per Nome e Cognome */}
          <div className="form-grid-2">
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

          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              className="form-input" 
              name="username" 
              placeholder="mariorossi99" 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
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
          
          <div className="form-group-last">
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
          
          <button type="submit" className="btn btn-primary btn-full">
            REGISTRATI
          </button>
        </form>

        {/* Footer */}
        <p className="login-footer">
          Hai già un account? 
          <Link to="/login" className="link-highlight">
            Accedi qui
          </Link>
        </p>
      </div>
    </div>
  );
}