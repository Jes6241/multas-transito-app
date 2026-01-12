import { COLORS } from '../../../config/theme';

/**
 * Métodos de pago disponibles
 */
export const METODOS_PAGO = [
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de Crédito/Débito',
    icono: 'card',
    color: '#3B82F6',
    descripcion: 'Visa, Mastercard, AMEX',
  },
  {
    id: 'linea_captura',
    nombre: 'Línea de Captura',
    icono: 'document-text',
    color: '#10B981',
    descripcion: 'Paga en banco o en línea',
  },
];

/**
 * Obtiene la placa del vehículo de diferentes fuentes posibles
 */
export const obtenerPlaca = (multa) => {
  if (multa.vehiculos?.placa) return multa.vehiculos.placa;
  if (multa.vehiculo?.placa) return multa.vehiculo.placa;
  if (multa.Vehiculo?.placa) return multa.Vehiculo.placa;
  if (multa.Vehiculos?.placa) return multa.Vehiculos.placa;
  if (multa.placa) return multa.placa;
  if (multa.placa_vehiculo) return multa.placa_vehiculo;
  return 'N/A';
};

/**
 * Calcula el descuento aplicable según días transcurridos
 */
export const calcularDescuento = (multa) => {
  const fechaMulta = new Date(multa.fecha_infraccion || multa.created_at);
  const hoy = new Date();
  const diasTranscurridos = Math.floor((hoy - fechaMulta) / (1000 * 60 * 60 * 24));

  if (diasTranscurridos <= 15) {
    return {
      aplica: true,
      porcentaje: 50,
      diasRestantes: 15 - diasTranscurridos,
      montoOriginal: multa.monto,
      montoFinal: multa.monto * 0.5,
    };
  } else if (diasTranscurridos <= 30) {
    return {
      aplica: true,
      porcentaje: 25,
      diasRestantes: 30 - diasTranscurridos,
      montoOriginal: multa.monto,
      montoFinal: multa.monto * 0.75,
    };
  }
  
  return {
    aplica: false,
    porcentaje: 0,
    diasRestantes: 0,
    montoOriginal: multa.monto,
    montoFinal: multa.monto_final || multa.monto,
  };
};

/**
 * Verifica si la línea de captura está vencida
 */
export const verificarVigenciaLinea = (vigenciaLinea, lineaCaptura) => {
  if (vigenciaLinea) {
    const fechaVigencia = new Date(vigenciaLinea);
    const hoy = new Date();
    return hoy > fechaVigencia;
  }
  return !lineaCaptura;
};

/**
 * Formatea número de tarjeta con espacios
 */
export const formatearTarjeta = (texto) => {
  const limpio = texto.replace(/\D/g, '').substring(0, 16);
  const grupos = limpio.match(/.{1,4}/g);
  return grupos ? grupos.join(' ') : '';
};

/**
 * Formatea fecha de expiración MM/YY
 */
export const formatearExpiracion = (texto) => {
  const limpio = texto.replace(/\D/g, '').substring(0, 4);
  if (limpio.length >= 2) {
    return limpio.substring(0, 2) + '/' + limpio.substring(2);
  }
  return limpio;
};

/**
 * Valida datos de la tarjeta
 */
export const validarTarjeta = (tarjeta) => {
  const numeroLimpio = tarjeta.numero.replace(/\s/g, '');
  
  if (numeroLimpio.length !== 16) {
    return { valid: false, error: 'El número de tarjeta debe tener 16 dígitos' };
  }
  if (!tarjeta.nombre.trim()) {
    return { valid: false, error: 'Ingresa el nombre del titular' };
  }
  if (tarjeta.expiracion.length !== 5) {
    return { valid: false, error: 'Ingresa la fecha de expiración (MM/YY)' };
  }
  if (tarjeta.cvv.length < 3) {
    return { valid: false, error: 'Ingresa el CVV' };
  }
  
  return { valid: true };
};
