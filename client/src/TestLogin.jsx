import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TestLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setUserData(null);

    try {
      // Chiamata al backend
      const res = await axios.post('http://localhost:5001/api/login', formData);
      
      // Successo - salva i dati nel localStorage
      setMessage(`✅ ${res.data.msg}`);
      setUserData(res.data.user);
      
      // Salva i dati dell'utente nel localStorage per accesso a Dashboard
      localStorage.setItem('userData', JSON.stringify(res.data.user));
      
      // Reindirizza alla dashboard dopo 1.5 secondi
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      // Errore
      console.error(err);
      setMessage(`❌ Errore: ${err.response?.data?.msg || 'Server non raggiungibile'}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Test Login</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
            <input 
            type="email" 
            name="email" 
            placeholder="mario.rossi@example.com" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
        </div>

        <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
            <input 
            type="password" 
            name="password" 
            placeholder="********" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
        </div>

        <button type="submit" style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>
          Accedi
        </button>
      </form>

      {/* FEEDBACK MESSAGGIO */}
      {message && (
        <div style={{ marginTop: '20px', padding: '10px', borderRadius: '4px', backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da', color: message.startsWith('✅') ? '#155724' : '#721c24' }}>
            {message}
        </div>
      )}

      {/* DATI UTENTE RICEVUTI */}
      {userData && (
        <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Dati Sessione:</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9em' }}>
            <li><strong>ID:</strong> {userData.id}</li>
            <li><strong>Nome:</strong> {userData.nome}</li>
            <li><strong>Email:</strong> {userData.email}</li>
            <li><strong>Ruolo:</strong> {userData.ruolo}</li>
          </ul>
          <p style={{ margin: '15px 0 0 0', fontSize: '0.9em', color: '#666' }}>
            Reindirizzamento alla dashboard in corso... oppure <a href="/dashboard" style={{ color: '#007bff', textDecoration: 'none' }}>clicca qui</a>
          </p>
        </div>
      )}
    </div>
  );
}

export default TestLogin;