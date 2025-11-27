export type DocOption = { value: string; label: string };

export async function fetchDocumentOptions(baseUrl = ''): Promise<DocOption[]> {
  const usefulUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/useful-informations` : `/api/useful-informations`;
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
  // always attempt /api/documents as a fallback regardless of DEV flag — some deployments serve static HTML without DEV set
  const docsUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents` : `/api/documents`;
  try {
    // prefer useful-informations endpoint (contains usefulInfo entries); fall back to documents
    console.debug('[E2E] fetchDocumentOptions trying useful-informations', usefulUrl);
    let res = await fetch(usefulUrl).catch(() => null);
    if (!res || !res.ok) {
      console.debug('[E2E] useful-informations failed, trying documents', docsUrl);
      res = await fetch(docsUrl).catch(() => null);
    }
    console.debug('[E2E] fetchDocumentOptions status', res && res.status);
    if (!res || !res.ok) return [];
    const json = await res.json();
    // Expecting shape: array or { items: array }
    const arr = Array.isArray(json) ? json : (json && Array.isArray((json as any).items) ? (json as any).items : []);
    return arr.map((it: any) => ({ value: it.value ?? it.id ?? it._id ?? '', label: it.label ?? it.title ?? it.name ?? it.filename ?? '' }));
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
    const arr = Array.isArray(json) ? json : (json && Array.isArray((json as any).items) ? (json as any).items : []);
    return arr.map((it: any) => ({ value: it._id ?? it.id ?? it.value ?? '', label: it.title ?? it.label ?? it.name ?? '' }));
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
  // choose endpoint based on payload shape; prefer useful-informations for usefulInfo payloads
  const usefulUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/useful-informations` : `/api/useful-informations`;
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
  const docsUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents` : `/api/documents`;
  // If payload contains usefulInfo -> use useful-informations. Otherwise prefer useful-informations but fall back to /api/documents
  const postUrl = (payload && payload.usefulInfo) ? usefulUrl : usefulUrl;
  try {
    console.debug('[E2E] createDocument url', postUrl, 'payload', payload);
    const res = await fetch(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.debug('[E2E] createDocument response status', res && res.status);
    if (!res || !res.ok) return null;
    const json = await res.json();
    return { value: json.id ?? json._id ?? json.value ?? '', label: json.title ?? json.label ?? json.name ?? '' };
  } catch (err) { return null; }
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
    // normalize to array; server may return { items: [...] }
    const arr = Array.isArray(json) ? json : (json && Array.isArray((json as any).items) ? (json as any).items : []);
    return arr;
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
    // try useful-informations first (they contain usefulInfo records), then documents
    const usefulUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/useful-informations/${id}` : `/api/useful-informations/${id}`;
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
    let docsUrl: string | null = null;
    if (isDev) {
      docsUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents/${id}` : `/api/documents/${id}`;
    }
    let res = await fetch(usefulUrl).catch(() => null);
    if ((!res || !res.ok) && docsUrl) {
      res = await fetch(docsUrl).catch(() => null);
    }
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function updateDocument(id: string, payload: any, baseUrl = ''): Promise<any | null> {
  try {
    // prefer updating useful-informations when possible, fall back to documents only in DEV
    const usefulUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/useful-informations/${id}` : `/api/useful-informations/${id}`;
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
    let docsUrl: string | null = null;
    if (isDev) {
      docsUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents/${id}` : `/api/documents/${id}`;
    }
    let res = await fetch(usefulUrl, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }).catch(() => null);
    if ((!res || !res.ok) && docsUrl) {
      res = await fetch(docsUrl, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) }).catch(() => null);
    }
    if (!res || !res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function deleteDocument(id: string, baseUrl = ''): Promise<boolean> {
  try {
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
    let docsUrl: string | null = null;
    if (isDev) {
      docsUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents/${id}` : `/api/documents/${id}`;
    }
    const usefulUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/useful-informations/${id}` : `/api/useful-informations/${id}`;
    let res = await fetch(usefulUrl, { method: 'DELETE' }).catch(() => null);
    if ((!res || !res.ok) && docsUrl) {
      res = await fetch(docsUrl, { method: 'DELETE' }).catch(() => null);
    }
    return !!(res && res.ok);
  } catch (err) { return false; }
}
