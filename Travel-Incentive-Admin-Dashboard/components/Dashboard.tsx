import React from 'react';
import { SearchIcon, CreationIcon, ReadyIcon, RegistrationIcon, DepartedIcon, WarningIcon, CheckCircleIcon } from './icons';
import DashboardCard from './DashboardCard';
import CircularProgressBar from './CircularProgressBar';

interface DashboardProps {
  onCreateTrip: () => void;
  onCreateCommunication: (initialType: 'information' | 'alert') => void;
  onSendReminder: (count: number) => void;
  onSendInvites: (tripName: string, inviteeCount: number) => void;
}

const CreationCardContent: React.FC = () => (
  <div className="space-y-6">
    <div>
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-medium text-gray-700">Trip to Ibiza</h4>
        <div className="flex items-center text-xs bg-red-100 text-red-600 font-semibold px-2 py-1 rounded-full">
          <WarningIcon className="w-4 h-4 mr-1"/> Missing Data
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-amber-400 h-2 rounded-full" style={{ width: '60%' }}></div>
        </div>
        <span className="text-sm font-medium text-gray-600">60%</span>
      </div>
       <div className="mt-4 flex">
        <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Completa setup</button>
      </div>
    </div>
    <div className="border-t border-gray-100 pt-6">
      <h4 className="font-medium text-gray-700 mb-1">Trip to Maldives</h4>
       <div className="flex items-center space-x-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-amber-400 h-2 rounded-full" style={{ width: '25%' }}></div>
        </div>
        <span className="text-sm font-medium text-gray-600">25%</span>
      </div>
      <div className="mt-4 flex">
        <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Completa setup</button>
      </div>
    </div>
  </div>
);

const ReadyCardContent: React.FC<{ onSendInvites: (tripName: string, inviteeCount: number) => void }> = ({ onSendInvites }) => (
    <div className="space-y-6">
    <div>
      <h4 className="font-medium text-gray-700">Team Retreat Mykonos</h4>
      <p className="text-sm text-gray-500 mb-4">150 invitees</p>
      <div className="flex space-x-3">
        <button onClick={() => onSendInvites('Team Retreat Mykonos', 150)} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Invia inviti</button>
        <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Modifica template</button>
      </div>
    </div>
    <div className="border-t border-gray-100 pt-6">
      <h4 className="font-medium text-gray-700">Sales Kick-off Dubai</h4>
      <p className="text-sm text-gray-500 mb-4">85 invitees</p>
      <div className="flex space-x-3">
        <button onClick={() => onSendInvites('Sales Kick-off Dubai', 85)} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Invia inviti</button>
        <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Modifica template</button>
      </div>
    </div>
  </div>
);

const RegistrationCardContent: React.FC<{ onSendReminder: (count: number) => void }> = ({ onSendReminder }) => {
  const incompleteCount = 38;
  return (
    <div className="space-y-4">
    <div className="flex items-center space-x-6">
      <CircularProgressBar percentage={75} />
      <div>
        <h4 className="font-semibold text-gray-800">President's Club Hawaii</h4>
        <p className="text-sm text-gray-600">112 / 150 completed</p>
        <p className="text-sm text-orange-500 font-medium">{incompleteCount} incomplete</p>
      </div>
    </div>
    <div className="flex space-x-3 pt-4">
      <button onClick={() => onSendReminder(incompleteCount)} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Invia Reminder</button>
      <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Vedi Report</button>
    </div>
  </div>
);
};

const DepartedCardContent: React.FC<{ onCreateCommunication: (initialType: 'information' | 'alert') => void }> = ({ onCreateCommunication }) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-gray-800 text-lg">Ski Trip to Aspen</h4>
    <div className="space-y-3">
        <div className="flex items-center space-x-2 text-red-600">
            <WarningIcon className="w-5 h-5"/>
            <span className="text-sm font-medium">Flight AA123 Delayed</span>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
            <CheckCircleIcon className="w-5 h-5"/>
            <span className="text-sm font-medium">Hotel check-in info sent</span>
        </div>
    </div>
    <div className="flex space-x-3 pt-4">
        <button onClick={() => onCreateCommunication('information')} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Invia aggiornamenti</button>
        <button onClick={() => onCreateCommunication('alert')} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">Gestione emergenze</button>
    </div>
  </div>
);


const Dashboard: React.FC<DashboardProps> = ({ onCreateTrip, onCreateCommunication, onSendReminder, onSendInvites }) => {
  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Principale</h1>
          <p className="text-gray-500 mt-1">Operational overview of all incentive trips</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search participants, flights, hotels..."
              className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <button 
            onClick={onCreateTrip}
            className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Create New Trip
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DashboardCard title="Viaggi in Fase di Creazione" icon={<CreationIcon className="text-amber-500 w-4 h-4"/>}>
            <CreationCardContent />
        </DashboardCard>
        <DashboardCard title="Viaggi Pronti per l'Invio" icon={<ReadyIcon className="text-green-500 w-4 h-4"/>}>
            <ReadyCardContent onSendInvites={onSendInvites} />
        </DashboardCard>
        <DashboardCard title="Registrazioni in Corso" icon={<RegistrationIcon className="text-blue-500 w-4 h-4"/>}>
            <RegistrationCardContent onSendReminder={onSendReminder} />
        </DashboardCard>
        <DashboardCard title="Viaggi Partiti - Gestione Operativa" icon={<DepartedIcon className="text-red-500 w-4 h-4"/>}>
            <DepartedCardContent onCreateCommunication={onCreateCommunication} />
        </DashboardCard>
      </div>
    </div>
  );
};

export default Dashboard;