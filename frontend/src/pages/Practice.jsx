import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api/client';

export default function Practice({ history }) {
  const [seconds, setSeconds] = useState(15 * 60);
  const [isActive, setIsActive] = useState(false);
  const [exercise, setExercise] = useState("Loading your personalized exercise...");
  const [focusArea, setFocusArea] = useState("");
  
  useEffect(() => {
    // Fetch dynamic exercise
    const fetchExercise = async () => {
      let email = localStorage.getItem('fluenta_email');
      if (!email && history && history.length > 0) {
        email = history[0].session_email;
      }
      
      if (!email) {
        setExercise("Explain the concept of 'Cloud Computing' to a 10-year-old child in less than 2 minutes. Try to avoid technical jargon.");
        return;
      }
      
      try {
        const res = await fetch(`${API_BASE}/api/practice/generate/${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setExercise(data.exercise);
          setFocusArea(data.focus);
        }
      } catch (e) {
        console.error("Failed to fetch dynamic practice", e);
        setExercise("Explain the concept of 'Cloud Computing' to a 10-year-old child in less than 2 minutes. Try to avoid technical jargon.");
      }
    };
    
    fetchExercise();
  }, [history]);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      alert("Practice Session Complete! Great job!");
      // Optionally post to practice log in db
      let email = localStorage.getItem('fluenta_email');
      if (!email && history && history.length > 0) {
        email = history[0].session_email;
      }
      if (email) {
        fetch(`${API_BASE}/api/gamification/status/${encodeURIComponent(email)}`);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, history]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTimerAction = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(15 * 60);
  };

  return (
    <div className="page-container glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2>Practice Hub</h2>
      <p className="text-gray">Daily Recommended Exercise {focusArea ? `(Focus: ${focusArea})` : ''}:</p>
      
      <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '2rem', padding: '1.5rem' }}>
        <p style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>"{exercise}"</p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '1rem' }}>
          {formatTime(seconds)}
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleTimerAction}>
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
