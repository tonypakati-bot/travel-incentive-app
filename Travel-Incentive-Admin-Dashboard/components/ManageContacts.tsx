import React, { useState, useRef } from 'react';
import { SearchIcon, PencilIcon, TrashIcon } from './icons';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import * as XLSX from 'xlsx';
import AddContactModal, { Contact, ContactData } from './AddContactModal';

interface ManageContactsProps {
    contacts: Contact[];
    setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

const ManageContacts: React.FC<ManageContactsProps> = ({ contacts, setContacts }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const sortContactsList = (list: Contact[]) => {
        return list.slice().sort((a,b) => {
            const an = `${(a.firstName||'') } ${(a.lastName||'')}`.trim().toLowerCase();
            const bn = `${(b.firstName||'') } ${(b.lastName||'')}`.trim().toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
        });
    };

    const mapServerToContact = (s: any): Contact => {
        const name = s.name || '';
        const parts = String(name).trim().split(/\s+/);
        const last = parts.length > 1 ? parts.pop() as string : '';
        const first = parts.join(' ');
        return {
            id: String(s.id ?? s._id ?? Date.now()),
            firstName: first || '',
            lastName: last || '',
            category: s.category || 'Tour Leader',
            phone: s.phone || '',
            email: s.email || '',
            notes: s.notes || ''
        } as Contact;
    };

    const handleOpenCreateModal = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (contact: Contact) => {
        (async () => {
            try {
                const res = await fetch(`/api/contacts/${contact.id}`);
                if (!res.ok) throw new Error('not-found');
                const json = await res.json();
                // map server shape to Contact
                const mapped = mapServerToContact(json);
                setEditingContact(mapped as any);
            } catch (e) {
                console.warn('Could not fetch contact for edit', e);
                setEditingContact(contact);
            } finally {
                setIsModalOpen(true);
            }
        })();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<string | number | null>(null);

    const handleDelete = (id: string | number) => {
        setToDeleteId(id as any);
        setConfirmOpen(true);
    };

    const isObjectId = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);

    const handleConfirmDelete = async () => {
        if (toDeleteId !== null) {
            try {
                if (isObjectId(toDeleteId)) {
                    await fetch(`/api/contacts/${toDeleteId}`, { method: 'DELETE' });
                }
            } catch (e) { console.warn('Delete request failed', e); }
            setContacts(prev => prev.filter(contact => String(contact.id) !== String(toDeleteId)));
            try { toast && toast.showToast('Contatto eliminato', 'success'); } catch (e) {}
        }
        setConfirmOpen(false);
        setToDeleteId(null);
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setToDeleteId(null);
    };
    
    const handleSave = async (data: ContactData, id?: string | number) => {
        try {
            const isObjId = (v: any) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(String(v));
            if (id !== undefined && isObjId(id)) {
                // Update remote
                const res = await fetch(`/api/contacts/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(data) });
                if (!res.ok) throw new Error('update-failed');
                const json = await res.json();
                const mapped = mapServerToContact(json);
                    setContacts(prev => prev.map(c => String(c.id) === String(id) ? mapped : c));
                try { toast && toast.showToast('Contatto aggiornato', 'success'); } catch (e) {}
            } else if (id !== undefined) {
                // local id (number) -> try create remote but keep local fallback
                const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(data) });
                if (res.ok) {
                    const json = await res.json();
                    const mapped = mapServerToContact(json);
                        setContacts(prev => [mapped, ...prev.filter(c => String(c.id) !== String(id))] as any);
                    try { toast && toast.showToast('Contatto creato', 'success'); } catch (e) {}
                } else {
                    // fallback local update
                    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } as any : c));
                }
            } else {
                // create remote
                const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(data) });
                if (res.ok) {
                    const json = await res.json();
                    const mapped = mapServerToContact(json);
                        setContacts(prev => [mapped, ...prev] as any);
                    try { toast && toast.showToast('Contatto creato', 'success'); } catch (e) {}
                } else {
                    const newContact: Contact = { id: Date.now(), ...data };
                    setContacts(prev => [newContact, ...prev]);
                }
            }
            handleCloseModal();
        } catch (err) {
            console.error('Save contact error', err);
            try { toast && toast.showToast('Errore durante il salvataggio del contatto', 'error'); } catch (e) {}
        }
    };

    const filteredContacts = contacts.filter(c => {
        const full = `${(c.firstName || '').toString()} ${(c.lastName || '').toString()}`.trim();
        return (
            full.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.category || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const toast = (() => { try { return useToast(); } catch { return null as any; } })();

    React.useEffect(() => {
        // load contacts from server
        (async () => {
            try {
                const res = await fetch('/api/contacts');
                if (!res.ok) throw new Error('no-contacts');
                const json = await res.json();
                // map server shape { id, name, category } -> local Contact shape
                const mapped: Contact[] = (json||[]).map((c: any) => ({ id: c.id, firstName: (c.name||'').split(' ')[0] || '', lastName: (c.name||'').split(' ').slice(1).join(' ') || '', category: c.category || 'Tour Leader', phone: c.phone || '', email: c.email || '', notes: c.notes || '' }));
                setContacts(mapped as any);
                            setContacts(sortContactsList(mapped) as any);
            } catch (e) {
                console.warn('Could not load contacts', e);
            }
        })();
    }, []);

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        console.log('ManageContacts: handleFileImport triggered', f && f.name, 'size', f && f.size);
        try { toast && toast.showToast('Import avviato', 'info'); } catch (e) {}
        const reader = new FileReader();
        reader.onload = (ev) => {
            const data = ev.target?.result;
            try {
                // prefer ArrayBuffer for compatibility
                let wb;
                if (data instanceof ArrayBuffer) {
                    wb = XLSX.read(data, { type: 'array' });
                } else {
                    wb = XLSX.read(data as string, { type: 'binary' });
                }
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
                const imported = json.map((row) => {
                    const first = row['firstName'] || row['FirstName'] || row['First Name'] || row['Nome'] || '';
                    const last = row['lastName'] || row['LastName'] || row['Last Name'] || row['Cognome'] || '';
                    let f = first || '';
                    let l = last || '';
                    if (!f && !l) {
                        const legacy = row['name'] || row['Name'] || row['Nome'] || row['nome'] || '';
                        const parts = String(legacy).trim().split(/\s+/);
                        l = parts.length > 1 ? parts.pop() as string : '';
                        f = parts.join(' ');
                    }
                    return {
                        firstName: (f || '').toString(),
                        lastName: (l || '').toString(),
                        category: row['category'] || row['Category'] || row['Categoria'] || 'Tour Leader',
                        phone: row['phone'] || row['Phone'] || row['Telefono'] || '',
                        email: row['email'] || row['Email'] || '',
                        notes: row['notes'] || row['Notes'] || row['Note'] || ''
                    };
                });
                const validated: Contact[] = [];
                const seen = new Set(contacts.map(c => (c.email || '').toLowerCase()));
                imported.forEach((imp) => {
                    const full = `${(imp.firstName||'').toString()} ${(imp.lastName||'').toString()}`.trim();
                    if (!full || !imp.email) return;
                    const emailLower = (imp.email || '').toLowerCase();
                    if (seen.has(emailLower)) return;
                    seen.add(emailLower);
                    validated.push({ id: Date.now() + Math.floor(Math.random()*10000), ...imp });
                });
                if (validated.length > 0) {
                    setContacts(prev => sortContactsList([...validated, ...prev] as any));
                    try { toast && toast.showToast(`${validated.length} contatti importati`, 'success'); } catch (e) {}
                }
                // clear input so same file can be re-selected later
                try { if (e.currentTarget) (e.currentTarget as HTMLInputElement).value = ''; } catch (err) { console.warn('Could not clear input in onload', err); }
            } catch (err) {
                console.error('Import error', err);
                try { toast && toast.showToast('Errore durante l\'import del file', 'error'); } catch (e) {}
                alert('Errore durante l\'import del file. Controlla il formato.');
                try { if (e.currentTarget) (e.currentTarget as HTMLInputElement).value = ''; } catch (err) { console.warn('Could not clear input in error handler', err); }
            }
        };
        reader.onerror = (err) => {
            console.error('File read error', err);
            try { toast && toast.showToast('Errore lettura file', 'error'); } catch (e) {}
            alert('Errore durante la lettura del file.');
            try { if (e.currentTarget) (e.currentTarget as HTMLInputElement).value = ''; } catch (err) { console.warn('Could not clear input in onerror', err); }
        };
        // read as ArrayBuffer (more compatible across browsers)
        reader.readAsArrayBuffer(f as Blob);
    };

    const handleExportFile = () => {
        try {
            // map contacts to expected export columns: Nome, Cognome, Category, Phone, Email, Notes
            const exportData = filteredContacts.map(c => ({ Nome: c.firstName || (c as any).name || '', Cognome: c.lastName || '', Categoria: c.category || '', Telefono: c.phone || '', Email: c.email || '', Note: c.notes || '' }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
            function s2ab(s: any) {
                const buf = new ArrayBuffer(s.length);
                const view = new Uint8Array(buf);
                for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
                return buf;
            }
            const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contacts_export_${Date.now()}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error', err);
            try { toast && toast.showToast('Errore durante l\'export', 'error'); } catch (e) {}
            alert('Errore durante l\'export.');
        }
    };

    return (
        <>
            <div className="p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Manage Contacts</h1>
                    <p className="text-gray-500 mt-1">Manage emergency and support contacts for trips.</p>
                </header>

                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input id="contacts-file-input" ref={fileInputRef} onChange={handleFileImport} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" type="file" className="hidden" />
                            <label htmlFor="contacts-file-input" onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">Import</label>
                            <button onClick={handleExportFile} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition">Export</button>
                            <button 
                                onClick={handleOpenCreateModal}
                                className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                                Add Contact
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Nome Contatto</th>
                                    <th scope="col" className="px-6 py-4">Categoria</th>
                                    <th scope="col" className="px-6 py-4">Telefono</th>
                                    <th scope="col" className="px-6 py-4">Email</th>
                                    <th scope="col" className="px-6 py-4">Note</th>
                                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {`${(contact.firstName || (contact as any).name || '').toString()} ${(contact.lastName || '').toString()}`.trim()}
                                        </th>
                                        <td className="px-6 py-4">{contact.category}</td>
                                        <td className="px-6 py-4">{contact.phone}</td>
                                        <td className="px-6 py-4">{contact.email}</td>
                                        <td className="px-6 py-4 max-w-xs truncate">{contact.notes}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-3">
                                                <button onClick={() => handleOpenEditModal(contact)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100" aria-label="Edit contact">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(contact.id)} className="p-1.5 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100" aria-label="Delete contact">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         {filteredContacts.length === 0 && (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-medium text-gray-700">No contacts found.</h3>
                                <p className="text-gray-500 mt-1">Try adjusting your search or add a new contact.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <AddContactModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                contactToEdit={editingContact}
            />
            <ConfirmModal
                open={confirmOpen}
                title="Conferma eliminazione"
                message="Sei sicuro di voler eliminare questo contatto? Questa azione è irreversibile."
                confirmLabel="Elimina"
                cancelLabel="Annulla"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
};

export default ManageContacts;