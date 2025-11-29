import React from 'react';
import { Page } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onNavClick: (page: Page) => void;
  activePage: Page;
}

const PAGE_TITLES: Record<Page, string> = {
    home: '',
    travel: 'Travel Information',
    agenda: 'Itinerary',
    explore: 'Explore',
    contact: 'Contatti & Assistenza',
    documents: 'Documenti di Viaggio',
    'travel-insurance': 'Assicurazione di Viaggio',
    registration: 'Scheda di Adesione',
    profile: 'Il Mio Profilo',
    settings: 'Impostazioni',
    gallery: 'Galleria Fotografica',
  admin: 'Pannello Admin',
  'admin-trip-details': 'Dettagli Viaggio',
};

const Header: React.FC<HeaderProps> = ({ onMenuClick, onNavClick, activePage }) => {
  const isHomePage = activePage === 'home';

  if (isHomePage) {
    const buttonClasses = `
      fixed top-4 right-4 z-40 
      flex items-center justify-center 
      w-12 h-12 rounded-full 
      transition-colors duration-200 
      hover:bg-black/10
    `;

    // Solo hamburger menu, nessun altro bottone
    return (
      <button onClick={onMenuClick} aria-label="Apri menu" className={buttonClasses}>
        <span className={`material-symbols-outlined text-3xl text-white`}>menu</span>
      </button>
    );
  }

  return (
    <header className="sticky top-0 left-0 right-0 h-20 bg-white z-30 flex items-center justify-between px-4 border-b border-gray-200/90">
      <button
        onClick={() => onNavClick('home')}
        aria-label="Torna alla Home"
        className="p-2 text-gray-700 rounded-full hover:bg-gray-100"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>

      <h1 className="text-lg font-semibold text-[#1A2C47] absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
        {PAGE_TITLES[activePage]}
      </h1>

      <button 
        onClick={onMenuClick} 
        aria-label="Apri menu"
        className="p-2 text-gray-700 rounded-full hover:bg-gray-100"
      >
        <span className="material-symbols-outlined text-3xl">menu</span>
      </button>
    </header>
  );
};

export default Header;