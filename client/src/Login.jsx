import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Importa lo stile dedicato

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setSuccess('');
    
    try {
      const res = await axios.post('http://localhost:5001/api/login', formData);
      
      const userData = res.data.user;
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setSuccess('Accesso effettuato! Reindirizzamento...');

      setTimeout(() => {
        if (userData.ruolo === 'admin') {
          navigate('/admin');
        } else {
          navigate('/videos');
        }
      }, 1500);

    } catch (err) {
      console.error("Errore Login:", err);
      setError(err.response?.data?.msg || 'Errore durante l\'accesso');
    }
  };

  return (
    <div className="hero-container">
      
      <div className="card-glass animate-enter">
        
        {/* Intestazione */}
        <div className="login-header">
          <h2 className="title-gradient title-lg">
            Bentornato
          </h2>
          <p className="login-subtitle">
            Inserisci le tue credenziali per accedere
          </p>
        </div>

        {/* Feedback */}
        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
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
          
          <div className="form-group-last">
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
          
          <button type="submit" className="btn btn-primary btn-full">
            ACCEDI
          </button>
        </form>

        {/* Footer */}
        <p className="login-footer">
          Non hai un account? 
          <Link to="/register" className="link-highlight">
            Registrati ora
          </Link>
        </p>
      </div>
    </div>
  );
}