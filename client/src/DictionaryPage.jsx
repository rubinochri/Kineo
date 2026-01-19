import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Componente Singola Card
const WordCard = ({ word, onRemove, onUpdate }) => {
  const [localNote, setLocalNote] = useState(word.notes || '');

  const handleBlur = () => {
    if (localNote !== word.notes) {
      onUpdate(word.id, { notes: localNote });
    }
  };

  const toggleLearned = () => {
    onUpdate(word.id, { learned: !word.learned });
  };

  return (
    <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderLeft: word.learned ? '6px solid #4caf50' : '6px solid #f59e0b',
        overflow: 'hidden',
        transition: 'all 0.3s'
    }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.4rem' }}>{word.original}</h3>
                {word.learned && (
                    <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                        COMPLETATA
                    </span>
                )}
            </div>
            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '1.1rem', fontStyle: 'italic' }}>
                {word.translation}
            </p>

            <div style={{ marginTop: '15px' }}>
                <textarea 
                    value={localNote}
                    onChange={(e) => setLocalNote(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Scrivi qui i tuoi appunti personali..."
                    style={{ 
                        width: '100%', minHeight: '60px', padding: '10px', borderRadius: '8px', 
                        border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical'
                    }}
                />
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '20px' }}>
            <button 
                onClick={toggleLearned}
                style={{ 
                    border: '1px solid',
                    backgroundColor: word.learned ? '#fffbeb' : '#15803d', 
                    borderColor: word.learned ? '#fcd34d' : '#15803d',
                    color: word.learned ? '#b45309' : 'white',
                    padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', width: '180px', textAlign: 'center'
                }}
            >
                {word.learned ? '↩️ Rimetti in studio' : '✅ Segna come fatta'}
            </button>

            <button 
                onClick={() => onRemove(word.id)}
                style={{ 
                    border: '1px solid #fee2e2', backgroundColor: 'white', color: '#ef4444',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', width: '180px'
                }}
            >
                🗑️ Elimina
            </button>
        </div>
      </div>
    </div>
  );
};

// Componente Principale
const DictionaryPage = ({ savedWords, onRemoveWord, onUpdateWord }) => {
  const [filter, setFilter] = useState('ALL'); 

  // --- FIX SALVA-VITA: Se savedWords è undefined, usa un array vuoto [] ---
  const safeWords = Array.isArray(savedWords) ? savedWords : [];

  const filteredWords = safeWords.filter(word => {
    if (filter === 'TO_LEARN') return !word.learned;
    if (filter === 'LEARNED') return word.learned;
    return true;
  });

  const counts = {
      all: safeWords.length,
      toLearn: safeWords.filter(w => !w.learned).length,
      learned: safeWords.filter(w => w.learned).length
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
                <h1 style={{ margin: 0, color: '#1e293b', fontSize: '2.5rem' }}>Il mio Dizionario</h1>
            </div>
            <Link to="/videos" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 'bold' }}>← Torna ai Video</Link>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
            {[
                { key: 'ALL', label: 'Tutte', count: counts.all },
                { key: 'TO_LEARN', label: 'Da Ripassare', count: counts.toLearn },
                { key: 'LEARNED', label: 'Già Imparate', count: counts.learned }
            ].map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    style={{
                        padding: '10px 20px', borderRadius: '20px', border: 'none',
                        backgroundColor: filter === tab.key ? '#2563eb' : 'transparent',
                        color: filter === tab.key ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    {tab.label} ({tab.count})
                </button>
            ))}
        </div>

        {safeWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
                <h3>Il dizionario è vuoto</h3>
                <Link to="/videos"><button>Vai ai Video</button></Link>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredWords.map((word) => (
                    <WordCard key={word.id} word={word} onRemove={onRemoveWord} onUpdate={onUpdateWord} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPage;