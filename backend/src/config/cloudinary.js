const cloudinary = require('cloudinary').v2;

// Initialize cloudinary with environment variables
// This ensures variables are read at request time, not module load time
const initCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
};

// Initialize on module load, but can be re-initialized if needed
initCloudinary();

/**
 * Returns current Cloudinary storage usage in MB and percentage of limit.
 */
const getStorageUsage = async () => {
  // Re-ensure config is correct before API call
  initCloudinary();
  
  const result = await cloudinary.api.usage();
  const usedMB = result.storage.usage / (1024 * 1024);
  // credits.limit is in GB (1 credit = 1 GB on Cloudinary plans)
  const limitMB = result.credits?.limit
    ? Math.round(result.credits.limit * 1024)
    : parseInt(process.env.CLOUDINARY_STORAGE_LIMIT_MB || '25000', 10);
  const percentage = result.credits?.used_percent ?? (usedMB / limitMB) * 100;
  return { usedMB: usedMB.toFixed(2), limitMB, percentage: parseFloat(percentage).toFixed(1) };
};

module.exports = { cloudinary, getStorageUsage, initCloudinary };
