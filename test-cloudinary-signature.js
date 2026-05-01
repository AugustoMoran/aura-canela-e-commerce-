const crypto = require('crypto');

// Test data - same as in uploadController
const cloudName = 'dvory3d2';
const apiKey = '578319858564676';
const apiSecret = '14QkxKKTnX49fQU-fY1jTjtmCPE';
const filename = 'test-image.jpg';
const timestamp = Math.floor(Date.now() / 1000);

console.log('🔍 Cloudinary Signature Verification\n');
console.log(`Cloud Name: ${cloudName}`);
console.log(`API Key: ${apiKey}`);
console.log(`API Secret: ${apiSecret}`);
console.log(`Filename: ${filename}`);
console.log(`Timestamp: ${timestamp}\n`);

// Create params object (same as uploadController)
const params = {
  folder: 'ecommerce',
  public_id: filename.split('.')[0],
  timestamp: timestamp.toString(),
};

console.log('📋 Parameters:');
console.log(`  folder: ${params.folder}`);
console.log(`  public_id: ${params.public_id}`);
console.log(`  timestamp: ${params.timestamp}\n`);

// Build string to sign (alphabetical order)
const paramsArray = Object.entries(params)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `${key}=${value}`);

console.log('🔤 Sorted params:');
paramsArray.forEach(p => console.log(`  ${p}`));

const paramsString = paramsArray.join('&');
const stringToSign = paramsString + apiSecret;

console.log(`\n📝 String to sign (without secret): ${paramsString}`);
console.log(`📝 String to sign (with secret): ${stringToSign}`);

// Generate SHA1 signature
const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

console.log(`\n✅ Generated SHA1 Signature: ${signature}`);
console.log(`\n📤 FormData would include:`);
console.log(`  file: [buffer]`);
console.log(`  folder: ${params.folder}`);
console.log(`  public_id: ${params.public_id}`);
console.log(`  timestamp: ${params.timestamp}`);
console.log(`  signature: ${signature}`);
console.log(`  api_key: ${apiKey}`);

console.log(`\n🔗 Cloudinary Upload URL:`);
console.log(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
