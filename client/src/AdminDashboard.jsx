import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; // IMPORTANTE

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- STATI GENERALI ---
  const [activeTab, setActiveTab] = useState('videos');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Dati
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);

  // --- STATI FORM VIDEO ---
  const [formData, setFormData] = useState({
    titolo: '', url: '', livelloDifficolta: 'A1', copertina: '', descrizione: '', serie: '', episodio: ''
  });
  const [subData, setSubData] = useState({ id: '', json: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- INIT ---
  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('userData');
      if (!userStr) return navigate('/login');
      const user = JSON.parse(userStr);
      if (user.ruolo !== 'admin') {
        alert('Accesso Negato');
        return navigate('/videos');
      }
    };
    checkAuth();
    loadData();
  }, [navigate, activeTab]);

  const loadData = () => {
    if (activeTab === 'videos') fetchVideos();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'comments') fetchComments();
  };

  // --- API CALLS ---
  const fetchVideos = async () => {
    try { const res = await axios.get('http://localhost:5001/api/videos'); setVideos(res.data); } 
    catch (err) { console.error(err); }
  };
  const fetchUsers = async () => {
    try { const res = await axios.get('http://localhost:5001/api/users'); setUsers(res.data); } 
    catch (err) { console.error(err); }
  };
  const fetchComments = async () => {
    try { const res = await axios.get('http://localhost:5001/api/comments/all'); setComments(res.data); } 
    catch (err) { console.error(err); }
  };

  // --- HANDLERS ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const payload = { ...formData };
      if (!payload.serie) delete payload.serie;
      if (!payload.episodio) delete payload.episodio;

      if (isEditing) {
        await axios.patch(`http://localhost:5001/api/videos/${editId}`, payload);
        setMessage({ text: 'Video aggiornato!', type: 'success' });
      } else {
        const res = await axios.post('http://localhost:5001/api/videos', payload);
        setMessage({ text: 'Video creato! ID: ' + res.data._id, type: 'success' });
        setSubData(prev => ({ ...prev, id: res.data._id }));
      }
      setFormData({ titolo: '', url: '', livelloDifficolta: 'A1', copertina: '', descrizione: '', serie: '', episodio: '' });
      setIsEditing(false); setEditId(null); fetchVideos();
    } catch (err) { setMessage({ text: 'Errore: ' + err.message, type: 'error' }); }
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!subData.id) throw new Error("ID mancante.");
      await axios.patch(`http://localhost:5001/api/videos/${subData.id}/segmenti`, { segmenti: JSON.parse(subData.json) });
      setMessage({ text: 'Sottotitoli caricati!', type: 'success' });
      setSubData({ id: '', json: '' });
    } catch (err) { setMessage({ text: 'Errore JSON: ' + err.message, type: 'error' }); }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm("Eliminare video?")) return;
    try { await axios.delete(`http://localhost:5001/api/videos/${id}`); fetchVideos(); } catch (err) {}
  };
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Eliminare utente?")) return;
    try { await axios.delete(`http://localhost:5001/api/user/${id}`); fetchUsers(); } catch (err) { alert("Errore"); }
  };
  const handleDeleteComment = async (id) => {
    if (!window.confirm("Eliminare commento?")) return;
    try { await axios.delete(`http://localhost:5001/api/admin/comments/${id}`); fetchComments(); } catch (err) { alert("Errore"); }
  };

  const handleEditVideo = (video) => {
    setFormData({ 
      titolo: video.titolo, 
      url: video.url, 
      livelloDifficolta: video.livelloDifficolta, 
      copertina: video.copertina||'', 
      descrizione: video.descrizione||'', 
      serie: video.serie||'', 
      episodio: video.episodio||'' 
    });
    setIsEditing(true); 
    setEditId(video._id); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="hero-container admin-wrapper">
      <div className="card-glass dashboard-card">
        
        {/* HEADER & NAV */}
        <div className="admin-header">
          <h2 className="title-gradient title-lg">Admin Dashboard</h2>
          <button onClick={() => navigate('/videos')} className="btn btn-secondary btn-logout">Kineo</button>
        </div>

        {/* MENU TABS */}
        <div className="tabs-container">
          <TabButton label="Gestione Video" active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} />
          <TabButton label="Utenti" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabButton label="Moderazione Commenti" active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} />
        </div>

        {/* FEEDBACK MSG */}
        {message.text && (
          <div className={`feedback-msg ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* --- TAB: VIDEO --- */}
        {activeTab === 'videos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
             {/* Form Video */}
             <div className="admin-section">
                <h3 className="section-title">{isEditing ? 'Modifica' : '➕ Nuovo Video'}</h3>
                <form onSubmit={handleSubmit} className="form-grid">
                   <div className="col-span-8"><label className="form-label">Titolo</label><input name="titolo" value={formData.titolo} onChange={handleChange} className="form-input" required /></div>
                   <div className="col-span-4"><label className="form-label">Livello</label><select name="livelloDifficolta" value={formData.livelloDifficolta} onChange={handleChange} className="form-input">{['A1','A2','B1','B2','C1'].map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                   <div className="col-span-6"><label className="form-label">URL Video</label><input name="url" value={formData.url} onChange={handleChange} className="form-input" required /></div>
                   <div className="col-span-6"><label className="form-label">Copertina</label><input name="copertina" value={formData.copertina} onChange={handleChange} className="form-input" /></div>
                   <div className="col-span-8"><label className="form-label">Serie (Opz.)</label><input name="serie" value={formData.serie} onChange={handleChange} className="form-input" /></div>
                   <div className="col-span-4"><label className="form-label">Episodio</label><input name="episodio" type="number" value={formData.episodio} onChange={handleChange} className="form-input" /></div>
                   <div className="col-span-12"><button type="submit" className={`btn btn-block ${isEditing?'btn-secondary':'btn-primary'}`}>{isEditing?'Aggiorna':'Pubblica'}</button></div>
                </form>
             </div>

             {/* Form Subs */}
             <div className="admin-section">
                <h3 className="section-title">Sottotitoli JSON</h3>
                <form onSubmit={handleSubSubmit} className="subs-form">
                  <input value={subData.id} onChange={e=>setSubData({...subData, id:e.target.value})} className="form-input input-mono" placeholder="ID Video" required />
                  <input value={subData.json} onChange={e=>setSubData({...subData, json:e.target.value})} className="form-input input-json" placeholder='[{"start":0, "end":2, "text":"Hi"}]' required />
                  <button type="submit" className="btn btn-primary">Carica</button>
                </form>
             </div>

             {/* Tabella Video */}
             <Table headers={['Titolo', 'Serie', 'Livello', 'Azioni']}>
               {videos.map(v => (
                 <tr key={v._id}>
                   <td>{v.titolo}</td>
                   <td>{v.serie ? `${v.serie} (Ep.${v.episodio})` : '-'} <br/><small className="id-small">{v._id}</small></td>
                   <td><Badge text={v.livelloDifficolta} /></td>
                   <td className="text-right">
                     <ActionBtn icon="📝" onClick={() => {setSubData({...subData, id:v._id}); window.scrollTo({top:300, behavior:'smooth'})}} />
                     <ActionBtn icon="✏️" onClick={() => handleEditVideo(v)} />
                     <ActionBtn icon="🗑️" className="bg-red-100" style={{backgroundColor: '#fee2e2'}} onClick={() => handleDeleteVideo(v._id)} />
                   </td>
                 </tr>
               ))}
             </Table>
          </div>
        )}

        {/* --- TAB: UTENTI --- */}
        {activeTab === 'users' && (
          <div>
            <h3 className="section-title">Utenti Registrati ({users.length})</h3>
            <Table headers={['Nome', 'Username', 'Email', 'Ruolo', 'Azioni']}>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.nome} {u.cognome}</td>
                  <td>@{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge ${u.ruolo==='admin'?'role-admin':'role-user'}`}>
                      {u.ruolo}
                    </span>
                  </td>
                  <td className="text-right">
                    {u.ruolo !== 'admin' && (
                      <ActionBtn icon="Elimina" style={{backgroundColor: '#fee2e2'}} onClick={() => handleDeleteUser(u._id)} />
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}

        {/* --- TAB: COMMENTI --- */}
        {activeTab === 'comments' && (
          <div>
            <h3 className="section-title">Ultimi Commenti ({comments.length})</h3>
            <Table headers={['Autore', 'Commento', 'Video', 'Data', 'Azioni']}>
              {comments.map(c => (
                <tr key={c._id}>
                  <td><strong>@{c.utenteId?.username || 'Eliminato'}</strong></td>
                  <td className="comment-preview">"{c.testo}"</td>
                  <td>{c.videoId?.titolo || 'Video rimosso'}</td>
                  <td>{new Date(c.dataCreazione).toLocaleDateString()}</td>
                  <td className="text-right">
                    <ActionBtn icon="Rimuovi" style={{backgroundColor: '#fee2e2'}} onClick={() => handleDeleteComment(c._id)} />
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}

      </div>
    </div>
  );
}

// --- COMPONENTI UI RIUTILIZZABILI ---
const TabButton = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`tab-btn ${active ? 'active' : ''}`}>
    {label}
  </button>
);

const Table = ({ headers, children }) => (
  <div className="table-wrapper">
    <table className="admin-table">
      <thead>
        <tr>
          {headers.map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const Badge = ({ text }) => (
  <span className="badge">{text}</span>
);

const ActionBtn = ({ icon, onClick, style }) => (
  <button onClick={onClick} className="action-btn" style={{ background: '#f3f4f6', ...style }}>
    {icon}
  </button>
);