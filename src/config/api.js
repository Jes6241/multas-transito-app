const API_URL = 'https://multas-transito-api.onrender.com';

export const API = {
  // Auth
  LOGIN:  `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  
  // Multas
  MULTAS:  `${API_URL}/api/multas`,
  MULTAS_PLACA: (placa) => `${API_URL}/api/multas/placa/${placa}`,
  MULTAS_FOLIO: (folio) => `${API_URL}/api/multas/folio/${folio}`,
  
  // Vehículos
  VEHICULOS: (placa) => `${API_URL}/api/vehiculos/${placa}`,
  
  // Pagos
  PAGOS: `${API_URL}/api/pagos`,
};

// Mantener compatibilidad con el código existente
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
  buscarPorPlaca: (placa) => fetchAPI(`/api/multas/placa/${placa}`),
  buscarPorFolio:  (folio) => fetchAPI(`/api/multas/folio/${folio}`),
  obtenerMultas: () => fetchAPI('/api/multas'),
  buscarVehiculo: (placa) => fetchAPI(`/api/vehiculos/${placa}`),
  procesarPago: (multa_id, metodo_pago) => fetchAPI('/api/pagos', {
    method:  'POST',
    body: JSON.stringify({ multa_id, metodo_pago }),
  }),
};

export default api;