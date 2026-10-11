import React, { useState, useEffect } from 'react';
import { clientsApi, formatCurrency, formatDate, getStatusDetails } from '../services/api';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Flame,
  Search,
  Plus,
  RefreshCw,
  Phone,
  MessageCircle,
  CreditCard,
  History,
  MoreVertical,
  Clock,
  Calendar,
  CheckCircle,
  ShieldAlert,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import NewClientModal from './NewClientModal';
import EditClientModal from './EditClientModal';
import PaymentHistoryModal from './PaymentHistoryModal';

export default function OwnerDashboard({ onOpenSettings }) {
  const [clients, setClients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'debt', 'al_dia', 'warning', 'mora'

  // Modals state
  const [selectedClientForPayment, setSelectedClientForPayment] = useState(null);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await clientsApi.getAll();
      setClients(res.clients || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.username && c.username.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'debt') return c.debt.totalToPay > 0;
    if (filterTab === 'al_dia') return c.debt.status === 'al_dia';
    if (filterTab === 'warning')
      return (
        c.debt.status === 'dentro_plazo' ||
        c.debt.status === 'llamado_atencion' ||
        c.debt.status === 'plazo_limite'
      );
    if (filterTab === 'mora')
      return c.debt.status === 'mora' || c.debt.status === 'recargo_mora';

    return true;
  });

  // Callbacks for modal updates
  const handleClientUpdated = (updatedClient) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    // Recalculate summary locally or reload
    loadData();
  };

  const handleClientDeleted = (deletedId) => {
    setClients((prev) => prev.filter((c) => c.id !== deletedId));
    loadData();
  };

  const handleClientCreated = (newClient) => {
    setClients((prev) => [newClient, ...prev]);
    loadData();
  };

  // WhatsApp sender
  const handleSendWhatsApp = (client) => {
    const cleanPhone = client.phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 8 ? `507${cleanPhone}` : (cleanPhone.startsWith('507') ? cleanPhone : cleanPhone);
    const message = encodeURIComponent(client.debt.whatsappMessage || `Hola ${client.name}`);
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Panel de Control del Conductor
          </h2>
          <p className="text-xs text-slate-400">
            Supervisa tus cobros diarios, semanales, plazos de 3 días y recargos del 15%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Ingresar Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Pending */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total por Cobrar</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-white">
              {formatCurrency(summary.totalPendingDebt)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Saldo acumulado pendiente</p>
          </div>

          {/* Active Clients */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Clientes Activos</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-white">
              {summary.activeClients}{' '}
              <span className="text-xs font-normal text-slate-400">/ {summary.totalClients}</span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-1">{summary.totalAlDia} al día</p>
          </div>

          {/* Warnings (Plazo 3 días o 1ª sem) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">En Advertencia</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-amber-300">
              {summary.totalAlerts}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Dentro de plazo o 1ª semana</p>
          </div>

          {/* Mora Crítica (Recargo +15% o >3 días) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Mora / +15%</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-rose-400">
              {summary.totalMora}
            </div>
            <p className="text-[10px] text-rose-400/80 mt-1">3ª semana o &gt;3 días atrasado</p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, teléfono o usuario..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setFilterTab('debt')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterTab === 'debt'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Con Saldo ({clients.filter((c) => c.debt.totalToPay > 0).length})
          </button>
          <button
            onClick={() => setFilterTab('warning')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterTab === 'warning'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-amber-400/80 hover:text-amber-300'
            }`}
          >
            En Alerta / Plazo ({summary?.totalAlerts || 0})
          </button>
          <button
            onClick={() => setFilterTab('mora')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterTab === 'mora'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-rose-400/80 hover:text-rose-300'
            }`}
          >
            Con Recargo (+15%) ({summary?.totalMora || 0})
          </button>
          <button
            onClick={() => setFilterTab('al_dia')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterTab === 'al_dia'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            Al Día ({summary?.totalAlDia || 0})
          </button>
        </div>
      </div>

      {/* Clients Cards List */}
      <div className="space-y-3.5">
        {loading && clients.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
            Cargando pasajeros y estado de pagos...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <p className="text-slate-400 text-xs">No se encontraron clientes con el filtro seleccionado.</p>
            <button
              onClick={() => setShowNewClientModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Ingresar primer cliente
            </button>
          </div>
        ) : (
          filteredClients.map((client) => {
            const debt = client.debt;
            const statusConfig = getStatusDetails(debt.status);

            return (
              <div
                key={client.id}
                className={`bg-slate-900/90 border rounded-3xl p-4 sm:p-5 transition-all shadow-lg hover:border-slate-700 ${
                  !client.is_active ? 'opacity-60 border-slate-800' : statusConfig.bgCardClass
                }`}
              >
                {/* Header of client card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base shadow-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{client.name}</h3>
                        {!client.is_active && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                            Pausado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {client.phone}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-indigo-300">
                          @{client.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusConfig.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Modality & Accrual Stats Box */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Modalidad</span>
                    <strong className="text-slate-200 capitalize">
                      {client.modality} ({formatCurrency(client.price)}/
                      {client.modality === 'diario' ? 'día' : 'sem'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Tiempo Acumulado</span>
                    <strong className="text-slate-200">
                      {debt.unpaidUnits} {debt.unitType} adeudados
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Subtotal</span>
                    <strong className="text-slate-200">{formatCurrency(debt.baseUnpaid)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">
                      {debt.surchargeAmount > 0 ? 'Total (+15% Mora)' : 'Total a Pagar'}
                    </span>
                    <strong
                      className={`text-sm font-extrabold ${
                        debt.totalToPay > 0
                          ? debt.surchargeAmount > 0
                            ? 'text-rose-400'
                            : 'text-amber-300'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(debt.totalToPay)}
                    </strong>
                  </div>
                </div>

                {/* Overdue Alert banner inside card */}
                {debt.alertMessage && debt.status !== 'al_dia' && (
                  <div
                    className={`p-2.5 rounded-xl text-xs mb-3 flex items-start gap-2 ${
                      debt.status === 'recargo_mora' || debt.status === 'mora'
                        ? 'bg-rose-500/10 border border-rose-500/25 text-rose-300'
                        : 'bg-amber-500/10 border border-amber-500/25 text-amber-300'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-tight">{debt.alertMessage}</p>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                  {/* Registrar Pago */}
                  <button
                    onClick={() => setSelectedClientForPayment(client)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    Registrar Pago
                  </button>

                  {/* Send WhatsApp */}
                  <button
                    onClick={() => handleSendWhatsApp(client)}
                    className="flex-1 py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    title="Enviar recordatorio por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>

                  {/* Historial */}
                  <button
                    onClick={() => setSelectedClientForHistory(client)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors flex items-center gap-1"
                    title="Ver historial de pagos"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Historial ({client.paymentsCount})</span>
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => setSelectedClientForEdit(client)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                    title="Configurar / Editar cliente"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {selectedClientForPayment && (
        <PaymentModal
          client={selectedClientForPayment}
          onClose={() => setSelectedClientForPayment(null)}
          onPaymentSuccess={handleClientUpdated}
        />
      )}

      {selectedClientForEdit && (
        <EditClientModal
          client={selectedClientForEdit}
          onClose={() => setSelectedClientForEdit(null)}
          onClientUpdated={handleClientUpdated}
          onClientDeleted={handleClientDeleted}
        />
      )}

      {selectedClientForHistory && (
        <PaymentHistoryModal
          client={selectedClientForHistory}
          onClose={() => setSelectedClientForHistory(null)}
          onPaymentDeleted={handleClientUpdated}
        />
      )}

      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onClientCreated={handleClientCreated}
        />
      )}
    </div>
  );
}
