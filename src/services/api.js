const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('transpago_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('transpago_token', token);
  } else {
    localStorage.removeItem('transpago_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en la solicitud');
  }

  return data;
}

// Authentication
export const authApi = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Clients
export const clientsApi = {
  getAll: () => request('/clients'),
  getMyStatus: (clientId) => request(`/clients/my-status${clientId ? `?clientId=${clientId}` : ''}`),
  getById: (id) => request(`/clients/${id}`),
  create: (data) =>
    request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    request(`/clients/${id}`, {
      method: 'DELETE',
    }),
  addExemption: (clientId, date, reason) =>
    request(`/clients/${clientId}/exemptions`, {
      method: 'POST',
      body: JSON.stringify({ date, reason }),
    }),
  deleteExemption: (clientId, exemptionId) =>
    request(`/clients/${clientId}/exemptions/${exemptionId}`, {
      method: 'DELETE',
    }),
};

// Payments
export const paymentsApi = {
  register: (clientId, amount, paymentDate, method, notes) =>
    request('/payments', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, amount, payment_date: paymentDate, method, notes }),
    }),
  getByClient: (clientId) => request(`/payments/client/${clientId}`),
  delete: (paymentId) =>
    request(`/payments/${paymentId}`, {
      method: 'DELETE',
    }),
};

// Settings
export const settingsApi = {
  get: () => request('/settings'),
  update: (data) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Firebase
export const firebaseApi = {
  getStatus: () => request('/firebase/status'),
  configure: (serviceAccountJson) =>
    request('/firebase/configure', {
      method: 'POST',
      body: JSON.stringify({ serviceAccountJson }),
    }),
  sync: () => request('/firebase/sync', { method: 'POST' }),
};

// Format Helpers
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  const num = Number(amount);
  if (Number.isInteger(num)) {
    return `$${num.toLocaleString('es-CO')}`;
  }
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getStatusDetails(status) {
  switch (status) {
    case 'al_dia':
      return {
        label: 'Al día',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        bgCardClass: 'bg-emerald-950/20 border-emerald-800/40',
        dotColor: 'bg-emerald-400',
      };
    case 'dentro_plazo':
      return {
        label: 'Plazo 3 días',
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        bgCardClass: 'bg-amber-950/20 border-amber-800/40',
        dotColor: 'bg-amber-400',
      };
    case 'llamado_atencion':
      return {
        label: 'Llamado de atención (Sem 1)',
        badgeClass: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
        bgCardClass: 'bg-orange-950/20 border-orange-800/40',
        dotColor: 'bg-orange-400',
      };
    case 'plazo_limite':
      return {
        label: 'Plazo límite (Sem 2)',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
        bgCardClass: 'bg-yellow-950/20 border-yellow-800/40',
        dotColor: 'bg-yellow-400',
      };
    case 'recargo_mora':
      return {
        label: 'Mora +15% Recargo',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse',
        bgCardClass: 'bg-rose-950/30 border-rose-700/50',
        dotColor: 'bg-rose-500',
      };
    case 'mora':
      return {
        label: 'Mora (>3 días)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold',
        bgCardClass: 'bg-rose-950/30 border-rose-700/50',
        dotColor: 'bg-rose-500',
      };
    default:
      return {
        label: 'Pendiente',
        badgeClass: 'bg-slate-700 text-slate-300 border border-slate-600',
        bgCardClass: 'bg-slate-900 border-slate-800',
        dotColor: 'bg-slate-400',
      };
  }
}
