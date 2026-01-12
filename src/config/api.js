const API_URL = 'https://multas-transito-api.onrender.com';
const TESORERIA_URL = 'https://lineas-captura-api.onrender.com';
const PARQUIMETROS_URL = 'https://parquimetros-api-u592.onrender.com';

export const API = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  MULTAS: `${API_URL}/api/multas`,
  MULTAS_PLACA: (placa) => `${API_URL}/api/multas/placa/${placa}`,
  MULTAS_FOLIO: (folio) => `${API_URL}/api/multas/folio/${folio}`,
  VEHICULOS: (placa) => `${API_URL}/api/vehiculos/${placa}`,
  PAGOS: `${API_URL}/api/pagos`,
  // API de Tesorería - Líneas de Captura
  TESORERIA: {
    BASE_URL: TESORERIA_URL,
    GENERAR_LINEA: `${TESORERIA_URL}/api/lineas/generar`,
    CONSULTAR_LINEA: (codigo) => `${TESORERIA_URL}/api/lineas/${codigo}/validar`,
    USAR_LINEA: (codigo) => `${TESORERIA_URL}/api/lineas/${codigo}/usar`,
    DISPONIBLES: `${TESORERIA_URL}/api/lineas/disponibles`,
  },
  // API de Parquímetros
  PARQUIMETROS: {
    BASE_URL: PARQUIMETROS_URL,
    VERIFICAR: (placa) => `${PARQUIMETROS_URL}/api/parquimetros/verificar/${placa}`,
    PAGAR: `${PARQUIMETROS_URL}/api/parquimetros/pagar`,
    EXTENDER: `${PARQUIMETROS_URL}/api/parquimetros/extender`,
    HISTORIAL: (placa) => `${PARQUIMETROS_URL}/api/parquimetros/historial/${placa}`,
    ACTIVOS: `${PARQUIMETROS_URL}/api/parquimetros/activos`,
    EXPIRADOS: `${PARQUIMETROS_URL}/api/parquimetros/expirados`,
    ZONAS: `${PARQUIMETROS_URL}/api/parquimetros/zonas`,
    MARCAR_MULTADO: (id) => `${PARQUIMETROS_URL}/api/parquimetros/${id}/marcar-multado`,
  },
};

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return await response.json();
  } catch (error) {
    console.error('Error en API:', error);
    throw error;
  }
};

export const api = {
  // Auth
  login: (email, password) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (datos) =>
    fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  // Multas
  buscarPorPlaca: (placa) => fetchAPI(`/api/multas/placa/${placa}`),
  buscarPorFolio: (folio) => fetchAPI(`/api/multas/folio/${folio}`),
  obtenerMultas: () => fetchAPI('/api/multas'),
  obtenerMulta: (id) => fetchAPI(`/api/multas/${id}`),

  actualizarMulta:  (id, datos) =>
    fetchAPI(`/api/multas/${id}`, {
      method:  'PUT',
      body: JSON. stringify(datos),
    }),

  // Vehículos
  buscarVehiculo: (placa) => fetchAPI(`/api/vehiculos/${placa}`),

  // Pagos
  registrarPago: (datos) =>
    fetchAPI('/api/pagos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  subirComprobante:  (multaId, datos) =>
    fetchAPI(`/api/multas/${multaId}/comprobante`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  validarPago: (multaId, aprobado) =>
    fetchAPI(`/api/multas/${multaId}/validar-pago`, {
      method: 'PATCH',
      body: JSON.stringify({ aprobado }),
    }),

  // ========== API de Tesorería - Líneas de Captura ==========
  tesoreria: {
    // Generar nueva línea de captura
    generarLineaCaptura: async (datos) => {
      try {
        const response = await fetch(`${TESORERIA_URL}/api/lineas/generar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            monto: datos.monto,
            concepto: datos.concepto || 'Pago de multa de tránsito',
            referencia_externa: datos.referencia_externa || null,
          }),
        });
        return await response.json();
      } catch (error) {
        console.error('Error generando línea de captura:', error);
        throw error;
      }
    },

    // Consultar línea de captura por código
    consultarLinea: async (codigo) => {
      try {
        const response = await fetch(`${TESORERIA_URL}/api/lineas/${codigo}/validar`);
        return await response.json();
      } catch (error) {
        console.error('Error consultando línea de captura:', error);
        throw error;
      }
    },

    // Marcar línea como usada
    usarLinea: async (codigo, datosPago) => {
      try {
        const response = await fetch(`${TESORERIA_URL}/api/lineas/${codigo}/usar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datosPago),
        });
        return await response.json();
      } catch (error) {
        console.error('Error marcando línea como usada:', error);
        throw error;
      }
    },
  },
};

export { TESORERIA_URL };
export default api;