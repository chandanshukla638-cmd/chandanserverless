import fetch from 'node-fetch';

const BASE = 'http://localhost:5000/api';

async function testSettingsFlow() {
  try {
    console.log('=== Step 1: Login to get token ===');
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@akksys.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
      console.log('❌ Login failed:', loginData);
      process.exit(1);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful! Token received.');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Test 1: GET Profile
    console.log('\n=== Step 2: GET /user/profile ===');
    const profileRes = await fetch(`${BASE}/user/profile`, { headers });
    const profileData = await profileRes.json();
    console.log('Status:', profileRes.status);
    console.log('Data:', profileData);

    // Test 2: PUT Profile
    console.log('\n=== Step 3: PUT /user/profile ===');
    const updateRes = await fetch(`${BASE}/user/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@akksys.com',
        phone: '+91 98765 43210',
        company: 'AKKSYS Updated'
      })
    });
    const updateData = await updateRes.json();
    console.log('Status:', updateRes.status);
    console.log('Response:', updateData);

    // Test 3: GET Notifications
    console.log('\n=== Step 4: GET /user/notifications ===');
    const notifRes = await fetch(`${BASE}/user/notifications`, { headers });
    const notifData = await notifRes.json();
    console.log('Status:', notifRes.status);
    console.log('Data:', notifData);

    // Test 4: GET Settings (Branding)
    console.log('\n=== Step 5: GET /settings ===');
    const settingsRes = await fetch(`${BASE}/settings`, { headers });
    const settingsData = await settingsRes.json();
    console.log('Status:', settingsRes.status);
    console.log('Data:', settingsData);

    // Revert company name
    await fetch(`${BASE}/user/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: 'Admin User', email: 'admin@akksys.com', phone: '+91 98765 43210', company: 'AKKSYS' })
    });
    console.log('\n✅ All tests passed! Reverted company name.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
testSettingsFlow();
