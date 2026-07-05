import React, { useState, useEffect } from 'react';

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Achievements({ history }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (history && history.length > 0) {
      const email = history[0].session_email;
      fetch(`${API_BASE}/api/gamification/status/${email}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch status');
          return res.json();
        })
        .then(data => setStatus(data))
        .catch(err => {
          console.error(err);
          setStatus({ streak: { current_streak: 0, longest_streak: 0 }, badges: [] });
        });
    }
  }, [history]);

  if (!history || history.length === 0) {
    return <div className="page-container"><h2>Achievements</h2><p>Complete an assessment first.</p></div>;
  }

  if (!status) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <h2>Your Achievements</h2>
      
      <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3>Current Streak</h3>
        <div style={{ fontSize: '3rem', color: '#f59e0b' }}>
          🔥 {status.streak.current_streak} Days
        </div>
        <p className="text-gray">Longest Streak: {status.streak.longest_streak}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {status.badges.map(badge => (
          <div key={badge.key} className="glass-panel" style={{ 
            textAlign: 'center', 
            opacity: badge.earned ? 1 : 0.5,
            border: badge.earned ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
            filter: badge.earned ? 'none' : 'grayscale(100%)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {badge.earned ? '🏆' : '🔒'}
            </div>
            <h4>{badge.name}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
