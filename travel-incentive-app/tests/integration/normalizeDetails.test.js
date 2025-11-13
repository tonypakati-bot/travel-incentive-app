import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const BASE = process.env.BASE_URL || 'http://localhost:5001';

describe('Integration: normalize details', () => {
  test('replay PUT and verify details are objects', async () => {
    const payload = JSON.parse(fs.readFileSync(path.resolve('tmp/latest_put.json'), 'utf8'));
  // token file may contain logging noise; extract the last token-like string
  const rawToken = fs.readFileSync(path.resolve('tmp/token.txt'), 'utf8');
  const tokenMatch = rawToken.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g);
  const token = tokenMatch ? tokenMatch[tokenMatch.length-1] : rawToken.trim();
    const res = await fetch(BASE + '/api/trip', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    // find item 101 in saved body
    const agenda = body.agenda || [];
    let found = false;
    for (const day of agenda) {
      for (const item of day.items || []) {
        if (item.id === 101) {
          found = true;
          expect(Array.isArray(item.details)).toBe(true);
          for (const d of item.details) {
            expect(d).toBeTruthy();
            expect(typeof d.type).toBe('string');
            expect(typeof d.value).toBe('string');
          }
        }
      }
    }
    expect(found).toBe(true);
  }, 20000);
});
