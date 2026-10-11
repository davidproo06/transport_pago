/**
 * Debt Calculation & Alert Engine for Transport Payments
 */

function parseDateOnly(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon to prevent timezone shifts
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates debt, time accumulated, status, alerts, and surcharge for a client.
 * @param {Object} client - Client record from DB
 * @param {Array} payments - Array of payment records for this client
 * @param {Array} exemptions - Array of exemption dates (days client didn't travel)
 * @param {string} [asOfDateStr] - Target evaluation date (default today)
 */
function calculateClientDebt(client, payments = [], exemptions = [], asOfDateStr = null) {
  const today = asOfDateStr ? parseDateOnly(asOfDateStr) : new Date();
  const startDate = parseDateOnly(client.start_date);

  // If start date is in the future
  if (startDate > today) {
    return {
      clientId: client.id,
      name: client.name,
      modality: client.modality,
      price: client.price,
      startDate: client.start_date,
      totalUnitsAccrued: 0,
      unitType: client.modality === 'diario' ? 'días' : 'semanas',
      totalGross: 0,
      totalPaid: 0,
      baseUnpaid: 0,
      surchargeRate: 0,
      surchargeAmount: 0,
      totalToPay: 0,
      status: 'al_dia',
      badge: 'success',
      title: 'Servicio por iniciar',
      alertMessage: `El servicio inicia el ${client.start_date}.`,
      unpaidUnits: 0,
      whatsappMessage: `Hola ${client.name}, tu servicio de transporte iniciará el ${client.start_date}.`,
    };
  }

  // Total paid by client
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const exemptionSet = new Set(exemptions.map(e => e.date));

  if (client.modality === 'diario') {
    // Determine active days of week (1 = Monday, 7 = Sunday)
    let activeDaysList = [1, 2, 3, 4, 5]; // default Mon-Fri
    if (client.active_days) {
      if (client.active_days === 'all' || client.active_days === '7') {
        activeDaysList = [1, 2, 3, 4, 5, 6, 7];
      } else {
        activeDaysList = client.active_days.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      }
    }

    // Count billable days from startDate to today
    let totalServiceDays = 0;
    const cur = new Date(startDate.getTime());
    while (cur <= today) {
      const dayOfWeek = cur.getDay() === 0 ? 7 : cur.getDay(); // JS getDay() is 0 for Sunday
      const isoStr = formatDateISO(cur);

      if (activeDaysList.includes(dayOfWeek) && !exemptionSet.has(isoStr)) {
        totalServiceDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const totalGross = Math.round(totalServiceDays * client.price);
    const baseUnpaid = Math.max(0, totalGross - totalPaid);
    const unpaidDays = client.price > 0 ? Math.ceil(baseUnpaid / client.price) : 0;

    let status = 'al_dia';
    let badge = 'success';
    let title = 'Al día';
    let alertMessage = '¡Estás al día con tus pagos de transporte diario! Muchas gracias.';
    let whatsappMessage = `Hola ${client.name}, te confirmo que estás al día con tu transporte. ¡Gracias!`;

    if (baseUnpaid > 0) {
      if (unpaidDays <= 3) {
        status = 'dentro_plazo';
        badge = 'warning';
        title = `Plazo de 3 días (${unpaidDays}/3)`;
        const remainingGrace = 3 - unpaidDays;
        alertMessage = `Llevas ${unpaidDays} día(s) acumulado(s) ($${baseUnpaid.toLocaleString('es-CO')}). Tienes un plazo de 3 días para pagarlo. Te quedan ${remainingGrace} día(s) de plazo.`;
        whatsappMessage = `Hola ${client.name}, te recuerdo que llevas ${unpaidDays} día(s) de transporte acumulado(s) por un valor de $${baseUnpaid.toLocaleString('es-CO')}. Recuerda que cuentas con el plazo de 3 días para pagarlo. Quedo atento, ¡gracias!`;
      } else {
        status = 'mora';
        badge = 'danger';
        title = `Pago atrasado (${unpaidDays} días)`;
        const daysOverdue = unpaidDays - 3;
        alertMessage = `⚠️ ¡ATENCIÓN! Has superado el plazo de 3 días. Llevas ${unpaidDays} días acumulados sin pagar ($${baseUnpaid.toLocaleString('es-CO')}). Superas el plazo por ${daysOverdue} día(s). Por favor realiza el pago al propietario.`;
        whatsappMessage = `Hola ${client.name}, te informo que has superado el plazo de 3 días para el pago diario de transporte. Llevas acumulados ${unpaidDays} días con un saldo pendiente de $${baseUnpaid.toLocaleString('es-CO')}. Por favor realiza el pago lo antes posible para mantener el servicio activo.`;
      }
    }

    return {
      clientId: client.id,
      name: client.name,
      phone: client.phone,
      modality: 'diario',
      price: client.price,
      startDate: client.start_date,
      totalUnitsAccrued: totalServiceDays,
      unitType: 'días',
      totalGross,
      totalPaid,
      baseUnpaid,
      surchargeRate: 0,
      surchargeAmount: 0,
      totalToPay: baseUnpaid,
      status,
      badge,
      title,
      alertMessage,
      unpaidUnits: unpaidDays,
      daysOverdue: unpaidDays > 3 ? unpaidDays - 3 : 0,
      whatsappMessage,
    };
  } else {
    // Modality: 'semanal'
    // Elapsed calendar days
    const diffTime = Math.max(0, today.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Weeks accrued (at least 1 week once started, increases every 7 days)
    const totalWeeksAccrued = Math.max(1, Math.ceil(diffDays / 7));
    const totalGross = Math.round(totalWeeksAccrued * client.price);
    const baseUnpaid = Math.max(0, totalGross - totalPaid);
    const unpaidWeeks = client.price > 0 ? Math.ceil(baseUnpaid / client.price) : 0;

    let status = 'al_dia';
    let badge = 'success';
    let title = 'Al día';
    let alertMessage = '¡Estás al día con tus pagos de transporte semanal! Muchas gracias.';
    let surchargeRate = 0;
    let surchargeAmount = 0;
    let totalToPay = 0;
    let whatsappMessage = `Hola ${client.name}, te confirmo que estás al día con tu pago semanal de transporte. ¡Gracias!`;

    if (baseUnpaid > 0) {
      if (unpaidWeeks === 1) {
        // First week: "se optará por llamado de atención la primera semana"
        status = 'llamado_atencion';
        badge = 'warning';
        title = 'Llamado de atención (Semana 1)';
        surchargeRate = 0;
        surchargeAmount = 0;
        totalToPay = baseUnpaid;
        alertMessage = `⚠️ LLAMADO DE ATENCIÓN: Tienes acumulada 1 semana de transporte pendiente ($${baseUnpaid.toLocaleString('es-CO')}). Recuerda que el plazo máximo acordado para pagarlo todo es de 2 semanas.`;
        whatsappMessage = `Hola ${client.name}, te envío este mensaje como un llamado de atención recordándote que tienes acumulada 1 semana de transporte por un total de $${baseUnpaid.toLocaleString('es-CO')}. Recuerda que cuentas con un plazo máximo de 2 semanas para cancelar todo. ¡Quedo atento!`;
      } else if (unpaidWeeks === 2) {
        // Second week: within the 2 weeks deadline, but limit reached!
        status = 'plazo_limite';
        badge = 'warning';
        title = 'Plazo límite (Semana 2)';
        surchargeRate = 0;
        surchargeAmount = 0;
        totalToPay = baseUnpaid;
        alertMessage = `⚠️ PLAZO LÍMITE: Tienes acumuladas 2 semanas de transporte ($${baseUnpaid.toLocaleString('es-CO')}). Este es el plazo máximo permitido. Si pasas a la 3ª semana sin pagar, se te aplicará automáticamente un 15% de recargo por mora.`;
        whatsappMessage = `Hola ${client.name}, te informo que ya completaste 2 semanas acumuladas de transporte ($${baseUnpaid.toLocaleString('es-CO')}). Este es tu plazo límite para pagar todo. Si pasas a la 3ª semana, se agregará un 15% de recargo por mora. Por favor gestiona tu pago lo antes posible.`;
      } else {
        // Third week or more: "y ya la tercera se le sube un 15% por pago atrasado"
        status = 'recargo_mora';
        badge = 'danger';
        title = `Mora 3ª semana (+15% de recargo)`;
        surchargeRate = 0.15;
        surchargeAmount = Math.round(baseUnpaid * 0.15);
        totalToPay = baseUnpaid + surchargeAmount;
        alertMessage = `🚨 ¡PAGO ATRASADO CON RECARGO! Has alcanzado la 3ª semana (o más) con deuda pendiente ($${baseUnpaid.toLocaleString('es-CO')}). Conforme a las condiciones del servicio, se ha aplicado un recargo del 15% por mora (+${surchargeAmount.toLocaleString('es-CO')}). Total a pagar: $${totalToPay.toLocaleString('es-CO')}.`;
        whatsappMessage = `Hola ${client.name}, te comunico que has superado el plazo de 2 semanas y has alcanzado la 3ª semana con saldo pendiente ($${baseUnpaid.toLocaleString('es-CO')}). Como se estableció, se ha aplicado un recargo del 15% por pago atrasado (+$${surchargeAmount.toLocaleString('es-CO')}), para un total a cancelar de $${totalToPay.toLocaleString('es-CO')}. Por favor realiza el pago hoy mismo.`;
      }
    }

    return {
      clientId: client.id,
      name: client.name,
      phone: client.phone,
      modality: 'semanal',
      price: client.price,
      startDate: client.start_date,
      totalUnitsAccrued: totalWeeksAccrued,
      unitType: 'semanas',
      totalGross,
      totalPaid,
      baseUnpaid,
      surchargeRate,
      surchargeAmount,
      totalToPay,
      status,
      badge,
      title,
      alertMessage,
      unpaidUnits: unpaidWeeks,
      daysOverdue: unpaidWeeks >= 3 ? (unpaidWeeks - 2) * 7 : 0,
      whatsappMessage,
    };
  }
}

module.exports = {
  calculateClientDebt,
  parseDateOnly,
  formatDateISO,
};
