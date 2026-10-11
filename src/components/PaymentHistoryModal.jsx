import React, { useState, useEffect } from 'react';
import { paymentsApi, formatCurrency, formatDate } from '../services/api';
import { X, Receipt, Trash2, Calendar, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentHistoryModal({ client, onClose, onPaymentDeleted }) {
  const { role } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await paymentsApi.getByClient(client.id);
        setPayments(res.payments || []);
      } catch (err) {
        console.error('Error loading payments:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [client.id]);

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('¿Seguro que deseas anular este pago? Se recalculará la deuda del cliente.')) {
      return;
    }

    setDeletingId(paymentId);
    try {
      const res = await paymentsApi.delete(paymentId);
      setPayments(payments.filter((p) => p.id !== paymentId));
      if (onPaymentDeleted) {
        onPaymentDeleted(res.client);
      }
    } catch (err) {
      alert(err.message || 'Error al eliminar pago');
    } finally {
      setDeletingId(null);
    }
  };

  const totalSum = payments.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Historial de Pagos</h3>
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

        {/* Total Summary */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total abonado históricamente:</span>
          <span className="text-sm font-bold text-emerald-400">
            {formatCurrency(totalSum)} ({payments.length} pagos)
          </span>
        </div>

        {/* Payments List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Cargando pagos...</div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No hay pagos registrados para este cliente aún.
            </div>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {p.method}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(p.payment_date)}</span>
                  </div>
                  {p.notes && (
                    <p className="text-[11px] text-slate-400 italic">"{p.notes}"</p>
                  )}
                </div>

                {role === 'owner' && (
                  <button
                    onClick={() => handleDeletePayment(p.id)}
                    disabled={deletingId === p.id}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Anular pago"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
