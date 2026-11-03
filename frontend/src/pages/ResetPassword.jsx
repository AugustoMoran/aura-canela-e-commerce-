import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useResetPasswordMutation } from '../services/authApi';
import usePageMeta from '../hooks/usePageMeta';

const ResetPassword = () => {
  usePageMeta({ title: 'Nueva contraseña' });
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword({ token, password }).unwrap();
      toast.success('Contraseña actualizada');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'El enlace no es válido o expiró');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-black text-ink mb-6">Nueva contraseña</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-primary-600 font-medium">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
