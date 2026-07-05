import React, { useState, useEffect } from 'react';
import Assessment from './pages/Assessment';
import Report from './pages/Report';
import Dashboard from './pages/Dashboard';
import Recruiter from './pages/Recruiter';
import Learning from './pages/Learning';
import Achievements from './pages/Achievements';
import Compare from './pages/Compare';
import Practice from './pages/Practice';
import Auth from './pages/Auth';
import { getHistory } from './api/client';

export default function App() {
  const [currentView, setCurrentView] = useState('assessment');
  const [selectedReport, setSelectedReport] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('text');
  
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('fluenta_token');
    const email = localStorage.getItem('fluenta_email');
    const name = localStorage.getItem('fluenta_name');
    return token ? { email, name } : null;
  });

  const fetchHistoryData = async () => {
    if (!user) return;
    try {
      const data = await getHistory();
      setAssessmentHistory(data);
    } catch (err) {
      console.warn('API History fetch failed, falling back to local memory:', err.message);
      const cached = localStorage.getItem('fluenta_history_fallback');
      if (cached) {
        setAssessmentHistory(JSON.parse(cached));
      }
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [currentView, user]);

  const handleAssessmentComplete = (data) => {
    setSelectedReport(data);
    setCurrentView('report');
    
    const newHistory = [data, ...assessmentHistory];
    setAssessmentHistory(newHistory);
    localStorage.setItem('fluenta_history_fallback', JSON.stringify(newHistory));
  };

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setCurrentView('report');
  };

  const handleNewAssessment = () => {
    setSelectedReport(null);
    setCurrentView('assessment');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('fluenta_token');
    localStorage.removeItem('fluenta_email');
    localStorage.removeItem('fluenta_name');
    setUser(null);
  };

  if (!user) {
    return <Auth onLogin={(userData) => setUser(userData)} />;
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand" onClick={handleNewAssessment}>
          <span>✨</span> Fluenta
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentView === 'assessment' ? 'active' : ''}`}
            onClick={() => {
              setSelectedReport(null);
              setCurrentView('assessment');
            }}
          >
            Assessment
          </button>
          <button
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-link ${currentView === 'learning' ? 'active' : ''}`}
            onClick={() => setCurrentView('learning')}
          >
            Learning
          </button>
          <button
            className={`nav-link ${currentView === 'achievements' ? 'active' : ''}`}
            onClick={() => setCurrentView('achievements')}
          >
            Achievements
          </button>
          <button
            className={`nav-link ${currentView === 'compare' ? 'active' : ''}`}
            onClick={() => setCurrentView('compare')}
          >
            Compare
          </button>
          <button
            className={`nav-link ${currentView === 'practice' ? 'active' : ''}`}
            onClick={() => setCurrentView('practice')}
          >
            Practice Timer
          </button>
          <button
            className={`nav-link ${currentView === 'recruiter' ? 'active' : ''}`}
            onClick={() => setCurrentView('recruiter')}
          >
            Recruiter View
          </button>
          {selectedReport && (
            <button
              className={`nav-link ${currentView === 'report' ? 'active' : ''}`}
              onClick={() => setCurrentView('report')}
            >
              Latest Report
            </button>
          )}
          <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'assessment' && (
          <Assessment
            onAssessmentComplete={handleAssessmentComplete}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
        {currentView === 'report' && (
          <Report
            data={selectedReport}
            onNewAssessment={handleNewAssessment}
          />
        )}
        {currentView === 'dashboard' && (
          <Dashboard
            history={assessmentHistory}
            onSelectReport={handleSelectReport}
          />
        )}
        {currentView === 'learning' && (
          <Learning
            history={assessmentHistory}
          />
        )}
        {currentView === 'achievements' && (
          <Achievements
            history={assessmentHistory}
          />
        )}
        {currentView === 'compare' && (
          <Compare
            history={assessmentHistory}
          />
        )}
        {currentView === 'practice' && (
          <Practice
            history={assessmentHistory}
          />
        )}
        {currentView === 'recruiter' && (
          <Recruiter
            history={assessmentHistory}
            onSelectReport={handleSelectReport}
          />
        )}
      </main>
    </div>
  );
}
