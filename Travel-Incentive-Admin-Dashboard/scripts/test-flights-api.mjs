import fetch from 'node-fetch';

const backend = process.env.BACKEND_URL || 'http://localhost:5001';

const ok = (cond, msg) => { if (!cond) { console.error('ASSERT FAILED:', msg); process.exit(2); } };

const main = async () => {
  console.log('Starting flights API tests against', backend);

  // 1) create a trip
  const tripPayload = { clientName: 'TestCo', name: `TestTrip ${Date.now()}`, subtitle: 'sub', description: 'desc', startDate: '2025-12-01', endDate: '2025-12-05' };
  let res = await fetch(`${backend}/api/trips`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(tripPayload) });
  ok(res.ok, `POST /api/trips failed: ${res.status}`);
  const tripJson = await res.json();
  ok(tripJson && tripJson.tripId, 'No tripId in response');
  const tripId = tripJson.tripId;
  console.log('Created trip', tripId);

  // 2) create flight (andata)
  const flightA = { direction: 'andata', title: 'A-Test', airline: 'TestAir', flightNumber: 'TA100', from: 'MXP', to: 'AUH', date: '2025-12-01', timeDeparture: '08:00' };
  res = await fetch(`${backend}/api/trips/${tripId}/flights`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(flightA) });
  ok(res.ok, `POST flight failed: ${res.status}`);
  const createdA = await res.json();
  ok(createdA && (createdA._id || createdA.id), 'Created flight missing id');
  const flightAId = createdA._id || createdA.id;
  console.log('Created flight A', flightAId);

  // 3) create flight (ritorno)
  const flightR = { direction: 'ritorno', title: 'R-Test', airline: 'TestAir', flightNumber: 'TR200', from: 'AUH', to: 'MXP', date: '2025-12-05', timeDeparture: '10:00' };
  res = await fetch(`${backend}/api/trips/${tripId}/flights`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(flightR) });
  ok(res.ok, `POST flight R failed: ${res.status}`);
  const createdR = await res.json();
  const flightRId = createdR._id || createdR.id;
  console.log('Created flight R', flightRId);

  // 4) list flights
  res = await fetch(`${backend}/api/trips/${tripId}/flights`);
  ok(res.ok, `GET flights failed: ${res.status}`);
  const list = await res.json();
  ok(Array.isArray(list.flights) && list.flights.length >= 2, `Expected >=2 flights, got ${JSON.stringify(list)}`);
  console.log('List contains', list.flights.length, 'flights');

  // 5) update flight A
  res = await fetch(`${backend}/api/trips/${tripId}/flights/${flightAId}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ airline: 'UpdatedAir' }) });
  ok(res.ok, `PUT flight failed: ${res.status}`);
  const updatedA = await res.json();
  ok(updatedA && (updatedA.airline === 'UpdatedAir'), `Expected airline UpdatedAir, got ${JSON.stringify(updatedA)}`);
  console.log('Updated flight A airline ->', updatedA.airline);

  // 6) get single flight
  res = await fetch(`${backend}/api/trips/${tripId}/flights/${flightRId}`);
  ok(res.ok, `GET single flight failed: ${res.status}`);
  const gotR = await res.json();
  ok(gotR && gotR._id && String(gotR._id).includes(String(flightRId).slice(0,4)), 'Got wrong flight');
  console.log('GET single flight R ok');

  // 7) delete flight A
  res = await fetch(`${backend}/api/trips/${tripId}/flights/${flightAId}`, { method: 'DELETE' });
  ok(res.ok, `DELETE flight failed: ${res.status}`);
  const afterDel = await res.json();
  ok(afterDel && Array.isArray(afterDel.flights), 'DELETE did not return flights list');
  const still = afterDel.flights.find(f => String(f._id) === String(flightAId));
  ok(!still, 'Flight A still present after delete');
  console.log('Delete flight A ok');

  console.log('All flights API tests passed');
  process.exit(0);
};

main().catch(e => { console.error('Test error', e); process.exit(2); });
