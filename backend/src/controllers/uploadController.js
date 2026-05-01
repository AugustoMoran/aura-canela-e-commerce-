const { cloudinary, initCloudinary } = require('../config/cloudinary');
const { getUsageReport } = require('../services/cloudinaryService');
const multer = require('multer');

// Memory storage that allows us to process uploads manually to Cloudinary
const memoryStorage = multer.memoryStorage();

// Create multer with memory storage - we'll upload to Cloudinary manually
const getUpload = () => {
  console.log('\n🔵 Creating upload middleware (using manual Cloudinary upload)...');
  
  const upload = multer({
    storage: memoryStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      console.log(`🔍 File filter: ${file.originalname}, mimetype: ${file.mimetype}`);
      const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      const allowed = [...allowedImages, ...allowedVideos];
      
      if (!allowed.includes(file.mimetype)) {
        console.log(`❌ File type rejected: ${file.mimetype}`);
        return cb(new Error('Formato no permitido. Solo JPEG, PNG, WEBP, MP4, WEBM, MOV, AVI.'));
      }
      console.log(`✅ File type accepted: ${file.mimetype}`);
      cb(null, true);
    },
  });

  console.log('✅ Multer instance created successfully\n');
  return upload;
};

// Function to upload buffer to Cloudinary using API
const uploadToCloudinary = async (fileBuffer, filename, mimetype) => {
  console.log(`\n📤 Uploading ${filename} to Cloudinary via HTTP API...`);
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured');
  }

  const isVideo = mimetype.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  
  // Create form data using built-in FormData (Node.js 18+)
  const formData = new FormData();
  
  // Convert buffer to blob
  const blob = new Blob([fileBuffer], { type: mimetype });
  formData.append('file', blob, filename);
  formData.append('folder', 'ecommerce');
  formData.append('public_id', filename.split('.')[0]);
  formData.append('api_key', apiKey);
  
  // Add timestamp for authentication
  const timestamp = Math.floor(Date.now() / 1000);
  formData.append('timestamp', timestamp.toString());
  
  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    console.log(`📡 POST ${uploadUrl}`);
    console.log(`   Cloud Name: ${cloudName}`);
    console.log(`   Resource Type: ${resourceType}`);
    console.log(`   File: ${filename} (${fileBuffer.length} bytes)`);
    console.log(`   API Key: ${apiKey}`);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log(`   Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`🔴 Upload failed. Status: ${response.status}`);
      console.log(`   Response: ${errorText}`);
      throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      console.log(`🔴 Cloudinary error:`, result.error);
      throw new Error(`Cloudinary error: ${result.error.message}`);
    }

    console.log(`✅ Upload successful!`);
    console.log(`   Public ID: ${result.public_id}`);
    console.log(`   URL: ${result.secure_url}`);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (err) {
    console.log(`🔴 Error uploading to Cloudinary:`, err.message);
    throw err;
  }
};

const uploadImage = async (req, res, next) => {
  try {
    const upload = getUpload();
    upload.single('image')(req, res, async (err) => {
      if (err) {
        console.error('🔴 Multer error:', err.message);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      try {
        // Now upload the file from memory to Cloudinary
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        console.log('\n✅ File uploaded successfully');
        console.log(`   URL: ${uploadResult.url}`);
        console.log(`   Public ID: ${uploadResult.publicId}`);

        res.json({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          width: uploadResult.width,
          height: uploadResult.height,
        });
      } catch (cloudinaryErr) {
        console.error('🔴 Cloudinary upload error:', cloudinaryErr.message);
        res.status(500).json({ message: 'Error uploading to Cloudinary: ' + cloudinaryErr.message });
      }
    });
  } catch (error) {
    console.error('🔴 Upload error:', error);
    res.status(500).json({ message: error.message || 'Error uploading image' });
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId, isVideo } = req.body;
    if (!publicId) {
      console.log('❌ No publicId provided for deletion');
      return res.status(400).json({ message: 'publicId requerido.' });
    }
    
    // Re-ensure cloudinary is initialized
    initCloudinary();
    
    const resourceType = isVideo ? 'video' : 'image';
    console.log(`🗑️  Attempting to delete ${resourceType}: ${publicId}`);
    
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {
      if (resourceType === 'image') {
        console.log('   Retrying as video...');
        return cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }
      throw new Error('No se pudo eliminar el archivo.');
    });
    
    console.log('✅ File deleted successfully');
    res.json({ message: 'Archivo eliminado.' });
  } catch (error) {
    console.log('🔴 Delete error:', error.message);
    next(error);
  }
};

const getStorageUsage = async (req, res, next) => {
  try {
    const report = await getUsageReport();
    res.json(report);
  } catch (error) {
    console.log('🔴 Storage usage error:', error.message);
    next(error);
  }
};

module.exports = { getUpload, uploadImage, deleteImage, getStorageUsage };
