import React, { useState } from 'react';
import { XIcon } from './icons';
import { createDocument, createUsefulInfo } from '../services/documents';
import { useToast } from './ToastContext';

type Props = { open: boolean; onCreated: (opt:{ value:string; label:string })=>void; onClose: ()=>void };

const DocumentCreator: React.FC<Props> = ({ open, onCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [country, setCountry] = useState('');
  const [documentsField, setDocumentsField] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [currency, setCurrency] = useState('');
  const [language, setLanguage] = useState('');
  const [climate, setClimate] = useState('');
  const [vaccinationsHealth, setVaccinationsHealth] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // expose dev hook to create a document directly with same logic
  React.useEffect(() => {
    let meta: any = undefined;
    try { meta = (import.meta as any); } catch (e) { meta = undefined; }
    if (!meta || !meta.env || !meta.env.DEV) return;
    try {
      (window as any).__E2E_forceCreateDocument = async (payload: any) => {
        try {
          const { title: pt = '', content: pc = '', usefulInfo = {} } = payload || {};
          console.debug('[E2E] __E2E_forceCreateDocument called', { payload });
          if (!pt || !pt.trim()) return { ok: false, reason: 'title_required' };
          let res = null;
          if (usefulInfo && Object.keys(usefulInfo).length > 0) {
            res = await createUsefulInfo({ title: pt.trim(), content: pc, usefulInfo });
          } else {
            res = await createDocument({ title: pt.trim(), content: pc, usefulInfo });
          }
          console.debug('[E2E] __E2E_forceCreateDocument createDocument result', res);
          try { (window as any).__E2E_lastCreateResult = res || null; } catch (e) {}
          if (!res) return { ok: false, reason: 'create_failed' };
          try { toast.push('Documento creato con successo', 'success'); } catch(e){}
          try { window.dispatchEvent(new CustomEvent('documents:changed', { detail: { action: 'create', doc: res } })); } catch (e) {}
          return { ok: true, doc: res };
        } catch (e) { return { ok: false, reason: e && e.message }; }
      };
    } catch (e) {}
    return () => { try { delete (window as any).__E2E_forceCreateDocument; } catch (e) {} };
  }, []);

  // dev hooks: allow tests to set modal fields directly and invoke create
  React.useEffect(() => {
    let meta2: any = undefined;
    try { meta2 = (import.meta as any); } catch (e) { meta2 = undefined; }
    if (!meta2 || !meta2.env || !meta2.env.DEV) return;
    try {
      (window as any).__E2E_setDocCreatorFields = (payload: any) => {
        try {
          if (!payload) return { ok: false, reason: 'no-payload' };
          if (payload.title !== undefined) setTitle(payload.title);
          if (payload.content !== undefined) setContent(payload.content);
          if (payload.destinationName !== undefined) setDestinationName(payload.destinationName);
          if (payload.country !== undefined) setCountry(payload.country);
          if (payload.documents !== undefined) setDocumentsField(payload.documents);
          if (payload.timeZone !== undefined) setTimeZone(payload.timeZone);
          if (payload.currency !== undefined) setCurrency(payload.currency);
          if (payload.language !== undefined) setLanguage(payload.language);
          if (payload.climate !== undefined) setClimate(payload.climate);
          if (payload.vaccinationsHealth !== undefined) setVaccinationsHealth(payload.vaccinationsHealth);
          console.debug('[E2E] __E2E_setDocCreatorFields applied', payload);
          try { (window as any).__E2E_lastSetPayload = payload; } catch (e) {}
          return { ok: true };
        } catch (e) { return { ok: false, reason: e && e.message }; }
      };
      (window as any).__E2E_invokeCreate = async (opts?: any) => {
        try {
          // call doCreate with override when provided, otherwise use last set payload
          let overrides = undefined;
          if (opts && (opts.title || opts.content || opts.usefulInfo)) overrides = { title: opts.title, content: opts.content, usefulInfo: opts.usefulInfo };
          if (!overrides) {
            try { overrides = (window as any).__E2E_lastSetPayload || undefined; } catch (e) { overrides = undefined; }
          }
          await doCreate(overrides);
          const start = Date.now();
          let last = (window as any).__E2E_lastCreateResult || null;
          while (!last && Date.now() - start < 3000) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, 100));
            last = (window as any).__E2E_lastCreateResult || null;
          }
          return { ok: !!last, doc: last };
        } catch (e) { return { ok: false, reason: e && e.message }; }
      };
    } catch (e) {}
    return () => {
      try { delete (window as any).__E2E_setDocCreatorFields; } catch(e){}
      try { delete (window as any).__E2E_invokeCreate; } catch(e){}
    };
  }, []);

  // debug: log mount/unmount and attach a capturing click listener to the create button
  React.useEffect(() => {
    console.debug('[E2E] DocumentCreator mounted, open=', open);
    if (!open) return;
    let attached = false;
    const attach = () => {
      try {
        const btn = document.querySelector('[data-testid="doc-creator-create"]');
        if (btn && !attached) {
          attached = true;
          btn.addEventListener('click', (e) => {
            try {
              const b = btn as HTMLButtonElement | null;
              console.debug('[E2E] capturing click on doc-creator-create', { disabled: b ? b.disabled : undefined });
            } catch (err) {}
          }, true);
        }
      } catch (err) {}
    };
    // try immediately and after a short delay to ensure button exists
    attach();
    const t = setTimeout(attach, 200);
    return () => { clearTimeout(t); console.debug('[E2E] DocumentCreator unmounted'); };
  }, [open]);

  if (!open) return null;

  async function doCreate(override?: { title?: string; content?: string; usefulInfo?: any }) {
    try { (window as any).__E2E_lastCreateAttempt = Date.now(); } catch (e) {}
    const localTitle = override && override.title !== undefined ? String(override.title || '') : title;
    const localContent = override && override.content !== undefined ? override.content : content;
    const ui = override && override.usefulInfo !== undefined ? override.usefulInfo : {
      destinationName, country, documents: documentsField, timeZone, currency, language, climate, vaccinationsHealth
    };
    if (!localTitle || !String(localTitle).trim()) return setError('Titolo richiesto');
    setSaving(true);
    setError(null);
    const payload = { title: String(localTitle).trim(), content: localContent, usefulInfo: ui };
    console.debug('[E2E] DocumentCreator.doCreate payload', payload);
    let res = null;
    if (payload && payload.usefulInfo && Object.keys(payload.usefulInfo).length > 0) {
      res = await createUsefulInfo(payload);
    } else {
      res = await createDocument(payload);
    }
    console.debug('[E2E] DocumentCreator.doCreate result', res);
          try { (window as any).__E2E_lastCreateResult = res || null; } catch (e) {}
    setSaving(false);
    if (!res) {
      console.debug('[E2E] DocumentCreator.doCreate failed to create');
      return setError('Errore durante la creazione');
    }
    // show toast then close
    toast.push('Documento creato con successo', 'success');
          try { window.dispatchEvent(new CustomEvent('documents:changed', { detail: { action: 'create', doc: res } })); } catch (e) {}
    setTimeout(() => onCreated(res), 250);
  };

  return (
    <div data-testid="doc-creator-root" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Create New Document</h3>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-600" /></button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Destination Name</label>
            <input data-testid="doc-creator-destinationName" value={destinationName} onChange={e=>setDestinationName(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Country</label>
            <input data-testid="doc-creator-country" value={country} onChange={e=>setCountry(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Title</label>
            <input data-testid="doc-creator-title" value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Content</label>
            <textarea data-testid="doc-creator-content" value={content} onChange={e=>setContent(e.target.value)} className="mt-1 p-2 border rounded w-full" rows={4} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Documents</label>
            <textarea data-testid="doc-creator-documents" value={documentsField} onChange={e=>setDocumentsField(e.target.value)} className="mt-1 p-2 border rounded w-full" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Time Zone</label>
            <input data-testid="doc-creator-timeZone" value={timeZone} onChange={e=>setTimeZone(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <input data-testid="doc-creator-currency" value={currency} onChange={e=>setCurrency(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Language</label>
            <input data-testid="doc-creator-language" value={language} onChange={e=>setLanguage(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Climate</label>
            <input data-testid="doc-creator-climate" value={climate} onChange={e=>setClimate(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Vaccinations & Health</label>
            <textarea data-testid="doc-creator-vaccinations" value={vaccinationsHealth} onChange={e=>setVaccinationsHealth(e.target.value)} className="mt-1 p-2 border rounded w-full" rows={2} />
          </div>
        </div>
        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        <footer className="flex justify-end gap-3 mt-4">
          <button data-testid="doc-creator-cancel" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button data-testid="doc-creator-create" onClick={() => { doCreate(); }} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Creating...' : 'Create'}</button>
        </footer>
      </div>
    </div>
  );
};

export default DocumentCreator;
