import React, { useState, useEffect } from 'react';
import { getHistory } from '../api/client';

export default function Compare({ history }) {
  const [earliest, setEarliest] = useState(null);
  const [latest, setLatest] = useState(null);
  
  useEffect(() => {
    if (history && history.length >= 2) {
      // History is sorted desc by timestamp usually, check to be sure
      const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setEarliest(sorted[0]);
      setLatest(sorted[sorted.length - 1]);
    }
  }, [history]);

  if (!history || history.length < 2) {
    return (
      <div className="page-container">
        <h2>Before/After Comparison</h2>
        <p>You need to complete at least two assessments to unlock the comparison view.</p>
      </div>
    );
  }

  if (!earliest || !latest) {
    return (
      <div className="page-container">
        <h2>Before/After Comparison</h2>
        <p>Loading comparison data...</p>
      </div>
    );
  }

  const eScore = earliest.assessment?.overall_score || 0;
  const lScore = latest.assessment?.overall_score || 0;
  const improvement = (lScore - eScore).toFixed(1);

  return (
    <div className="page-container glass-panel animate-fade-in">
      <h2>Your Progress Journey</h2>
      
      <div className="summary-card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3>Improvement</h3>
        <div style={{ fontSize: '3rem', color: improvement >= 0 ? '#10b981' : '#ef4444' }}>
          {improvement >= 0 ? '+' : ''}{improvement} pts
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel">
          <h3>Earliest Assessment</h3>
          <p className="text-gray">{new Date(earliest.timestamp).toLocaleDateString()}</p>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{eScore} / 100</div>
        </div>
        
        <div className="glass-panel" style={{ border: '2px solid var(--primary-color)' }}>
          <h3>Latest Assessment</h3>
          <p className="text-gray">{new Date(latest.timestamp).toLocaleDateString()}</p>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{lScore} / 100</div>
        </div>
      </div>
    </div>
  );
}
