/**
 * Configuración de tarifas del corralón
 * Este archivo centraliza todos los costos para mantener consistencia
 * entre la vista del ciudadano y el agente de corralón
 */

// Tarifas oficiales del corralón
export const TARIFAS_CORRALON = {
  // Costo del servicio de grúa/arrastre
  COSTO_GRUA: 1500,
  
  // Costo de pensión por día de resguardo
  COSTO_PENSION_DIARIA: 180,
  
  // El primer día es gratuito (true) o se cobra (false)
  PRIMER_DIA_GRATIS: false,
};

/**
 * Calcula los días de estancia en el corralón
 * @param {Date|string} fechaIngreso - Fecha de ingreso al corralón
 * @returns {number} - Días de estancia (mínimo 1)
 */
export const calcularDiasEstancia = (fechaIngreso) => {
  if (!fechaIngreso) return 1;
  
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const dias = Math.ceil((hoy - ingreso) / (1000 * 60 * 60 * 24));
  
  return dias < 1 ? 1 : dias;
};

/**
 * Calcula todos los costos del corralón
 * @param {Date|string} fechaIngreso - Fecha de ingreso al corralón
 * @param {number} montoMulta - Monto de la multa asociada (opcional)
 * @param {Object} tarifasPersonalizadas - Tarifas personalizadas del corralón (opcional)
 * @returns {Object} - Objeto con el desglose de costos
 */
export const calcularCostosCorralon = (fechaIngreso, montoMulta = 0, tarifasPersonalizadas = null) => {
  const tarifas = tarifasPersonalizadas || TARIFAS_CORRALON;
  
  const diasEstancia = calcularDiasEstancia(fechaIngreso);
  const diasCobrar = tarifas.PRIMER_DIA_GRATIS ? Math.max(0, diasEstancia - 1) : diasEstancia;
  
  const costoGrua = tarifas.COSTO_GRUA;
  const costoPensionTotal = diasCobrar * tarifas.COSTO_PENSION_DIARIA;
  const costoMulta = parseFloat(montoMulta) || 0;
  const total = costoGrua + costoPensionTotal + costoMulta;

  return {
    diasEstancia,
    diasCobrar,
    costoGrua,
    costoPensionDiaria: tarifas.COSTO_PENSION_DIARIA,
    costoPensionTotal,
    costoMulta,
    total,
  };
};

export default {
  TARIFAS_CORRALON,
  calcularDiasEstancia,
  calcularCostosCorralon,
};
