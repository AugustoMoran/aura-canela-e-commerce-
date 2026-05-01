const https = require('https');
const fs = require('fs');
const path = require('path');

// Test user credentials
const testUserEmail = 'test-admin-' + Date.now() + '@example.com';
const testUserPassword = 'Admin123456';

// Create test image
const testImagePath = path.join(__dirname, 'test-upload.png');
const pngBytes = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
  0x42, 0x60, 0x82
]);

fs.writeFileSync(testImagePath, pngBytes);
console.log('✅ Test image created');

// Store cookies
let cookies = [];

// Step 1: Register user
console.log('\n🔐 Step 1: Registering admin user...');
const registerBody = JSON.stringify({
  nombre: 'Admin',
  apellido: 'Test',
  email: testUserEmail,
  password: testUserPassword,
  telefono: '+5491234567890'
});

const registerOptions = {
  hostname: 'm-sports-backend.fly.dev',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(registerBody)
  },
  timeout: 10000
};

const registerReq = https.request(registerOptions, (res) => {
  const setCookieHeaders = res.headers['set-cookie'] || [];
  setCookieHeaders.forEach(cookie => {
    const cookieName = cookie.split('=')[0];
    cookies.push(cookie);
    console.log(`   Captured cookie: ${cookieName}`);
  });

  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('✅ Registration successful!');
      const response = JSON.parse(data);
      const userId = response.user._id;
      
      // Update user role to admin via direct API call
      updateUserRole(userId);
    } else {
      console.log('❌ Registration failed');
      const response = JSON.parse(data);
      console.log('Response:', response);
      process.exit(1);
    }
  });
});

registerReq.on('error', (e) => {
  console.error('❌ Register error:', e.message);
  process.exit(1);
});

registerReq.write(registerBody);
registerReq.end();

function updateUserRole(userId) {
  console.log('\n👑 Step 2: Updating user role to admin...');
  
  const updateBody = JSON.stringify({
    role: 'admin'
  });

  // Build Cookie header
  const cookieHeader = cookies
    .map(c => c.split(';')[0])
    .join('; ');

  const updateOptions = {
    hostname: 'm-sports-backend.fly.dev',
    port: 443,
    path: `/api/users/${userId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateBody),
      'Cookie': cookieHeader
    },
    timeout: 10000
  };

  const updateReq = https.request(updateOptions, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ User role updated to admin!');
        uploadImage();
      } else {
        console.log('❌ Failed to update user role');
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        // Continue anyway with regular user
        uploadImage();
      }
    });
  });

  updateReq.on('error', (e) => {
    console.error('❌ Update error:', e.message);
    process.exit(1);
  });

  updateReq.write(updateBody);
  updateReq.end();
}

function uploadImage() {
  console.log('\n📤 Step 3: Uploading image...');
  
  const file = fs.readFileSync(testImagePath);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="test-upload.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    file,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const cookieHeader = cookies
    .map(c => c.split(';')[0])
    .join('; ');

  const uploadOptions = {
    hostname: 'm-sports-backend.fly.dev',
    port: 443,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
      'Cookie': cookieHeader
    },
    timeout: 15000
  };

  const uploadReq = https.request(uploadOptions, (res) => {
    console.log('   Response Status:', res.statusCode);
    
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('\n✅✅✅ CLOUDINARY UPLOAD SUCCESSFUL! ✅✅✅');
          console.log('\nResponse:');
          console.log(JSON.stringify(response, null, 2));
          process.exit(0);
        } else {
          console.log('\n❌ Upload failed:');
          console.log(JSON.stringify(response, null, 2));
          process.exit(1);
        }
      } catch (e) {
        console.log('\n❌ Response parse error:', e.message);
        console.log('Raw response:', data);
        process.exit(1);
      }
    });
  });

  uploadReq.on('error', (e) => {
    console.error('\n❌ Upload error:', e.message);
    process.exit(1);
  });

  uploadReq.on('timeout', () => {
    console.error('\n❌ Upload timeout');
    uploadReq.destroy();
    process.exit(1);
  });

  uploadReq.write(body);
  uploadReq.end();
}
