import React from 'react';

interface SectionCardProps {
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, actions, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        {actions && <div>{actions}</div>}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
