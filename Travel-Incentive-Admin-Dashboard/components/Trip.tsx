import React, { useState, useMemo } from 'react';
import { SearchIcon, ArrowUpIcon, ArrowDownIcon, PencilIcon, ChevronDownIcon } from './icons';

type Trip = {
    id: string;
    name: string;
    status: string;
    participants: string;
    dates: string;
    missingDataPercentage: number;
};

interface TripProps {
  onCreateTrip: () => void;
  onEditTrip: () => void;
  onCreateCommunication: (initialType?: 'information' | 'alert') => void;
}

const trips: Trip[] = [
    { id: 'IBZ2026', name: 'Trip to Ibiza', status: 'Draft', participants: '0/80', dates: 'Mag 05 - Mag 10, 2026', missingDataPercentage: 40 },
    { id: 'DXB2026', name: 'Sales Kick-off Dubai', status: 'Ready to Send', participants: '0/85', dates: 'Feb 20 - Feb 25, 2026', missingDataPercentage: 0 },
    { id: 'MYK2025', name: 'Team Retreat Mykonos', status: 'Completed', participants: '150/150', dates: 'Dic 01 - Dic 07, 2025', missingDataPercentage: 0 },
    { id: 'ASP2025', name: 'Ski Trip to Aspen', status: 'Departed', participants: '120/120', dates: 'Gen 15 - Gen 22, 2025', missingDataPercentage: 0 },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Draft':
            return 'bg-blue-100 text-blue-800';
        case 'Ready to Send':
            return 'bg-green-100 text-green-800';
        case 'Completed':
            return 'bg-gray-200 text-gray-800';
        case 'Departed':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const TripActions: React.FC<{ status: string; onEdit: () => void; onCreateCommunication: (initialType?: 'information' | 'alert') => void }> = ({ status, onEdit, onCreateCommunication }) => {
    let primaryButton: React.ReactNode = null;
    switch (status) {
        case 'Draft':
            primaryButton = (
                <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                    Completa Setup
                </button>
            );
            break;
        case 'Ready to Send':
            primaryButton = (
                <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors">
                    Invia Inviti
                </button>
            );
            break;
        case 'Completed':
             primaryButton = (
                <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    Entra
                </button>
            );
            break;
        case 'Departed':
            primaryButton = (
               <button onClick={() => onCreateCommunication('information')} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                   Invia Aggiornamenti
               </button>
           );
           break;
        default:
            break;
    }

    return (
        <div className="flex items-center justify-end space-x-2">
            {primaryButton}
            {status !== 'Completed' && status !== 'Departed' && (
              <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100">
                  <PencilIcon className="w-4 h-4" />
              </button>
            )}
        </div>
    );
};

const parseItalianDate = (dateStr: string): number => {
    const monthMap: { [key: string]: number } = {
        'Gen': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mag': 4, 'Giu': 5,
        'Lug': 6, 'Ago': 7, 'Set': 8, 'Ott': 9, 'Nov': 10, 'Dic': 11
    };
    // Format: "Mag 05 - Mag 10, 2026"
    const parts = dateStr.split(' - ');
    if (parts.length < 2) return 0;

    const startDatePart = parts[0]; // "Mag 05"
    const endDatePart = parts[1]; // "Mag 10, 2026"
    
    const yearMatch = endDatePart.match(/(\d{4})/);
    if (!yearMatch) return 0;
    const year = parseInt(yearMatch[0], 10);

    const startParts = startDatePart.split(' ');
    const monthAbbr = startParts[0];
    const day = parseInt(startParts[1], 10);
    
    const month = monthMap[monthAbbr];

    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day).getTime();
    }
    
    return 0;
};


const Trip: React.FC<TripProps> = ({ onCreateTrip, onEditTrip, onCreateCommunication }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Trip; direction: 'ascending' | 'descending' }>({ key: 'dates', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const uniqueStatuses = useMemo(() => [...new Set(trips.map(p => p.status))], []);

  const sortedTrips = useMemo(() => {
    let sortableItems = [...trips]
        .filter(trip => statusFilter === 'all' || trip.status === statusFilter)
        .filter(trip => 
            trip.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            trip.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

    if (sortConfig.key) {
        sortableItems.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (sortConfig.key === 'dates') {
                aValue = parseItalianDate(a.dates);
                bValue = parseItalianDate(b.dates);
            } else if (sortConfig.key === 'participants') {
                aValue = parseInt(a.participants, 10);
                bValue = parseInt(b.participants, 10);
            } else if (sortConfig.key === 'missingDataPercentage') {
                aValue = a.missingDataPercentage;
                bValue = b.missingDataPercentage;
            } else {
                aValue = a[sortConfig.key];
                bValue = b[sortConfig.key];
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [sortConfig, searchTerm, statusFilter]);

  const requestSort = (key: keyof Trip) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name: keyof Trip) => {
    if (sortConfig.key !== name) {
        return <span className="inline-block w-4 h-4"></span>;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUpIcon className="inline-block ml-1 w-4 h-4" />;
    }
    return <ArrowDownIcon className="inline-block ml-1 w-4 h-4" />;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Trips</h1>
        <p className="text-gray-500 mt-1">View, edit, and create new incentive trips.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search trips..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                </div>
                 <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-48 border border-gray-300 rounded-lg py-2 px-4 text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8"
                    >
                        <option value="all">All Statuses</option>
                        {uniqueStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
            <button 
                onClick={onCreateTrip}
                className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Create New Trip
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4">
                            <button onClick={() => requestSort('name')} className="flex items-center hover:text-gray-900 transition-colors">
                                Trip Name
                                {getSortIcon('name')}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4">
                            <button onClick={() => requestSort('id')} className="flex items-center hover:text-gray-900 transition-colors">
                                Trip Id
                                {getSortIcon('id')}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4">
                            <button onClick={() => requestSort('status')} className="flex items-center hover:text-gray-900 transition-colors">
                                Status
                                {getSortIcon('status')}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4">
                            <button onClick={() => requestSort('participants')} className="flex items-center hover:text-gray-900 transition-colors">
                                Registrations
                                {getSortIcon('participants')}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4">
                            <button onClick={() => requestSort('missingDataPercentage')} className="flex items-center hover:text-gray-900 transition-colors">
                                Missing Data
                                {getSortIcon('missingDataPercentage')}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTrips.map((trip) => (
                        <tr key={trip.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                <div>
                                    <div className="text-base font-semibold">{trip.name}</div>
                                    <div className="text-sm text-gray-500 font-normal">{trip.dates}</div>
                                </div>
                            </th>
                            <td className="px-6 py-4">
                                {trip.id}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1.5 text-xs font-semibold rounded-full ${getStatusBadge(trip.status)}`}>
                                    {trip.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {trip.participants}
                            </td>
                            <td className="px-6 py-4">
                                {trip.missingDataPercentage > 0 ? (
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                            <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${100 - trip.missingDataPercentage}%` }}></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">{100 - trip.missingDataPercentage}%</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">100%</span>
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <TripActions status={trip.status} onEdit={onEditTrip} onCreateCommunication={onCreateCommunication} />
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

export default Trip;