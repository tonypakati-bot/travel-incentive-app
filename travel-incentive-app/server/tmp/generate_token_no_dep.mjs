import fs from 'fs';
import crypto from 'crypto';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), '..', '.env') });
const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const header = { alg: 'HS256', typ: 'JWT' };
const payload = { user: { id: 'server-tmp-user' }, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 };
const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const headerB = base64url(header);
const payloadB = base64url(payload);
const signingInput = `${headerB}.${payloadB}`;
const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
console.log(`${signingInput}.${signature}`);
