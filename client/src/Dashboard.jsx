import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Importa gli stili

function Dashboard() {
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    if (!loggedUser) navigate('/login');
  }, [loggedUser, navigate]);

  const [userData, setUserData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [userComments, setUserComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (loggedUser?.id) fetchUserData();
  }, [loggedUser?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/user/${loggedUser.id}`);
      setUserData(res.data);
      setEditedData(res.data);
      setMessage('');
    } catch (err) {
      console.error(err);
      setMessage(`Errore nel caricamento: ${err.response?.data?.msg || 'Server off'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editedData.nome?.trim()) newErrors.nome = 'Nome obbligatorio';
    if (!editedData.cognome?.trim()) newErrors.cognome = 'Cognome obbligatorio';
    if (!editedData.username?.trim()) newErrors.username = 'Username obbligatorio';
    if (!editedData.email?.trim()) {
      newErrors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedData.email)) {
      newErrors.email = 'Email non valida';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await axios.put(`http://localhost:5001/api/user/${loggedUser.id}`, {
        nome: editedData.nome,
        cognome: editedData.cognome,
        username: editedData.username,
        email: editedData.email
      });

      setUserData(res.data.user);
      setEditedData(res.data.user);
      
      const updatedUser = {
        ...loggedUser,
        nome: res.data.user.nome,
        username: res.data.user.username,
        email: res.data.user.email
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      setIsEditing(false);
      setMessage('Dati aggiornati con successo!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage(`Errore: ${err.response?.data?.msg || 'Errore salvataggio'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
    setErrors({});
    setMessage('');
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const fetchUserComments = async () => {
    try {
      setLoadingComments(true);
      const res = await axios.get(`http://localhost:5001/api/user/${loggedUser.id}/commenti`);
      setUserComments(res.data);
      setShowComments(true);
    } catch (err) {
      console.error(err);
      setMessage(`Errore caricamento commenti`);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await axios.put(`http://localhost:5001/api/commenti/${commentId}/like`, {
        utenteId: loggedUser.id
      });
      setUserComments(prev => prev.map(c => c._id === commentId ? { ...c, like: res.data.like } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('⚠️ ATTENZIONE: Azione irreversibile. Confermi?')) return;
    if (!window.confirm('Sicuro al 100%?')) return;

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5001/api/user/${loggedUser.id}`);
      localStorage.removeItem('userData');
      setMessage('Profilo eliminato');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(`Errore eliminazione`);
      setLoading(false);
    }
  };

  if (loading && !userData) return <div className="dashboard-container"><p>Caricamento dati...</p></div>;
  if (!userData) return <div className="dashboard-container"><p>Dati non disponibili</p></div>;

  return (
    <div className="dashboard-container animate-enter">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <h2 className="title-gradient title-lg" style={{ margin: 0, fontSize: '2rem' }}>
          Dashboard Profilo
        </h2>
        <button onClick={handleLogout} className="btn btn-danger btn-small">
          Esci
        </button>
      </div>

      {/* FEEDBACK */}
      {message && (
        <div className={`alert-box ${message.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* FORM DATI */}
      <div className="dashboard-card">
        <h3 className="section-title">Informazioni Personali</h3>

        <div className="input-group">
          <label className="input-label">Nome</label>
          <input
            className={`dashboard-input ${errors.nome ? 'input-error' : ''}`}
            name="nome"
            value={editedData.nome || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
          {errors.nome && <span className="error-msg">{errors.nome}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Cognome</label>
          <input
            className={`dashboard-input ${errors.cognome ? 'input-error' : ''}`}
            name="cognome"
            value={editedData.cognome || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
          {errors.cognome && <span className="error-msg">{errors.cognome}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Username</label>
          <input
            className={`dashboard-input ${errors.username ? 'input-error' : ''}`}
            name="username"
            value={editedData.username || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
          {errors.username && <span className="error-msg">{errors.username}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            className={`dashboard-input ${errors.email ? 'input-error' : ''}`}
            name="email"
            value={editedData.email || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
          {errors.email && <span className="error-msg">{errors.email}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Ruolo</label>
          <input
            className="dashboard-input"
            value={userData.ruolo || 'Studente'}
            disabled
          />
        </div>

        <div className="input-group">
          <label className="input-label">Data Registrazione</label>
          <input
            className="dashboard-input"
            value={userData.dataRegistrazione ? new Date(userData.dataRegistrazione).toLocaleDateString('it-IT') : ''}
            disabled
          />
        </div>

        <div className="action-buttons">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ width: '100%' }}>
              Modifica Dati
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={loading} className="btn btn-success" style={{ flex: 1 }}>
                {loading ? '...' : 'Salva'}
              </button>
              <button onClick={handleCancel} disabled={loading} className="btn btn-neutral" style={{ flex: 1 }}>
                Annulla
              </button>
            </>
          )}
        </div>
        
        {!isEditing && (
          <div className="info-box">
            <p><strong>Info:</strong> Stai visualizzando i dati di <strong>{loggedUser?.nome}</strong>.</p>
          </div>
        )}
      </div>

      {/* COMMENTI */}
      <div className="dashboard-card">
        <div className="comments-header">
          <h4 className="section-title" style={{ marginBottom: 0 }}>I Tuoi Commenti</h4>
          <button
            onClick={() => showComments ? setShowComments(false) : fetchUserComments()}
            disabled={loadingComments}
            className="btn btn-secondary btn-small"
          >
            {loadingComments ? 'Caricamento...' : showComments ? 'Nascondi' : 'Visualizza'}
          </button>
        </div>

        {showComments && (
          <div className="comments-list">
            {userComments.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Nessun commento trovato.</p>
            ) : (
              userComments.map((comment) => {
                const hasLiked = comment.like?.includes(loggedUser.id);
                return (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-meta">
                      <strong>Video: {comment.videoId?.titolo || 'Video rimosso'}</strong>
                      <span>{new Date(comment.dataCreazione).toLocaleDateString('it-IT')}</span>
                    </div>
                    <p className="comment-text">{comment.testo}</p>
                    
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className={`like-btn ${hasLiked ? 'liked' : ''}`}
                      >
                        <span>{hasLiked ? '❤️' : '🤍'}</span>
                        <span>{comment.like?.length || 0}</span>
                      </button>
                      {comment.parentCommentoId && (
                        <span style={{ fontSize: '0.8rem', color: '#2563eb' }}>↳ Risposta</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ZONA PERICOLOSA */}
      <div className="danger-zone">
        <h4 className="danger-title">Zona Pericolosa</h4>
        <p className="danger-desc">
          L'eliminazione del profilo è permanente. Tutti i tuoi dati verranno persi per sempre.
        </p>
        <button onClick={handleDeleteProfile} disabled={loading} className="btn-outline-danger">
          Elimina Profilo Definitivamente
        </button>
      </div>

    </div>
  );
}

export default Dashboard;