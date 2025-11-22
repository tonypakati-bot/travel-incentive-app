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
