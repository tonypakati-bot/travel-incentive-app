import React, { useState, useRef } from 'react';
import { SearchIcon, PencilIcon, TrashIcon } from './icons';
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

    const handleOpenCreateModal = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (contact: Contact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            setContacts(prev => prev.filter(contact => contact.id !== id));
        }
    };
    
    const handleSave = (data: ContactData, id?: number) => {
        if (id !== undefined) { // Editing
            setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
        } else { // Creating
            const newContact: Contact = { id: Date.now(), ...data };
            setContacts(prev => [newContact, ...prev]);
        }
        handleCloseModal();
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
                    setContacts(prev => [...validated, ...prev]);
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
        </>
    );
};

export default ManageContacts;