import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  
  // Recupera i dati dell'utente dal localStorage (salvati al login)
  const loggedUser = JSON.parse(localStorage.getItem('userData'));

  // REDIRECT se non è loggato
  useEffect(() => {
    if (!loggedUser) {
      navigate('/login');
    }
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

  // Carica i dati dell'utente al montaggio
  useEffect(() => {
    if (loggedUser?.id) {
      fetchUserData();
    }
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
      setMessage(`❌ Errore nel caricamento dei dati: ${err.response?.data?.msg || 'Server non raggiungibile'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
    // Rimuove l'errore per questo campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

      // Aggiorna i dati locali
      setUserData(res.data.user);
      setEditedData(res.data.user);
      
      // Aggiorna anche il localStorage
      const updatedUser = {
        ...loggedUser,
        nome: res.data.user.nome,
        username: res.data.user.username,
        email: res.data.user.email
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      setIsEditing(false);
      setMessage('✅ Dati aggiornati con successo!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage(`❌ Errore: ${err.response?.data?.msg || 'Errore nel salvataggio'}`);
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
      console.error('Errore caricamento commenti:', err);
      setMessage(`❌ Errore nel caricamento dei commenti: ${err.response?.data?.msg || 'Errore sconosciuto'}`);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await axios.put(`http://localhost:5001/api/commenti/${commentId}/like`, {
        utenteId: loggedUser.id
      });
      
      // Aggiorna lo stato locale del commento con i nuovi like
      setUserComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, like: res.data.like }
          : comment
      ));
    } catch (err) {
      console.error('Errore like commento:', err);
      setMessage(`❌ Errore: ${err.response?.data?.message || 'Impossibile aggiornare il like'}`);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      '⚠️ ATTENZIONE: Questa azione eliminerà definitivamente il tuo profilo e tutti i dati associati.\n\nSei sicuro di voler procedere?'
    );
    
    if (!confirmed) return;

    // Seconda conferma per sicurezza
    const doubleConfirm = window.confirm(
      'Confermi di voler eliminare il tuo profilo? Questa azione è irreversibile.'
    );
    
    if (!doubleConfirm) return;

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5001/api/user/${loggedUser.id}`);
      
      // Logout automatico dopo eliminazione
      localStorage.removeItem('userData');
      setMessage('✅ Profilo eliminato con successo');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage(`❌ Errore nell'eliminazione del profilo: ${err.response?.data?.msg || 'Errore sconosciuto'}`);
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Caricamento dati...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto' }}>
        <p>Dati non disponibili</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>📊 Dashboard Profilo</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: 'bold'
          }}
        >
          Esci
        </button>
      </div>

      {/* MESSAGGIO FEEDBACK */}
      {message && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          borderRadius: '4px',
          backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
          color: message.startsWith('✅') ? '#155724' : '#721c24',
          border: message.startsWith('✅') ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        }}>
          {message}
        </div>
      )}

      {/* FORM DATI */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Informazioni Profilo</h3>

        {/* CAMPO: NOME */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Nome
          </label>
          <input
            type="text"
            name="nome"
            value={editedData.nome || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${errors.nome ? '#dc3545' : '#ccc'}`,
              boxSizing: 'border-box',
              backgroundColor: isEditing ? '#fff' : '#e9ecef',
              cursor: isEditing ? 'text' : 'not-allowed'
            }}
          />
          {errors.nome && <span style={{ color: '#dc3545', fontSize: '0.85em' }}>{errors.nome}</span>}
        </div>

        {/* CAMPO: COGNOME */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Cognome
          </label>
          <input
            type="text"
            name="cognome"
            value={editedData.cognome || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${errors.cognome ? '#dc3545' : '#ccc'}`,
              boxSizing: 'border-box',
              backgroundColor: isEditing ? '#fff' : '#e9ecef',
              cursor: isEditing ? 'text' : 'not-allowed'
            }}
          />
          {errors.cognome && <span style={{ color: '#dc3545', fontSize: '0.85em' }}>{errors.cognome}</span>}
        </div>

        {/* CAMPO: USERNAME */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Username
          </label>
          <input
            type="text"
            name="username"
            value={editedData.username || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${errors.username ? '#dc3545' : '#ccc'}`,
              boxSizing: 'border-box',
              backgroundColor: isEditing ? '#fff' : '#e9ecef',
              cursor: isEditing ? 'text' : 'not-allowed'
            }}
          />
          {errors.username && <span style={{ color: '#dc3545', fontSize: '0.85em' }}>{errors.username}</span>}
        </div>

        {/* CAMPO: EMAIL */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={editedData.email || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${errors.email ? '#dc3545' : '#ccc'}`,
              boxSizing: 'border-box',
              backgroundColor: isEditing ? '#fff' : '#e9ecef',
              cursor: isEditing ? 'text' : 'not-allowed'
            }}
          />
          {errors.email && <span style={{ color: '#dc3545', fontSize: '0.85em' }}>{errors.email}</span>}
        </div>

        {/* CAMPO: RUOLO (READ-ONLY) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Ruolo
          </label>
          <input
            type="text"
            value={userData.ruolo || 'Studente'}
            disabled
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              backgroundColor: '#e9ecef',
              cursor: 'not-allowed'
            }}
          />
        </div>

        {/* CAMPO: DATA REGISTRAZIONE (READ-ONLY) */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
            Data Registrazione
          </label>
          <input
            type="text"
            value={userData.dataRegistrazione ? new Date(userData.dataRegistrazione).toLocaleDateString('it-IT') : ''}
            disabled
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box',
              backgroundColor: '#e9ecef',
              cursor: 'not-allowed'
            }}
          />
        </div>

        {/* PULSANTI AZIONE */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                flex: 1,
                padding: '12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#0056b3'}
              onMouseLeave={(e) => e.target.style.background = '#007bff'}
            >
              ✏️ Modifica
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: loading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.background = '#218838')}
                onMouseLeave={(e) => !loading && (e.target.style.background = '#28a745')}
              >
                {loading ? 'Salvataggio...' : '💾 Salva'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.background = '#5a6268')}
                onMouseLeave={(e) => !loading && (e.target.style.background = '#6c757d')}
              >
                ❌ Annulla
              </button>
            </>
          )}
        </div>
      </div>

      {/* INFO AGGIUNTIVE */}
      <div style={{ marginTop: '30px', padding: '15px', background: '#e7f3ff', border: '1px solid #b3d9ff', borderRadius: '4px', color: '#004085' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>ℹ️ Informazioni</p>
        <p style={{ margin: '5px 0' }}>Sei loggato come: <strong>{loggedUser?.nome}</strong></p>
        <p style={{ margin: '5px 0', fontSize: '0.9em' }}>Modifica i tuoi dati e salva le modifiche nel database.</p>
      </div>

      {/* SEZIONE COMMENTI UTENTE */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: '#333' }}>💬 I Tuoi Commenti</h4>
          <button
            onClick={() => showComments ? setShowComments(false) : fetchUserComments()}
            disabled={loadingComments}
            style={{
              padding: '10px 20px',
              background: showComments ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingComments ? 'not-allowed' : 'pointer',
              fontSize: '0.95em',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => !loadingComments && (e.target.style.background = showComments ? '#5a6268' : '#0056b3')}
            onMouseLeave={(e) => !loadingComments && (e.target.style.background = showComments ? '#6c757d' : '#007bff')}
          >
            {loadingComments ? 'Caricamento...' : showComments ? '🔼 Nascondi' : '🔽 Visualizza Commenti'}
          </button>
        </div>

        {showComments && (
          <div>
            {userComments.length === 0 ? (
              <p style={{ color: '#6c757d', fontStyle: 'italic' }}>Non hai ancora scritto commenti.</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {userComments.map((comment) => {
                  const hasLiked = comment.like?.includes(loggedUser.id);
                  const likeCount = comment.like?.length || 0;
                  
                  return (
                  <div key={comment._id} style={{
                    background: 'white',
                    padding: '15px',
                    marginBottom: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85em', color: '#6c757d', fontWeight: 'bold' }}>
                        Video: {comment.videoId?.titolo || 'Video eliminato'}
                      </span>
                      <span style={{ fontSize: '0.8em', color: '#999' }}>
                        {new Date(comment.dataCreazione).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', color: '#333', lineHeight: '1.5' }}>
                      {comment.testo}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          background: hasLiked ? '#e3f2fd' : '#f8f9fa',
                          color: hasLiked ? '#1976d2' : '#6c757d',
                          border: `1px solid ${hasLiked ? '#1976d2' : '#dee2e6'}`,
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '0.85em',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        <span style={{ fontSize: '1.1em' }}>{hasLiked ? '❤️' : '🤍'}</span>
                        <span>{likeCount}</span>
                      </button>
                      {comment.parentCommentoId && (
                        <span style={{ fontSize: '0.75em', color: '#007bff' }}>
                          ↳ Risposta a un commento
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ZONA PERICOLOSA - ELIMINA PROFILO */}
      <div style={{ marginTop: '30px', padding: '20px', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#856404' }}>⚠️ Zona Pericolosa</h4>
        <p style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '0.95em' }}>
          L'eliminazione del profilo è permanente e non può essere annullata. Tutti i tuoi dati verranno cancellati definitivamente.
        </p>
        <button
          onClick={handleDeleteProfile}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#dc3545',
            color: 'white',
            border: '2px solid #c82333',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#c82333')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#dc3545')}
        >
          🗑️ Elimina Profilo
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
