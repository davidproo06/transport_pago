import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, LogOut, Settings, User } from 'lucide-react';

export default function Header({ onOpenSettings, onOpenNewClient }) {
  const { user, role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
              TransPago
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {role === 'owner' ? 'Propietario' : 'Pasajero'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">Control de Pagos de Transporte</p>
          </div>
        </div>

        {/* User actions */}
        <div className="flex items-center gap-2">
          {role === 'owner' && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Configuración de cuentas y cobro"
              aria-label="Configuración"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-200">{user?.name || user?.username}</p>
              <p className="text-[11px] text-slate-400">@{user?.username}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
