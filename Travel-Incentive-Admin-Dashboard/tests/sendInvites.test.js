const fetch = require('node-fetch');

async function run() {
  const res = await fetch('http://localhost:5001/api/invites/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripName: 'Sales Kick-off Dubai', emailBody: 'Test body' }),
  });
  console.log('Status', res.status);
  const json = await res.json();
  console.log('Response', json);
}

run().catch(e => console.error(e));
