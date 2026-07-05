import React, { useState } from 'react';

export default function Recruiter({ history, onSelectReport }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredHistory = history.filter(item => {
    const name = (item.session_name || '').toLowerCase();
    const email = (item.session_email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--success)';
    if (score >= 70) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getStatusBadge = (score) => {
    if (score >= 85) {
      return (
        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
          EXCELLENT
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
          COMPETENT
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
        NEEDS COACHING
      </span>
    );
  };

  return (
    <div>
      <div className="hero-section" style={{ marginBottom: '2rem' }}>
        <h1 className="hero-title">Recruiter Dashboard</h1>
        <p className="hero-subtitle">
          Evaluate and compare candidate communication benchmarks. Track hiring cohorts and drill down into evidence-based coaching logs.
        </p>
      </div>

      {/* Recruiter Stats Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Candidates Evaluated</h3>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{history.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Cohort Average Score</h3>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
            {history.length > 0
              ? Math.round(history.reduce((acc, h) => acc + (h.assessment?.overall_score || 0), 0) / history.length)
              : 0}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Flagged Filler Word Freq</h3>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
            {history.length > 0
              ? (history.reduce((acc, h) => acc + (h.filler_word_count || 0), 0) / history.length).toFixed(1)
              : '0.0'}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}> avg/speech</span>
          </div>
        </div>
      </div>

      {/* Main candidate list panel */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Candidate Assessments</h2>
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '350px' }}
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            📭 No candidate benchmarks match your search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>Candidate</th>
                  <th style={{ padding: '1rem' }}>Benchmark Framework</th>
                  <th style={{ padding: '1rem' }}>Submitted Date</th>
                  <th style={{ padding: '1rem' }}>Complexity (Words)</th>
                  <th style={{ padding: '1rem' }}>Overall Score</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => {
                  const score = item.assessment?.overall_score || 0;
                  return (
                    <tr 
                      key={idx} 
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                      onClick={() => onSelectReport(item)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{item.session_name || 'Anonymous Candidate'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.session_email || 'No email'}</div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {item.framework || 'General Assessment'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        {item.word_count} words
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: getScoreColor(score), fontSize: '1.1rem' }}>
                        {Math.round(score)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(score)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectReport(item);
                          }}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
