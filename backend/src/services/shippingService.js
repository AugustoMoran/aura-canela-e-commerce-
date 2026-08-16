const ShippingConfig = require('../models/ShippingConfig');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { ShippingProviderFactory } = require('./shippingProviders');
const { createNotification } = require('./notificationService');

// Obtener o crear la configuración de envíos
const getShippingConfig = async () => {
  let config = await ShippingConfig.findOne({ provider: 'correoargentino' });
  if (!config) {
    config = await ShippingConfig.create({
      provider: 'correoargentino',
      activo: true,
      ambiente: 'sandbox',
    });
  }
  return config;
};

// Actualizar configuración
const updateShippingConfig = async (data) => {
  let config = await ShippingConfig.findOne({ provider: 'correoargentino' });
  if (!config) {
    config = new ShippingConfig({ provider: 'correoargentino' });
  }

  Object.assign(config, data);
  await config.save();
  return config;
};

// Cotizar envío según items y CP destino
const calculateShippingQuote = async ({ items, destinationZip, providerName = 'correoargentino' }) => {
  if (!destinationZip || !/^\d{4}$/.test(destinationZip.trim())) {
    throw new Error('Debe proporcionar un código postal argentino válido (4 dígitos).');
  }

  const config = await getShippingConfig();
  if (!config.activo) {
    throw new Error('El servicio de envío no está activo en este momento.');
  }

  // Verificar productos y calcular peso y dimensiones totales
  let totalWeight = 0; // en kg
  let totalVolume = 0; // en cm3
  let maxLargo = 0;
  let maxAncho = 0;

  const missingSpecsProducts = [];

  for (const item of items) {
    let prod = null;

    // Soporte si es un ítem normal o un pack
    if (item.producto) {
      if (typeof item.producto === 'object') {
        prod = item.producto;
      } else {
        prod = await Product.findById(item.producto);
      }
    } else if (item.isPack && item.packInfo?.productosSeleccionados) {
      // Para packs, iteramos sobre los productos del pack
      for (const pSel of item.packInfo.productosSeleccionados) {
        const subProd = await Product.findById(pSel.producto);
        if (subProd) {
          const qty = pSel.cantidad || 1;
          const peso = subProd.peso || 0;
          const largo = subProd.largo || 0;
          const ancho = subProd.ancho || 0;
          const alto = subProd.alto || 0;

          if (!peso || !largo || !ancho || !alto) {
            missingSpecsProducts.push(subProd.nombre);
          }

          totalWeight += peso * qty;
          totalVolume += (largo * ancho * alto) * qty;
          if (largo > maxLargo) maxLargo = largo;
          if (ancho > maxAncho) maxAncho = ancho;
        }
      }
      continue;
    }

    if (prod) {
      const qty = item.cantidad || 1;
      const peso = prod.peso || 0;
      const largo = prod.largo || 0;
      const ancho = prod.ancho || 0;
      const alto = prod.alto || 0;

      // REQUERIMIENTO 2: Si el producto no tiene peso o medidas cargadas, solicitar completar dichos campos
      if (!peso || !largo || !ancho || !alto) {
        missingSpecsProducts.push(prod.nombre);
      }

      totalWeight += peso * qty;
      totalVolume += (largo * ancho * alto) * qty;
      if (largo > maxLargo) maxLargo = largo;
      if (ancho > maxAncho) maxAncho = ancho;
    }
  }

  if (missingSpecsProducts.length > 0) {
    const errorMsg = `Para calcular el envío, los siguientes productos requieren especificar peso y dimensiones: ${missingSpecsProducts.join(', ')}`;
    const err = new Error(errorMsg);
    err.status = 400;
    throw err;
  }

  // Estimación de altura de la caja apilada a partir del volumen total
  const baseArea = Math.max(20 * 15, maxLargo * maxAncho);
  const estimatedHeight = Math.ceil(totalVolume / baseArea) || 10;
  const estimatedLargo = Math.max(15, maxLargo);
  const estimatedAncho = Math.max(10, maxAncho);

  const provider = ShippingProviderFactory.getProvider(providerName, config);

  const options = await provider.quoteShipping({
    originZip: config.codigoPostalOrigen || '1000',
    destinationZip: destinationZip.trim(),
    weight: Math.max(0.2, totalWeight),
    length: estimatedLargo,
    width: estimatedAncho,
    height: Math.max(5, estimatedHeight),
  });

  return {
    pesoTotalKg: totalWeight,
    dimensiones: {
      largo: estimatedLargo,
      ancho: estimatedAncho,
      alto: estimatedHeight,
    },
    opciones: options,
  };
};

// Generar envío en Correo Argentino cuando el pedido se despacha
const processOrderShipment = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Pedido no encontrado');

  const config = await getShippingConfig();
  const provider = ShippingProviderFactory.getProvider('correoargentino', config);

  try {
    const shipmentResult = await provider.createShipment(order);
    
    order.datosEnvio = order.datosEnvio || {};
    order.datosEnvio.trackingNumber = shipmentResult.trackingNumber;
    order.datosEnvio.estadoCorreo = shipmentResult.estado || 'Admitido';
    
    if (!order.datosEnvio.historialEnvio) {
      order.datosEnvio.historialEnvio = [];
    }

    order.datosEnvio.historialEnvio.push({
      fecha: new Date(),
      estado: shipmentResult.estado || 'Admitido',
      descripcion: 'Envío registrado exitosamente en Correo Argentino',
    });

    await order.save();

    // Notificación
    await createNotification({
      tipo: 'envio',
      titulo: 'Envío Creado',
      descripcion: `Se generó el seguimiento ${shipmentResult.trackingNumber} para el pedido ${order.codigo}`,
      entidadRelacionada: 'Order',
      entidadId: order._id,
    });

    return order;
  } catch (error) {
    await createNotification({
      tipo: 'envio',
      titulo: 'Error en Envío',
      descripcion: `Error al crear envío en Correo Argentino para pedido ${order.codigo}: ${error.message}`,
      entidadRelacionada: 'Order',
      entidadId: order._id,
    });
    throw error;
  }
};

// Job de actualización de estados de envíos activos
const syncPendingShipmentsTracking = async () => {
  const config = await getShippingConfig();
  const provider = ShippingProviderFactory.getProvider('correoargentino', config);

  // Buscar órdenes despachadas no finalizadas
  const orders = await Order.find({
    'datosEnvio.trackingNumber': { $ne: null },
    estadoEnvio: { $nin: ['entregado', 'cancelado'] },
  });

  for (const order of orders) {
    try {
      const trackingNum = order.datosEnvio.trackingNumber;
      if (!trackingNum) continue;

      const status = await provider.getTrackingStatus(trackingNum);

      if (status && status.estadoActual !== order.datosEnvio.estadoCorreo) {
        order.datosEnvio.estadoCorreo = status.estadoActual;
        
        if (status.eventos && status.eventos.length > 0) {
          const ultimoEvento = status.eventos[status.eventos.length - 1];
          order.datosEnvio.historialEnvio.push({
            fecha: new Date(),
            estado: ultimoEvento.estado,
            descripcion: ultimoEvento.descripcion,
          });
        }

        if (status.estadoActual.toLowerCase().includes('entregado')) {
          order.estadoEnvio = 'entregado';
          await createNotification({
            tipo: 'envio',
            titulo: 'Envío Entregado',
            descripcion: `El paquete del pedido ${order.codigo} ha sido entregado al cliente.`,
            entidadRelacionada: 'Order',
            entidadId: order._id,
          });
        } else {
          await createNotification({
            tipo: 'envio',
            titulo: 'Actualización de Envío',
            descripcion: `Pedido ${order.codigo}: ${status.estadoActual}`,
            entidadRelacionada: 'Order',
            entidadId: order._id,
          });
        }

        await order.save();
      }
    } catch (err) {
      console.error(`Error sincronizando tracking para orden ${order.codigo}:`, err.message);
    }
  }
};

module.exports = {
  getShippingConfig,
  updateShippingConfig,
  calculateShippingQuote,
  processOrderShipment,
  syncPendingShipmentsTracking,
};
