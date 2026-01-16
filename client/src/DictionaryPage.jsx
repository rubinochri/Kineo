import React from 'react';
import { Link } from 'react-router-dom';

const DictionaryPage = ({ savedWords, onRemoveWord }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: 0, color: '#333' }}>📖 Il mio Dizionario</h1>
            <Link to="/videos" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>← Torna ai Video</Link>
        </div>

        {savedWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '10px' }}>
                <span style={{ fontSize: '3rem' }}>📭</span>
                <h3>Vuoto!</h3>
                <p>Salva delle parole dai video per vederle qui.</p>
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
                {savedWords.map((word) => (
                    <div key={word.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div>
                            <strong style={{ fontSize: '1.2rem', color: '#007bff' }}>{word.original}</strong>
                            <p style={{ margin: '5px 0' }}>{word.translation}</p>
                        </div>
                        <button onClick={() => onRemoveWord(word.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPage;