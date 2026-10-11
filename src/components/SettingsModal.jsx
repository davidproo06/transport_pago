import React, { useState, useEffect } from 'react';
import { settingsApi, firebaseApi } from '../services/api';
import { X, Settings, Save, Smartphone, Building, FileText, Check, DollarSign, Database, Cloud, RefreshCw, Key, ChevronDown, ChevronUp } from 'lucide-react';

export default function SettingsModal({ onClose }) {
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('63336030');
  const [yappy, setYappy] = useState('63336030');
  const [banco, setBanco] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Firebase status & configuration
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);
  const [firebaseJsonInput, setFirebaseJsonInput] = useState('');
  const [connectingFirebase, setConnectingFirebase] = useState(false);
  const [firebaseMessage, setFirebaseMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, fbRes] = await Promise.all([
          settingsApi.get().catch(() => ({ settings: {} })),
          firebaseApi.getStatus().catch(() => ({ connected: false, mode: 'Local' })),
        ]);

        const s = settingsRes.settings || {};
        setOwnerName(s.owner_name || 'David (Administrador)');
        setOwnerPhone(s.owner_phone || '63336030');
        setYappy(s.yappy || '63336030');
        setBanco(s.banco || '');
        setPaymentNotes(s.payment_notes || 'Puedes pagar en Efectivo directamente al conductor o por Yappy al 63336030.');

        setFirebaseStatus(fbRes);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await settingsApi.update({
        owner_name: ownerName,
        owner_phone: ownerPhone,
        yappy,
        banco,
        payment_notes: paymentNotes,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectFirebase = async () => {
    if (!firebaseJsonInput.trim()) {
      alert('Por favor pega el contenido de serviceAccountKey.json de tu proyecto de Firebase');
      return;
    }

    setConnectingFirebase(true);
    setFirebaseMessage('');
    try {
      const res = await firebaseApi.configure(firebaseJsonInput.trim());
      setFirebaseMessage(`✅ ${res.message}`);
      setFirebaseStatus({
        connected: true,
        mode: 'Firebase Firestore (Nube)',
        projectId: res.projectId,
      });
      setFirebaseJsonInput('');
      setShowFirebaseSetup(false);
    } catch (err) {
      alert(err.message || 'Error al conectar con Firebase');
    } finally {
      setConnectingFirebase(false);
    }
  };

  const handleSyncFirebase = async () => {
    setConnectingFirebase(true);
    try {
      const res = await firebaseApi.sync();
      alert(`Sincronización exitosa: ${res.message}`);
    } catch (err) {
      alert(err.message || 'Error al sincronizar');
    } finally {
      setConnectingFirebase(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configuración del Administrador</h3>
              <p className="text-xs text-slate-400">Formas de pago y base de datos Firebase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Cargando datos...</div>
        ) : (
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Firebase Database Status Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Base de Datos:
                  </span>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    firebaseStatus?.connected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {firebaseStatus?.connected ? '🟢 Firebase Firestore Activo' : '🟡 SQLite Local (Listo para Firebase)'}
                </span>
              </div>

              {firebaseStatus?.connected ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    Tu aplicación está conectada a la nube de <strong className="text-amber-400">Google Firebase Firestore</strong> en el proyecto <code className="text-indigo-300 font-mono">{firebaseStatus.projectId}</code>.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncFirebase}
                    disabled={connectingFirebase}
                    className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${connectingFirebase ? 'animate-spin' : ''}`} />
                    <span>Sincronizar y respaldar todo a Firestore</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">
                    La app funciona actualmente con la base de datos local. Puedes activar <strong className="text-amber-400">Firebase Firestore</strong> pegando la clave de tu cuenta de servicio.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFirebaseSetup(!showFirebaseSetup)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <span>{showFirebaseSetup ? 'Ocultar configuración de Firebase' : 'Conectar Firebase Firestore'}</span>
                    {showFirebaseSetup ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showFirebaseSetup && (
                    <div className="pt-2 space-y-2 border-t border-slate-800">
                      <p className="text-[11px] text-slate-400">
                        1. En tu consola de <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Firebase</a> ve a: <strong>Configuración del proyecto &gt; Cuentas de servicio &gt; Generar nueva clave privada</strong>.<br />
                        2. Pega el contenido del archivo JSON aquí:
                      </p>
                      <textarea
                        rows={4}
                        value={firebaseJsonInput}
                        onChange={(e) => setFirebaseJsonInput(e.target.value)}
                        placeholder='{"type": "service_account", "project_id": "tu-proyecto", ...}'
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-amber-400 resize-none"
                      />
                      <button
                        type="button"
                        onClick={handleConnectFirebase}
                        disabled={connectingFirebase}
                        className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {connectingFirebase ? (
                          <span>Conectando con Firebase...</span>
                        ) : (
                          <>
                            <Cloud className="w-4 h-4" />
                            <span>Conectar y Sincronizar a Firestore</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {firebaseMessage && (
                <div className="text-xs text-emerald-400 font-medium">
                  {firebaseMessage}
                </div>
              )}
            </div>

            {/* General & Payment Settings Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre del Administrador
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    WhatsApp para Pagos y Alertas
                  </label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="63336030"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Número de Yappy (Para recibir pagos)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={yappy}
                    onChange={(e) => setYappy(e.target.value)}
                    placeholder="63336030"
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Los pasajeros verán este número en su aplicación y enviarán el comprobante a tu WhatsApp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Cuenta Bancaria Opcional
                </label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Ej: Banco General - Ahorros #..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Instrucciones de Pago para el Pasajero
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      ¡Guardado!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Datos
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
