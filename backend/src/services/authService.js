const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Cart = require('../models/Cart');
const { sendPasswordResetEmail } = require('../utils/sendNotifications');
const {
  generateAccessToken,
  generateRefreshToken,
  clearRefreshTokenCookie,
} = require('../utils/generateToken');

const register = async ({ nombre, apellido, email, password, telefono }) => {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('El email ya está registrado.'), { statusCode: 400 });

  const user = await User.create({ nombre, apellido, email, password, telefono });
  return user;
};

const login = async (email, password) => {
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) throw Object.assign(new Error('Credenciales inválidas.'), { statusCode: 401 });

  const valid = await user.comparePassword(password);
  if (!valid) throw Object.assign(new Error('Credenciales inválidas.'), { statusCode: 401 });

  return user;
};

const refreshTokens = async (oldToken) => {
  const stored = await RefreshToken.findOne({ token: oldToken, revoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token inválido o expirado.'), { statusCode: 401 });
  }

  // Rotate: revoke old, issue new
  stored.revoked = true;
  await stored.save();

  const newRefreshToken = await generateRefreshToken(stored.usuario);
  const newAccessToken = generateAccessToken(stored.usuario);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (token, res) => {
  if (token) {
    await RefreshToken.updateOne({ token }, { revoked: true });
  }
  clearRefreshTokenCookie(res);
};

const mergeGuestCart = async (userId, guestItems) => {
  if (!guestItems || !guestItems.length) return;

  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) {
    cart = new Cart({ usuario: userId, items: [] });
  }

  for (const guestItem of guestItems) {
    const existing = cart.items.find(
      (i) => i.producto.toString() === guestItem.producto
    );
    if (existing) {
      existing.cantidad += guestItem.cantidad;
    } else {
      cart.items.push({ producto: guestItem.producto, cantidad: guestItem.cantidad });
    }
  }
  await cart.save();
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim(), isActive: true });
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const front = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const resetUrl = `${front}/recuperar/${rawToken}`;
  await sendPasswordResetEmail(user.email, user.nombre, resetUrl);
};

const resetPassword = async (token, password) => {
  if (!token || !password || password.length < 6) {
    throw Object.assign(new Error('La contraseña debe tener al menos 6 caracteres.'), { statusCode: 400 });
  }
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
    isActive: true,
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw Object.assign(new Error('El enlace expiró o no es válido. Pedí uno nuevo.'), { statusCode: 400 });
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
};

module.exports = { register, login, refreshTokens, logout, mergeGuestCart, forgotPassword, resetPassword };
