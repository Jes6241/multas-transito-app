import AsyncStorage from '@react-native-async-storage/async-storage';

const PAGOS_KEY = 'user_pagos';

/**
 * Obtener la clave de pagos para un usuario específico
 */
const getPagosKey = (userId) => `${PAGOS_KEY}_${userId}`;

/**
 * Guardar un nuevo pago realizado por el usuario
 */
export const guardarPago = async (userId, datosPago) => {
  try {
    const pagosGuardados = await obtenerPagos(userId);
    
    const nuevoPago = {
      id: datosPago.id || `pago_${Date.now()}`,
      folio: datosPago.folio,
      placa: datosPago.placa,
      monto_pagado: datosPago.monto_pagado || datosPago.monto_final || datosPago.monto,
      fecha_pago: datosPago.fecha_pago || new Date().toISOString(),
      metodo_pago: datosPago.metodo_pago,
      linea_captura: datosPago.linea_captura,
      referencia_pago: datosPago.referencia_pago,
      tipo_infraccion: datosPago.tipo_infraccion,
      direccion: datosPago.direccion,
      fecha_infraccion: datosPago.fecha_infraccion || datosPago.created_at,
      guardado_en: new Date().toISOString(),
    };
    
    // Evitar duplicados por folio
    const pagosActualizados = pagosGuardados.filter(p => p.folio !== nuevoPago.folio);
    pagosActualizados.unshift(nuevoPago); // Agregar al inicio
    
    await AsyncStorage.setItem(getPagosKey(userId), JSON.stringify(pagosActualizados));
    console.log('Pago guardado localmente:', nuevoPago.folio);
    
    return nuevoPago;
  } catch (error) {
    console.error('Error guardando pago:', error);
    throw error;
  }
};

/**
 * Obtener todos los pagos guardados del usuario
 */
export const obtenerPagos = async (userId) => {
  try {
    const pagosJson = await AsyncStorage.getItem(getPagosKey(userId));
    return pagosJson ? JSON.parse(pagosJson) : [];
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return [];
  }
};

/**
 * Eliminar un pago guardado
 */
export const eliminarPago = async (userId, folio) => {
  try {
    const pagosGuardados = await obtenerPagos(userId);
    const pagosActualizados = pagosGuardados.filter(p => p.folio !== folio);
    await AsyncStorage.setItem(getPagosKey(userId), JSON.stringify(pagosActualizados));
  } catch (error) {
    console.error('Error eliminando pago:', error);
  }
};

/**
 * Limpiar todos los pagos del usuario
 */
export const limpiarPagos = async (userId) => {
  try {
    await AsyncStorage.removeItem(getPagosKey(userId));
  } catch (error) {
    console.error('Error limpiando pagos:', error);
  }
};

export default {
  guardarPago,
  obtenerPagos,
  eliminarPago,
  limpiarPagos,
};
