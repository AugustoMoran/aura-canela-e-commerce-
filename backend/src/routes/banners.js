const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, adminOnly } = require('../middleware/auth');

// Test endpoint - ver datos crudos de banners
router.get('/test/debug', async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const Order = require('../models/Order');
    
    const banners = await Banner.find({ activo: true }).lean();
    const lastOrder = await Order.findOne().sort({ createdAt: -1 }).lean();
    
    res.json({
      banners: {
        count: banners.length,
        data: banners.map(b => ({
          _id: b._id,
          titulo: b.titulo,
          video: b.video,
          imagen: b.imagen,
          mostrarTexto: b.mostrarTexto,
          mostrarBoton: b.mostrarBoton,
          autoplay: b.autoplay,
        }))
      },
      lastOrder: lastOrder ? {
        _id: lastOrder._id,
        codigo: lastOrder.codigo,
        mpPreferenceId: lastOrder.mpPreferenceId,
        mpPaymentId: lastOrder.mpPaymentId,
        estadoPago: lastOrder.estadoPago,
        metodoPago: lastOrder.metodoPago,
      } : null,
      mpEnv: {
        hasAccessToken: !!process.env.MP_ACCESS_TOKEN,
        hasPublicKey: !!process.env.MP_PUBLIC_KEY,
        tokenLength: process.env.MP_ACCESS_TOKEN?.length || 0,
        publicKeyLength: process.env.MP_PUBLIC_KEY?.length || 0,
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', getBanners);
router.post('/', protect, adminOnly, createBanner);
router.put('/:id', protect, adminOnly, updateBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

module.exports = router;
