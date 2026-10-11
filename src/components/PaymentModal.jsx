import React, { useState } from 'react';
import { paymentsApi, formatCurrency, formatDate } from '../services/api';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, FileText, AlertCircle } from 'lucide-react';

export default function PaymentModal({ client, onClose, onPaymentSuccess }) {
  const [amount, setAmount] = useState(client.debt.totalToPay > 0 ? client.debt.totalToPay : client.price);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debt = client.debt;

  const handleFullPayClick = () => {
    setAmount(debt.totalToPay);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const result = await paymentsApi.register(
        client.id,
        numAmount,
        paymentDate,
        method,
        notes.trim()
      );
      onPaymentSuccess(result.client);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrar Pago</h3>
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

        {/* Current debt recap */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Total adeudado actualmente:</span>
            <span className="text-lg font-bold text-white">
              {formatCurrency(debt.totalToPay)}
            </span>
          </div>

          {debt.surchargeAmount > 0 && (
            <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 mb-2">
              Incluye recargo del 15% (+{formatCurrency(debt.surchargeAmount)}) por pago atrasado en 3ª semana.
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Modalidad:{' '}
              <strong className="text-slate-200 capitalize">{client.modality}</strong> (
              {formatCurrency(client.price)}/{client.modality === 'diario' ? 'día' : 'sem'})
            </span>
            <span>
              Lleva acumulado:{' '}
              <strong className="text-slate-200">
                {debt.unpaidUnits} {debt.unitType}
              </strong>
            </span>
          </div>

          {/* Quick preset buttons: Pagar todo, solo un día/semana, o cierta cantidad */}
          <div className="mt-3 space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Seleccionar monto a abonar:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {debt.totalToPay > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(debt.totalToPay)}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                    Number(amount) === debt.totalToPay
                      ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Pagar Todo ({formatCurrency(debt.totalToPay)})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAmount(client.price)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                  Number(amount) === client.price
                    ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-indigo-300 hover:bg-slate-800'
                }`}
              >
                <span>
                  Pagar 1 {client.modality === 'diario' ? 'Día' : 'Semana'} ({formatCurrency(client.price)})
                </span>
              </button>

              {debt.unpaidUnits >= 2 && (
                <button
                  type="button"
                  onClick={() => setAmount(client.price * 2)}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                    Number(amount) === client.price * 2
                      ? 'bg-indigo-500/25 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>
                    Pagar 2 {client.modality === 'diario' ? 'Días' : 'Semanas'} ({formatCurrency(client.price * 2)})
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAmount('')}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                  amount === '' || (Number(amount) !== debt.totalToPay && Number(amount) !== client.price && Number(amount) !== client.price * 2)
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Cierta Cantidad</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Monto a Pagar ($ COP / Moneda)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                $
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Date & Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Fecha del Pago
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Método de Pago
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Yappy (63336030)">Yappy (63336030)</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observaciones / Comprobante (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pago adelantado, transferencia Nequi #1234..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Buttons */}
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
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
