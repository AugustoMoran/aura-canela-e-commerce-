import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForgotPasswordMutation } from '../services/authApi';
import usePageMeta from '../hooks/usePageMeta';

const ForgotPassword = () => {
  usePageMeta({ title: 'Recuperar contraseña' });
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      setSent(true);
    } catch (err) {
      toast.error(err?.data?.message || 'No se pudo enviar el mail');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-black text-ink mb-2">Recuperar contraseña</h1>
        <p className="text-sm text-gray-500 mb-6">
          Te mandamos un enlace al mail. Vale 1 hora.
        </p>
        {sent ? (
          <p className="text-sm text-green-700 bg-green-50 rounded-xl p-4">
            Si el email está registrado, vas a recibir el enlace. Revisá también spam.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="input-field"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-primary-600 font-medium">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
