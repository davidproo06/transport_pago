import React, { useState, useEffect } from 'react';
import { clientsApi, formatCurrency, formatDate, getStatusDetails } from '../services/api';
import {
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Receipt,
  Smartphone,
  ShieldAlert,
  ArrowRight,
  Info,
  Banknote,
} from 'lucide-react';

export default function ClientPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  const [selectedPayMethod, setSelectedPayMethod] = useState('yappy'); // 'yappy' or 'efectivo'
  const [payAmountType, setPayAmountType] = useState('total'); // 'total', 'one_unit', 'custom'
  const [customAmount, setCustomAmount] = useState('');

  const loadClientStatus = async () => {
    setLoading(true);
    try {
      const res = await clientsApi.getMyStatus();
      setData(res);
    } catch (err) {
      console.error('Error loading my status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientStatus();
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTargetAmount = () => {
    if (!data?.client) return 0;
    const debt = data.client.debt;
    if (payAmountType === 'total') return debt.totalToPay;
    if (payAmountType === 'one_unit') return data.client.price;
    if (payAmountType === 'custom') return Number(customAmount) || debt.totalToPay;
    return debt.totalToPay;
  };

  const handleSendPaymentWhatsApp = () => {
    if (!data?.client) return;
    const client = data.client;
    const ownerPhone = data.paymentAccounts?.ownerPhone || '63336030';
    const amountVal = getTargetAmount();
    const formattedAmount = formatCurrency(amountVal);

    let message = '';
    if (selectedPayMethod === 'yappy') {
      message = `Hola David, soy ${client.name}. Te informo que voy a realizar / ya realicé el pago de mi transporte por YAPPY por valor de ${formattedAmount} a tu número 63336030. Aquí te adjunto el comprobante de pago.`;
    } else {
      message = `Hola David, soy ${client.name}. Te informo que te entregaré el pago de mi transporte en EFECTIVO por valor de ${formattedAmount} al abordar/finalizar el viaje. ¡Muchas gracias!`;
    }

    const clean = ownerPhone.replace(/\D/g, '');
    const fullPhone = clean.length === 8 ? `507${clean}` : (clean.startsWith('507') ? clean : `507${clean}`);
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
        Cargando tu estado de cuenta y alertas...
      </div>
    );
  }

  if (!data?.client) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-slate-400 text-xs">
        No se encontró información del cliente. Contacta al propietario del transporte.
      </div>
    );
  }

  const { client, payments = [], paymentAccounts = {} } = data;
  const debt = client.debt;
  const statusConfig = getStatusDetails(debt.status);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Greeting card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Bienvenido a tu portal móvil
            </span>
            <h2 className="text-xl font-black text-white mt-0.5">{client.name}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Modalidad: <strong className="text-slate-200 capitalize">{client.modality}</strong> (
              {formatCurrency(client.price)}/{client.modality === 'diario' ? 'día' : 'semana'})
            </p>
          </div>

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              debt.status === 'al_dia'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : debt.status === 'recargo_mora' || debt.status === 'mora'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
          >
            {debt.status === 'al_dia' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : debt.status === 'recargo_mora' ? (
              <Flame className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* Prominent Required Alert Banner */}
      <div
        className={`rounded-3xl p-5 border shadow-xl transition-all ${
          debt.status === 'al_dia'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : debt.status === 'recargo_mora' || debt.status === 'mora'
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 ring-1 ring-rose-500/40'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{debt.title}</span>
        </div>
        <p className="text-xs leading-relaxed opacity-95">{debt.alertMessage}</p>

        {debt.surchargeAmount > 0 && (
          <div className="mt-3 pt-3 border-t border-rose-500/30 text-xs flex items-center justify-between">
            <span className="font-semibold text-rose-300">Recargo por mora (+15%):</span>
            <span className="font-bold text-rose-200">+{formatCurrency(debt.surchargeAmount)}</span>
          </div>
        )}
      </div>

      {/* Main Debt Counter Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="text-center">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Total Pendiente a Pagar
          </span>
          <div
            className={`text-4xl font-black tracking-tight ${
              debt.totalToPay > 0
                ? debt.surchargeAmount > 0
                  ? 'text-rose-400'
                  : 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {formatCurrency(debt.totalToPay)}
          </div>
        </div>

        {/* Counter Breakdown */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Tiempo acumulado sin pagar:</span>
            <strong className="text-slate-200">
              {debt.unpaidUnits} {debt.unitType}
            </strong>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Tarifa base ({formatCurrency(client.price)} c/u):</span>
            <strong className="text-slate-200">{formatCurrency(debt.baseUnpaid)}</strong>
          </div>
          {debt.surchargeAmount > 0 && (
            <div className="flex justify-between items-center text-rose-400 font-semibold">
              <span>Recargo por mora (+15% 3ª sem):</span>
              <strong>+{formatCurrency(debt.surchargeAmount)}</strong>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-400 border-t border-slate-800 pt-2 font-bold text-white text-sm">
            <span>Saldo total neto:</span>
            <span className={debt.totalToPay > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {formatCurrency(debt.totalToPay)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Box & WhatsApp Flow */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>¿Cómo deseas realizar tu pago?</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Elige tu método y avisa directamente al conductor por WhatsApp para confirmar tu saldo.
          </p>
        </div>

        {/* Method Selector: Yappy vs Efectivo */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedPayMethod('yappy')}
            className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
              selectedPayMethod === 'yappy'
                ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500 shadow-lg shadow-cyan-950/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-[10px]">
                  Y
                </span>
                Yappy
              </span>
              {selectedPayMethod === 'yappy' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <span className="text-[11px] text-slate-300 font-mono font-bold">
              63336030
            </span>
            <span className="text-[10px] text-slate-500">Pago por transferencia</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPayMethod('efectivo')}
            className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
              selectedPayMethod === 'efectivo'
                ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-400" />
                Efectivo
              </span>
              {selectedPayMethod === 'efectivo' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <span className="text-[11px] text-slate-300 font-semibold">
              En Mano
            </span>
            <span className="text-[10px] text-slate-500">Pago directo al conductor</span>
          </button>
        </div>

        {/* Amount Selector: Todo, 1 Día/Semana, Cierta cantidad */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
            Monto que vas a pagar:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPayAmountType('total')}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                payAmountType === 'total'
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Todo ({formatCurrency(debt.totalToPay)})</span>
            </button>

            <button
              type="button"
              onClick={() => setPayAmountType('one_unit')}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                payAmountType === 'one_unit'
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>1 {client.modality === 'diario' ? 'Día' : 'Sem'} ({formatCurrency(client.price)})</span>
            </button>

            <button
              type="button"
              onClick={() => setPayAmountType('custom')}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                payAmountType === 'custom'
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Otro Monto</span>
            </button>
          </div>

          {payAmountType === 'custom' && (
            <div className="pt-1">
              <label className="text-[11px] text-slate-400 block mb-1">Escribe la cantidad que vas a abonar:</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">$</span>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ej: 10000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Method details card */}
        {selectedPayMethod === 'yappy' ? (
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">Número de Yappy</span>
                <span className="text-base font-mono font-bold text-white tracking-wide">63336030</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('63336030', 'yappy')}
                className="py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiedKey === 'yappy' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar número</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Abre tu app de Banco General / Yappy, transfiere <strong className="text-white">{formatCurrency(getTargetAmount())}</strong> al <strong className="text-cyan-400">63336030</strong> y envía el comprobante presionando el botón abajo.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1.5">
            <span className="text-xs font-bold text-emerald-400 uppercase block">Pago en Efectivo</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Le entregarás <strong className="text-white">{formatCurrency(getTargetAmount())}</strong> en efectivo directamente al conductor al momento de abordar o finalizar tu transporte.
            </p>
          </div>
        )}

        {/* WhatsApp Direct Action Button */}
        <button
          type="button"
          onClick={handleSendPaymentWhatsApp}
          className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${
            selectedPayMethod === 'yappy'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-600/30'
          }`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>
            {selectedPayMethod === 'yappy'
              ? `Mandar Comprobante de Yappy por WhatsApp (${formatCurrency(getTargetAmount())})`
              : `Avisar Pago en Efectivo por WhatsApp (${formatCurrency(getTargetAmount())})`}
          </span>
        </button>
      </div>

      {/* Payment History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Receipt className="w-4 h-4 text-indigo-400" />
          <span>Tus Pagos Registrados</span>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            Aún no tienes pagos registrados en el sistema.
          </p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {p.method}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {formatDate(p.payment_date)}
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
