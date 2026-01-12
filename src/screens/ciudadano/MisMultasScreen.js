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

export default function MisMultasScreen({ navigation }) {
  const { user } = useAuth();
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // todas, pendientes, pagadas

  const cargarMultas = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${user?.id}/multas`);
      const data = await response.json();
      if (data.success) {
        setMultas(data.multas || []);
      }
    } catch (error) {
      console.log('Error cargando multas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargarMultas();
  }, [cargarMultas]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarMultas();
  };

  // Eliminar multa de la lista del usuario (quita el vehículo asociado)
  const eliminarMulta = (multa) => {
    const placa = multa.placa || multa.vehiculos?.placa;
    Alert.alert(
      'Eliminar de Mis Multas',
      `¿Deseas dejar de monitorear el vehículo ${placa}? Esto eliminará todas las multas asociadas de tu lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/api/usuarios/${user?.id}/vehiculos/${placa}`,
                { method: 'DELETE' }
              );
              const data = await response.json();
              if (data.success) {
                Alert.alert('✅ Eliminado', 'El vehículo fue eliminado de tu lista');
                cargarMultas();
              } else {
                Alert.alert('Error', data.error || 'No se pudo eliminar');
              }
            } catch (error) {
              console.log('Error eliminando:', error);
              Alert.alert('Error', 'No se pudo conectar con el servidor');
            }
          },
        },
      ]
    );
  };

  const multasFiltradas = multas.filter((multa) => {
    if (filtro === 'pendientes') return multa.estatus === 'pendiente';
    if (filtro === 'pagadas') return multa.estatus === 'pagada';
    return true;
  });

  const getEstatusStyle = (estatus) => {
    switch (estatus) {
      case 'pendiente':
        return { bg: '#FEE2E2', color: '#DC2626', icon: 'alert-circle' };
      case 'pagada':
        return { bg: '#D1FAE5', color: '#059669', icon: 'checkmark-circle' };
      case 'impugnada':
        return { bg: '#EDE9FE', color: '#7C3AED', icon: 'scale' };
      case 'cancelada':
        return { bg: '#F3F4F6', color: '#6B7280', icon: 'close-circle' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', icon: 'help-circle' };
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calcularDescuento = (multa) => {
    if (multa.estatus !== 'pendiente') return null;
    
    const fechaCreacion = new Date(multa.created_at);
    const hoy = new Date();
    const diasTranscurridos = Math.floor((hoy - fechaCreacion) / (1000 * 60 * 60 * 24));
    
    if (diasTranscurridos <= 10) {
      return { porcentaje: 50, dias: 10 - diasTranscurridos };
    } else if (diasTranscurridos <= 20) {
      return { porcentaje: 30, dias: 20 - diasTranscurridos };
    }
    return null;
  };

  // Estadísticas
  const stats = {
    total: multas.length,
    pendientes: multas.filter((m) => m.estatus === 'pendiente').length,
    pagadas: multas.filter((m) => m.estatus === 'pagada').length,
    montoPendiente: multas
      .filter((m) => m.estatus === 'pendiente')
      .reduce((sum, m) => sum + (m.monto_final || m.monto || 0), 0),
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando multas...</Text>
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
          <Text style={styles.resumenTitle}>Resumen de Multas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statItem, styles.statPendientes]}>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.pendientes}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#059669' }]}>{stats.pagadas}</Text>
              <Text style={styles.statLabel}>Pagadas</Text>
            </View>
          </View>
          {stats.montoPendiente > 0 && (
            <View style={styles.montoContainer}>
              <Text style={styles.montoLabel}>Total por pagar:</Text>
              <Text style={styles.montoValue}>
                ${stats.montoPendiente.toLocaleString('es-MX')}
              </Text>
            </View>
          )}
        </View>

        {/* Filtros */}
        <View style={styles.filtrosContainer}>
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'pendientes', label: 'Pendientes' },
            { id: 'pagadas', label: 'Pagadas' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filtroBtn, filtro === f.id && styles.filtroBtnActivo]}
              onPress={() => setFiltro(f.id)}
            >
              <Text style={[styles.filtroBtnText, filtro === f.id && styles.filtroBtnTextActivo]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de multas */}
        {multasFiltradas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {filtro === 'todas' ? 'Sin multas registradas' : `Sin multas ${filtro}`}
            </Text>
            <Text style={styles.emptyText}>
              {filtro === 'todas'
                ? '¡Excelente! No tienes multas en el sistema'
                : 'No hay multas con este estado'}
            </Text>
          </View>
        ) : (
          multasFiltradas.map((multa, index) => {
            const estatusStyle = getEstatusStyle(multa.estatus);
            const descuento = calcularDescuento(multa);

            return (
              <TouchableOpacity
                key={index}
                style={styles.multaCard}
                onPress={() => navigation.navigate('DetalleMulta', { multa })}
              >
                {/* Descuento badge */}
                {descuento && (
                  <View style={styles.descuentoBadge}>
                    <Ionicons name="pricetag" size={14} color="#fff" />
                    <Text style={styles.descuentoText}>
                      {descuento.porcentaje}% desc. - {descuento.dias} días restantes
                    </Text>
                  </View>
                )}

                <View style={styles.multaHeader}>
                  <View>
                    <Text style={styles.multaFolio}>Folio: {multa.folio}</Text>
                    <Text style={styles.multaFecha}>{formatFecha(multa.created_at)}</Text>
                  </View>
                  <View style={[styles.estatusBadge, { backgroundColor: estatusStyle.bg }]}>
                    <Ionicons name={estatusStyle.icon} size={14} color={estatusStyle.color} />
                    <Text style={[styles.estatusText, { color: estatusStyle.color }]}>
                      {multa.estatus.charAt(0).toUpperCase() + multa.estatus.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.multaBody}>
                  <View style={styles.placaBox}>
                    <Text style={styles.placaLabel}>PLACA</Text>
                    <Text style={styles.placaValue}>{multa.placa || multa.vehiculos?.placa}</Text>
                  </View>

                  <View style={styles.multaInfo}>
                    <Text style={styles.infoTipo} numberOfLines={2}>
                      {multa.tipo_infraccion}
                    </Text>
                    <Text style={styles.infoDireccion} numberOfLines={1}>
                      📍 {multa.direccion || 'Sin ubicación'}
                    </Text>
                  </View>
                </View>

                <View style={styles.multaFooter}>
                  <View>
                    <Text style={styles.montoLabel2}>Monto:</Text>
                    <Text style={styles.montoValue2}>
                      ${(multa.monto_final || multa.monto || 0).toLocaleString('es-MX')}
                    </Text>
                  </View>
                  <View style={styles.footerActions}>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        eliminarMulta(multa);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                    <View style={styles.verDetalleBtn}>
                      <Text style={styles.verDetalleText}>Ver detalle</Text>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

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
  resumenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statPendientes: {
    paddingHorizontal: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  montoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  montoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  montoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  filtrosContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  filtroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtroBtnActivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filtroBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filtroBtnTextActivo: {
    color: '#fff',
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
  multaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.medium,
  },
  descuentoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 5,
  },
  descuentoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  multaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  multaFolio: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  multaFecha: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  estatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  estatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  multaBody: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  placaBox: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  placaLabel: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  placaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  multaInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTipo: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  infoDireccion: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  multaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  montoLabel2: {
    fontSize: 11,
    color: '#6B7280',
  },
  montoValue2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  verDetalleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verDetalleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
});
