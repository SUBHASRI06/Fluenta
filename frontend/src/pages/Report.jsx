import React from 'react';
import ScoreBadge from '../components/ScoreBadge';
import CriterionCard from '../components/CriterionCard';

export default function Report({ data, onNewAssessment }) {
  if (!data) return null;

  const {
    id,
    session_email,
    word_count,
    sentence_count,
    avg_words_per_sentence,
    flesh_reading_ease,
    assessment,
    wpm,
    filler_word_count,
    transcript
  } = data;

  const { overall_score, criteria, deductions, coaching_tips } = assessment;

  // Function to highlight evidence in the text
  const renderHighlightedText = () => {
    const rawText = transcript || data.text || "";
    if (!deductions || deductions.length === 0 || !rawText) return rawText;

    // Find indices of all deductions in the text
    const matches = [];
    deductions.forEach((ded, index) => {
      const evidence = ded.evidence;
      if (!evidence) return;
      
      let startIdx = rawText.indexOf(evidence);
      while (startIdx !== -1) {
        // Avoid overlapping matches
        const endIdx = startIdx + evidence.length;
        const overlap = matches.some(m => 
          (startIdx >= m.start && startIdx < m.end) || 
          (endIdx > m.start && endIdx <= m.end) ||
          (startIdx <= m.start && endIdx >= m.end)
        );
        
        if (!overlap) {
          matches.push({ start: startIdx, end: endIdx, ded, index });
        }
        
        startIdx = rawText.indexOf(evidence, startIdx + 1);
      }
    });

    // Sort matches by start index
    matches.sort((a, b) => a.start - b.start);

    // Build the React element tree
    const result = [];
    let lastIdx = 0;

    matches.forEach(({ start, end, ded, index }) => {
      // Add normal text before highlight
      if (start > lastIdx) {
        result.push(rawText.substring(lastIdx, start));
      }
      // Add highlighted span
      result.push(
        <span 
          key={`hl-${index}-${start}`} 
          className="highlight-span"
          title={`Click to view issue: ${ded.issue}`}
          onClick={() => {
            const el = document.getElementById(`deduction-${index}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          {rawText.substring(start, end)}
        </span>
      );
      lastIdx = end;
    });

    // Add trailing text
    if (lastIdx < rawText.length) {
      result.push(rawText.substring(lastIdx));
    }

    return result;
  };

  const getFleschDescription = (ease) => {
    if (ease >= 90) return 'Very Easy (Fifth Grade)';
    if (ease >= 80) return 'Easy (Sixth Grade)';
    if (ease >= 70) return 'Fairly Easy (Seventh Grade)';
    if (ease >= 60) return 'Standard (8th-9th Grade)';
    if (ease >= 50) return 'Fairly Difficult (High School)';
    if (ease >= 30) return 'Difficult (College level)';
    return 'Very Confusing (College Graduate)';
  };

  const handleDownloadPDF = () => {
    if (!id || !session_email) {
      alert("PDF download is only available for saved reports with a valid session email.");
      return;
    }
    window.open(`/api/export/pdf/${id}/${session_email}`, '_blank');
  };

  const handleShareX = () => {
    const text = `I just scored ${overall_score}/100 on my Fluenta Communication Assessment! Check your communication skills here.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopy = () => {
    const text = `Fluenta Assessment Report\nOverall Score: ${overall_score}/100\nReadability: ${flesh_reading_ease}\nWords: ${word_count}`;
    navigator.clipboard.writeText(text);
    alert("Report summary copied to clipboard!");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Assessment Report</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
          <button className="btn btn-secondary" onClick={handleShareX}>
            🐦 Share on X
          </button>
          <button className="btn btn-secondary" onClick={handleCopy}>
            📋 Copy Info
          </button>
          <button className="btn btn-secondary" onClick={onNewAssessment}>
            🔄 Start New Assessment
          </button>
        </div>
      </div>

      <div className="split-layout">
        {/* Left Column: Detailed breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Highlighted text pane */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Submitted Text / Transcript</h2>
            <div className="highlight-container">
              {renderHighlightedText()}
            </div>
            {deductions && deductions.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
                💡 Click on highlighted text below to scroll to its correction card.
              </p>
            )}
          </div>

          {/* Deductions breakdown */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Deductions & Structural Corrections</h2>
            {deductions && deductions.length > 0 ? (
              <div className="deductions-container">
                {deductions.map((ded, index) => (
                  <div key={index} id={`deduction-${index}`} className="deduction-card">
                    <div className="deduction-meta">
                      <span className="deduction-category">{ded.criterion}</span>
                      <span className="deduction-points">-{ded.points_lost} pts</span>
                    </div>
                    <div className="deduction-text">
                      "{ded.evidence}"
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      <strong>Issue:</strong> {ded.issue}
                    </div>
                    <div className="deduction-correction-box">
                      <div className="deduction-correction-lbl">Correction Suggestion</div>
                      {ded.correction}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                🎉 Outstanding! No critical rubric deductions were found in this communication.
              </div>
            )}
          </div>

          {/* Coaching section */}
          {data.coaching_plan ? (
            <div className="coaching-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="coaching-header">
                <span>🎯</span>
                <h2 style={{ fontSize: '1.25rem' }}>AI Communication Coach Plan</h2>
              </div>
              
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--danger)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Areas of Improvement</h3>
                <ul className="coaching-tips-list">
                  {data.coaching_plan.weak_areas.map((area, idx) => (
                    <li key={idx} className="coaching-tip-item">{area}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🛠️ Actionable Exercises</h3>
                <ul className="coaching-tips-list">
                  {data.coaching_plan.recommendations.map((rec, idx) => (
                    <li key={idx} className="coaching-tip-item">{rec}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '1rem', borderRadius: '10px', marginTop: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Weekly Focus Goal
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                  "{data.coaching_plan.weekly_goal}"
                </div>
              </div>
            </div>
          ) : (
            coaching_tips && coaching_tips.length > 0 && (
              <div className="coaching-section">
                <div className="coaching-header">
                  <span>🎯</span>
                  <h2 style={{ fontSize: '1.25rem' }}>Personalized Coaching Recommendations</h2>
                </div>
                <ul className="coaching-tips-list">
                  {coaching_tips.map((tip, idx) => (
                    <li key={idx} className="coaching-tip-item">{tip}</li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>

        {/* Right Column: Score metrics & summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main Score panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ScoreBadge score={overall_score} />
            
            <div className="criteria-list" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <CriterionCard name="Clarity & Conciseness" score={criteria.clarity_conciseness} />
              <CriterionCard name="Grammar & Mechanics" score={criteria.grammar_mechanics} />
              <CriterionCard name="Tone & Professionalism" score={criteria.tone_professionalism} />
              <CriterionCard name="Organization & Structure" score={criteria.organization_structure} />
            </div>
          </div>

          {/* Spoken metrics if available */}
          {(wpm !== undefined || filler_word_count !== undefined) && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Spoken Delivery Metrics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {wpm !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{wpm} WPM</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Spoken Speed (Words per Min)</div>
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>
                      {wpm < 110 ? '🐢 Slow' : wpm > 160 ? '⚡ Fast' : '✅ Balanced'}
                    </span>
                  </div>
                )}
                {filler_word_count !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: filler_word_count > 5 ? 'var(--danger)' : 'var(--success)' }}>
                        {filler_word_count} occurrences
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filler Words (um, uh, like, you know)</div>
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>
                      {filler_word_count > 8 ? '🚨 High' : filler_word_count > 3 ? '⚠️ Moderate' : '✅ Low'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Readability & Text metrics panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deterministic Readability Metrics
            </h3>
            
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-val">{word_count}</div>
                <div className="metric-lbl">Words</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">{sentence_count}</div>
                <div className="metric-lbl">Sentences</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">{avg_words_per_sentence}</div>
                <div className="metric-lbl">Words/Sent</div>
              </div>
              <div className="metric-box" style={{ gridColumn: 'span 2' }}>
                <div className="metric-val" style={{ color: 'var(--success)' }}>{flesh_reading_ease}</div>
                <div className="metric-lbl">Flesch Ease</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {getFleschDescription(flesh_reading_ease)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
