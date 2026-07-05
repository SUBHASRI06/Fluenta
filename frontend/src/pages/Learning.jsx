import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : '';

export default function Learning({ history }) {
  const [pathway, setPathway] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (history && history.length > 0) {
      const latest = history[0]; // descending order assumed
      fetchPathway(latest.id, latest.session_email);
    }
  }, [history]);

  const fetchPathway = async (assessmentId, email) => {
    setLoading(true);
    try {
      // First check if pathway exists
      const getRes = await fetch(`${API_BASE}/api/learning/${email}`);
      const getData = await getRes.json();
      
      if (getData.status === 'success' && getData.assessment_id === assessmentId) {
        setPathway(getData.pathway);
      } else {
        // Generate new pathway
        const genRes = await fetch(`${API_BASE}/api/learning/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_email: email, assessment_id: assessmentId })
        });
        const genData = await genRes.json();
        setPathway(genData.pathway);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!history || history.length === 0) {
    return <div className="page-container"><h2>Learning Pathway</h2><p>Complete an assessment first.</p></div>;
  }

  if (loading) {
    return <div className="page-container" style={{ textAlign: 'center' }}><h3>✨ Generating your 4-week AI Learning Pathway...</h3></div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <h2>Your Personalized Learning Pathway</h2>
      
      {pathway && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel">
            <h3>Recommended Courses</h3>
            <ul>
              {pathway.recommended_courses?.map((course, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  <a href={course.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    {course.title}
                  </a> ({course.platform})
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel">
            <h3>4-Week Plan</h3>
            {pathway.weekly_plan?.map((week, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <h4>Week {week.week_number}: {week.theme}</h4>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {week.daily_exercises?.map((ex, exIdx) => (
                    <li key={exIdx} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                      <strong>{ex.day}:</strong> {ex.task} <span className="text-gray">({ex.duration_mins} mins)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
        </div>
      )}
    </div>
  );
}
