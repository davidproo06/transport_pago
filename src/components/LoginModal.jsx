import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, KeyRound, User, Lock, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginModal() {
  const { login } = useAuth();
  const [roleTab, setRoleTab] = useState('owner'); // 'owner' or 'client'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('davidFF06');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (tab) => {
    setRoleTab(tab);
    setError('');
    if (tab === 'owner') {
      setUsername('admin');
      setPassword('davidFF06');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const user = await login(username.trim(), password.trim());
      // Optional check if they chose a specific tab
      if (roleTab === 'owner' && user.role !== 'owner') {
        // User logged in as client
      }
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 items-center justify-center shadow-xl shadow-indigo-500/25 mb-3 text-white">
            <Bus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">TransPago Móvil</h1>
          <p className="text-sm text-slate-400 mt-1">Gestión de pagos y alertas de transporte</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl mb-6 border border-slate-800/80">
            <button
              type="button"
              onClick={() => handleTabChange('owner')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                roleTab === 'owner'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Propietario
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('client')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                roleTab === 'client'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Cliente
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">
              {roleTab === 'owner' ? 'Acceso de Conductor / Propietario' : 'Portal de Pasajero / Cliente'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {roleTab === 'owner'
                ? 'Controla tus cobros, registra usuarios y gestiona las tarifas.'
                : 'Consulta tus días acumulados, saldo pendiente y fechas de pago.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {roleTab === 'owner' ? 'Usuario del Propietario' : 'Usuario o Teléfono Celular'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={roleTab === 'owner' ? 'admin' : 'Ej: 3001234567'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Helpers */}
          {roleTab === 'owner' && (
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400 mb-2">Acceso del Administrador:</p>
              <div className="inline-flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                <span>Usuario: <strong className="text-indigo-400">admin</strong></span>
                <span>•</span>
                <span>Clave: <strong className="text-indigo-400">davidFF06</strong></span>
              </div>
            </div>
          )}

          {roleTab === 'client' && (
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                ¿Aún no tienes acceso? Pídele a tu conductor / propietario que te registre para ver tus alertas y saldo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
