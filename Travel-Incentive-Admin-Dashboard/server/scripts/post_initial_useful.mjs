import fetch from 'node-fetch';

const items = [
  { title: 'Ibiza', usefulInfo: { destinationName: 'Ibiza', country: 'Spagna' } },
  { title: 'Mykonos', usefulInfo: { destinationName: 'Mykonos', country: 'Grecia' } },
  { title: 'Abu Dhabi', usefulInfo: { destinationName: 'Abu Dhabi', country: 'Emirati Arabi Uniti' } },
];

const API = process.env.API || 'http://localhost:5001';

async function main() {
  for (const it of items) {
    try {
      // check existing by title
      const res = await fetch(`${API}/api/useful-informations/summary`);
      const list = await res.json();
      if (!list.find(l => l.title === it.title)) {
        console.log('Creating', it.title);
        await fetch(`${API}/api/useful-informations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: it.title, usefulInfo: it.usefulInfo }),
        });
      } else {
        console.log('Already exists', it.title);
      }
    } catch (err) {
      console.error('Error posting', it.title, err);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
