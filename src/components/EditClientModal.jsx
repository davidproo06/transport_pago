import React, { useState } from 'react';
import { clientsApi, formatCurrency } from '../services/api';
import { X, Edit2, Trash2, Key, Phone, Calendar, Clock, AlertTriangle, Check } from 'lucide-react';

export default function EditClientModal({ client, onClose, onClientUpdated, onClientDeleted }) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [modality, setModality] = useState(client.modality);
  const [price, setPrice] = useState(String(client.price));
  const [startDate, setStartDate] = useState(client.start_date);
  const [activeDays, setActiveDays] = useState(client.active_days || '1,2,3,4,5');
  const [isActive, setIsActive] = useState(client.is_active === 1);
  const [notes, setNotes] = useState(client.notes || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        modality,
        price: Number(price),
        start_date: startDate,
        active_days: modality === 'diario' ? activeDays : null,
        is_active: isActive,
        notes: notes.trim(),
        new_password: newPassword.trim() || undefined,
      };

      const res = await clientsApi.update(client.id, data);
      onClientUpdated(res.client);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await clientsApi.delete(client.id);
      onClientDeleted(client.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al eliminar cliente');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Editar Cliente</h3>
              <p className="text-xs text-slate-400">{client.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">¿Eliminar este cliente?</h4>
            <p className="text-xs text-slate-300">
              Se eliminará permanentemente a <strong className="text-white">{client.name}</strong>, su usuario y todo su historial de pagos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                {loading ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Modality & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Modalidad</label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="diario">Por Día (Diario)</option>
                  <option value="semanal">Por Semana (Semanal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Precio ({modality === 'diario' ? 'por Día' : 'por Semana'})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Start Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Fecha de Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Estado del Servicio</label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{isActive ? 'Activo (Viajando)' : 'En Pausa / Inactivo'}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isActive ? 'bg-emerald-500 border-emerald-400' : 'border-slate-600'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              </div>
            </div>

            {/* If Daily: choose days per week */}
            {modality === 'diario' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Días de Servicio por Semana
                </label>
                <select
                  value={activeDays}
                  onChange={(e) => setActiveDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1,2,3,4,5">Lunes a Viernes (5 días)</option>
                  <option value="1,2,3,4,5,6">Lunes a Sábado (6 días)</option>
                  <option value="all">Todos los días (7 días)</option>
                </select>
              </div>
            )}

            {/* Reset Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cambiar Contraseña del Cliente (Dejar en blanco para no modificar)
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva clave..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Observaciones</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
