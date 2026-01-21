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
        <Link to="/login" className="btn btn-primary" style={{ borderRadius: '999px' }}>
          Accedi
        </Link>
        <Link to="/register" className="btn btn-secondary">
          Crea un account
        </Link>
      </div>

    </div>
  );
}

export default Home;