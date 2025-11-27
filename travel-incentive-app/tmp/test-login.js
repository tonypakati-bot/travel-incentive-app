import axios from 'axios';

async function testLogin() {
  try {
    const base = process.env.API_BASE || '/api';
    const loginRes = await axios.post(`${base}/auth/login`, {
      email: 'mario.rossi@bevnet.it',
      password: 'Test123!'
    });
    console.log('Login response data:', loginRes.data);
    const token = loginRes.data.token;
    const profileRes = await axios.get(`${base}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Profile:', profileRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

testLogin();
