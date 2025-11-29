export type FormOption = { value: string; label: string };

export async function fetchFormOptions(baseUrl = ''): Promise<FormOption[]> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/forms` : `/api/forms`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const arr = Array.isArray(json) ? json : (json && Array.isArray((json as any).items) ? (json as any).items : []);
    return arr.map((it: any) => ({ value: it._id ?? it.id ?? '', label: it.title ?? it.name ?? '' }));
  } catch (err) { return []; }
}

export async function createForm(payload: any, baseUrl = ''): Promise<any | null> {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/forms` : `/api/forms`;
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { console.error('createForm error', err); return null; }
}

export async function getFormById(id: string, baseUrl = ''): Promise<any | null> {
  try {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/forms/${id}` : `/api/forms/${id}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function updateForm(id: string, payload: any, baseUrl = ''): Promise<any | null> {
  try {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/forms/${id}` : `/api/forms/${id}`;
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) { return null; }
}

export async function deleteForm(id: string, baseUrl = ''): Promise<boolean> {
  try {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/forms/${id}` : `/api/forms/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    return res.ok;
  } catch (err) { return false; }
}
