
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import ParticipantModal from './ParticipantModal';
import ConfirmModal from './ConfirmModal';
import { SearchIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, UploadIcon, ChevronDownIcon, DownloadIcon, PlusIcon, UsersIcon, CheckCircleIcon } from './icons';

type ParticipantStatus = 'Registered' | 'Invited' | 'To Invite';

type Participant = {
    id?: string | number;
    _id?: string;
    name: string;
    email: string;
    trip: string;
    group: string;
    status: ParticipantStatus;
};

interface ManageParticipantsProps {
    participants?: Participant[];
    onSendReminder: (count: number, onSent: () => void) => void;
    onSendInvite: (tripName: string, count: number) => void;
    onSaveParticipant?: (participant: Participant) => void;
    onDeleteParticipant?: (id: string | number) => void;
}

// participants will be provided via props (loaded from API)
const participantsDataFallback: Participant[] = [];

const getStatusBadge = (status: ParticipantStatus) => {
    switch (status) {
        case 'Registered':
            return 'bg-green-100 text-green-800';
        case 'Invited':
            return 'bg-blue-100 text-blue-800';
        case 'To Invite':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// --- Detail Component: List of Participants for a specific Trip ---

interface TripParticipantsViewProps {
    tripName: string;
    participants: Participant[];
    onBack: () => void;
    onSendReminder: (count: number, onSent: () => void) => void;
    onSendInvite: (tripName: string, count: number) => void;
    onSaveParticipant?: (participant: Participant) => void;
    onDeleteParticipant?: (id: string | number) => void;
}

const TripParticipantsView: React.FC<TripParticipantsViewProps> = ({ tripName, participants, onBack, onSendReminder, onSendInvite, onSaveParticipant, onDeleteParticipant }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();
    const [statusFilter, setStatusFilter] = useState<ParticipantStatus | 'all'>('all');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
    const [participantToEditLocal, setParticipantToEditLocal] = useState<Participant | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [participantToDeleteLocal, setParticipantToDeleteLocal] = useState<Participant | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Participant; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

    const headerCheckboxRef = useRef<HTMLInputElement>(null);

    // Filter and Sort
    const filteredParticipants = useMemo(() => {
        let filtered = [...participants]
            .filter(p => statusFilter === 'all' || p.status === statusFilter)
            .filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.group.toLowerCase().includes(searchTerm.toLowerCase())
            );

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filtered;
    }, [participants, searchTerm, statusFilter, sortConfig]);

    useEffect(() => {
        if (headerCheckboxRef.current) {
            const numVisible = filteredParticipants.length;
            const numSelected = selectedParticipants.length;
            headerCheckboxRef.current.checked = numSelected === numVisible && numVisible > 0;
            headerCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numVisible;
        }
    }, [selectedParticipants, filteredParticipants]);

    const requestSort = (key: keyof Participant) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (name: keyof Participant) => {
        if (!sortConfig || sortConfig.key !== name) {
            return <span className="inline-block w-4 h-4"></span>;
        }
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-4 h-4 inline-block ml-1" /> : <ArrowDownIcon className="w-4 h-4 inline-block ml-1" />;
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedParticipants(filteredParticipants.map(p => String(p.id ?? p._id ?? '')));
        } else {
            setSelectedParticipants([]);
        }
    };

    const handleSelectOne = (id: string | number) => {
        const sid = String(id);
        setSelectedParticipants(prev =>
            prev.includes(sid) ? prev.filter(pId => pId !== sid) : [...prev, sid]
        );
    };

    const handleExport = () => {
        const headers = ['ID', 'Name', 'Email', 'Trip', 'Group', 'Status'];
        const csvRows = [headers.join(',')];
        filteredParticipants.forEach(p => {
            const row = [p.id, p.name, p.email, p.trip, p.group, p.status].map(val => `"${val}"`).join(',');
            csvRows.push(row);
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${tripName.replace(/\s+/g, '_')}_participants.csv`;
        link.click();
    };

    const primaryAction = useMemo(() => {
        const selectedObjs = participants.filter(p => selectedParticipants.includes(String(p.id ?? p._id ?? '')));
        if (selectedObjs.length === 0) return null;

        // Logic:
        // 1. If ANY selected is "To Invite" -> Show "Send Invite"
        // 2. If NO "To Invite" but HAS "Invited" -> Show "Send Reminder"
        // 3. Else (e.g. only Registered) -> No main action (or could be something else)

        const hasToInvite = selectedObjs.some(p => p.status === 'To Invite');
        if (hasToInvite) {
            return {
                type: 'invite',
                label: `Send Invite (${selectedParticipants.length})`,
                bg: 'bg-blue-600 hover:bg-blue-700'
            };
        }

        const hasInvited = selectedObjs.some(p => p.status === 'Invited');
        if (hasInvited) {
            return {
                type: 'remind',
                label: `Send Reminder (${selectedParticipants.length})`,
                bg: 'bg-blue-600 hover:bg-blue-700'
            };
        }

        return null;
    }, [selectedParticipants, participants]);

    const executePrimaryAction = () => {
        if (!primaryAction) return;

        if (primaryAction.type === 'invite') {
            // Send invites to all selected.
            onSendInvite(tripName, selectedParticipants.length);
            setSelectedParticipants([]);
        } else if (primaryAction.type === 'remind') {
            // Send reminders to all eligible selected (not registered).
            const selectedObjs = participants.filter(p => selectedParticipants.includes(String(p.id ?? p._id ?? '')));
            const participantsToRemind = selectedObjs.filter(p => p.status !== 'Registered');

            if (participantsToRemind.length === 0) {
                console.log('[ManageParticipants] no participants to remind');
                toast.showToast('All selected participants are already registered.', 'info');
                return;
            }
            onSendReminder(participantsToRemind.length, () => setSelectedParticipants([]));
        }
    };

    // Simple add/edit flows using prompt dialogs (minimal UX for quick testing)
    const handleAddNew = () => {
        setParticipantToEditLocal(null);
        setIsParticipantModalOpen(true);
    };

    const handleEditParticipant = (p: Participant) => {
        setParticipantToEditLocal(p);
        setIsParticipantModalOpen(true);
    };

    return (
        <div className="animate-fade-in">
            <ParticipantModal
                isOpen={isParticipantModalOpen}
                onClose={() => setIsParticipantModalOpen(false)}
                participantToEdit={participantToEditLocal}
                defaultTrip={tripName}
                onSave={(p) => {
                    if (onSaveParticipant) {
                        const res = onSaveParticipant(p);
                        // return promise if parent provided one so modal can await
                        return res;
                    }
                    return Promise.resolve();
                }}
            />
            <div className="flex items-center mb-6">
                <button 
                    onClick={onBack} 
                    className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
                >
                    <ChevronDownIcon className="w-6 h-6 transform rotate-90" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{tripName}</h2>
                    <p className="text-sm text-gray-500">Managing participants list</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    {/* Toolbar */}
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                            <div className="relative flex-1 max-w-md">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search participants..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 w-full border rounded-lg bg-white text-sm text-gray-900 placeholder-gray-500 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>
                            <div className="relative w-44">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as ParticipantStatus | 'all')}
                                    className="w-full border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Registered">Registered</option>
                                    <option value="Invited">Invited</option>
                                    <option value="To Invite">To Invite</option>
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedParticipants.length > 0 && primaryAction && (
                                <button 
                                    data-testid={process.env.NODE_ENV === 'development' ? (primaryAction.type === 'invite' ? 'send-invite' : 'send-reminder') : undefined}
                                    onClick={executePrimaryAction}
                                    className={`${primaryAction.bg} text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm`}>
                                    {primaryAction.label}
                                </button>
                            )}
                            <button data-testid={process.env.NODE_ENV === 'development' ? 'add-new-participant' : undefined} onClick={handleAddNew} className="bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center">
                                <PlusIcon className="w-4 h-4 mr-2" /> Add New
                            </button>
                            <button className="bg-white text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 flex items-center shadow-sm">
                                <UploadIcon className="w-4 h-4 mr-2" /> Import
                            </button>
                            <button onClick={handleExport} className="bg-white text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 flex items-center shadow-sm">
                                <DownloadIcon className="w-4 h-4 mr-2" /> Export
                            </button>
                        </div>
                    </div>
                 </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-10">
                                    <input 
                                        type="checkbox"
                                        ref={headerCheckboxRef}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    <button onClick={() => requestSort('name')} className="flex items-center hover:text-gray-900 font-bold">
                                        Participant {getSortIcon('name')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    <button onClick={() => requestSort('group')} className="flex items-center hover:text-gray-900 font-bold">
                                        Group {getSortIcon('group')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    <button onClick={() => requestSort('status')} className="flex items-center hover:text-gray-900 font-bold">
                                        Status {getSortIcon('status')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-4 text-right font-bold">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParticipants.length > 0 ? (
                                filteredParticipants.map((participant) => (
                                    <tr key={String(participant.id ?? participant._id ?? '')} className={`bg-white border-b last:border-b-0 hover:bg-gray-50 transition-colors ${selectedParticipants.includes(String(participant.id ?? participant._id ?? '')) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="checkbox"
                                                checked={selectedParticipants.includes(String(participant.id ?? participant._id ?? ''))}
                                                onChange={() => handleSelectOne(participant.id ?? participant._id ?? '')}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 text-sm">
                                                    {participant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{participant.name}</div>
                                                    <div className="text-xs text-gray-500 font-normal">{participant.email}</div>
                                                </div>
                                            </div>
                                        </th>
                                        <td className="px-6 py-4 text-gray-600">{participant.group}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(participant.status)}`}>
                                                {participant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => handleEditParticipant(participant)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors hover:bg-gray-100" aria-label="Edit participant">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setParticipantToDeleteLocal(participant); setIsConfirmOpen(true); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-full transition-colors hover:bg-red-50" aria-label="Delete participant">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No participants found matching your search for this trip.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <ConfirmModal
                    open={isConfirmOpen}
                    title="Eliminare partecipante"
                    message={`Eliminare questo partecipante?`}
                    confirmLabel="Elimina"
                    cancelLabel="Annulla"
                    onCancel={() => { setIsConfirmOpen(false); setParticipantToDeleteLocal(null); }}
                    onConfirm={() => {
                        if (participantToDeleteLocal && onDeleteParticipant) {
                            onDeleteParticipant(String(participantToDeleteLocal.id ?? participantToDeleteLocal._id ?? ''));
                        }
                        setIsConfirmOpen(false);
                        setParticipantToDeleteLocal(null);
                    }}
                />
            </div>
        </div>
    );
};


// --- Main View: List of Trips ---

interface TripSummary {
    name: string;
    totalParticipants: number;
    registeredCount: number;
    groups: number;
}

interface TripListViewProps {
    onSelectTrip: (tripName: string) => void;
    participants: Participant[];
}

const TripListView: React.FC<TripListViewProps> = ({ onSelectTrip, participants }) => {
    // Aggregate data to get trip summaries
    const tripSummaries = useMemo(() => {
        const summaries: Record<string, TripSummary> = {};
        participants.forEach(p => {
            if (!summaries[p.trip]) {
                summaries[p.trip] = { name: p.trip, totalParticipants: 0, registeredCount: 0, groups: 0 };
            }
            summaries[p.trip].totalParticipants += 1;
            if (p.status === 'Registered') {
                summaries[p.trip].registeredCount += 1;
            }
        });
        // Simple way to count unique groups per trip
        Object.keys(summaries).forEach(tripName => {
            const groups = new Set(participants.filter(p => p.trip === tripName).map(p => p.group));
            summaries[tripName].groups = groups.size;
        });

        return Object.values(summaries);
    }, [participants]);

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Manage Participants</h1>
                <p className="text-gray-500 mt-1">Select a trip to view and manage its participants.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th scope="col" className="px-6 py-4">Trip Name</th>
                            <th scope="col" className="px-6 py-4">Total Participants</th>
                            <th scope="col" className="px-6 py-4">Registration Status</th>
                            <th scope="col" className="px-6 py-4">Groups</th>
                            <th scope="col" className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tripSummaries.map((trip) => (
                            <tr 
                                key={trip.name} 
                                className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onSelectTrip(trip.name)}
                            >
                                <th scope="row" className="px-6 py-5 font-medium text-gray-900 whitespace-nowrap text-base">
                                    {trip.name}
                                </th>
                                <td className="px-6 py-5">
                                    <div className="flex items-center">
                                        <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="font-semibold text-gray-700">{trip.totalParticipants}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="w-full max-w-xs">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-medium text-blue-700">{trip.registeredCount} Registered</span>
                                            <span className="text-xs font-medium text-gray-500">{Math.round((trip.registeredCount / trip.totalParticipants) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${(trip.registeredCount / trip.totalParticipants) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-xs font-medium">
                                        {trip.groups} Groups
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectTrip(trip.name);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 font-medium text-sm px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        Manage Participants
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Main Component ---

const ManageParticipants: React.FC<ManageParticipantsProps> = ({ participants = participantsDataFallback, onSendReminder, onSendInvite, onSaveParticipant, onDeleteParticipant }) => {
    const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

    const handleSelectTrip = (tripName: string) => {
        setSelectedTrip(tripName);
    };

    const handleBack = () => {
        setSelectedTrip(null);
    };

    const activeTripParticipants = useMemo(() => {
        return selectedTrip ? participants.filter(p => p.trip === selectedTrip) : [];
    }, [selectedTrip, participants]);

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            {selectedTrip ? (
                <TripParticipantsView 
                    tripName={selectedTrip} 
                    participants={activeTripParticipants} 
                    onBack={handleBack} 
                    onSendReminder={onSendReminder}
                    onSendInvite={onSendInvite}
                    onSaveParticipant={onSaveParticipant}
                    onDeleteParticipant={onDeleteParticipant}
                />
            ) : (
                <TripListView onSelectTrip={handleSelectTrip} participants={participants} />
            )}
        </div>
    );
};

export default ManageParticipants;
