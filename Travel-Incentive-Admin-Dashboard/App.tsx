import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/ToastContext';
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
import PrivacyPolicy, { PrivacyDocument } from './components/PrivacyPolicy';
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

const AppContent: React.FC = () => {
  // DEV helper: rewrite absolute backend URLs to relative paths so Vite proxy handles them
  // This prevents CORS issues when code still contains `http://localhost:5001/...`.
  try {
    if (typeof window !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) {
      const w: any = window;
      if (!w.__FETCH_REWRITTEN) {
        const _fetch = w.fetch.bind(w);
        w.fetch = (input: any, init?: any) => {
          try {
            const orig = typeof input === 'string' ? input : (input && input.url) || '';
            if (typeof orig === 'string' && orig.startsWith('http://localhost:5001')) {
              const newUrl = orig.replace('http://localhost:5001', '');
              if (typeof input === 'string') input = newUrl;
              else if (input && input.url) input = new Request(newUrl, input);
            }
          } catch (e) {
            // silence
          }
          return _fetch(input, init);
        };
        w.__FETCH_REWRITTEN = true;
      }
    }
  } catch (e) {
    // ignore in production or unsupported environments
  }
  const [activeView, setActiveView] = useState('dashboard');
  const [tripFormMode, setTripFormMode] = useState<'hidden' | 'create' | 'edit'>('hidden');
  const [isCommFormVisible, setIsCommFormVisible] = useState(false);
  const [formFormMode, setFormFormMode] = useState<'hidden' | 'create' | 'edit'>('hidden');
  const [editingFormData, setEditingFormData] = useState<any | null>(null);
  const [commInitialType, setCommInitialType] = useState<'information' | 'alert' | undefined>(undefined);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderParticipantCount, setReminderParticipantCount] = useState(0);
  const [onReminderSentCallback, setOnReminderSentCallback] = useState<(() => void) | null>(null);

  const [isInvitesModalOpen, setIsInvitesModalOpen] = useState(false);
  const [invitesModalData, setInvitesModalData] = useState<{ tripName: string; inviteeCount: number; emailBody?: string } | null>(null);
  
  const [usefulInformations, setUsefulInformations] = useState<UsefulInfoEntry[]>(initialInformations);
  const [termsDocuments, setTermsDocuments] = useState<TermsDocument[]>(initialDocuments);
  const [privacyDocuments, setPrivacyDocuments] = useState<PrivacyDocument[]>([]);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [forms, setForms] = useState<Form[]>(initialForms);
  const [invitesTemplates, setInvitesTemplates] = useState<Invite[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  const toast = useToast();

  // If URL contains /manage-trip or /manage-trips with ?tripId=..., fetch trip and open editor
  useEffect(() => {
    try {
      const { pathname, search } = window.location;
      const lower = (pathname || '').toLowerCase();
      const params = new URLSearchParams(search || '');
      const tripId = params.get('tripId') || params.get('id');
      if (lower.includes('manage-trip') || lower.includes('manage-trips')) {
        setActiveView('manage-trip');
        if (tripId) {
          (async () => {
            try {
              const res = await fetch(`/api/trips/${tripId}`);
              if (!res.ok) return;
              const json = await res.json();
              const normalized = { ...(json || {}), tripId: json.tripId || json._id || json.id || tripId };
              try { (window as any).__E2E_injectedTrip = normalized; } catch (e) {}
              // If CreateTrip exposed a setter, call it so component receives the trip immediately
              try { if ((window as any).__E2E_setTripDraft) (window as any).__E2E_setTripDraft(normalized); } catch (e) {}
              setTripFormMode('edit');
            } catch (e) {
              console.warn('Failed loading trip from URL', e);
            }
          })();
        }
      }
    } catch (e) {}
  }, []);

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
      // Load forms from server (names come from DB; trip and responses remain placeholders until backend provides them)
      try {
        const formsRes = await fetch('http://localhost:5001/api/forms');
        if (formsRes.ok) {
          const data = await formsRes.json();
          const items = data.items || data;
          setForms(items.map((f: any) => ({ id: f._id ?? f.id, name: f.title || f.name || 'Untitled Form', description: f.description || '', trip: '—', responses: '—', status: f.status || 'draft' })));
        }
      } catch (e) {
        console.error('Error loading forms', e);
      }
        try {
          // Load privacy policies from server so UI shows DB content instead of local initial values
          const ppRes = await fetch('http://localhost:5001/api/privacy-policies');
          if (ppRes.ok) {
            const policies = await ppRes.json();
            setPrivacyDocuments(policies.map((p: any) => ({
              id: p._id ?? p.id,
              title: p.title,
              trip: p.trip ?? null,
              content: p.content || ''
            })));
          }
          } catch (e) {
            console.error('Error loading privacy policies', e);
          }
          try {
            // Load useful informations summary from server (lightweight)
            const uiRes = await fetch('http://localhost:5001/api/useful-informations/summary');
            if (uiRes.ok) {
              const data = await uiRes.json();
              // Backward compatibility: API may return either an array, an object with `items`, or a single item
              let items: any[] = [];
              if (Array.isArray(data)) items = data;
              else if (data && Array.isArray(data.items)) items = data.items;
              else if (data && data.items) items = [data.items];
              else if (data) items = [data];

              setUsefulInformations(items.map((u: any) => ({
                id: u._id ?? u.id ?? String(Math.random()).slice(2),
                destinationName: u.title || '',
                country: '',
                dateAdded: u.createdAt ? new Date(u.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '') : '',
                fullData: u
              })));
            }
          } catch (e) {
            console.error('Error loading useful informations', e);
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

  React.useEffect(() => {
    const openHandler = () => setFormFormMode('create');
    const changedHandler = (e: any) => {
      try {
        const saved = e?.detail?.created;
        if (saved) handleCreateOrUpdateFormSaved(saved);
      } catch (err) {
        console.error('forms:changed handler error', err);
      }
    };
    try {
      window.addEventListener('forms:openCreate', openHandler);
      window.addEventListener('forms:changed', changedHandler as EventListener);
    } catch (e) {
      /* ignore */
    }
    return () => {
      try {
        window.removeEventListener('forms:openCreate', openHandler);
        window.removeEventListener('forms:changed', changedHandler as EventListener);
      } catch (e) {
        /* ignore */
      }
    };
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

  const handleEditForm = async (id: string | number) => {
    try {
      const sid = String(id);
      const res = await fetch(`http://localhost:5001/api/forms/${sid}`);
      if (!res.ok) throw new Error('Fetch form failed');
      const data = await res.json();
      setEditingFormData(data);
      setFormFormMode('edit');
    } catch (err) {
      console.error('Load form for edit failed', err);
      toast.push('Impossibile caricare il form per la modifica.', 'error');
    }
  };

  const handleDeleteForm = async (id: string | number) => {
    try {
      const sid = String(id);
      const res = await fetch(`http://localhost:5001/api/forms/${sid}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Delete failed');
      setForms(prev => prev.filter(f => String(f.id) !== sid));
      toast.push('Form eliminato.', 'success');
    } catch (err) {
      console.error('Delete form error', err);
      toast.push('Errore durante la cancellazione del form.', 'error');
    }
  };

  const handleCloneForm = async (id: string | number) => {
    try {
      const sid = String(id);
      const res = await fetch(`http://localhost:5001/api/forms/${sid}`);
      if (!res.ok) throw new Error('Fetch form failed');
      const data = await res.json();
      // Prepare clone payload
      const payload = {
        title: `${data.title || data.name || 'Untitled Form'} (copy)`,
        description: data.description || data.desc || '',
        sections: data.sections || [],
        status: 'draft'
      };
      const createRes = await fetch('http://localhost:5001/api/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!createRes.ok) throw new Error('Clone failed');
      const created = await createRes.json();
      const normalized = { id: created._id ?? created.id, name: created.title ?? created.name ?? 'Untitled Form', trip: '—', responses: '—', status: created.status || 'draft' };
      setForms(prev => [normalized, ...prev]);
      toast.push('Form clonato.', 'success');
    } catch (err) {
      console.error('Clone form error', err);
      toast.push('Errore durante la clonazione del form.', 'error');
    }
  };

  const handleCreateOrUpdateFormSaved = (saved: any) => {
    if (!saved) return;
    const normalized = { id: saved._id ?? saved.id, name: saved.title ?? saved.name ?? 'Untitled Form', description: saved.description || '', trip: '—', responses: '—', status: saved.status || 'draft' };
    const exists = forms.some(f => String(f.id) === String(normalized.id));
    if (exists) {
      setForms(prev => prev.map(f => String(f.id) === String(normalized.id) ? normalized : f));
    } else {
      setForms(prev => [normalized, ...prev]);
    }
    setFormFormMode('hidden');
    setEditingFormData(null);
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
        toast.push('Errore durante il salvataggio del template. Vedi console per dettagli.', 'error');
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
        toast.push('Errore durante la cancellazione del template. Vedi console per dettagli.', 'error');
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
    toast.push(`Invio del promemoria a ${reminderParticipantCount} partecipanti in corso... Oggetto: ${subject}`, 'info');
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
      toast.push(`Invio completato: ${summary.sent} inviati, ${summary.failed} falliti`, 'success');

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
      toast.push('Errore durante l\'invio degli inviti. Vedi console per dettagli.', 'error');
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
      toast.push('Errore durante il salvataggio del partecipante. Vedi console.', 'error');
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
      toast.push('Errore durante la cancellazione del partecipante. Vedi console.', 'error');
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
        return <Forms onCreateForm={handleCreateForm} onEditForm={handleEditForm} onDeleteForm={handleDeleteForm} onCloneForm={handleCloneForm} forms={forms} />;
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
    <ToastProvider>
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
        {formFormMode !== 'hidden' && (
          <CreateForm
            onCancel={handleCloseForm}
            onSave={(saved?: any) => handleCreateOrUpdateFormSaved(saved)}
            isEditing={formFormMode === 'edit'}
            initialData={editingFormData}
            onDelete={(id) => {
              handleDeleteForm(id);
              setFormFormMode('hidden');
              setEditingFormData(null);
            }}
          />
        )}
      </div>
    </ToastProvider>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;