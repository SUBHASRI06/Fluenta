import React, { useState, useRef, useEffect } from 'react';

export default function MicRecorder({ onRecordingComplete, disabled }) {
  const [status, setStatus] = useState('idle'); // idle, recording, paused
  const [seconds, setSeconds] = useState(0);
  const [audioChunks, setAudioChunks] = useState([]);
  
  // Real-time live feedback states
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveFillerCount, setLiveFillerCount] = useState(0);
  const [lastFiller, setLastFiller] = useState('');
  const [pauseWarning, setPauseWarning] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastWordTimeRef = useRef(Date.now());

  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
    };
  }, []);

  const startTimer = () => {
    setSeconds(0);
    lastWordTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        // Check for pause (> 3 seconds of silence)
        if (Date.now() - lastWordTimeRef.current > 3000) {
          setPauseWarning(true);
        } else {
          setPauseWarning(false);
        }
        return next;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for browsers that don't support audio/webm
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/wav' });
        onRecordingComplete(audioBlob);
      };

      // Real-time Web Speech API Setup
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        
        rec.onresult = (event) => {
          lastWordTimeRef.current = Date.now();
          setPauseWarning(false);
          
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          
          const words = transcript.trim().split(/\s+/).filter(Boolean);
          const count = words.length;
          
          // Estimate WPM dynamically
          if (seconds > 0) {
            setLiveWpm(Math.round((count / seconds) * 60));
          }
          
          // Check for common filler words
          const fillers = ['um', 'uh', 'like', 'ah', 'so'];
          let fillersFound = 0;
          let latestFiller = '';
          
          words.forEach(w => {
            const clean = w.toLowerCase().replace(/[^a-z]/g, '');
            if (fillers.includes(clean)) {
              fillersFound++;
              latestFiller = clean;
            }
          });
          
          setLiveFillerCount(fillersFound);
          if (latestFiller) {
            setLastFiller(latestFiller);
            setTimeout(() => setLastFiller(''), 1500);
          }
        };
        
        recognitionRef.current = rec;
        rec.start();
      }

      recorder.start(250); // collect chunks every 250ms
      setStatus('recording');
      startTimer();
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopTimer();
      stopStream();
      setStatus('idle');
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', border: '1px dashed var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Live Microphone Input</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
        {status === 'recording' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Outfit, monospace' }}>{formatTime(seconds)}</span>
            </div>
            
            {/* Live speech feedback display */}
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <div>Live Speed: <strong style={{ color: 'var(--primary)' }}>{liveWpm} WPM</strong></div>
              <div>Fillers: <strong style={{ color: liveFillerCount > 3 ? 'var(--danger)' : 'var(--success)' }}>{liveFillerCount}</strong></div>
            </div>

            {lastFiller && (
              <div style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.85rem', animation: 'flash 0.5s' }}>
                ⚠️ Filler detected: "{lastFiller}"
              </div>
            )}

            {pauseWarning && (
              <div style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                ⏳ Pause detected... Keep speaking!
              </div>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Ready to record</span>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          {status === 'idle' ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startRecording}
              disabled={disabled}
              style={{ background: 'var(--danger)', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.3)' }}
            >
              🎤 Start Recording
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={stopRecording}
              style={{ background: 'var(--success)', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)' }}
            >
              ⏹️ Stop & Analyze
            </button>
          )}
        </div>
      </div>
      
      {/* CSS Animation for red pulse */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
