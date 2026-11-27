require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const ensurePackIndexes = require('./src/utils/ensurePackIndexes');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await ensurePackIndexes();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
