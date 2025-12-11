import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_MULTAS_KEY = 'offline_multas';
const GRUAS_SOLICITADAS_KEY = 'gruas_solicitadas';
const API_URL = 'https://multas-transito-api.onrender.com';

export const offlineService = {
  // Verificar conexión usando NetInfo
  isOnline: async () => {
    try {
      const state = await NetInfo. fetch();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      // Si NetInfo falla, intentar con fetch
      try {
        const response = await fetch(`${API_URL}/`, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    }
  },

  // ========== MULTAS ==========
  guardarMultaOffline: async (multa) => {
    try {
      const multas = await offlineService.obtenerMultasOffline();
      
      // Limitar fotos para almacenamiento
      const fotosLimitadas = (multa.fotos || []).slice(0, 3);
      
      const nuevaMulta = {
        ...multa,
        fotos: fotosLimitadas,
        id_temporal: Date.now().toString(),
        fecha_guardado: new Date().toISOString(),
        sincronizado: false,
      };
      
      multas.push(nuevaMulta);
      
      try {
        await AsyncStorage.setItem(OFFLINE_MULTAS_KEY, JSON.stringify(multas));
        console.log('Multa guardada offline');
      } catch (storageError) {
        // Si falla por tamaño, guardar sin fotos
        console. log('Guardando sin fotos por tamaño');
        nuevaMulta.fotos = [];
        nuevaMulta.sinFotos = true;
        const multasSinFotos = await offlineService. obtenerMultasOffline();
        multasSinFotos.push(nuevaMulta);
        await AsyncStorage. setItem(OFFLINE_MULTAS_KEY, JSON.stringify(multasSinFotos));
      }
      
      return nuevaMulta;
    } catch (error) {
      console.error('Error guardando multa offline:', error);
      throw error;
    }
  },

  obtenerMultasOffline: async () => {
    try {
      const data = await AsyncStorage. getItem(OFFLINE_MULTAS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },

  eliminarMultaOffline: async (id_temporal) => {
    try {
      const multas = await offlineService.obtenerMultasOffline();
      const nuevas = multas.filter((m) => m.id_temporal !== id_temporal);
      await AsyncStorage.setItem(OFFLINE_MULTAS_KEY, JSON.stringify(nuevas));
    } catch (error) {
      console. error('Error eliminando multa offline:', error);
    }
  },

  sincronizarMultas: async () => {
    try {
      const multas = await offlineService. obtenerMultasOffline();
      
      if (multas.length === 0) {
        return { success: true, message: 'No hay multas pendientes', sincronizadas: 0 };
      }

      let sincronizadas = 0;
      let errores = 0;

      for (const multa of multas) {
        try {
          const response = await fetch(`${API_URL}/api/multas`, {
            method:  'POST',
            headers: { 'Content-Type':  'application/json' },
            body: JSON.stringify({
              placa:  multa.placa,
              tipo_infraccion: multa.tipo_infraccion,
              descripcion: multa.descripcion,
              monto: multa.monto,
              monto_final: multa. monto_final,
              direccion:  multa.direccion,
              latitud: multa.latitud,
              longitud: multa. longitud,
              agente_id:  multa.agente_id,
              fotos: multa.fotos || [],
            }),
          });

          const data = await response. json();

          if (response.ok && data.success) {
            await offlineService.eliminarMultaOffline(multa.id_temporal);
            sincronizadas++;
          } else {
            errores++;
          }
        } catch (error) {
          errores++;
        }
      }

      return {
        success: errores === 0,
        message: `Sincronizadas:  ${sincronizadas}, Errores:  ${errores}`,
        sincronizadas,
        errores,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // ========== GRÚAS ==========
  guardarSolicitudGrua: async (solicitud) => {
    try {
      const solicitudes = await offlineService.obtenerSolicitudesGrua();
      solicitudes.push({
        ...solicitud,
        id_local: Date.now().toString(),
        fecha:  new Date().toISOString(),
      });
      await AsyncStorage.setItem(GRUAS_SOLICITADAS_KEY, JSON.stringify(solicitudes));
    } catch (error) {
      console. error('Error:', error);
    }
  },

  obtenerSolicitudesGrua:  async () => {
    try {
      const data = await AsyncStorage.getItem(GRUAS_SOLICITADAS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  obtenerSolicitudesGruaHoy: async () => {
    try {
      const todas = await offlineService.obtenerSolicitudesGrua();
      const hoy = new Date().toDateString();
      return todas.filter((s) => new Date(s.fecha).toDateString() === hoy);
    } catch {
      return [];
    }
  },

  limpiarOffline: async () => {
    await AsyncStorage.multiRemove([OFFLINE_MULTAS_KEY, GRUAS_SOLICITADAS_KEY]);
  },
};

export default offlineService;