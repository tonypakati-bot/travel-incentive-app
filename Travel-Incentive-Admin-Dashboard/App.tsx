import React, { useState } from 'react';
import { useToast } from './contexts/ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Trip from './components/Trip';
import CreateTrip from './components/CreateTrip';
import Communications from './components/Communications';
import CreateCommunication from './components/CreateCommunication';
import Forms, { Form } from './components/Forms';
import CreateForm from './components/CreateForm';
import ManageParticipants from './components/ManageParticipants';
import ManageContacts from './components/ManageContacts';
import Reports from './components/Reports';
import PrivacyPolicy, { initialPrivacyDocuments, PrivacyDocument } from './components/PrivacyPolicy';
import TermsConditions, { initialDocuments, TermsDocument } from './components/TermsConditions';
import SendReminderModal from './components/SendReminderModal';
import SendInvitesModal from './components/SendInvitesModal';
import Documents from './components/Documents';
import UsefulInformations, { initialInformations, UsefulInfoEntry } from './components/UsefulInformations';
import Invites, { Invite } from './components/Invites';
import { Contact } from './components/AddContactModal';

const initialContacts: Contact[] = [
  { id: 1, firstName: 'Mario', lastName: 'Rossi', category: 'Tour Leader', phone: '+39 123 456789', email: 'm.rossi@example.com', notes: 'Referente h24 per il gruppo Milano' },
  { id: 2, firstName: 'Laura', lastName: 'Verdi', category: 'Assistenza Aeroportuale', phone: '+39 987 654321', email: 'l.verdi@example.com', notes: 'Presente in aeroporto Malpensa per partenze e arrivi' },
  { id: 3, firstName: 'Giuseppe', lastName: 'Bianchi', category: 'Assistenza Hotel', phone: '+39 456 123789', email: 'g.bianchi@example.com', notes: 'Contatto in hotel per check-in e check-out' },
];

const initialForms: Form[] = [
    { id: 1, name: 'Dietary Restrictions & Allergies', trip: 'Trip to Ibiza', responses: '65/80' },
    { id: 2, name: 'Activity Preferences', trip: 'Sales Kick-off Dubai', responses: '80/85' },
    { id: 3, name: 'Post-Trip Feedback', trip: 'Team Retreat Mykonos', responses: '145/150' },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [tripFormMode, setTripFormMode] = useState<'hidden' | 'create' | 'edit'>('hidden');
  const [isCommFormVisible, setIsCommFormVisible] = useState(false);
  const [formFormMode, setFormFormMode] = useState<'hidden' | 'create' | 'edit'>('hidden');
  const [commInitialType, setCommInitialType] = useState<'information' | 'alert' | undefined>(undefined);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderParticipantCount, setReminderParticipantCount] = useState(0);
  const [onReminderSentCallback, setOnReminderSentCallback] = useState<(() => void) | null>(null);

  const [isInvitesModalOpen, setIsInvitesModalOpen] = useState(false);
  const [invitesModalData, setInvitesModalData] = useState<{ tripName: string; inviteeCount: number; emailBody?: string } | null>(null);
  
  const [usefulInformations, setUsefulInformations] = useState<UsefulInfoEntry[]>(initialInformations);
  const [termsDocuments, setTermsDocuments] = useState<TermsDocument[]>(initialDocuments);
  const [privacyDocuments, setPrivacyDocuments] = useState<PrivacyDocument[]>(initialPrivacyDocuments);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [forms, setForms] = useState<Form[]>(initialForms);
  const [invitesTemplates, setInvitesTemplates] = useState<Invite[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  const toast = useToast();

  React.useEffect(() => {
    // Load invites and participants from API
    const load = async () => {
      try {
        const [invRes, partsRes] = await Promise.all([
          fetch('http://localhost:5001/api/invites'),
          fetch('http://localhost:5001/api/participants')
        ]);
        if (invRes.ok) {
          const inv = await invRes.json();
          // Normalize server objects (_id) into `id` (string) so components can work uniformly
          setInvitesTemplates(inv.map((x: any) => ({ ...x, id: x._id ?? x.id })));
        }
        if (partsRes.ok) {
          const p = await partsRes.json();
          setParticipants(p.map((x: any) => ({ ...x, id: x._id ?? x.id })));
        }
      } catch (e) {
        console.error('Error loading admin data', e);
      }
    };
    load();
    // Dev-only: if URL contains __test/invites/create, open Invites create view
    try {
      // Only run this shortcut in development builds
      // eslint-disable-next-line no-undef
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.includes('__test/invites/create')) {
        setActiveView('invites');
        // open create view inside Invites by setting a small timeout to allow component mount
        setTimeout(() => {
          // We cheat by triggering a synthetic click on any create button after render
          try {
            const el = document.querySelector('[data-testid="create-invite"]');
            if (el) (el as HTMLElement).click();
          } catch (e) {}
        }, 200);
      }
    } catch (e) {}
  }, []);


  // Trip form handlers
  const handleCreateTrip = () => setTripFormMode('create');
  const handleEditTrip = () => setTripFormMode('edit');
  const handleCloseTripForm = () => setTripFormMode('hidden');
  const handleSaveTripForm = () => {
    // Logic to save the new/edited trip would go here
    setTripFormMode('hidden');
  };

  // Communication form handlers
  const handleCreateCommunication = (initialType?: 'information' | 'alert') => {
    setCommInitialType(initialType);
    setIsCommFormVisible(true);
  };
  const handleCloseCommForm = () => {
    setIsCommFormVisible(false);
    setCommInitialType(undefined);
  };
  const handleSaveCommForm = () => {
    // Logic to save/send communication would go here
    setIsCommFormVisible(false);
    setCommInitialType(undefined);
  };
  
  // Form handlers
  const handleCreateForm = () => setFormFormMode('create');
  const handleCloseForm = () => setFormFormMode('hidden');
  const handleSaveForm = () => {
    // Logic to save form would go here
    setFormFormMode('hidden');
  };

  // Invites handlers
    const handleSaveInvite = async (invite: Invite) => {
      try {
        const exists = invitesTemplates.some(i => String(i.id) === String(invite.id));
        if (!exists) {
          // Create
          const res = await fetch('http://localhost:5001/api/invites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invite),
          });
          if (!res.ok) throw new Error('Create invite failed');
          const created = await res.json();
          const normalized = { ...created, id: created._id ?? created.id };
          setInvitesTemplates(prev => [normalized, ...prev]);
        } else {
          // Update
          const id = String(invite.id);
          const res = await fetch(`http://localhost:5001/api/invites/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invite),
          });
          if (!res.ok) throw new Error('Update invite failed');
          const updated = await res.json();
          const normalized = { ...updated, id: updated._id ?? updated.id };
          setInvitesTemplates(prev => prev.map(i => String(i.id) === String(normalized.id) ? normalized : i));
        }
      } catch (err) {
        console.error('Invite save error', err);
        toast.showToast('Errore durante il salvataggio del template. Vedi console per dettagli.', 'error');
      }
    };

  const handleDeleteInvite = async (id: string | number) => {
      try {
        const sid = String(id);
        const res = await fetch(`http://localhost:5001/api/invites/${sid}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error('Delete failed');
        setInvitesTemplates(prev => prev.filter(i => String(i.id) !== sid));
      } catch (err) {
        console.error('Invite delete error', err);
        toast.showToast('Errore durante la cancellazione del template. Vedi console per dettagli.', 'error');
      }
  };

  // Reminder modal handlers
  const handleOpenReminderModal = (count: number, onSent?: () => void) => {
    setReminderParticipantCount(count);
    if (onSent) {
      setOnReminderSentCallback(() => onSent);
    }
    setIsReminderModalOpen(true);
  };

  const handleCloseReminderModal = () => {
    setIsReminderModalOpen(false);
    setReminderParticipantCount(0);
    setOnReminderSentCallback(null);
  };

  const handleSendReminder = (subject: string, body: string) => {
    toast.showToast(`Invio del promemoria a ${reminderParticipantCount} partecipanti in corso... Oggetto: ${subject}`, 'info');
    if (onReminderSentCallback) {
      onReminderSentCallback();
    }
    handleCloseReminderModal();
  };

  // Invites modal handlers
  const handleOpenInvitesModal = (tripName: string, inviteeCount: number) => {
    const template = invitesTemplates.find(i => i.tripName === tripName);
    setInvitesModalData({ 
        tripName, 
        inviteeCount, 
        emailBody: template ? template.body : undefined 
    });
    setIsInvitesModalOpen(true);
  };

  const handleCloseInvitesModal = () => {
    setIsInvitesModalOpen(false);
    setInvitesModalData(null);
  };

  const handleConfirmSendInvites = async (emailBody: string, saveAsTemplate?: boolean) => {
    if (!invitesModalData) return;
    const { tripName, inviteeCount } = invitesModalData;
    try {
      // Call send endpoint
      const res = await fetch('http://localhost:5001/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripName, emailBody }),
      });
      if (!res.ok) throw new Error('Send failed');
      const summary = await res.json();
      // Show toast
      toast.showToast(`Invio completato: ${summary.sent} inviati, ${summary.failed} falliti`, 'success');

      // Optionally save template
      if (saveAsTemplate) {
        try {
          const tRes = await fetch('http://localhost:5001/api/invites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripName, body: emailBody }),
          });
          if (tRes.ok) {
            const created = await tRes.json();
            setInvitesModalData(prev => prev ? { ...prev, emailBody } : prev);
            setInvitesTemplates(prev => [{ ...created, id: created._id ?? created.id }, ...prev]);
          }
        } catch (e) {
          console.error('Save template error', e);
        }
      }

      // Update local participants to 'Invited'
      try {
        setParticipants(prev => prev.map(p => p.trip === tripName ? { ...p, status: 'Invited' } : p));
        // Optionally call backend to persist status (not mandatory)
        await fetch(`http://localhost:5001/api/participants/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripName, status: 'Invited' }),
        });
      } catch (e) {
        console.error('Update participants status failed', e);
      }

    } catch (err) {
      console.error('Error sending invites', err);
      toast.showToast('Errore durante l\'invio degli inviti. Vedi console per dettagli.', 'error');
    } finally {
      handleCloseInvitesModal();
    }
  };


  const handleSetView = (view: string) => {
    setTripFormMode('hidden');
    setIsCommFormVisible(false); // Reset comm form on view change
    setFormFormMode('hidden'); // Reset form creator on view change
    setActiveView(view);
  };

  // Participants handlers (create/update/delete via API)
  const handleSaveParticipant = async (participant: any) => {
    try {
      const exists = participants.some(p => String(p.id) === String(participant.id));
      if (!exists) {
        const promise = fetch('http://localhost:5001/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(participant),
        }).then(async res => {
          if (!res.ok) throw new Error('Create participant failed');
          const created = await res.json();
          setParticipants(prev => [{ ...created, id: created._id ?? created.id }, ...prev]);
          return created;
        });
        return promise;
      } else {
        const id = String(participant.id);
        const promise = fetch(`http://localhost:5001/api/participants/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(participant),
        }).then(async res => {
          if (!res.ok) throw new Error('Update participant failed');
          const updated = await res.json();
          setParticipants(prev => prev.map(p => String(p.id) === String(updated._id ?? updated.id) ? { ...updated, id: updated._id ?? updated.id } : p));
          return updated;
        });
        return promise;
      }
    } catch (err) {
      console.error('Participant save error', err);
      toast.showToast('Errore durante il salvataggio del partecipante. Vedi console.', 'error');
    }
  };

  const handleDeleteParticipant = async (id: string | number) => {
    try {
      const sid = String(id);
      const res = await fetch(`http://localhost:5001/api/participants/${sid}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Delete participant failed');
      setParticipants(prev => prev.filter(p => String(p.id) !== sid));
    } catch (err) {
      console.error('Participant delete error', err);
      toast.showToast('Errore durante la cancellazione del partecipante. Vedi console.', 'error');
    }
  };

  // Participant handlers are passed via props into ManageParticipants to avoid globals.

  const renderContent = () => {
    if (tripFormMode !== 'hidden') {
      return <CreateTrip onCancel={handleCloseTripForm} onSave={handleSaveTripForm} isEditing={tripFormMode === 'edit'} />;
    }

    if (isCommFormVisible) {
      return <CreateCommunication onCancel={handleCloseCommForm} onSave={handleSaveCommForm} initialType={commInitialType} />;
    }

    if (formFormMode !== 'hidden') {
      return <CreateForm onCancel={handleCloseForm} onSave={handleSaveForm} />;
    }
    
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onCreateTrip={handleCreateTrip} onCreateCommunication={handleCreateCommunication} onSendReminder={handleOpenReminderModal} onSendInvites={handleOpenInvitesModal} />;
      case 'manage-trip':
        return <Trip onCreateTrip={handleCreateTrip} onEditTrip={handleEditTrip} onCreateCommunication={handleCreateCommunication} />;
      case 'manage-contacts':
        return <ManageContacts contacts={contacts} setContacts={setContacts} />;
      case 'manage-participants':
        return <ManageParticipants participants={participants} onSendReminder={handleOpenReminderModal} onSendInvite={handleOpenInvitesModal} onSaveParticipant={handleSaveParticipant} onDeleteParticipant={handleDeleteParticipant} />;
      case 'invites':
        return <Invites invites={invitesTemplates} onSave={handleSaveInvite} onDelete={handleDeleteInvite} />;
      case 'communications':
        return <Communications onCreateCommunication={handleCreateCommunication} />;
      case 'useful-informations':
        return <UsefulInformations informations={usefulInformations} setInformations={setUsefulInformations} />;
      case 'forms':
        return <Forms onCreateForm={handleCreateForm} forms={forms} />;
      case 'privacy-policy':
        return <PrivacyPolicy documents={privacyDocuments} setDocuments={setPrivacyDocuments} />;
      case 'terms-conditions':
        return <TermsConditions documents={termsDocuments} setDocuments={setTermsDocuments} />;
      case 'documents':
        return <Documents />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard onCreateTrip={handleCreateTrip} onCreateCommunication={handleCreateCommunication} onSendReminder={handleOpenReminderModal} onSendInvites={handleOpenInvitesModal} />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <Sidebar activeView={activeView} setActiveView={handleSetView} />
      <main className="flex-1 h-screen overflow-y-auto">
        {renderContent()}
      </main>
      <SendReminderModal
        isOpen={isReminderModalOpen}
        onClose={handleCloseReminderModal}
        onSend={handleSendReminder}
        participantCount={reminderParticipantCount}
      />
      <SendInvitesModal
        isOpen={isInvitesModalOpen}
        onClose={handleCloseInvitesModal}
        onSend={handleConfirmSendInvites}
        tripName={invitesModalData?.tripName || ''}
        inviteeCount={invitesModalData?.inviteeCount || 0}
        initialBody={invitesModalData?.emailBody}
      />
    </div>
  );
};

export default App;