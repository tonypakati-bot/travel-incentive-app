import React from 'react';

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center space-x-2 mb-4">
        {icon}
        <h3 className="font-bold text-gray-800 text-xl">{title}</h3>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;