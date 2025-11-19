import React, { useState, useEffect } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import SectionCard from '../../components/SectionCard';
import api from '../../api';

interface AdminTripDetailsPageProps {
  tripId?: string;
  onBack?: () => void;
  formConfig: any; // RegistrationFormConfig
}

const AdminTripDetailsPage: React.FC<AdminTripDetailsPageProps> = ({ tripId, onBack, formConfig }) => {
  const [trip, setTrip] = useState<any>(null);
  const [travelInfo, setTravelInfo] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTrip, setEditedTrip] = useState<any>(null);
  const [newGroupValue, setNewGroupValue] = useState('');
  const [isEditingTravel, setIsEditingTravel] = useState(false);
  const [editedTravel, setEditedTravel] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'outbound' | 'return'>('outbound');
  const [outboundFlights, setOutboundFlights] = useState<any[]>([]);
  const [returnFlights, setReturnFlights] = useState<any[]>([]);
  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState<string | undefined>(undefined);
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  // Emergency contacts edit state
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [editedEmergency, setEditedEmergency] = useState<any[] | null>(null);
  // Agenda edit state
  const [isEditingAgenda, setIsEditingAgenda] = useState(false);
  const [editedAgenda, setEditedAgenda] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);

        // Recupera tutti i dati in parallelo
        const [tripRes, travelInfoRes, registrationsRes] = await Promise.all([
          api.get('/trip'),
          api.get('/travel-info'),
          api.get('/admin/registrations')
        ]);

        setTrip(tripRes.data);
        const travelData = travelInfoRes.data;
        // Ensure emergencyContacts have departureGroup field
        if (travelData?.emergencyContacts) {
          travelData.emergencyContacts = travelData.emergencyContacts.map((c: any) => ({
            ...c,
            departureGroup: c.departureGroup || '',
            type: c.type || ''
          }));
        }
        setTravelInfo(travelData);
        // initialize local flights arrays for UI
        setOutboundFlights(travelData?.outboundFlights || []);
        setReturnFlights(travelData?.returnFlights || []);
        setRegistrations(registrationsRes.data || []);
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Errore nel caricamento dei dettagli del viaggio');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const handleEdit = () => {
    const copy = JSON.parse(JSON.stringify(trip)); // deep copy
    const toInputDate = (val: any) => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return val; // leave as-is if not a parsable date
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    if (copy?.eventDetails) {
      copy.eventDetails.startDate = toInputDate(copy.eventDetails.startDate);
      copy.eventDetails.endDate = toInputDate(copy.eventDetails.endDate);
      copy.eventDetails.registrationDeadline = toInputDate(copy.eventDetails.registrationDeadline);
      // ensure boolean flags exist to avoid them being omitted on save
      if (typeof copy.eventDetails.allowCompanion === 'undefined') copy.eventDetails.allowCompanion = false;
      if (typeof copy.eventDetails.allowBusiness === 'undefined') copy.eventDetails.allowBusiness = false;
    }
    setEditedTrip(copy);
    setIsEditing(true);
  };

  const handleEditTravel = () => {
    const copy: any = JSON.parse(JSON.stringify(travelInfo || {}));
    const toInputDate = (val: any) => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    // normalize flight dates for outbound and return
    const normalizeFlights = (arr: any[]) => {
      if (!Array.isArray(arr)) return arr;
      return arr.map((f) => {
        const nf = { ...f };
        if (nf.departure) nf.departure.date = toInputDate(nf.departure.date);
        if (nf.arrival) nf.arrival.date = toInputDate(nf.arrival.date);
        return nf;
      });
    };
    if (copy.outboundFlights) copy.outboundFlights = normalizeFlights(copy.outboundFlights);
    if (copy.returnFlights) copy.returnFlights = normalizeFlights(copy.returnFlights);
    setEditedTravel(copy);
    setIsEditingTravel(true);
  };

  const handleSave = async () => {
    try {
      if (!editedTrip) return;
      // open confirm modal and set pending action
      setConfirmTitle('Conferma Salvataggio');
      setConfirmMessage('Sei sicuro di voler salvare le modifiche alla Sezione 1?');
      setOnConfirmAction(() => async () => {
        try {
          const res = await api.put('/trip', editedTrip);
          setTrip(res.data || editedTrip);
          setIsEditing(false);
          setEditedTrip(null);
        } catch (err) {
          console.error('Error saving trip:', err);
          setError('Errore nel salvataggio del viaggio');
        } finally {
          setConfirmOpen(false);
          setOnConfirmAction(null);
        }
      });
      setConfirmOpen(true);
    } catch (err) {
      console.error('Error preparing save:', err);
      setError('Errore interno');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTrip(null);
  };

  const handleSaveTravel = async () => {
    try {
      if (!editedTravel) return;
      setConfirmTitle('Conferma Salvataggio Travel Info');
      setConfirmMessage('Sei sicuro di voler salvare le modifiche alle Travel Info?');
      setOnConfirmAction(() => async () => {
        try {
          const res = await api.put('/travel-info', editedTravel);
          setTravelInfo(res.data);
          setIsEditingTravel(false);
          setEditedTravel(null);
        } catch (err) {
          console.error('Error saving travel info:', err);
          setError('Errore nel salvataggio delle informazioni di viaggio');
        } finally {
          setConfirmOpen(false);
          setOnConfirmAction(null);
        }
      });
      setConfirmOpen(true);
    } catch (err) {
      console.error('Error preparing save travel:', err);
      setError('Errore interno');
    }
  };

  const handleCancelTravel = () => {
    setIsEditingTravel(false);
    setEditedTravel(null);
  };

  const handleEditEmergency = () => {
    setEditedEmergency(JSON.parse(JSON.stringify(travelInfo?.emergencyContacts || [])));
    setIsEditingEmergency(true);
  };

  const handleCancelEmergency = () => {
    setIsEditingEmergency(false);
    setEditedEmergency(null);
  };

  const handleSaveEmergency = async () => {
    if (!editedEmergency) return;
    setConfirmTitle('Conferma Salvataggio Contatti');
    setConfirmMessage('Sei sicuro di voler salvare le modifiche ai contatti di emergenza?');
    setOnConfirmAction(() => async () => {
      try {
      // Ensure departureGroup is sent: if empty/whitespace, send empty string so backend can overwrite
      const updatedContacts = editedEmergency.map((c) => {
        const out = { ...c };
        if (typeof out.departureGroup === 'string' && out.departureGroup.trim() === '') {
          out.departureGroup = '';
        }
        return out;
      });
      const payload = { ...(travelInfo || {}), emergencyContacts: updatedContacts };
        const res = await api.put('/travel-info', payload);
        setTravelInfo(res.data);
        setIsEditingEmergency(false);
        setEditedEmergency(null);
      } catch (err) {
        console.error('Error saving emergency contacts:', err);
        setError('Errore nel salvataggio dei contatti di emergenza');
      } finally {
        setConfirmOpen(false);
        setOnConfirmAction(null);
      }
    });
    setConfirmOpen(true);
  };

  const updateEditedEmergency = (index: number, field: string, value: any) => {
    if (!editedEmergency) return;
    const copy = JSON.parse(JSON.stringify(editedEmergency));
    if (!copy[index]) copy[index] = {};
    copy[index][field] = value;
    setEditedEmergency(copy);
  };

  const handleAddContact = () => {
    if (!editedEmergency) return;
    const copy = JSON.parse(JSON.stringify(editedEmergency));
    // keep departureGroup empty by default (user prefers empty value)
  copy.push({ departureGroup: '', type: '', name: '', phone: '', email: '' });
    setEditedEmergency(copy);
  };

  const handleDeleteContact = (idx: number) => {
    if (!editedEmergency) return;
    setConfirmTitle('Conferma Eliminazione Contatto');
    setConfirmMessage('Sei sicuro di eliminare questo contatto di emergenza?');
    setOnConfirmAction(() => () => {
      const copy = JSON.parse(JSON.stringify(editedEmergency));
      copy.splice(idx, 1);
      setEditedEmergency(copy);
      setConfirmOpen(false);
      setOnConfirmAction(null);
    });
    setConfirmOpen(true);
  };

  const handleImportGoogleSheets = () => {
    // placeholder: integration with Google Sheets not implemented here
    // show a confirm/imported toast via modal for now
    setConfirmTitle('Importa da Google Sheets');
    setConfirmMessage('Funzionalità di import non implementata in questo ambiente. Simulare import?');
    setOnConfirmAction(() => () => {
      // simulate no-op
      setConfirmOpen(false);
      setOnConfirmAction(null);
      // optionally you could setEditedEmergency([...]) with sample data
    });
    setConfirmOpen(true);
  };

  const handleEditAgenda = () => {
    const copy: any[] = JSON.parse(JSON.stringify(trip?.agenda || []));
    // Normalize date strings to ISO (yyyy-mm-dd) so input[type=date] shows value
    for (let i = 0; i < copy.length; i++) {
      if (copy[i]?.date) {
        copy[i].date = parseItalianDateToISO(copy[i].date) || copy[i].date;
      }
      // ensure items array exists
      if (!Array.isArray(copy[i].items)) copy[i].items = [];
    }
    setEditedAgenda(copy);
    setIsEditingAgenda(true);
  };

  const handleCancelAgenda = () => {
    setIsEditingAgenda(false);
    setEditedAgenda(null);
  };

  const handleSaveAgenda = async () => {
    if (!editedAgenda) return;
    setConfirmTitle('Conferma Salvataggio Agenda');
    setConfirmMessage('Sei sicuro di voler salvare le modifiche all\'agenda?');
    setOnConfirmAction(() => async () => {
      try {
        const payload = { ...(trip || {}), agenda: editedAgenda };
        const res = await api.put('/trip', payload);
        setTrip(res.data || payload);
        setIsEditingAgenda(false);
        setEditedAgenda(null);
      } catch (err) {
        console.error('Error saving agenda:', err);
        setError('Errore nel salvataggio dell\'agenda');
      } finally {
        setConfirmOpen(false);
        setOnConfirmAction(null);
      }
    });
    setConfirmOpen(true);
  };

  const updateEditedAgendaDay = (index: number, field: string, value: any) => {
    if (!editedAgenda) return;
    const copy = JSON.parse(JSON.stringify(editedAgenda));
    if (!copy[index]) copy[index] = {};
    copy[index][field] = value;
    setEditedAgenda(copy);
  };

  const handleAddAgendaDay = () => {
    if (!editedAgenda) return;
    const copy = JSON.parse(JSON.stringify(editedAgenda));
    copy.push({ day: (copy.length + 1), title: '', date: '', items: [] });
    setEditedAgenda(copy);
  };

  const handleDeleteAgendaDay = (index: number) => {
    if (!editedAgenda) return;
    setConfirmTitle('Conferma Eliminazione Giorno');
    setConfirmMessage('Sei sicuro di eliminare questo giorno dall\'agenda?');
    setOnConfirmAction(() => () => {
      const copy = JSON.parse(JSON.stringify(editedAgenda));
      copy.splice(index, 1);
      // reindex days
      for (let i = 0; i < copy.length; i++) copy[i].day = i + 1;
      setEditedAgenda(copy);
      setConfirmOpen(false);
      setOnConfirmAction(null);
    });
    setConfirmOpen(true);
  };

  const handleAddAgendaItem = (dayIndex: number) => {
    if (!editedAgenda) return;
    const copy = JSON.parse(JSON.stringify(editedAgenda));
    if (!Array.isArray(copy[dayIndex].items)) copy[dayIndex].items = [];
    copy[dayIndex].items.push({ time: '', title: '', description: '' });
    setEditedAgenda(copy);
  };

  const handleDeleteAgendaItem = (dayIndex: number, itemIndex: number) => {
    if (!editedAgenda) return;
    const copy = JSON.parse(JSON.stringify(editedAgenda));
    if (!Array.isArray(copy[dayIndex].items)) return;
    copy[dayIndex].items.splice(itemIndex, 1);
    setEditedAgenda(copy);
  };

  const formatDatePretty = (val: any) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const parseItalianDateToISO = (val: any) => {
    if (!val) return '';
    // If already ISO/parsible by Date, return yyyy-mm-dd
    const d1 = new Date(val);
    if (!isNaN(d1.getTime())) {
      const yyyy = d1.getFullYear();
      const mm = String(d1.getMonth() + 1).padStart(2, '0');
      const dd = String(d1.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    // Try to parse formats like '06 novembre 2025' (it)
    const months: Record<string, number> = {
      gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
      luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12
    };
    const m = String(val).trim().toLowerCase().match(/(\d{1,2})\s+([a-zà-ú]+)\s+(\d{4})/i);
    if (m) {
      const dd = String(Number(m[1])).padStart(2, '0');
      const monthName = m[2];
      const yyyy = m[3];
      const mm = months[monthName] ? String(months[monthName]).padStart(2, '0') : '01';
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  };

  const updateEditedAgendaItem = (dayIndex: number, itemIndex: number, field: string, value: any) => {
    if (!editedAgenda) return;
    const copy = JSON.parse(JSON.stringify(editedAgenda));
    if (!Array.isArray(copy[dayIndex].items)) copy[dayIndex].items = [];
    if (!copy[dayIndex].items[itemIndex]) copy[dayIndex].items[itemIndex] = {};
    copy[dayIndex].items[itemIndex][field] = value;
    setEditedAgenda(copy);
  };

  const updateEditedTrip = (path: string, value: any) => {
    if (!editedTrip) return;
    const newTrip = { ...editedTrip };
    const keys = path.split('.');
    let current: any = newTrip;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    setEditedTrip(newTrip);
  };

  const updateEditedTravel = (path: string, value: any) => {
    if (!editedTravel) return;
    const newTravel: any = JSON.parse(JSON.stringify(editedTravel));
    const parts = path.split('.');
    let cur: any = newTravel;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      // support bracket indices like Flights[0]
      const arrMatch = part.match(/(\w+)\[(\d+)\]/);
      if (arrMatch) {
        const arrKey = arrMatch[1];
        const idx = parseInt(arrMatch[2], 10);
        if (!cur[arrKey]) cur[arrKey] = [];
        if (!cur[arrKey][idx]) cur[arrKey][idx] = {};
        cur = cur[arrKey][idx];
        continue;
      }
      if (!cur[part]) cur[part] = {};
      cur = cur[part];
    }
    const last = parts[parts.length - 1];
    // handle final bracket key
    const lastArr = last.match(/(\w+)\[(\d+)\]/);
    if (lastArr) {
      const arrKey = lastArr[1];
      const idx = parseInt(lastArr[2], 10);
      if (!cur[arrKey]) cur[arrKey] = [];
      cur[arrKey][idx] = value;
    } else {
      cur[last] = value;
    }
    setEditedTravel(newTravel);
  };

    const handleAddFlight = (tab: 'outbound' | 'return') => {
      if (!editedTravel) return;
      const newTravel = JSON.parse(JSON.stringify(editedTravel));
      const newFlight = {
        departureGroup: '',
        airline: '',
        flightNumber: '',
        departure: { code: '', airport: '', date: '', time: '' },
        arrival: { code: '', airport: '', time: '' }
      };
      const arrKey = tab === 'outbound' ? 'outboundFlights' : 'returnFlights';
      if (!newTravel[arrKey]) newTravel[arrKey] = [];
      newTravel[arrKey].push(newFlight);
      setEditedTravel(newTravel);
    };

    const handleDeleteFlight = (tab: 'outbound' | 'return', index: number) => {
      if (!editedTravel) return;
      setConfirmTitle('Conferma Eliminazione Volo');
      setConfirmMessage('Sei sicuro di eliminare questo volo? L\'operazione non può essere annullata.');
      setOnConfirmAction(() => () => {
        const newTravel = JSON.parse(JSON.stringify(editedTravel));
        const arrKey = tab === 'outbound' ? 'outboundFlights' : 'returnFlights';
        if (!newTravel[arrKey] || !Array.isArray(newTravel[arrKey])) return;
        newTravel[arrKey].splice(index, 1);
        setEditedTravel(newTravel);
        setConfirmOpen(false);
        setOnConfirmAction(null);
      });
      setConfirmOpen(true);
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dettagli viaggio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Torna all'elenco
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dettagli Viaggio</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
          >
            <span className="material-symbols-outlined mr-2">arrow_back</span>
            Torna all'elenco
          </button>
        </div>

        <div className="space-y-8">
          <SectionCard title="Sezione 1: Informazioni Base del Viaggio" actions={!isEditing ? (
            <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Modifica</button>
          ) : (
            <div className="space-x-2">
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salva</button>
              <button onClick={handleCancel} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Annulla</button>
            </div>
          )}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Nome del Viaggio *</label>
                  <input
                    readOnly={!isEditing}
                    value={isEditing ? (editedTrip?.eventDetails?.title || '') : (trip?.eventDetails?.title || '')}
                    onChange={(e) => updateEditedTrip('eventDetails.title', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sottotitolo</label>
                  <input
                    readOnly={!isEditing}
                    value={isEditing ? (editedTrip?.eventDetails?.subtitle || '') : (trip?.eventDetails?.subtitle || '')}
                    onChange={(e) => updateEditedTrip('eventDetails.subtitle', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrizione</label>
                <textarea
                  readOnly={!isEditing}
                  value={isEditing ? (editedTrip?.eventDetails?.overview?.description || '') : (trip?.eventDetails?.overview?.description || '')}
                  onChange={(e) => updateEditedTrip('eventDetails.overview.description', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2 h-28 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data di Inizio *</label>
                  <input
                    type={isEditing ? 'date' : 'text'}
                    readOnly={!isEditing}
                    value={
                      isEditing
                        ? (editedTrip?.eventDetails?.startDate || '')
                        : (trip?.eventDetails?.startDate ? formatDatePretty(trip.eventDetails.startDate) : '')
                    }
                    onChange={(e) => updateEditedTrip('eventDetails.startDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data di Fine *</label>
                  <input
                    type={isEditing ? 'date' : 'text'}
                    readOnly={!isEditing}
                    value={
                      isEditing
                        ? (editedTrip?.eventDetails?.endDate || '')
                        : (trip?.eventDetails?.endDate ? formatDatePretty(trip.eventDetails.endDate) : '')
                    }
                    onChange={(e) => updateEditedTrip('eventDetails.endDate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Scadenza Registrazione *</label>
                  <input
                    type={isEditing ? 'date' : 'text'}
                    readOnly={!isEditing}
                    value={
                      isEditing
                        ? (editedTrip?.eventDetails?.registrationDeadline || '')
                        : (trip?.eventDetails?.registrationDeadline ? formatDatePretty(trip.eventDetails.registrationDeadline) : '')
                    }
                    onChange={(e) => updateEditedTrip('eventDetails.registrationDeadline', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Immagine del Viaggio</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editedTrip?.eventDetails?.backgroundImageUrl || ''}
                      onChange={(e) => updateEditedTrip('eventDetails.backgroundImageUrl', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                      placeholder="URL immagine"
                    />
                  ) : (
                    <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      {trip?.eventDetails?.backgroundImageUrl ? (
                        <img src={trip.eventDetails.backgroundImageUrl} alt="Immagine del Viaggio" className="max-h-36 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-gray-400">Nessuna immagine</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo del Viaggio</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editedTrip?.eventDetails?.brandImageUrl || ''}
                      onChange={(e) => updateEditedTrip('eventDetails.brandImageUrl', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                      placeholder="URL logo"
                    />
                  ) : (
                    <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      {trip?.eventDetails?.brandImageUrl ? (
                        <img src={trip.eventDetails.brandImageUrl} alt="Logo del Viaggio" className="max-h-36 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-gray-400">Nessun logo</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Gruppi</label>
                <div className="flex flex-wrap gap-2">
                  {((isEditing ? (editedTrip?.eventDetails?.departureGroup || []) : (trip?.eventDetails?.departureGroup || [])) || []).map((g: string, i: number) => (
                    <span key={i} className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${g && String(g).toLowerCase() === 'vip' ? 'bg-yellow-100 text-yellow-900' : 'bg-gray-100 text-gray-800'}`}>
                      <span className="mr-2">{g}</span>
                      {isEditing ? (
                        <button type="button" className={`${g && String(g).toLowerCase() === 'vip' ? 'text-yellow-700 hover:text-yellow-900' : 'text-gray-500 hover:text-gray-700'}`} aria-label={`Remove ${g}`} onClick={() => {
                          const copy = JSON.parse(JSON.stringify(editedTrip || {}));
                          const arr = (copy.eventDetails = copy.eventDetails || {}).departureGroup || [];
                          const idx = arr.indexOf(g);
                          if (idx >= 0) {
                            arr.splice(idx, 1);
                            copy.eventDetails.departureGroup = arr;
                            setEditedTrip(copy);
                          }
                        }}>
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      ) : (
                        <div className="w-2" />
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-3 flex items-center space-x-2">
                    <input value={newGroupValue} onChange={(e) => setNewGroupValue(e.target.value)} placeholder="Nuovo gruppo" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                    <button onClick={() => {
                      const v = (newGroupValue || '').trim();
                      if (!v) return;
                      const copy = JSON.parse(JSON.stringify(editedTrip || {}));
                      if (!copy.eventDetails) copy.eventDetails = {};
                      if (!Array.isArray(copy.eventDetails.departureGroup)) copy.eventDetails.departureGroup = [];
                      // avoid duplicates
                      if (!copy.eventDetails.departureGroup.includes(v)) {
                        copy.eventDetails.departureGroup.push(v);
                        setEditedTrip(copy);
                      }
                      setNewGroupValue('');
                    }} className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded border border-blue-100 hover:bg-blue-100">
                      <span className="mr-2 text-lg font-bold">+</span> Aggiungi Gruppo
                    </button>
                  </div>
                )}
              </div>
              {/* Tipologia Camera chips */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipologia Camera</label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // read options from registrationForm config so new types (es. "Tripla") appear automatically
                    const logisticsSection = formConfig.find(s => s.id === 'logistics');
                    const roomField = logisticsSection?.fields?.find((f: any) => f.id === 'roomType');
                    const options: string[] = (roomField && Array.isArray(roomField.options)) ? roomField.options : ['Matrimoniale', 'Doppia uso singola', 'Doppia letti separati'];
                    return options.map((type) => {
                      const selected = isEditing
                        ? (editedTrip?.eventDetails?.roomType || []).includes(type)
                        : (trip?.eventDetails?.roomType || []).includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`px-3 py-1 rounded-full text-sm border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-800 border-gray-300'} transition`}
                          disabled={!isEditing}
                          onClick={() => {
                            if (!isEditing) return;
                            const copy = JSON.parse(JSON.stringify(editedTrip || {}));
                            if (!copy.eventDetails) copy.eventDetails = {};
                            if (!Array.isArray(copy.eventDetails.roomType)) copy.eventDetails.roomType = [];
                            const arr = copy.eventDetails.roomType;
                            if (arr.includes(type)) {
                              copy.eventDetails.roomType = arr.filter((t: string) => t !== type);
                            } else {
                              copy.eventDetails.roomType = [...arr, type];
                            }
                            setEditedTrip(copy);
                          }}
                        >
                          {type}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
              {/* Companion toggle */}
              <div className="mt-4">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" checked={isEditing ? !!editedTrip?.eventDetails?.allowCompanion : !!trip?.eventDetails?.allowCompanion} onChange={(e) => {
                    if (!isEditing) return;
                    const copy = JSON.parse(JSON.stringify(editedTrip || {}));
                    if (!copy.eventDetails) copy.eventDetails = {};
                    copy.eventDetails.allowCompanion = e.target.checked;
                    setEditedTrip(copy);
                  }} className="h-4 w-4 text-blue-600 bg-white border-gray-200 rounded" />
                  <span className="text-sm font-medium text-gray-700">Aggiungi accompagnatore</span>
                </label>
              </div>
              {/* Business flights toggle */}
              <div className="mt-4">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" checked={isEditing ? !!editedTrip?.eventDetails?.allowBusiness : !!trip?.eventDetails?.allowBusiness} onChange={(e) => {
                    if (!isEditing) return;
                    const copy = JSON.parse(JSON.stringify(editedTrip || {}));
                    if (!copy.eventDetails) copy.eventDetails = {};
                    copy.eventDetails.allowBusiness = e.target.checked;
                    setEditedTrip(copy);
                  }} className="h-4 w-4 text-blue-600 bg-white border-gray-200 rounded" />
                  <span className="text-sm font-medium text-gray-700">Voli Business</span>
                </label>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={"Sezione 2: ✈️ Travel Info (Informazioni Viaggio)"} actions={!isEditingTravel ? (
            <button onClick={handleEditTravel} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Modifica</button>
          ) : (
            <div className="space-x-2">
              <button onClick={handleSaveTravel} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salva</button>
              <button onClick={handleCancelTravel} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Annulla</button>
            </div>
          )}>
            {travelInfo ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="border-b">
                      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('outbound')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'outbound' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}>
                          Voli di Andata
                        </button>
                        <button onClick={() => setActiveTab('return')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'return' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}>
                          Voli di Ritorno
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>

                {/* Callout */}
                {(() => {
                  const info = activeTab === 'outbound' ? (isEditingTravel ? editedTravel?.outboundFlightInfo : travelInfo.outboundFlightInfo) : (isEditingTravel ? editedTravel?.returnFlightInfo : travelInfo.returnFlightInfo);
                  if (!info || (!info.title && !info.content)) return null;
                  return (
                    <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-100 text-blue-800">
                      {info.title && <div className="font-semibold mb-2 text-lg">{info.title}</div>}
                      {info.content && (
                        isEditingTravel ? (
                          <textarea value={info.content} onChange={(e) => updateEditedTravel(`${activeTab}FlightInfo.content`, e.target.value)} className="w-full mt-1 rounded-md border-gray-200 p-2 h-24" />
                        ) : (
                          <div className="text-base whitespace-pre-line">{info.content}</div>
                        )
                      )}
                    </div>
                  );
                })()}

                {/* Flights list */}
                <div className="mt-6 space-y-4">
                  {((activeTab === 'outbound' ? (isEditingTravel ? (editedTravel?.outboundFlights || []) : (travelInfo.outboundFlights || [])) : (isEditingTravel ? (editedTravel?.returnFlights || []) : (travelInfo.returnFlights || [])))).map((f: any, idx: number) => (
                    <div key={idx} className="bg-white border rounded-lg p-4 relative">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-3">
                        <div>
                          <label className="text-xs text-gray-600">Gruppo Partenza</label>
                          <select
                            disabled={!isEditingTravel}
                            value={isEditingTravel ? (f.departureGroup || f.group || '') : (f.departureGroup || f.group || '')}
                            onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].departureGroup`, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2"
                          >
                            <option value="">Seleziona gruppo</option>
                            {(isEditing ? editedTrip?.eventDetails?.departureGroup : trip?.eventDetails?.departureGroup)?.map((g: string) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Compagnia Aerea</label>
                          <input readOnly={!isEditingTravel} value={isEditingTravel ? (f.airline || '') : (f.airline || '')} onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].airline`, e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Numero Volo</label>
                          <input readOnly={!isEditingTravel} value={isEditingTravel ? (f.flightNumber || '') : (f.flightNumber || '')} onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].flightNumber`, e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-center">
                        <div>
                          <label className="text-xs text-gray-600">Aeroporto Partenza</label>
                          <input readOnly={!isEditingTravel} value={isEditingTravel ? (f.departure?.airport || '') : (f.departure?.airport || '')} onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].departure.airport`, e.target.value)} placeholder="e.g. Milano Malpensa (MXP)" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Aeroporto Arrivo</label>
                          <input readOnly={!isEditingTravel} value={isEditingTravel ? (f.arrival?.airport || '') : (f.arrival?.airport || '')} onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].arrival.airport`, e.target.value)} placeholder="e.g. Abu Dhabi (AUH)" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Data Partenza</label>
                          <input type={isEditingTravel ? 'date' : 'text'} readOnly={!isEditingTravel} value={isEditingTravel ? (f.departure?.date || '') : (f.departure?.date ? formatDatePretty(f.departure.date) : '')} onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].departure.date`, e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Ora Partenza</label>
                          <input type={isEditingTravel ? 'time' : 'text'} readOnly={!isEditingTravel} value={isEditingTravel ? (f.departure?.time || '') : (f.departure?.time || '')} onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].departure.time`, e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Ora Arrivo</label>
                          <input type={isEditingTravel ? 'time' : 'text'} readOnly={!isEditingTravel} value={isEditingTravel ? (f.arrival?.time || '') : (f.arrival?.time || '')} onChange={(e) => updateEditedTravel(`${activeTab}Flights[${idx}].arrival.time`, e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                        </div>
                      </div>
                      {isEditingTravel && (
                        <button onClick={() => handleDeleteFlight(activeTab, idx)} className="absolute right-3 top-3 p-2 rounded-full bg-gray-100 hover:bg-red-100 text-red-600" title="Elimina Volo">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditingTravel && (
                    <div className="mt-3">
                      <button onClick={() => handleAddFlight(activeTab)} className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded border border-blue-100 hover:bg-blue-100">
                        <span className="mr-2 text-lg font-bold">+</span> Aggiungi Volo {activeTab === 'outbound' ? 'di Andata' : 'di Ritorno'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Nessuna informazione di viaggio disponibile</p>
            )}
          </SectionCard>

          <SectionCard title="Sezione 3: Contatti di Emergenza e Sicurezza" actions={
            <div className="ml-4 flex items-center space-x-3">
              <button onClick={handleImportGoogleSheets} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center">
                <span className="material-symbols-outlined mr-2">check</span> Importa da Google Sheets
              </button>
              {!isEditingEmergency ? (
                <button onClick={handleEditEmergency} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Modifica</button>
              ) : (
                <div className="space-x-2">
                  <button onClick={handleSaveEmergency} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salva</button>
                  <button onClick={handleCancelEmergency} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Annulla</button>
                </div>
              )}
            </div>
          }>
            <div className="mt-4 space-y-4">
              {(isEditingEmergency ? (editedEmergency || []) : (travelInfo?.emergencyContacts || [])).map((c: any, idx: number) => (
                <div key={idx} className="bg-white border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                    <div>
                      <label className="text-xs text-gray-600">Gruppo Partenza</label>
                      {/* build departure group options from outboundFlights (deduped) */}
                      {(() => {
                        const flights = isEditingTravel ? (editedTravel?.outboundFlights || []) : (travelInfo?.outboundFlights || []);
                        const groups = Array.from(new Set((flights || []).map((f: any) => f.departureGroup || '').filter(Boolean)));
                        const departureGroups = isEditing ? (editedTrip?.eventDetails?.departureGroup || []) : (trip?.eventDetails?.departureGroup || []);
                        return isEditingEmergency ? (
                          <select value={c.departureGroup || ''} onChange={(e) => updateEditedEmergency(idx, 'departureGroup', e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">
                            <option value="">-- Seleziona Gruppo --</option>
                            {departureGroups.map((g: string) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">{c.departureGroup || ''}</div>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Nome Contatto</label>
                      <input readOnly={!isEditingEmergency} value={isEditingEmergency ? (c.name || c.contactName || '') : (c.name || c.contactName || '')} onChange={(e) => updateEditedEmergency(idx, 'name', e.target.value)} placeholder="Nome Cognome" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Categoria</label>
                      <input readOnly={!isEditingEmergency} value={isEditingEmergency ? (c.type || '') : (c.type || '')} onChange={(e) => updateEditedEmergency(idx, 'type', e.target.value)} placeholder="Categoria" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Telefono</label>
                      <input readOnly={!isEditingEmergency} value={isEditingEmergency ? (c.phone || '') : (c.phone || '')} onChange={(e) => updateEditedEmergency(idx, 'phone', e.target.value)} placeholder="+39 123 4567" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Email</label>
                      <input readOnly={!isEditingEmergency} value={isEditingEmergency ? (c.email || '') : (c.email || '')} onChange={(e) => updateEditedEmergency(idx, 'email', e.target.value)} placeholder="m.rossi@example.com" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                    </div>
                    <div className="flex items-start justify-end">
                      {isEditingEmergency ? (
                        <button onClick={() => handleDeleteContact(idx)} className="p-2 rounded-full bg-gray-100 hover:bg-red-100 text-red-600" title="Elimina Contatto">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isEditingEmergency && (
                <div>
                  <button onClick={handleAddContact} className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded border border-blue-100 hover:bg-blue-100">
                    <span className="mr-2 text-lg font-bold">+</span> Aggiungi Contatto
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title={"Sezione 4: Agenda (Programma Viaggio)"} actions={!isEditingAgenda ? (
            <button onClick={handleEditAgenda} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Modifica</button>
          ) : (
            <div className="space-x-2">
              <button onClick={handleSaveAgenda} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salva</button>
              <button onClick={handleCancelAgenda} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Annulla</button>
            </div>
          )}>
            <div className="mt-2">
              {((isEditingAgenda ? (editedAgenda || []) : (trip?.agenda || []))).length === 0 ? (
                <p className="text-gray-600">Nessuna agenda disponibile</p>
              ) : (
                <div className="space-y-4">
                  {((isEditingAgenda ? (editedAgenda || []) : (trip?.agenda || []))).map((day: any, dayIndex: number) => (
                    <div key={dayIndex} className="bg-white border rounded-lg p-4 relative">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-1">
                          <label className="text-xs text-gray-600">Giorno</label>
                          <div className="mt-1">
                            {isEditingAgenda ? (
                              <input value={String(day.day || dayIndex + 1)} onChange={(e) => updateEditedAgendaDay(dayIndex, 'day', Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                            ) : (
                              <div className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">{day.day}</div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-xs text-gray-600">Data</label>
                          <div className="mt-1">
                            {isEditingAgenda ? (
                              <input type="date" value={day.date || ''} onChange={(e) => updateEditedAgendaDay(dayIndex, 'date', e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                            ) : (
                              <div className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">{day.date ? formatDatePretty(day.date) : 'N/A'}</div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-6">
                          <label className="text-xs text-gray-600">Titolo del Giorno</label>
                          <div className="mt-1">
                            {isEditingAgenda ? (
                              <input value={day.title || ''} onChange={(e) => updateEditedAgendaDay(dayIndex, 'title', e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                            ) : (
                              <div className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">{day.title}</div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          {isEditingAgenda ? (
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleDeleteAgendaDay(dayIndex)} className="px-3 py-1 bg-red-50 text-red-700 rounded border border-red-100">Elimina Giorno</button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3">
                        {((day.items || [])).length === 0 ? (
                          <p className="text-sm text-gray-500">Nessun evento programmato per questo giorno</p>
                        ) : (
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-700">Eventi del giorno:</h4>
                            <div className="space-y-2">
                              {(day.items || []).map((item: any, itemIndex: number) => (
                                <div key={itemIndex} className="bg-gray-50 p-3 rounded-md border">
                                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                                    <div className="md:col-span-1">
                                      <label className="text-xs text-gray-600">Ora</label>
                                      {isEditingAgenda ? (
                                        <input value={item.time || ''} onChange={(e) => updateEditedAgendaItem(dayIndex, itemIndex, 'time', e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                                      ) : (
                                        <div className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">{item.time || 'N/A'}</div>
                                      )}
                                    </div>
                                    <div className="md:col-span-3">
                                      <label className="text-xs text-gray-600">Titolo</label>
                                      {isEditingAgenda ? (
                                        <input value={item.title || ''} onChange={(e) => updateEditedAgendaItem(dayIndex, itemIndex, 'title', e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                                      ) : (
                                        <div className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">{item.title}</div>
                                      )}
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="text-xs text-gray-600">Descrizione</label>
                                      {isEditingAgenda ? (
                                        <input value={item.description || ''} onChange={(e) => updateEditedAgendaItem(dayIndex, itemIndex, 'description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2" />
                                      ) : (
                                        <div className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 text-gray-700 p-2">{item.description}</div>
                                      )}
                                    </div>
                                    <div className="flex items-start justify-end md:col-span-1">
                                      {isEditingAgenda ? (
                                        <button onClick={() => handleDeleteAgendaItem(dayIndex, itemIndex)} className="p-2 rounded-full bg-gray-100 hover:bg-red-100 text-red-600" title="Elimina Evento">
                                          <span className="material-symbols-outlined">delete</span>
                                        </button>
                                      ) : (
                                        <div className="w-8" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {isEditingAgenda && (
                          <div className="mt-3">
                            <button onClick={() => handleAddAgendaItem(dayIndex)} className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded border border-blue-100 hover:bg-blue-100">
                              <span className="mr-2 text-lg font-bold">+</span> Aggiungi Evento
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isEditingAgenda && (
                    <div>
                      <button onClick={handleAddAgendaDay} className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded border border-blue-100 hover:bg-blue-100">
                        <span className="mr-2 text-lg font-bold">+</span> Aggiungi Giorno
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="📝 Registrations (Registrazioni)">
            <div className="mb-4">
              <strong>Totale Registrazioni:</strong> {registrations.length}
            </div>
            {registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Invio</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((reg: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {reg.userId?.firstName} {reg.userId?.lastName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {reg.userId?.email}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            reg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            reg.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {reg.submittedAt ? formatDatePretty(reg.submittedAt) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">Nessuna registrazione disponibile</p>
            )}
          </SectionCard>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => {
          if (onConfirmAction) {
            // call the stored action (may be async)
            const fn = onConfirmAction;
            try {
              // if it returns a promise, let it handle modal closing; otherwise close here
              const res = (fn as any)();
              if (!(res instanceof Promise)) {
                setConfirmOpen(false);
                setOnConfirmAction(null);
              }
            } catch (e) {
              console.error('Error executing confirm action', e);
              setConfirmOpen(false);
              setOnConfirmAction(null);
            }
          } else {
            setConfirmOpen(false);
          }
        }}
        onCancel={() => { setConfirmOpen(false); setOnConfirmAction(null); }}
      />
    </div>
  );
};

export default AdminTripDetailsPage;
