export type DocOption = { value: string; label: string };

export async function fetchDocumentOptions(baseUrl = ''): Promise<DocOption[]> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents` : `/api/documents`;
  try {
    const res = await fetch(url);
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

export async function createDocument(payload: { title: string; content?: string; usefulInfo?: any; visible?: boolean; author?: string }, baseUrl = ''): Promise<DocOption | null> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/documents` : `/api/documents`;
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return null;
    const json = await res.json();
    return { value: json.id ?? json._id ?? json.value, label: json.title ?? json.label ?? json.name ?? '' };
  } catch (err) {
    return null;
  }
}
