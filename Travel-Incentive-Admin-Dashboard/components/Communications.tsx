import React from 'react';
import { SearchIcon, PencilIcon, TrashIcon } from './icons';

type Communication = {
    title: string;
    type: 'Information' | 'Alert';
    trip: string;
    group: string;
    date: string;
};

interface CommunicationsProps {
  onCreateCommunication: (initialType?: 'information' | 'alert') => void;
}

const communications: Communication[] = [
    { title: 'Cambio location per il Welcome Drink', type: 'Information', trip: 'Trip to Ibiza', group: 'Tutti i gruppi', date: '20 Lug, 2026' },
    { title: 'Ritardo Volo EY 82', type: 'Alert', trip: 'Sales Kick-off Dubai', group: 'Milano', date: '19 Feb, 2026' },
    { title: 'Dettagli per il check-in in Hotel', type: 'Information', trip: 'Team Retreat Mykonos', group: 'Tutti i gruppi', date: '01 Dic, 2025' },
];

const getTypeBadge = (type: string) => {
    switch (type) {
        case 'Information':
            return 'bg-blue-100 text-blue-800';
        case 'Alert':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const Communications: React.FC<CommunicationsProps> = ({ onCreateCommunication }) => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Communications</h1>
        <p className="text-gray-500 mt-1">Send information and alerts to trip participants.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search communications..."
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
            </div>
            <button 
                onClick={() => onCreateCommunication()}
                className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Create New Communication
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4">Title</th>
                        <th scope="col" className="px-6 py-4">Type</th>
                        <th scope="col" className="px-6 py-4">Trip</th>
                        <th scope="col" className="px-6 py-4">Audience</th>
                        <th scope="col" className="px-6 py-4">Date Sent</th>
                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {communications.map((comm, index) => (
                        <tr key={index} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {comm.title}
                            </th>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getTypeBadge(comm.type)}`}>
                                    {comm.type}
                                </span>
                            </td>
                            <td className="px-6 py-4">{comm.trip}</td>
                            <td className="px-6 py-4">{comm.group}</td>
                            <td className="px-6 py-4">{comm.date}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end space-x-3">
                                    <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100" aria-label="Edit communication">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100" aria-label="Delete communication">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Communications;