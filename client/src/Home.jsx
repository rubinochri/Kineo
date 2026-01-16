import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="hero-container">
      
      {/* Contenuto Pulito */}
      <h1 className="title-gradient title-xl animate-enter">
        Kineo
      </h1>
      
      <p className="subtitle animate-enter delay-1">
        Impara l'inglese guardando i video che ami.
      </p>
      
      <div className="animate-enter delay-2" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/login" className="btn btn-primary">
          Accedi
        </Link>
        <Link to="/register" className="btn btn-secondary">
          Crea un account
        </Link>
      </div>

      {/* --- BOTTONE ADMIN (Era già nel tuo codice originale) --- */}
      <div className="animate-enter delay-3" style={{ marginTop: '40px' }}>
        <Link to="/testvideo" 
          style={{ 
            textDecoration: 'none', 
            color: '#6b7280', 
            border: '1px solid #e5e7eb', 
            padding: '10px 20px', 
            borderRadius: '30px', 
            fontSize: '0.9rem', 
            fontWeight: '600',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.5)'
          }} 
           onMouseEnter={(e) => { e.target.style.borderColor = '#333'; e.target.style.color = '#333'; e.target.style.background = 'white'; }}
           onMouseLeave={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.color = '#6b7280'; e.target.style.background = 'rgba(255,255,255,0.5)'; }}
        >
          <span>🔧</span> Area Admin
        </Link>
      </div>

    </div>
  );
}

export default Home;