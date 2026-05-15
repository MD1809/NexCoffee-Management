import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, IconComponent, colorTheme }) => {
  return (
    <div className="card">
      <div className={`card-icon-box ${colorTheme}-icon`}>
        <IconComponent size={24} /> 
      </div>
      <div className="card-info">
        <span className="card-stat__title">{title}</span>
        <span className={`card-value ${colorTheme}-text`}>{value}</span>
      </div>
    </div>
  );
};

export default StatCard;