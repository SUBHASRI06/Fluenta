import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function Dashboard({ history, onSelectReport }) {
  const getFleschColor = (ease) => {
    if (ease >= 70) return 'var(--success)';
    if (ease >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  const radarData = useMemo(() => {
    if (history.length === 0) return [];
    
    const sums = {
      Clarity: 0,
      Grammar: 0,
      Tone: 0,
      Organization: 0
    };
    
    history.forEach(item => {
      const criteria = item.assessment?.criteria || {};
      sums.Clarity += criteria.clarity_conciseness || 0;
      sums.Grammar += criteria.grammar_mechanics || 0;
      sums.Tone += criteria.tone_professionalism || 0;
      sums.Organization += criteria.organization_structure || 0;
    });

    return [
      { subject: 'Clarity', A: Math.round(sums.Clarity / history.length), fullMark: 100 },
      { subject: 'Grammar', A: Math.round(sums.Grammar / history.length), fullMark: 100 },
      { subject: 'Tone', A: Math.round(sums.Tone / history.length), fullMark: 100 },
      { subject: 'Organization', A: Math.round(sums.Organization / history.length), fullMark: 100 },
    ];
  }, [history]);

  // Render inline SVG chart representing performance over time
  const renderSVGChart = () => {
    if (sortedHistory.length < 2) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          📈 Chart will populate once you complete at least 2 assessments.
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxScore = 100;
    const minScore = 0;

    const points = sortedHistory.map((item, index) => {
      const x = padding + (index / (sortedHistory.length - 1)) * chartWidth;
      const score = item.assessment?.overall_score || 0;
      const y = padding + chartHeight - (score / 100) * chartHeight;
      return { x, y, score, name: item.session_name || 'Anonymous' };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((gridVal) => {
          const y = padding + chartHeight - (gridVal / 100) * chartHeight;
          return (
            <g key={gridVal}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="chart-grid-line"
              />
              <text
                x={padding - 5}
                y={y + 3}
                textAnchor="end"
                className="chart-labels"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Chart Line path */}
        <path d={pathD} className="chart-line" />

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              className="chart-dots"
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="chart-labels"
              style={{ fontWeight: 700, fill: 'var(--text-primary)' }}
            >
              {Math.round(p.score)}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div>
      <div className="hero-section" style={{ marginBottom: '2rem' }}>
        <h1 className="hero-title">Your Progress Dashboard</h1>
        <p className="hero-subtitle">
          Monitor your score changes over time and review your full communication assessment history.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Progress Chart */}
        <div className="glass-panel chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Performance Trend</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Historical overall communication scores
          </p>
          {renderSVGChart()}
        </div>

        {/* Right Column: Key Stats Card & Radar */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--secondary)' }}>Communication Profile</h2>
          
          {history.length > 0 ? (
            <div style={{ height: '200px', width: '100%', margin: '0 auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0' }}>
                Take an assessment to generate your profile.
             </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                {history.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assessments</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                {history.length > 0
                  ? Math.round(history.reduce((acc, h) => acc + (h.assessment?.overall_score || 0), 0) / history.length)
                  : 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Avg Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* History table list */}
      <div className="glass-panel history-card" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Assessment History</h2>
        {history.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            📭 You haven't completed any assessments yet. Get started on the Assessment tab!
          </div>
        ) : (
          <div className="history-list">
            {sortedHistory.reverse().map((item, idx) => (
              <div
                key={idx}
                className="history-item"
                onClick={() => onSelectReport(item)}
              >
                <div>
                  <div className="history-name">
                    {item.session_name || 'Anonymous Assessment'}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      ({item.session_email || 'No email'})
                    </span>
                  </div>
                  <div className="history-date">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>Word count: <strong>{item.word_count}</strong></div>
                    <div>Flesch Ease: <strong style={{ color: getFleschColor(item.flesh_reading_ease) }}>{item.flesh_reading_ease}</strong></div>
                  </div>
                  <div className="history-score">
                    {Math.round(item.assessment?.overall_score || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
