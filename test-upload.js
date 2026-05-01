const https = require('https');
const fs = require('fs');
const path = require('path');

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
console.log('✅ Test image created at', testImagePath);

const file = fs.readFileSync(testImagePath);
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\n`),
  Buffer.from('Content-Disposition: form-data; name="file"; filename="test-upload.png"\r\n'),
  Buffer.from('Content-Type: image/png\r\n\r\n'),
  file,
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);

console.log('\n📤 Testing upload endpoint...');
console.log('   URL: https://m-sports-backend.fly.dev/api/upload');
console.log('   File size:', file.length, 'bytes');

const options = {
  hostname: 'm-sports-backend.fly.dev',
  port: 443,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  },
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log('\n📥 Response Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n✅ Response (JSON):\n', JSON.stringify(json, null, 2));
      process.exit(0);
    } catch (e) {
      console.log('\n📋 Response (raw):\n', data);
      process.exit(0);
    }
  });
});

req.on('error', (e) => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('\n❌ Request timeout');
  req.destroy();
  process.exit(1);
});

req.write(body);
req.end();
