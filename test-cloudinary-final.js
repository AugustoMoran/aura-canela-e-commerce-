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
console.log('✅ Test image created');

const file = fs.readFileSync(testImagePath);
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\n`),
  Buffer.from('Content-Disposition: form-data; name="image"; filename="test-upload.png"\r\n'),
  Buffer.from('Content-Type: image/png\r\n\r\n'),
  file,
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);

console.log('\n📤 Testing Cloudinary SDK upload...');
console.log('   URL: https://m-sports-backend.fly.dev/api/upload/test/cloudinary');
console.log('   File size:', file.length, 'bytes');

const uploadOptions = {
  hostname: 'm-sports-backend.fly.dev',
  port: 443,
  path: '/api/upload/test/cloudinary',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  },
  timeout: 15000
};

const uploadReq = https.request(uploadOptions, (res) => {
  console.log('\n📥 Response Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n✅✅✅ CLOUDINARY UPLOAD SUCCESSFUL! ✅✅✅');
        console.log('\nResponse:');
        console.log(JSON.stringify(response, null, 2));
        console.log('\n📸 Image URL:', response.data?.url);
        console.log('📍 Public ID:', response.data?.publicId);
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
