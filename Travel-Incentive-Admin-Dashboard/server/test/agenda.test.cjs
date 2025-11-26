const fetch = require('node-fetch');

const backend = process.env.BACKEND_URL || 'http://localhost:5001';

describe('Agenda API', () => {
  let tripId;

  beforeAll(async () => {
    const payload = { clientName: 'E2E', name: `AgendaTest-${Date.now()}`, startDate: '2025-11-26', endDate: '2025-11-27' };
    const res = await fetch(`${backend}/api/trips`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    expect(res.status).toBe(201);
    const trip = await res.json();
    tripId = trip.tripId || trip._id || trip.id;
  });

  test('create day, add item, update item, delete item, delete day', async () => {
    // create day
    const dayPayload = { day: 1, title: 'Day 1', date: '2025-11-26', items: [] };
    let res = await fetch(`${backend}/api/trips/${tripId}/agenda`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(dayPayload) });
    expect(res.status).toBe(201);
    const createdDay = await res.json();
    expect(createdDay).toBeDefined();

    // add item
    const itemPayload = { time: '10:00', title: 'Test Event', description: 'desc' };
    res = await fetch(`${backend}/api/trips/${tripId}/agenda/0/items`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(itemPayload) });
    expect(res.status).toBe(201);
    const createdItem = await res.json();
    expect(createdItem).toBeDefined();

    // update item
    const itemIndex = 0;
    const updatePayload = { title: 'Updated Event' };
    res = await fetch(`${backend}/api/trips/${tripId}/agenda/0/items/${itemIndex}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(updatePayload) });
    if (res.status !== 200) {
      const errBody = await res.text().catch(()=>'<no-body>');
      console.error('PUT update item failed', res.status, errBody);
    }
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.title === 'Updated Event' || (Array.isArray(updated) && updated[0] && updated[0].title === 'Updated Event')).toBeTruthy();

    // delete item
    res = await fetch(`${backend}/api/trips/${tripId}/agenda/0/items/${itemIndex}`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    // delete day
    res = await fetch(`${backend}/api/trips/${tripId}/agenda/0`, { method: 'DELETE' });
    expect(res.status).toBe(200);
  }, 20000);
});
