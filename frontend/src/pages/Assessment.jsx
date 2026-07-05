import React, { useState, useEffect } from 'react';
import { assessText, assessAudio } from '../api/client';
import MicRecorder from '../components/MicRecorder';

export default function Assessment({ onAssessmentComplete, activeTab, setActiveTab }) {
  const [sessionName, setSessionName] = useState(() => localStorage.getItem('fluenta_name') || '');
  const [sessionEmail, setSessionEmail] = useState(() => localStorage.getItem('fluenta_email') || '');
  const [framework, setFramework] = useState('General Assessment');
  
  // Text state
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Audio state
  const [audioFile, setAudioFile] = useState(null);
  
  // Save profile info on change
  useEffect(() => {
    localStorage.setItem('fluenta_name', sessionName);
    localStorage.setItem('fluenta_email', sessionEmail);
  }, [sessionName, sessionEmail]);

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await assessText(text, framework, sessionName, sessionEmail);
      onAssessmentComplete(data);
    } catch (err) {
      setError(err.message || 'An error occurred during text assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setError('');
    }
  };

  const handleAudioSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      setError('Please upload an audio file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await assessAudio(audioFile, framework, sessionName, sessionEmail);
      onAssessmentComplete(data);
    } catch (err) {
      setError(err.message || 'An error occurred during audio assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicRecordingComplete = async (audioBlob) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await assessAudio(audioBlob, framework, sessionName, sessionEmail);
      onAssessmentComplete(data);
    } catch (err) {
      setError(err.message || 'An error occurred processing microphone recording.');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  const getFleschEase = (textVal) => {
    if (!textVal.trim()) return 0;
    const words = textVal.trim().split(/\s+/).filter(Boolean);
    const sentences = textVal.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length || 1;
    
    let syllables = 0;
    words.forEach(w => {
      let word = w.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length <= 3) { syllables += 1; return; }
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      const doubleVowels = word.match(/[aeiouy]{1,2}/g);
      syllables += doubleVowels ? doubleVowels.length : 1;
    });

    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = syllables / wordCount;
    const ease = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.round(Math.max(0, Math.min(100, ease)));
  };

  const getFillerCount = (textVal) => {
    if (!textVal.trim()) return 0;
    const words = textVal.trim().split(/\s+/).filter(Boolean);
    const fillers = ['um', 'uh', 'like', 'ah', 'so', 'actually', 'basically'];
    let count = 0;
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (fillers.includes(clean)) count++;
    });
    return count;
  };

  const getGrammarWarnings = (textVal) => {
    if (!textVal.trim()) return [];
    const warnings = [];
    if (textVal.includes("  ")) {
      warnings.push("Double spaces detected.");
    }
    const sentences = textVal.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 25);
    if (longSentences.length > 0) {
      warnings.push(`${longSentences.length} long sentence(s) (>25 words).`);
    }
    const nonCapitalized = sentences.filter(s => {
      const clean = s.trim();
      return clean.length > 0 && clean[0] !== clean[0].toUpperCase();
    });
    if (nonCapitalized.length > 0) {
      warnings.push("Uncapitalized sentence starting character.");
    }
    return warnings;
  };

  const liveEase = getFleschEase(text);
  const liveFillers = getFillerCount(text);
  const liveWarnings = getGrammarWarnings(text);

  return (
    <div>
      <div className="hero-section">
        <h1 className="hero-title">Evaluate Your Communication</h1>
        <p className="hero-subtitle">
          Submit text, audio files, or live voice recordings to receive detailed, evidence-linked scoring and coaching feedback.
        </p>
      </div>

      {error && (
        <div className="alert-banner" style={{ borderColor: 'var(--danger)', background: 'var(--danger-glow)', color: '#ff6b6b' }}>
          <span>⚠️</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      <div className="split-layout">
        {/* Input Column */}
        <div className="glass-panel form-card">
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            Submission Details
          </h2>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="session-name">Name</label>
              <input
                id="session-name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="session-email">Email</label>
              <input
                id="session-email"
                type="email"
                value={sessionEmail}
                onChange={(e) => setSessionEmail(e.target.value)}
                placeholder="e.g. john@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="framework">Evaluation Framework</label>
            <select
              id="framework"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
            >
              <option value="General Assessment">General Assessment</option>
              <option value="Email Correspondence">Email Correspondence</option>
              <option value="College Admission Essay">College Admission Essay</option>
              <option value="Pitch Presentation">Pitch Presentation / Speech</option>
              <option value="Business Proposal">Business Proposal</option>
            </select>
          </div>

          {/* Assessment Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className={`nav-link ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
              style={{ flex: 1, padding: '0.75rem' }}
            >
              ✍️ Written Text
            </button>
            <button
              type="button"
              className={`nav-link ${activeTab === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveTab('audio')}
              style={{ flex: 1, padding: '0.75rem' }}
            >
              🎙️ Spoken Audio
            </button>
          </div>

          {activeTab === 'text' ? (
            <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="assessment-text">Written Content</label>
                <textarea
                  id="assessment-text"
                  rows="10"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your essay, draft email, pitch, or speech transcript here..."
                  style={{ resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Words: {wordCount}</span>
                  <span>Characters: {text.length}</span>
                </div>
                
                {text.trim().length > 0 && (
                  <div className="glass-panel" style={{ padding: '0.75rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                      <div>Readability: <strong style={{ color: 'var(--primary)' }}>{liveEase}/100</strong></div>
                      <div>Fillers Count: <strong>{liveFillers}</strong></div>
                    </div>
                    {liveWarnings.length > 0 && (
                      <div style={{ color: '#ef4444' }}>
                        ⚠️ {liveWarnings.join(" | ")}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !text.trim()}
              >
                {loading ? <div className="spinner" style={{ margin: 0, width: '20px', height: '20px' }}></div> : 'Analyze Written Text'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Live Mic Recorder (Phase 5 Component) */}
              <MicRecorder onRecordingComplete={handleMicRecordingComplete} disabled={loading} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                <div style={{ height: '1px', background: 'var(--border-color)', flex: 1 }} />
                <span>OR UPLOAD AUDIO FILE</span>
                <div style={{ height: '1px', background: 'var(--border-color)', flex: 1 }} />
              </div>

              {/* File Upload Form */}
              <form onSubmit={handleAudioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label htmlFor="audio-file">Upload Audio File (MP3/WAV)</label>
                  <input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    style={{ padding: '0.5rem' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !audioFile}
                >
                  {loading ? <div className="spinner" style={{ margin: 0, width: '20px', height: '20px' }}></div> : 'Analyze Spoken Audio'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Informational Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--primary)' }}>How it Works</h3>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><strong>Deterministic Metrics:</strong> Word count, sentence counts, WPM, reading ease, and filler words are calculated locally in code to guarantee mathematical correctness.</li>
              <li><strong>Rubric Evaluation:</strong> The Gemini AI acts as a scoring coach evaluating organization, grammar, tone, and conciseness.</li>
              <li><strong>Evidence-Linked Feedback:</strong> Rather than a generic score, every deduction highlights the exact text span that caused the penalty, showing you the issue and the correction.</li>
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--secondary)' }}>Evaluation Rubric</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><strong>Clarity & Conciseness (25 pts):</strong> Direct, active voice, minimal wordiness.</div>
              <div><strong>Grammar & Mechanics (25 pts):</strong> Punctuation, run-ons, syntax errors.</div>
              <div><strong>Tone & Professionalism (25 pts):</strong> Audience appropriateness, vocabulary.</div>
              <div><strong>Organization & Structure (25 pts):</strong> Flow, layout, introductory hook, and conclusion.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
