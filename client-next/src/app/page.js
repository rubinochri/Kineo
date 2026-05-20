
import Link from 'next/link';
import './Home.css'; 

export default function Home() {
  return (
    <main className="contenitore-hero">
      <h1 className="titolo-gradiente titolo-xl">Kineo</h1>
      <p className="sottotitolo">
        Impara l'inglese guardando i video che ami.
      </p>
      
      <div className="azioni-hero">
        <Link href="/login" className="bottone bottone-primario bottone-arrotondato">
          Accedi
        </Link>
        <Link href="/register" className="bottone bottone-secondario bottone-arrotondato">
          Crea un account
        </Link>
      </div>
    </main>
  );
}