const fetch = require('node-fetch');

const backend = process.env.BACKEND_URL || 'http://localhost:5001';

describe('Flights API', () => {
  let tripId;
  let flightAId;
  let flightRId;

  test('create trip', async () => {
    const payload = { clientName: 'TestCo', name: `TestTrip-${Date.now()}`, startDate: '2025-12-01', endDate: '2025-12-05' };
    const res = await fetch(`${backend}/api/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tripId).toBeDefined();
    tripId = body.tripId;
  });

  test('create flights (andata + ritorno)', async () => {
    const a = { direction: 'andata', title: 'A-Test', airline: 'TestAir', flightNumber: 'TA100', from: 'MXP', to: 'AUH', date: '2025-12-01', timeDeparture: '08:00' };
    let res = await fetch(`${backend}/api/trips/${tripId}/flights`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) });
    expect(res.status).toBe(201);
    const ra = await res.json();
    flightAId = ra._id || ra.id;

    const r = { direction: 'ritorno', title: 'R-Test', airline: 'TestAir', flightNumber: 'TR200', from: 'AUH', to: 'MXP', date: '2025-12-05', timeDeparture: '10:00' };
    res = await fetch(`${backend}/api/trips/${tripId}/flights`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) });
    expect(res.status).toBe(201);
    const rr = await res.json();
    flightRId = rr._id || rr.id;
  });

  test('list flights', async () => {
    const res = await fetch(`${backend}/api/trips/${tripId}/flights`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.flights)).toBe(true);
    expect(body.flights.length).toBeGreaterThanOrEqual(2);
  });

  test('update flight', async () => {
    const res = await fetch(`${backend}/api/trips/${tripId}/flights/${flightAId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ airline: 'UpdatedAir' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.airline).toBe('UpdatedAir');
  });

  test('get single flight', async () => {
    const res = await fetch(`${backend}/api/trips/${tripId}/flights/${flightRId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._id || body.id).toBeDefined();
  });

  test('delete flight', async () => {
    const res = await fetch(`${backend}/api/trips/${tripId}/flights/${flightAId}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.flights)).toBe(true);
    const still = body.flights.find(f => String(f._id) === String(flightAId));
    expect(still).toBeUndefined();
  });

});
