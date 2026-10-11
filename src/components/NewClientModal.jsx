import React, { useState } from 'react';
import { clientsApi, formatCurrency } from '../services/api';
import { X, UserPlus, Calendar, Phone, DollarSign, Clock, ShieldAlert, KeyRound, Copy, Check, FileText } from 'lucide-react';

export default function NewClientModal({ onClose, onClientCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [modality, setModality] = useState('diario'); // 'diario' or 'semanal'
  const [price, setPrice] = useState(modality === 'diario' ? '5000' : '30000');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeDaysType, setActiveDaysType] = useState('1,2,3,4,5'); // Mon-Fri default
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  // Update default price when modality changes
  const handleModalityChange = (newMod) => {
    setModality(newMod);
    if (newMod === 'diario') {
      setPrice('5000');
    } else {
      setPrice('30000');
    }
  };

  // Auto-generate username & password when typing phone
  const handlePhoneChange = (val) => {
    setPhone(val);
    const clean = val.replace(/\D/g, '');
    if (!username && clean) {
      setUsername(clean);
    }
    if (!password && clean.length >= 4) {
      setPassword(clean.slice(-4));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim() || !price) {
      setError('Por favor completa el nombre, teléfono y precio');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        modality,
        price: Number(price),
        start_date: startDate,
        active_days: modality === 'diario' ? activeDaysType : null,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await clientsApi.create(data);
      setCreatedInfo(res);
      onClientCreated(res.client);
    } catch (err) {
      setError(err.message || 'Error al registrar nuevo cliente');
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdInfo) return;
    const text = `Hola ${name}, bienvenido al servicio de transporte.\nPuedes ingresar a la app para ver tus días, saldo y alertas:\n👤 Usuario: ${createdInfo.initialCredentials.username}\n🔑 Clave: ${createdInfo.initialCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ingresar Nuevo Cliente</h3>
              <p className="text-xs text-slate-400">Asigna su tarifa por día o por semana</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdInfo ? (
          /* Success Screen with Client Access Credentials */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">¡Cliente Registrado con Éxito!</h4>
            <p className="text-xs text-slate-300">
              Se ha creado el usuario para <strong className="text-white">{name}</strong> con tarifa{' '}
              <strong className="text-emerald-400">{formatCurrency(Number(price))}</strong> por{' '}
              {modality === 'diario' ? 'día' : 'semana'}.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Datos de acceso del cliente para su celular:
              </p>
              <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Usuario:</span>
                <span className="font-mono font-bold text-indigo-300">
                  {createdInfo.initialCredentials.username}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-400">Contraseña:</span>
                <span className="font-mono font-bold text-indigo-300">
                  {createdInfo.initialCredentials.password}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyCredentials}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  ¡Copiado para enviar por WhatsApp!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar mensaje de bienvenida y clave
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Listo, ir a la lista de clientes
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Carlos Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Ej: 3001234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Modality Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Modalidad de Cobro *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleModalityChange('diario')}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                    modality === 'diario'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 text-indigo-400">
                    <Clock className="w-4 h-4" /> Por Día (Diario)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Plazo de 3 días para pagar. Se acumula cada día de viaje.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModalityChange('semanal')}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col gap-1 ${
                    modality === 'semanal'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5 text-indigo-400">
                    <Calendar className="w-4 h-4" /> Por Semana (Semanal)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Plazo de 2 sem. Llamado en 1ª sem. En 3ª sem: +15% mora.
                  </span>
                </button>
              </div>
            </div>

            {/* Price & Start Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Precio a Pagar ({modality === 'diario' ? 'por Día' : 'por Semana'}) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                    $
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej: 2.50 o 5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fecha de Inicio del Servicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* If Daily: choose days per week */}
            {modality === 'diario' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Días de Transporte por Semana
                </label>
                <select
                  value={activeDaysType}
                  onChange={(e) => setActiveDaysType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1,2,3,4,5">Lunes a Viernes (5 días de servicio)</option>
                  <option value="1,2,3,4,5,6">Lunes a Sábado (6 días de servicio)</option>
                  <option value="all">Todos los días (7 días de servicio)</option>
                </select>
              </div>
            )}

            {/* Client App Credentials */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                <KeyRound className="w-3.5 h-3.5" />
                Acceso del Pasajero a la Aplicación Móvil
              </div>
              <p className="text-[11px] text-slate-400">
                El pasajero podrá iniciar sesión en la app para ver sus alertas y saldo pendiente.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Teléfono o apodo"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Contraseña</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ej: 1234"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ruta / Parada / Observaciones (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Recoger en Estación Norte 6:30am..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Registrar y Aplicar Precio
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
