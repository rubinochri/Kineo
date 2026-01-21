import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- STATI GENERALI ---
  const [activeTab, setActiveTab] = useState('videos'); // 'videos', 'users', 'comments'
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
  }, [navigate, activeTab]); // Ricarica quando cambi Tab

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

  // --- HANDLERS VIDEO & SUBS (Invariati) ---
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

  // --- DELETE HANDLERS ---
  const handleDeleteVideo = async (id) => {
    if (!window.confirm("Eliminare video?")) return;
    try { await axios.delete(`http://localhost:5001/api/videos/${id}`); fetchVideos(); } catch (err) {}
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Eliminare utente? Questa azione è irreversibile.")) return;
    try { await axios.delete(`http://localhost:5001/api/user/${id}`); fetchUsers(); } catch (err) { alert("Errore eliminazione utente"); }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Eliminare commento?")) return;
    try { await axios.delete(`http://localhost:5001/api/admin/comments/${id}`); fetchComments(); } catch (err) { alert("Errore eliminazione commento"); }
  };

  // --- EDIT HELPER ---
  const handleEditVideo = (video) => {
    setFormData({ titolo: video.titolo, url: video.url, livelloDifficolta: video.livelloDifficolta, copertina: video.copertina||'', descrizione: video.descrizione||'', serie: video.serie||'', episodio: video.episodio||'' });
    setIsEditing(true); setEditId(video._id); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="hero-container" style={{ alignItems: 'flex-start', paddingTop: '100px', height: 'auto', minHeight: '100vh' }}>
      <div className="card-glass" style={{ width: '90%', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER & NAV */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="title-gradient title-lg">Admin Dashboard</h2>
          <button onClick={() => navigate('/videos')} className="btn btn-secondary" style={{ padding: '8px 15px', fontSize: '0.9rem' }}>Esci</button>
        </div>

        {/* MENU TABS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
          <TabButton label="🎥 Gestione Video" active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} />
          <TabButton label="👥 Utenti" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabButton label="💬 Moderazione Commenti" active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} />
        </div>

        {/* FEEDBACK MSG */}
        {message.text && (
          <div style={{ padding: '15px', background: message.type==='error'?'#fee2e2':'#dcfce7', color: message.type==='error'?'#991b1b':'#166534', borderRadius: '8px', marginBottom: '30px', textAlign: 'center' }}>
            {message.text}
          </div>
        )}

        {/* --- TAB: VIDEO --- */}
        {activeTab === 'videos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
             {/* Form Video */}
             <div style={sectionStyle}>
                <h3 style={headerStyle}>{isEditing ? '✏️ Modifica' : '➕ Nuovo Video'}</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '15px' }}>
                   <div style={{ gridColumn: 'span 8' }}><label className="form-label">Titolo</label><input name="titolo" value={formData.titolo} onChange={handleChange} className="form-input" required /></div>
                   <div style={{ gridColumn: 'span 4' }}><label className="form-label">Livello</label><select name="livelloDifficolta" value={formData.livelloDifficolta} onChange={handleChange} className="form-input">{['A1','A2','B1','B2','C1'].map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                   <div style={{ gridColumn: 'span 6' }}><label className="form-label">URL Video</label><input name="url" value={formData.url} onChange={handleChange} className="form-input" required /></div>
                   <div style={{ gridColumn: 'span 6' }}><label className="form-label">Copertina</label><input name="copertina" value={formData.copertina} onChange={handleChange} className="form-input" /></div>
                   <div style={{ gridColumn: 'span 8' }}><label className="form-label">Serie (Opz.)</label><input name="serie" value={formData.serie} onChange={handleChange} className="form-input" /></div>
                   <div style={{ gridColumn: 'span 4' }}><label className="form-label">Episodio</label><input name="episodio" type="number" value={formData.episodio} onChange={handleChange} className="form-input" /></div>
                   <div style={{ gridColumn: 'span 12' }}><button type="submit" className={`btn ${isEditing?'btn-secondary':'btn-primary'}`} style={{width:'100%'}}>{isEditing?'Aggiorna':'Pubblica'}</button></div>
                </form>
             </div>

             {/* Form Subs */}
             <div style={sectionStyle}>
                <h3 style={headerStyle}>📝 Sottotitoli JSON</h3>
                <form onSubmit={handleSubSubmit} style={{display:'flex', gap:'10px'}}>
                  <input value={subData.id} onChange={e=>setSubData({...subData, id:e.target.value})} className="form-input" placeholder="ID Video" style={{flex:1, fontFamily:'monospace'}} required />
                  <input value={subData.json} onChange={e=>setSubData({...subData, json:e.target.value})} className="form-input" placeholder='[{"start":0, "end":2, "text":"Hi"}]' style={{flex:3}} required />
                  <button type="submit" className="btn btn-primary">Carica</button>
                </form>
             </div>

             {/* Tabella Video */}
             <Table headers={['Titolo', 'Serie', 'Livello', 'Azioni']}>
               {videos.map(v => (
                 <tr key={v._id} style={rowStyle}>
                   <td style={cellStyle}>{v.titolo}</td>
                   <td style={cellStyle}>{v.serie ? `${v.serie} (Ep.${v.episodio})` : '-'} <br/><small style={{color:'#cbd5e1'}}>{v._id}</small></td>
                   <td style={cellStyle}><Badge text={v.livelloDifficolta} /></td>
                   <td style={{...cellStyle, textAlign:'right'}}>
                     <ActionBtn icon="📝" onClick={() => {setSubData({...subData, id:v._id}); window.scrollTo({top:300, behavior:'smooth'})}} />
                     <ActionBtn icon="✏️" onClick={() => handleEditVideo(v)} />
                     <ActionBtn icon="🗑️" color="#fee2e2" onClick={() => handleDeleteVideo(v._id)} />
                   </td>
                 </tr>
               ))}
             </Table>
          </div>
        )}

        {/* --- TAB: UTENTI --- */}
        {activeTab === 'users' && (
          <div>
            <h3 style={{marginBottom:'15px', color:'#374151'}}>Utenti Registrati ({users.length})</h3>
            <Table headers={['Nome', 'Username', 'Email', 'Ruolo', 'Azioni']}>
              {users.map(u => (
                <tr key={u._id} style={rowStyle}>
                  <td style={cellStyle}>{u.nome} {u.cognome}</td>
                  <td style={cellStyle}>@{u.username}</td>
                  <td style={cellStyle}>{u.email}</td>
                  <td style={cellStyle}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: u.ruolo==='admin'?'#fef3c7':'#e0f2fe', color: u.ruolo==='admin'?'#d97706':'#0369a1', fontWeight:'bold', fontSize:'0.8rem'}}>
                      {u.ruolo}
                    </span>
                  </td>
                  <td style={{...cellStyle, textAlign:'right'}}>
                    {u.ruolo !== 'admin' && (
                      <ActionBtn icon="🗑️ Elimina" color="#fee2e2" onClick={() => handleDeleteUser(u._id)} />
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
            <h3 style={{marginBottom:'15px', color:'#374151'}}>Ultimi Commenti ({comments.length})</h3>
            <Table headers={['Autore', 'Commento', 'Video', 'Data', 'Azioni']}>
              {comments.map(c => (
                <tr key={c._id} style={rowStyle}>
                  <td style={cellStyle}><strong>@{c.utenteId?.username || 'Eliminato'}</strong></td>
                  <td style={{...cellStyle, maxWidth:'300px'}}>"{c.testo}"</td>
                  <td style={cellStyle}>{c.videoId?.titolo || 'Video rimosso'}</td>
                  <td style={cellStyle}>{new Date(c.dataCreazione).toLocaleDateString()}</td>
                  <td style={{...cellStyle, textAlign:'right'}}>
                    <ActionBtn icon="🗑️ Rimuovi" color="#fee2e2" onClick={() => handleDeleteComment(c._id)} />
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
  <button onClick={onClick} style={{
    padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s',
    background: active ? '#2563eb' : 'transparent', color: active ? 'white' : '#6b7280'
  }}>
    {label}
  </button>
);

const Table = ({ headers, children }) => (
  <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background:'white' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
          {headers.map(h => <th key={h} style={{ padding: '15px', color: '#64748b' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const Badge = ({ text }) => (
  <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#e0e7ff', color: '#4338ca', fontSize: '0.8rem', fontWeight: 'bold' }}>{text}</span>
);

const ActionBtn = ({ icon, onClick, color='#f3f4f6' }) => (
  <button onClick={onClick} style={{ background: color, border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', marginLeft:'5px', fontWeight:'600' }}>
    {icon}
  </button>
);

// Stili Vari
const sectionStyle = { background: 'rgba(255,255,255,0.6)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.8)', marginBottom:'30px' };
const headerStyle = { marginBottom: '15px', color: '#374151' };
const rowStyle = { borderBottom: '1px solid #f1f5f9' };
const cellStyle = { padding: '15px', color: '#334155' };