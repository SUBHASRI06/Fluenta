import React from 'react';

export default function ScoreBadge({ score }) {
  // Radius of the circle is 70, circumference is 2 * pi * r = 439.8 (~440)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="score-container">
      <div className="score-ring">
        <svg width="160" height="160">
          <circle
            className="score-ring-bg"
            cx="80"
            cy="80"
            r={radius}
          />
          <circle
            className="score-ring-fill"
            cx="80"
            cy="80"
            r={radius}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset
            }}
          />
        </svg>
        <span className="score-value">{Math.round(score)}</span>
      </div>
      <span className="score-label">Overall Score</span>
    </div>
  );
}
