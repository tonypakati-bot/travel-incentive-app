import React from 'react';

const Documents: React.FC = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
        <p className="text-gray-500 mt-1">Manage and view trip-related documents.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Coming Soon!</h2>
        <p className="text-gray-500 mt-2">The documents management functionality is currently under development.</p>
      </div>
    </div>
  );
};

export default Documents;