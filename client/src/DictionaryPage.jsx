import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './DictionaryPage.css'; // Importa il CSS

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
    <div className={`word-card ${word.learned ? 'status-learned' : 'status-learning'}`}>
      <div className="card-inner">
        
        <div className="card-main">
            <div className="card-header-row">
                <h3 className="word-original">{word.original}</h3>
                {word.learned && <span className="badge-completed">COMPLETATA</span>}
            </div>
            <p className="word-translation">{word.translation}</p>

            <div className="notes-wrapper">
                <textarea 
                    className="notes-textarea"
                    value={localNote}
                    onChange={(e) => setLocalNote(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Scrivi qui i tuoi appunti personali..."
                />
            </div>
        </div>

        <div className="card-actions">
            <button 
                onClick={toggleLearned}
                className={`btn-card ${word.learned ? 'btn-toggle-learning' : 'btn-toggle-learned'}`}
            >
                {word.learned ? '↩️ Rimetti in studio' : 'Segna come fatta'}
            </button>

            <button 
                onClick={() => onRemove(word.id)}
                className="btn-card btn-delete"
            >
                Elimina
            </button>
        </div>
      </div>
    </div>
  );
};

// Componente Principale
const DictionaryPage = ({ savedWords, onRemoveWord, onUpdateWord }) => {
  const [filter, setFilter] = useState('ALL'); 

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
    <div className="dictionary-container">
      <div className="dictionary-content">
        
        <div className="dictionary-header">
            <h1 className="page-title">Il mio Dizionario</h1>
            <Link to="/videos" className="back-link">← Torna ai Video</Link>
        </div>

        <div className="filters-bar">
            {[
                { key: 'ALL', label: 'Tutte', count: counts.all },
                { key: 'TO_LEARN', label: 'Da Ripassare', count: counts.toLearn },
                { key: 'LEARNED', label: 'Già Imparate', count: counts.learned }
            ].map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`filter-btn ${filter === tab.key ? 'active' : 'inactive'}`}
                >
                    {tab.label} ({tab.count})
                </button>
            ))}
        </div>

        {safeWords.length === 0 ? (
            <div className="empty-state">
                <h3>Il dizionario è vuoto</h3>
                <Link to="/videos">
                    <button className="btn-cta">Vai ai Video</button>
                </Link>
            </div>
        ) : (
            <div className="words-list">
                {filteredWords.map((word) => (
                    <WordCard 
                        key={word.id} 
                        word={word} 
                        onRemove={onRemoveWord} 
                        onUpdate={onUpdateWord} 
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPage;