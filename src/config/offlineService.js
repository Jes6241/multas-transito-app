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
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_URL}/`, {
          method:  'HEAD',
          signal:  controller.signal,
        });
        clearTimeout(timeoutId);
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

      // Limitar fotos para almacenamiento (máximo 3)
      const fotosLimitadas = (multa.fotos || []).slice(0, 3);

      // Generar folio si no existe
      const folio = multa.folio || `MUL-${Date.now().toString(36).toUpperCase()}`;

      const nuevaMulta = {
        // Datos básicos
        placa: multa. placa,
        tipo_infraccion: multa.tipo_infraccion,
        descripcion: multa. descripcion || multa.tipo_infraccion,
        monto: multa. monto || 0,
        monto_final: multa.monto_final || multa.monto || 0,

        // Ubicación
        direccion: multa. direccion,
        latitud: multa. latitud,
        longitud: multa.longitud,

        // Agente
        agente_id: multa. agente_id,

        // Folio (se mantiene el mismo)
        folio: folio,

        // FIRMAS - IMPORTANTE
        firma_agente: multa. firma_agente || null,
        firma_infractor: multa.firma_infractor || null,

        // Fotos (limitadas)
        fotos: fotosLimitadas,

        // Metadatos offline
        id_temporal: Date.now().toString(),
        fecha_guardado: new Date().toISOString(),
        created_at: new Date().toISOString(),
        sincronizado: false,
        estatus: 'pendiente',
        esOffline: true,
      };

      multas.push(nuevaMulta);

      try {
        await AsyncStorage.setItem(OFFLINE_MULTAS_KEY, JSON.stringify(multas));
        console.log('✅ Multa guardada offline');
        console.log('   Folio:', nuevaMulta.folio);
        console.log('   Firma agente:', nuevaMulta.firma_agente ?  'Sí' : 'No');
        console.log('   Firma infractor:', nuevaMulta.firma_infractor ? 'Sí' : 'No');
      } catch (storageError) {
        // Si falla por tamaño, guardar sin fotos pero CON firmas
        console.log('⚠️ Guardando sin fotos por tamaño (firmas conservadas)');
        nuevaMulta.fotos = [];
        nuevaMulta.sinFotos = true;
        const multasSinFotos = await offlineService. obtenerMultasOffline();
        multasSinFotos.push(nuevaMulta);
        await AsyncStorage.setItem(OFFLINE_MULTAS_KEY, JSON.stringify(multasSinFotos));
      }

      return nuevaMulta;
    } catch (error) {
      console.error('❌ Error guardando multa offline:', error);
      throw error;
    }
  },

  obtenerMultasOffline: async () => {
    try {
      const data = await AsyncStorage. getItem(OFFLINE_MULTAS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error obteniendo multas offline:', error);
      return [];
    }
  },

  obtenerMultaOfflinePorId: async (id_temporal) => {
    try {
      const multas = await offlineService.obtenerMultasOffline();
      return multas. find((m) => m.id_temporal === id_temporal) || null;
    } catch (error) {
      console. error('Error obteniendo multa por ID:', error);
      return null;
    }
  },

  eliminarMultaOffline: async (id_temporal) => {
    try {
      const multas = await offlineService.obtenerMultasOffline();
      const nuevas = multas.filter((m) => m.id_temporal !== id_temporal);
      await AsyncStorage.setItem(OFFLINE_MULTAS_KEY, JSON.stringify(nuevas));
      console.log('✅ Multa offline eliminada:', id_temporal);
    } catch (error) {
      console.error('❌ Error eliminando multa offline:', error);
    }
  },

  sincronizarMultas: async () => {
    try {
      const multas = await offlineService. obtenerMultasOffline();

      if (multas.length === 0) {
        return { success: true, message: 'No hay multas pendientes', resultados: [] };
      }

      console.log(`\n🔄 Sincronizando ${multas.length} multa(s)...`);

      const resultados = [];

      for (const multa of multas) {
        try {
          console.log(`📤 Enviando multa:  ${multa.placa} - Folio: ${multa.folio}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetch(`${API_URL}/api/multas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // Datos básicos
              placa: multa.placa,
              tipo_infraccion:  multa.tipo_infraccion,
              descripcion: multa.descripcion,
              monto:  multa.monto,
              monto_final: multa.monto_final,

              // Ubicación
              direccion: multa. direccion,
              latitud: multa.latitud,
              longitud: multa.longitud,

              // Agente
              agente_id: multa.agente_id,

              // Folio (el mismo que se generó offline)
              folio: multa.folio,

              // FIRMAS
              firma_agente: multa.firma_agente,
              firma_infractor: multa.firma_infractor,

              // Fotos
              fotos: multa.fotos || [],
            }),
            signal:  controller.signal,
          });

          clearTimeout(timeoutId);

          const data = await response.json();

          if (response. ok && data.success) {
            await offlineService.eliminarMultaOffline(multa.id_temporal);
            console.log(`✅ Multa ${multa.placa} sincronizada - Folio: ${data.multa?. folio}`);
            resultados.push({
              success: true,
              placa: multa.placa,
              folio:  data.multa?. folio,
            });
          } else {
            console. log(`❌ Error sincronizando ${multa.placa}: `, data.error);
            resultados. push({
              success: false,
              placa: multa.placa,
              error: data.error,
            });
          }
        } catch (error) {
          console.error(`❌ Error de red sincronizando ${multa.placa}:`, error.message);
          resultados.push({
            success: false,
            placa:  multa.placa,
            error:  error.message,
          });
        }
      }

      const exitosas = resultados.filter((r) => r.success).length;
      const fallidas = resultados.filter((r) => !r.success).length;

      console.log(`\n🎉 Sincronización completada: ${exitosas} exitosas, ${fallidas} fallidas\n`);

      return {
        success: fallidas === 0,
        message: `Sincronizadas:  ${exitosas}, Errores: ${fallidas}`,
        resultados,
      };
    } catch (error) {
      console. error('❌ Error en sincronización:', error);
      return { success: false, message: error.message, resultados: [] };
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
      console.log('✅ Solicitud de grúa guardada offline');
    } catch (error) {
      console. error('❌ Error guardando solicitud de grúa:', error);
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
    try {
      await AsyncStorage.multiRemove([OFFLINE_MULTAS_KEY, GRUAS_SOLICITADAS_KEY]);
      console.log('✅ Datos offline limpiados');
    } catch (error) {
      console. error('❌ Error limpiando datos offline:', error);
    }
  },
};

export default offlineService;