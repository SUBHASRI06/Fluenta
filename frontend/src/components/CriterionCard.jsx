import React from 'react';

export default function CriterionCard({ name, score }) {
  const percentage = (score / 25) * 100;
  
  return (
    <div className="criterion-card">
      <div className="criterion-header">
        <span className="criterion-name">{name}</span>
        <span className="criterion-score" style={{ fontWeight: 700 }}>
          {score} / 25
        </span>
      </div>
      <div className="criterion-bar-bg">
        <div 
          className="criterion-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
