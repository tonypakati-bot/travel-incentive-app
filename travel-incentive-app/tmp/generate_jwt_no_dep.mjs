import fs from 'fs';
import crypto from 'crypto';
import { join } from 'path';

// read .env if exists
const envPath = join(process.cwd(), '.env');
let secret = 'your_jwt_secret_key_here';
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/^\s*JWT_SECRET\s*=\s*(.+)\s*$/m);
  if (m) secret = m[1].trim();
}

const header = { alg: 'HS256', typ: 'JWT' };
const payload = { user: { id: 'tmp-script-user' }, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 };

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const headerB = base64url(header);
const payloadB = base64url(payload);
const signingInput = `${headerB}.${payloadB}`;
const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
console.log(`${signingInput}.${signature}`);
