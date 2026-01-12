import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../config/theme';
import { API_URL } from '../../config/api';
import { obtenerPagos } from '../../config/pagosStorage';
import { generarComprobantePagoPDF } from './pagar/comprobantePagoPDF';

export default function MisPagosScreen({ navigation }) {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(null);

  const cargarPagos = useCallback(async () => {
    try {
      let todosPagos = [];
      
      // 1. Cargar pagos guardados localmente (pagos hechos en sesión)
      if (user?.id) {
        const pagosLocales = await obtenerPagos(user.id);
        todosPagos = [...pagosLocales];
        console.log('Pagos locales:', pagosLocales.length);
      }
      
      // 2. Cargar multas pagadas de los vehículos del usuario
      try {
        const vehiculosResponse = await fetch(`${API_URL}/api/usuarios/${user?.id}/vehiculos`);
        const vehiculosData = await vehiculosResponse.json();
        
        if (vehiculosData.success && vehiculosData.vehiculos?.length > 0) {
          for (const vehiculo of vehiculosData.vehiculos) {
            try {
              const multasResponse = await fetch(`${API_URL}/api/multas/placa/${vehiculo.placa}`);
              const multasData = await multasResponse.json();
              
              if (multasData.multas || Array.isArray(multasData)) {
                const multas = multasData.multas || multasData;
                const pagadas = multas.filter(m => m.estatus === 'pagada');
                todosPagos = [...todosPagos, ...pagadas.map(m => ({
                  ...m,
                  placa: vehiculo.placa,
                }))];
              }
            } catch (error) {
              console.log(`Error buscando multas de ${vehiculo.placa}:`, error);
            }
          }
        }
      } catch (error) {
        console.log('Error cargando vehículos:', error);
      }
      
      // 3. Intentar cargar desde el endpoint de pagos del servidor (si existe)
      try {
        const pagosResponse = await fetch(`${API_URL}/api/usuarios/${user?.id}/pagos`);
        const pagosData = await pagosResponse.json();
        if (pagosData.success && pagosData.pagos?.length > 0) {
          todosPagos = [...todosPagos, ...pagosData.pagos];
        }
      } catch (error) {
        console.log('Endpoint de pagos no disponible');
      }
      
      // Eliminar duplicados por folio
      const pagosUnicos = todosPagos.reduce((acc, pago) => {
        const folio = pago.folio || pago.folio_multa;
        if (folio && !acc.find(p => (p.folio || p.folio_multa) === folio)) {
          acc.push(pago);
        }
        return acc;
      }, []);
      
      // Ordenar por fecha de pago (más reciente primero)
      pagosUnicos.sort((a, b) => {
        const fechaA = new Date(a.fecha_pago || a.guardado_en || a.updated_at || a.created_at);
        const fechaB = new Date(b.fecha_pago || b.guardado_en || b.updated_at || b.created_at);
        return fechaB - fechaA;
      });
      
      setPagos(pagosUnicos);
    } catch (error) {
      console.log('Error cargando pagos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargarPagos();
  }, [cargarPagos]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarPagos();
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getMetodoPagoIcon = (metodo) => {
    switch (metodo) {
      case 'tarjeta':
        return 'card';
      case 'transferencia':
        return 'swap-horizontal';
      case 'efectivo':
        return 'cash';
      case 'oxxo':
        return 'storefront';
      default:
        return 'wallet';
    }
  };

  // Generar comprobante de pago PDF
  const descargarComprobante = async (pago) => {
    setGenerandoPDF(pago.folio || pago.id);
    try {
      await generarComprobantePagoPDF(pago);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el comprobante');
    } finally {
      setGenerandoPDF(null);
    }
  };

  // Obtener placa del pago
  const obtenerPlaca = (pago) => {
    return pago.placa || 
           pago.vehiculos?.placa || 
           pago.vehiculo?.placa || 
           pago.placa_vehiculo || 
           'N/A';
  };

  // Estadísticas
  const stats = {
    totalPagado: pagos.reduce((sum, p) => sum + (parseFloat(p.monto_pagado || p.monto_final || p.monto) || 0), 0),
    totalPagos: pagos.length,
    ahorroDescuentos: pagos.reduce((sum, p) => sum + (p.descuento || 0), 0),
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando historial de pagos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen */}
        <View style={styles.resumenCard}>
          <View style={styles.resumenHeader}>
            <Ionicons name="receipt" size={32} color="#059669" />
            <Text style={styles.resumenTitle}>Historial de Pagos</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalPagos}</Text>
              <Text style={styles.statLabel}>Pagos realizados</Text>
            </View>
            <View style={styles.statBoxMain}>
              <Text style={styles.statValueMain}>
                ${stats.totalPagado.toLocaleString('es-MX')}
              </Text>
              <Text style={styles.statLabelMain}>Total pagado</Text>
            </View>
          </View>

          {stats.ahorroDescuentos > 0 && (
            <View style={styles.ahorroContainer}>
              <Ionicons name="pricetag" size={18} color="#059669" />
              <Text style={styles.ahorroText}>
                Has ahorrado ${stats.ahorroDescuentos.toLocaleString('es-MX')} en descuentos
              </Text>
            </View>
          )}
        </View>

        {/* Lista de pagos */}
        {pagos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Sin pagos registrados</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán tus comprobantes cuando realices pagos de tus multas
            </Text>
          </View>
        ) : (
          pagos.map((pago, index) => {
            const folio = pago.folio || pago.folio_multa;
            const placa = obtenerPlaca(pago);
            const monto = parseFloat(pago.monto_pagado || pago.monto_final || pago.monto) || 0;
            const fechaPago = pago.fecha_pago || pago.updated_at;
            const estaGenerando = generandoPDF === folio;
            
            return (
              <View key={folio || index} style={styles.pagoCard}>
                <View style={styles.pagoHeader}>
                  <View style={styles.pagoIconContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={28}
                      color="#059669"
                    />
                  </View>
                  <View style={styles.pagoInfo}>
                    <Text style={styles.pagoFolio}>Folio: {folio || 'N/A'}</Text>
                    <Text style={styles.pagoFecha}>{formatFecha(fechaPago)}</Text>
                  </View>
                  <View style={styles.pagoMonto}>
                    <Text style={styles.pagoMontoValue}>
                      ${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.badgePagado}>
                      <Text style={styles.badgePagadoText}>PAGADO</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pagoDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Placa:</Text>
                    <Text style={styles.detailValue}>{placa}</Text>
                  </View>
                  {pago.metodo_pago && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Método:</Text>
                      <Text style={styles.detailValue}>
                        {pago.metodo_pago.charAt(0).toUpperCase() + pago.metodo_pago.slice(1)}
                      </Text>
                    </View>
                  )}
                  {pago.linea_captura && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Línea de captura:</Text>
                      <Text style={styles.detailValue}>{pago.linea_captura}</Text>
                    </View>
                  )}
                  {pago.referencia_pago && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Referencia:</Text>
                      <Text style={styles.detailValue}>{pago.referencia_pago}</Text>
                    </View>
                  )}
                </View>

                {/* Botón de comprobante */}
                <TouchableOpacity
                  style={[styles.comprobanteBtn, estaGenerando && styles.comprobanteBtnDisabled]}
                  onPress={() => descargarComprobante(pago)}
                  disabled={estaGenerando}
                >
                  {estaGenerando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="document-text" size={18} color="#fff" />
                  )}
                  <Text style={styles.comprobanteBtnText}>
                    {estaGenerando ? 'Generando...' : 'Descargar Comprobante'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Información */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Sobre tus pagos</Text>
            <Text style={styles.infoText}>
              • Los pagos se reflejan en 24-48 horas hábiles{'\n'}
              • Guarda tus comprobantes como respaldo{'\n'}
              • Si tienes dudas, contacta a soporte
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  resumenCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  resumenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  resumenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statBoxMain: {
    flex: 1.5,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statValueMain: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statLabelMain: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 4,
  },
  ahorroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    gap: 8,
  },
  ahorroText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  pagoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.medium,
  },
  pagoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pagoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pagoFolio: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  pagoFecha: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  pagoMonto: {
    alignItems: 'flex-end',
  },
  pagoMontoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  pagoDescuento: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  pagoDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  montoTachado: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  estadoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  estadoCompletado: {
    backgroundColor: '#D1FAE5',
  },
  estadoPendiente: {
    backgroundColor: '#FEF3C7',
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgePagado: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  badgePagadoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  comprobanteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  comprobanteBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  comprobanteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 20,
  },
});
