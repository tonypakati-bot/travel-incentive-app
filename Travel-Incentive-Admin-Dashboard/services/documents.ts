export type DocOption = { value: string; label: string };

export async function fetchDocumentOptions(baseUrl = ''): Promise<DocOption[]> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents` : `/api/documents`;
  try {
    console.debug('[E2E] fetchDocumentOptions url', url);
    const res = await fetch(url);
    console.debug('[E2E] fetchDocumentOptions status', res && res.status);
    if (!res.ok) {
      // return empty so caller can fallback
      return [];
    }
    const json = await res.json();
    // Expecting shape: [{ id, title }] or [{ value, label }]
    if (Array.isArray(json)) {
      return json.map((it: any) => ({ value: it.value ?? it.id ?? it._id ?? '', label: it.label ?? it.title ?? it.name ?? it.filename ?? '' }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function fetchPrivacyPolicyOptions(baseUrl = ''): Promise<DocOption[]> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/privacy-policies` : `/api/privacy-policies`;
  try {
    console.debug('[E2E] fetchPrivacyPolicyOptions url', url);
    const res = await fetch(url);
    console.debug('[E2E] fetchPrivacyPolicyOptions status', res && res.status);
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json)) {
      return json.map((it: any) => ({ value: it._id ?? it.id ?? it.value ?? '', label: it.title ?? it.label ?? it.name ?? '' }));
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function createPrivacyPolicy(payload: { title: string; content?: string; trip?: string | null }, baseUrl = ''): Promise<DocOption | null> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/privacy-policies` : `/api/privacy-policies`;
  try {
    console.debug('[E2E] createPrivacyPolicy url', url, 'payload', payload);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.debug('[E2E] createPrivacyPolicy response status', res && res.status);
    if (!res.ok) return null;
    const json = await res.json();
    const out = { value: json.id ?? json._id ?? json.value ?? '', label: json.title ?? json.label ?? '' };
    try { (window as any).__E2E_lastCreatePrivacyResult = out; } catch (e) { /* ignore */ }
    return out;
  } catch (err) {
    console.error('createPrivacyPolicy error', err);
    return null;
  }
}

export async function createDocument(payload: { title: string; content?: string; usefulInfo?: any; visible?: boolean; author?: string }, baseUrl = ''): Promise<DocOption | null> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents` : `/api/documents`;
  try {
    console.debug('[E2E] createDocument url', url, 'payload', payload);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.debug('[E2E] createDocument response status', res && res.status);
    if (!res.ok) return null;
    const json = await res.json();
    return { value: json.id ?? json._id ?? json.value, label: json.title ?? json.label ?? json.name ?? '' };
  } catch (err) {
    return null;
  }
}

export async function createUsefulInfo(payload: { title: string; content?: string; usefulInfo?: any; visible?: boolean; author?: string }, baseUrl = ''): Promise<DocOption | null> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/useful-informations` : `/api/useful-informations`;
  try {
    console.debug('[E2E] createUsefulInfo url', url, 'payload', payload);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.debug('[E2E] createUsefulInfo response status', res && res.status);
    if (!res.ok) return null;
    const json = await res.json();
    return { value: json.id ?? json._id ?? json.value ?? '', label: json.title ?? json.label ?? '' };
  } catch (err) {
    console.error('createUsefulInfo error', err);
    return null;
  }
}

export async function fetchTermsDocuments(baseUrl = ''): Promise<any[]> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/terms-documents` : `/api/terms-documents`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    // return raw server objects so callers can access _id, title, trip, content
    return Array.isArray(json) ? json : [];
  } catch (err) { return []; }
}

export async function createTermsDocument(payload: { title: string; content?: string; trip?: string | null }, baseUrl = ''): Promise<DocOption | null> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/terms-documents` : `/api/terms-documents`;
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return null;
    const json = await res.json();
    return { value: json.id ?? json._id ?? json.value ?? '', label: json.title ?? json.label ?? '' };
  } catch (err) { return null; }
}

export async function updateTermsDocument(id: string, payload: any, baseUrl = ''): Promise<any | null> {
  try {
    const res = await fetch(baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/terms-documents/${id}` : `/api/terms-documents/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function deleteTermsDocument(id: string, baseUrl = ''): Promise<boolean> {
  try {
    const res = await fetch(baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/terms-documents/${id}` : `/api/terms-documents/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) { return false; }
}

export async function getDocumentById(id: string, baseUrl = ''): Promise<any | null> {
  try {
    const res = await fetch(baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents/${id}` : `/api/documents/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function updateDocument(id: string, payload: any, baseUrl = ''): Promise<any | null> {
  try {
    const res = await fetch(baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents/${id}` : `/api/documents/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function deleteDocument(id: string, baseUrl = ''): Promise<boolean> {
  try {
    const res = await fetch(baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents/${id}` : `/api/documents/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) { return false; }
}
