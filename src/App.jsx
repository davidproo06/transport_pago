import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import OwnerDashboard from './components/OwnerDashboard';
import ClientPortal from './components/ClientPortal';
import SettingsModal from './components/SettingsModal';

function MainLayout() {
  const { isAuthenticated, loading, role } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-medium">Iniciando TransPago Móvil...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-1 pb-12">
        {role === 'owner' ? (
          <OwnerDashboard onOpenSettings={() => setShowSettings(true)} />
        ) : (
          <ClientPortal />
        )}
      </main>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
