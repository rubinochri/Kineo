import { Link } from 'react-router-dom';
import './Home.css'; 

function Home() {
  return (
    <div className="hero-container">
      
      <h1 className="title-gradient title-xl animate-enter">
        Kineo
      </h1>
      
      <p className="subtitle animate-enter delay-1">
        Impara l'inglese guardando i video che ami.
      </p>
      
      <div className="hero-actions animate-enter delay-2">
        <Link to="/login" className="btn btn-primary">
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