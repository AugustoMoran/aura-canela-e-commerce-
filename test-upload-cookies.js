const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Test user credentials
const testUser = {
  email: 'test-upload-' + Date.now() + '@example.com',
  password: 'Test123456'
};

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

// Store cookies from responses
let cookies = [];

// Step 1: Register
console.log('\n🔐 Step 1: Registering test user...');
const registerBody = JSON.stringify({
  nombre: 'Test',
  apellido: 'Upload',
  email: testUser.email,
  password: testUser.password,
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
  // Capture cookies from Set-Cookie header
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
      loginUser();
    } else {
      // Try to login anyway
      console.log('   Registration skipped (status: ' + res.statusCode + ')');
      loginUser();
    }
  });
});

registerReq.on('error', () => {
  console.log('   Registration error, trying login...');
  loginUser();
});

registerReq.write(registerBody);
registerReq.end();

function loginUser() {
  console.log('\n🔐 Step 2: Logging in...');
  const loginBody = JSON.stringify({
    email: testUser.email,
    password: testUser.password
  });

  const loginOptions = {
    hostname: 'm-sports-backend.fly.dev',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginBody)
    },
    timeout: 10000
  };

  const loginReq = https.request(loginOptions, (res) => {
    // Capture cookies from login response
    const setCookieHeaders = res.headers['set-cookie'] || [];
    cookies = []; // Reset cookies to only use login cookies
    setCookieHeaders.forEach(cookie => {
      cookies.push(cookie);
      const cookieName = cookie.split('=')[0];
      console.log(`   Captured cookie: ${cookieName}`);
    });

    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode !== 200) {
          console.log('❌ Login failed:', response.message || response.error);
          process.exit(1);
        }
        
        console.log('✅ Login successful!');
        
        // Upload with cookies
        uploadWithCookies();
      } catch (e) {
        console.log('❌ Login error:', e.message);
        console.log('Response:', data);
        process.exit(1);
      }
    });
  });

  loginReq.on('error', (e) => {
    console.error('❌ Login request error:', e.message);
    process.exit(1);
  });

  loginReq.write(loginBody);
  loginReq.end();
}

function uploadWithCookies() {
  console.log('\n📤 Step 3: Uploading image with cookies...');
  console.log('   Total cookies:', cookies.length);
  
  const file = fs.readFileSync(testImagePath);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="test-upload.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    file,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  // Build Cookie header from captured cookies
  const cookieHeader = cookies
    .map(c => c.split(';')[0]) // Get just the name=value part
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

  console.log('   Sending with cookies:', cookieHeader.substring(0, 50) + '...');

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
        console.log('\n❌ Upload response error:', e.message);
        console.log('Raw response:', data);
        process.exit(1);
      }
    });
  });

  uploadReq.on('error', (e) => {
    console.error('\n❌ Upload request error:', e.message);
    process.exit(1);
  });

  uploadReq.on('timeout', () => {
    console.error('\n❌ Upload request timeout');
    uploadReq.destroy();
    process.exit(1);
  });

  uploadReq.write(body);
  uploadReq.end();
}
