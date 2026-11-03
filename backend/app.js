require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const { apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

// Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const orderRoutes = require('./src/routes/orders');
const cartRoutes = require('./src/routes/cart');
const couponRoutes = require('./src/routes/coupons');
const uploadRoutes = require('./src/routes/upload');
const webhookRoutes = require('./src/routes/webhook');
const bannerRoutes = require('./src/routes/banners');
const popupRoutes = require('./src/routes/popup');
const chatRoutes = require('./src/routes/chat');
const siteSettingsRoutes = require('./src/routes/siteSettings');
const shippingRoutes = require('./src/routes/shipping');
const packRoutes = require('./src/routes/packs');
const notificationRoutes = require('./src/routes/notifications');
const testRoutes = require('./src/routes/test');
const Product = require('./src/models/Product');
const Pack = require('./src/models/Pack');

const app = express();

// Trust proxy for Fly.io / reverse proxies (needed for rate limiter and IP detection)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/+$/, ''),
  'https://aura-canela-e-commerce.vercel.app',
  'https://aura-canela-e-commerce-auracanela.vercel.app',
].filter(Boolean);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhost = origin?.includes('localhost');
      const isAuraVercel = origin?.includes('aura-canela') && origin.endsWith('.vercel.app');

      if (!origin) {
        callback(null, true);
      } else if (allowedOrigins.includes(origin) || isAuraVercel) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'development' && isLocalhost) {
        callback(null, true);
      } else {
        callback(new Error('CORS no permitido'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Webhook raw body (must be before json parser)
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Sanitize NoSQL injection
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/popup', popupRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test', testRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date() });
});

app.get('/api/sitemap.xml', async (req, res) => {
  try {
    const front = (process.env.FRONTEND_URL || 'https://aura-canela-e-commerce.vercel.app').replace(/\/+$/, '');
    const [products, packs] = await Promise.all([
      Product.find({ isActive: true, deletedAt: null }).select('_id updatedAt').lean(),
      Pack.find({ activo: true }).select('_id updatedAt').lean(),
    ]);
    const urls = [
      '',
      '/productos',
      '/contacto',
      '/pedido',
      ...products.map((p) => `/productos/${p._id}`),
      ...packs.map((p) => `/packs/${p._id}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${front}${path}</loc></url>`).join('\n')}
</urlset>`;
    res.header('Content-Type', 'application/xml').send(xml);
  } catch (err) {
    res.status(500).send('sitemap error');
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
