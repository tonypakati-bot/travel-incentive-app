import React from 'react';
import { 
    DashboardIcon, 
    CreationIcon, 
    UsersIcon, 
    ContactsIcon,
    FlightIcon, 
    HotelIcon,
    AgendaIcon,
    DocumentIcon,
    DocumentsIcon,
    CommunicationIcon,
    ReportIcon,
    FormIcon,
    InformationCircleIcon,
    MailIcon
} from './icons';

interface SidebarProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-left ${
                active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <span className="mr-3">{icon}</span>
            {label}
        </button>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
    const navItems = [
        { key: 'dashboard', icon: <DashboardIcon className="w-5 h-5"/>, label: 'Dashboard' },
        { key: 'manage-trip', icon: <CreationIcon className="w-5 h-5"/>, label: 'Manage Trip' },
        { key: 'manage-contacts', icon: <ContactsIcon className="w-5 h-5"/>, label: 'Manage Contacts' },
        { key: 'manage-participants', icon: <UsersIcon className="w-5 h-5"/>, label: 'Manage Participants' },
        { key: 'invites', icon: <MailIcon className="w-5 h-5"/>, label: 'Invites' },
        { key: 'forms', icon: <FormIcon className="w-5 h-5"/>, label: 'Forms' },
        { key: 'communications', icon: <CommunicationIcon className="w-5 h-5"/>, label: 'Communications' },
        { key: 'useful-informations', icon: <InformationCircleIcon className="w-5 h-5"/>, label: 'Useful Informations' },
        { key: 'privacy-policy', icon: <DocumentIcon className="w-5 h-5"/>, label: 'Privacy Policy' },
        { key: 'terms-conditions', icon: <DocumentIcon className="w-5 h-5"/>, label: 'Terms & Conditions' },
        { key: 'documents', icon: <DocumentsIcon className="w-5 h-5"/>, label: 'Documents' },
        { key: 'reports', icon: <ReportIcon className="w-5 h-5"/>, label: 'Reports' },
    ];

    return (
        <aside className="w-64 bg-white flex-shrink-0 border-r border-gray-200">
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <FlightIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">IncentiveTravel</h1>
                        <p className="text-xs text-gray-500">Admin Panel</p>
                    </div>
                </div>
                <nav className="space-y-2">
                    {navItems.map((item) => (
                         <NavItem 
                            key={item.key} 
                            icon={item.icon} 
                            label={item.label} 
                            active={activeView === item.key}
                            onClick={() => setActiveView(item.key)}
                        />
                    ))}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;