const transporter = require('../config/mailer');

const FROM_NAME = 'Aura Canela';
const PINK = '#E11D8A';
const INK = '#111111';

const mailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const formatMoney = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value || 0);

const formatOrderItems = (items) =>
  (items || [])
    .map((i) => {
      const extra = [i.talla, i.color].filter(Boolean).join(' · ');
      return `• ${i.nombre} x${i.cantidad}${extra ? ` (${extra})` : ''} — ${formatMoney(i.precio * i.cantidad)}`;
    })
    .join('<br/>');

const layout = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F5F3EE;padding:24px">
    <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #eee">
      <p style="letter-spacing:3px;text-transform:uppercase;font-size:11px;color:${PINK};font-weight:700;margin:0 0 8px">Aura Canela</p>
      <h2 style="color:${INK};margin:0 0 16px">${title}</h2>
      <div style="color:#444;font-size:15px;line-height:1.6">${body}</div>
    </div>
  </div>
`;

const sendMail = async ({ to, subject, html }) => {
  if (!mailConfigured()) {
    console.warn(`SMTP no configurado, se omite email: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

const customerName = (order) =>
  order.usuario
    ? `${order.usuario.nombre} ${order.usuario.apellido}`
    : `${order.guestData?.nombre || ''} ${order.guestData?.apellido || ''}`.trim();

const trackHint = (order) => {
  const front = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  const email = order.usuario?.email || order.guestData?.email || '';
  if (!front) return `Código de pedido: <strong>${order.codigo}</strong>`;
  return `Código de pedido: <strong>${order.codigo}</strong><br/>Seguí el estado en: ${front}/pedido`;
};

const sendOrderConfirmationToUser = async (email, order) => {
  if (!email) return;
  const name = customerName(order);
  await sendMail({
    to: email,
    subject: `Recibimos tu pedido #${order.codigo} — Aura Canela`,
    html: layout(
      `¡Gracias${name ? `, ${name}` : ''}!`,
      `${trackHint(order)}<br/><br/>
       ${formatOrderItems(order.items)}<br/><br/>
       <strong>Total: ${formatMoney(order.total)}</strong><br/>
       Pago: ${order.metodoPago} (${order.estadoPago})`
    ),
  });
};

const sendOrderNotificationToAdmin = async (order) => {
  if (!process.env.ADMIN_EMAIL) return;
  const recipientEmail = order.usuario?.email || order.guestData?.email;
  await sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `Nuevo pedido #${order.codigo}`,
    html: layout(
      'Nuevo pedido',
      `<strong>${customerName(order)}</strong><br/>
       ${recipientEmail || ''}<br/>
       ${order.guestData?.telefono || order.usuario?.telefono || ''}<br/><br/>
       Envío: ${order.datosEnvio?.servicio || order.datosEnvio?.tipo || '—'} — ${formatMoney(order.datosEnvio?.costo)}<br/>
       CP: ${order.datosEnvio?.codigoPostal || '—'}<br/><br/>
       ${formatOrderItems(order.items)}<br/><br/>
       <strong>Total: ${formatMoney(order.total)}</strong>`
    ),
  });
};

const sendShippingCodeEmail = async (email, order) => {
  if (!email) return;
  const tracking = order.datosEnvio?.trackingNumber;
  await sendMail({
    to: email,
    subject: `Tu pedido #${order.codigo} fue enviado — Aura Canela`,
    html: layout(
      'Tu pedido está en camino',
      `${trackHint(order)}<br/>
       ${tracking ? `Seguimiento del correo: <strong>${tracking}</strong><br/>` : ''}
       Te avisamos cualquier novedad.`
    ),
  });
};

const sendOrderCancelledEmail = async (email, order) => {
  if (!email) return;
  await sendMail({
    to: email,
    subject: `Pedido #${order.codigo} cancelado — Aura Canela`,
    html: layout(
      'Pedido cancelado',
      `El pedido <strong>#${order.codigo}</strong> fue cancelado.<br/>
       Si no lo pediste vos, escribinos y lo vemos juntas.`
    ),
  });
};

const sendPasswordResetEmail = async (email, nombre, resetUrl) => {
  await sendMail({
    to: email,
    subject: 'Recuperá tu contraseña — Aura Canela',
    html: layout(
      `Hola${nombre ? ` ${nombre}` : ''}`,
      `Pediste recuperar tu contraseña. El enlace vale 1 hora:<br/><br/>
       <a href="${resetUrl}" style="display:inline-block;background:${PINK};color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Cambiar contraseña</a><br/><br/>
       Si no fuiste vos, ignorá este mail.`
    ),
  });
};

module.exports = {
  sendOrderConfirmationToUser,
  sendOrderNotificationToAdmin,
  sendShippingCodeEmail,
  sendOrderCancelledEmail,
  sendPasswordResetEmail,
};
