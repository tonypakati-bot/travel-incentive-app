import React, { useState, useEffect } from 'react';
import { Page, TripData, TravelInfo, Announcement, AgendaCategory, AgendaItem, RegistrationFormConfig, Photo, Profile, UserDocument } from './types';
import { registrationFormConfig } from './config/registrationForm';
import { PhotoUploadData } from './types/upload';
import { AuthProvider } from './contexts/AuthContext';
import { useAuthContext } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import { getTripData, getTravelInfo, getDownloadableDocuments, submitRegistration, uploadPhoto, togglePhotoLike, deletePhoto, getUserDocuments, getConfig } from './services/tripService';
import { getUserRegistration } from './services/tripService';
import { getUserProfile } from './api';
import Footer from './components/Footer';
import HamburgerMenu from './components/HamburgerMenu';
import HomePage from './pages/HomePage';
import TravelPage from './pages/TravelPage';
import AgendaPage from './pages/AgendaPage';
import ExplorePage from './pages/ExplorePage';
import ContactPage from './pages/ContactPage';
import DocumentsPage from './pages/DocumentsPage';
import RegistrationPage from './pages/RegistrationPage';
import Header from './components/Header';
import TravelInsurancePage from './pages/TravelInsurancePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import GalleryPage from './pages/GalleryPage';
import AdminTripsPage from './pages/admin/AdminTripsPage';
import AdminTripDetailsPage from './pages/admin/AdminTripDetailsPage';

function MainApp() {
  const { isAuthenticated, loading, user } = useAuthContext();
  // Imposta la home come pagina iniziale
  const [activePage, setActivePage] = useState<Page>('admin');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>(() => {
    // Recupera gli annunci dismissed dal localStorage
    try {
      const saved = localStorage.getItem('dismissedAnnouncements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [downloadableDocs, setDownloadableDocs] = useState<string[]>([]);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [registrationData, setRegistrationData] = useState<{[key: string]: any} | null>(null);
  const [navigateToExplore, setNavigateToExplore] = useState<{ itemId: number; category: AgendaCategory } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [likedPhotos, setLikedPhotos] = useState<number[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isEditingRegistration, setIsEditingRegistration] = useState(false);
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<RegistrationFormConfig>(registrationFormConfig);

  useEffect(() => {
    // Salva gli annunci dismissed nel localStorage ogni volta che cambiano
    try {
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements));
    } catch (error) {
      console.error('Error saving dismissed announcements to localStorage:', error);
    }
  }, [dismissedAnnouncements]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        // Recupera i dati dal server
        const [tripDataResponse, travelInfoResponse, documentsResponse, profile, userRegistration] = await Promise.all([
          getTripData(),
          getTravelInfo(),
          getDownloadableDocuments(),
          getUserProfile(),
          getUserRegistration()
        ]);

        let updatedTripData = { ...tripDataResponse };

        if (!isFormSubmitted && tripDataResponse.eventDetails?.registrationDeadline) {
          const registrationAnnouncement: Announcement = {
            id: 999,
            title: "Azione Richiesta",
            content: `Compila la scheda di adesione entro e non oltre il ${tripDataResponse.eventDetails.registrationDeadline} per finalizzare la tua registrazione.`,
            action: { page: 'registration', label: 'Compila Ora' }
          };
          if (updatedTripData.announcements && !updatedTripData.announcements.some(a => a.id === 999)) {
            updatedTripData.announcements = [registrationAnnouncement, ...updatedTripData.announcements];
          }
        }

        setTripData(updatedTripData);
        setTravelInfo(travelInfoResponse);
        setDownloadableDocs(documentsResponse);
        setUserProfile(profile);
        if (userRegistration && userRegistration._id) {
          setRegistrationData(userRegistration);
          setIsFormSubmitted(true);
        } else {
          // Nessuna registrazione trovata, mostra il form
          setRegistrationData(null);
          setIsFormSubmitted(false);
        }

        // Carica carte d'imbarco personali dell'utente
        try {
          const userDocs = await getUserDocuments();
          setUserDocuments(userDocs);
        } catch (error) {
          console.error('Error loading user documents:', error);
        }

        // Fetch config and update form options
        try {
          const configResponse = await getConfig();
          // Update form config with dynamic options
          const updatedFormConfig = JSON.parse(JSON.stringify(registrationFormConfig)); // deep clone
          const logisticsSection = updatedFormConfig.find(s => s.id === 'logistics');
          if (logisticsSection) {
            const roomTypeField = logisticsSection.fields.find(f => f.id === 'roomType');
            if (roomTypeField && configResponse?.tipologiaCamera) {
              roomTypeField.options = configResponse.tipologiaCamera;
            }
          }
          setFormConfig(updatedFormConfig);
        } catch (error) {
          console.error('Error fetching config:', error);
          // Keep default options
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isFormSubmitted, isAuthenticated]);

  const handleNavClick = (page: Page) => {
    setActivePage(page);
    setIsEditingRegistration(false); // Reset editing flag when navigating
    window.scrollTo(0, 0);
  };

  const handleViewTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setActivePage('admin-trip-details');
  };

  const handleBackToTrips = () => {
    setSelectedTripId(null);
    setActivePage('admin');
  };

  const handleNavigateToExplore = (itemId: number) => {
    if (!tripData || !tripData.agenda) return;
    
    let foundItem: AgendaItem | undefined;
    for (const day of tripData.agenda) {
        if (!day.items) continue;
        foundItem = day.items.find(item => item.id === itemId);
        if (foundItem) break;
    }
    
    if (foundItem?.category && foundItem.category !== 'Travel') {
        setNavigateToExplore({ itemId: foundItem.id, category: foundItem.category });
        setActivePage('explore');
    }
  };

  const clearNavigationData = () => {
    setNavigateToExplore(null);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const dismissAnnouncement = (id: number) => {
    setDismissedAnnouncements(prev => {
      const updated = [...prev];
      if (!updated.includes(id)) {
        updated.push(id);
        // Salva nel localStorage
        try {
          localStorage.setItem('dismissedAnnouncements', JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving dismissed announcements to localStorage:', error);
        }
      }
      return updated;
    });
  };

  const handleFormSubmit = async (data: {[key: string]: any}) => {
    try {
      if (!tripData) throw new Error('Missing trip data');
      
      // Trova i voli corretti basandosi sull'aeroporto di partenza selezionato
      const selectedDepartureAirport = data.departureAirport;
      const outboundFlight = travelInfo?.outboundFlights.find(flight => flight.departureGroup === selectedDepartureAirport);
      const returnFlight = travelInfo?.returnFlights.find(flight => flight.departureGroup === selectedDepartureAirport);
      
      if (!outboundFlight || !returnFlight) {
        throw new Error(`Nessun volo trovato per l'aeroporto selezionato: ${selectedDepartureAirport}`);
      }

      const outboundFlightId = outboundFlight.id;
      const returnFlightId = returnFlight.id;

      // Mappa tutti i dati del form
      const registrationData = {
        outboundFlightId: outboundFlightId,
        returnFlightId: returnFlightId,
        groupName: user?.groupName || 'Default',
        status: 'pending',
        form_data: {
          // Dati partecipante
          companyName: data.companyName,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate,
          nationality: data.nationality,
          mobilePhone: data.mobilePhone,
          email: data.email,
          passportInRenewal: data.passportInRenewal,
          passportNumber: data.passportNumber,
          passportIssueDate: data.passportIssueDate,
          passportExpiryDate: data.passportExpiryDate,

          // Logistica
          roomType: data.roomType,
          departureAirport: data.departureAirport,
          businessClass: data.businessClass,

          // Fatturazione (direttamente in form_data)
          billingName: data.billingName,
          billingAddress: data.billingAddress,
          billingVat: data.billingVat,
          billingSdi: data.billingSdi,

          // Consensi (come da form)
          dataProcessingConsent: data.dataProcessingConsent,
          dataProcessingConsentCompanion: data.dataProcessingConsentCompanion,
          penaltiesAcknowledgement: data.penaltiesAcknowledgement,

          // Altri campi opzionali
          foodRequirements: data.foodRequirements || '',
          dietaryRequirements: data.dietaryRequirements || '',

          // Accompagnatore (se presente)
          hasCompanion: data.hasCompanion,
          companionFirstName: data.companionFirstName,
          companionLastName: data.companionLastName,
          companionBirthDate: data.companionBirthDate,
          companionNationality: data.companionNationality,
          companionPassportInRenewal: data.companionPassportInRenewal,
          companionPassportNumber: data.companionPassportNumber,
          companionPassportIssueDate: data.companionPassportIssueDate,
          companionPassportExpiryDate: data.companionPassportExpiryDate,
          companionFoodRequirements: data.companionFoodRequirements,
          companionMeeting: data.companionMeeting
        }
      };

      await submitRegistration(registrationData);
      setRegistrationData(registrationData);
      setIsFormSubmitted(true);
      setIsEditingRegistration(false); // Reset editing flag
      handleNavClick('home');
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      if (error.response && error.response.data) {
        console.error('Dettaglio errore backend:', error.response.data);
        if (error.response.data.errors) {
          alert('Errore di validazione: ' + JSON.stringify(error.response.data.errors));
        } else if (error.response.data.message) {
          alert('Errore: ' + error.response.data.message);
        } else {
          alert('Errore sconosciuto durante la registrazione.');
        }
      } else {
        alert('Si è verificato un errore durante l\'invio della registrazione. Riprova più tardi.');
      }
    }
  };

  const handlePhotoUpload = async (newPhotos: PhotoUploadData[]) => {
    try {
      const formData = new FormData();
      newPhotos.forEach((photo, index) => {
        formData.append(`photos`, photo.file);
        formData.append(`captions`, photo.caption);
        formData.append(`days`, photo.day.toString());
      });
      
      const uploadedPhotos = await uploadPhoto(formData);
      setPhotos(prevPhotos => [...uploadedPhotos, ...prevPhotos].sort((a,b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
  };

  const handlePhotoLikeToggle = async (photoId: number) => {
    try {
      const updatedPhoto = await togglePhotoLike(photoId);
      const isLiked = likedPhotos.includes(photoId);

      setLikedPhotos(prevLiked => 
        isLiked ? prevLiked.filter(id => id !== photoId) : [...prevLiked, photoId]
      );

      setPhotos(prevPhotos => prevPhotos.map(p => {
        if (p.id === photoId) {
          return { ...p, likes: updatedPhoto.likes };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling photo like:', error);
    }
  };
  
  const handlePhotoDelete = async (photoId: number) => {
    try {
      await deletePhoto(photoId);
      setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleDocumentUpload = async (formData: FormData) => {
    // Documenti caricati solo dall'amministratore
    throw new Error('Upload non disponibile per gli utenti');
  };

  const handleDocumentDelete = async (documentId: string) => {
    // Documenti eliminati solo dall'amministratore
    throw new Error('Eliminazione non disponibile per gli utenti');
  };

  const unreadCount = tripData && tripData.announcements ? 
    tripData.announcements.filter(a => a.id !== 999).length - dismissedAnnouncements.length 
    : 0;

  const renderPage = () => {
    if (!tripData || !travelInfo) return null;

    switch (activePage) {
      case 'home':
        let announcements = tripData.announcements ? tripData.announcements.filter(a => !dismissedAnnouncements.includes(a.id)) : [];
        if (isFormSubmitted && announcements.length > 0) {
            announcements = announcements.filter(a => a.id !== 999);
        }
        return <HomePage eventDetails={tripData.eventDetails || {}} announcements={announcements} onDismiss={dismissAnnouncement} onNavClick={handleNavClick} userRegistration={registrationData} />;
      case 'travel':
        return <TravelPage travelInfo={travelInfo} userRegistration={registrationData} />;
      case 'agenda':
        return <AgendaPage agenda={tripData.agenda || []} onNavigateToExplore={handleNavigateToExplore} userRegistration={registrationData} />;
      case 'explore':
        return <ExplorePage agenda={tripData.agenda || []} navigationData={navigateToExplore} clearNavigationData={clearNavigationData} />;
      case 'contact':
        return <ContactPage emergencyContacts={travelInfo?.emergencyContacts || []} userRegistration={registrationData} />;
      case 'documents':
        return <DocumentsPage 
          travelInfo={travelInfo} 
          downloadableDocs={downloadableDocs} 
          userRegistration={registrationData}
          userDocuments={userDocuments}
        />;
      case 'travel-insurance':
        return <TravelInsurancePage />;
      case 'profile':
        return <ProfilePage userProfile={userProfile} registrationData={registrationData} />;
      case 'settings':
        return <SettingsPage />;
      case 'gallery':
        return <GalleryPage 
                  agenda={tripData.agenda || []}
                  photos={photos}
                  onUpload={handlePhotoUpload}
                  onLike={handlePhotoLikeToggle}
                  onDelete={handlePhotoDelete}
                  currentUser={userProfile}
                  likedPhotos={likedPhotos}
                />;
      case 'registration':
        return <RegistrationPage 
                  formConfig={formConfig} 
                  onFormSubmit={handleFormSubmit} 
                  deadline={tripData.eventDetails?.registrationDeadline}
                  existingData={registrationData}
                  isSubmitted={isFormSubmitted}
                  isEditing={isEditingRegistration}
                  tripData={tripData}
                  onEdit={() => {
                    console.log('DEBUG: Modifica Dati cliccato');
                    setIsEditingRegistration(true);
                  }}
                />;
      case 'admin':
        return <AdminTripsPage onViewTrip={handleViewTrip} />;
      case 'admin-trip-details':
        return <AdminTripDetailsPage tripId={selectedTripId || undefined} onBack={handleBackToTrips} formConfig={formConfig} />;
      default:
        return <HomePage eventDetails={tripData.eventDetails || {}} announcements={[]} onDismiss={() => {}} onNavClick={handleNavClick} />;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <Header onMenuClick={toggleMenu} onNavClick={handleNavClick} activePage={activePage} />
      <main className={activePage === 'home' ? '' : 'pb-24'}>
        {renderPage()}
      </main>
      <Footer
        activePage={activePage}
        onNavClick={handleNavClick}
        unreadCount={unreadCount}
      />
      <HamburgerMenu isOpen={isMenuOpen} onClose={toggleMenu} onNavClick={handleNavClick} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}