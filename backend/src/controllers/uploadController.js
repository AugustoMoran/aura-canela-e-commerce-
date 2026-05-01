const { cloudinary, initCloudinary } = require('../config/cloudinary');
const { getUsageReport } = require('../services/cloudinaryService');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Ensure cloudinary is initialized BEFORE creating storage
const getUpload = () => {
  // Reinitialize cloudinary with current env vars
  console.log('🔵 Initializing Cloudinary for upload...');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
  initCloudinary();
  
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      
      const baseParams = {
        folder: 'ecommerce',
        resource_type: isVideo ? 'video' : 'image',
      };

      if (isVideo) {
        return {
          ...baseParams,
          allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
        };
      } else {
        return {
          ...baseParams,
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
        };
      }
    },
  });

  return multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      const allowed = [...allowedImages, ...allowedVideos];
      
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Formato no permitido. Solo JPEG, PNG, WEBP, MP4, WEBM, MOV, AVI.'));
      }
      cb(null, true);
    },
  });
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió archivo.' });
    console.log('✅ Upload successful:', req.file.path);
    res.json({ url: req.file.path, publicId: req.file.filename });
  } catch (error) {
    console.log('🔴 Upload error:', error.message);
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId, isVideo } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId requerido.' });
    
    // Re-ensure cloudinary is initialized
    initCloudinary();
    
    const resourceType = isVideo ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {
      if (resourceType === 'image') {
        return cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }
      throw new Error('No se pudo eliminar el archivo.');
    });
    
    res.json({ message: 'Archivo eliminado.' });
  } catch (error) {
    next(error);
  }
};

const getStorageUsage = async (req, res, next) => {
  try {
    const report = await getUsageReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUpload, uploadImage, deleteImage, getStorageUsage };
