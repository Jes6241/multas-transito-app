import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../config/theme';
import { API_URL } from '../../config/api';

export default function MisImpugnacionesScreen({ navigation }) {
  const { user } = useAuth();
  const [impugnaciones, setImpugnaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarImpugnaciones = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${user?.id}/impugnaciones`);
      const data = await response.json();
      if (data.success) {
        setImpugnaciones(data.impugnaciones || []);
      }
    } catch (error) {
      console.log('Error cargando impugnaciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargarImpugnaciones();
  }, [cargarImpugnaciones]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarImpugnaciones();
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEstadoConfig = (estado) => {
    switch (estado) {
      case 'pendiente':
        return {
          bg: '#FEF3C7',
          color: '#D97706',
          icon: 'time',
          label: 'En revisión',
        };
      case 'en_proceso':
        return {
          bg: '#DBEAFE',
          color: '#2563EB',
          icon: 'hourglass',
          label: 'En proceso',
        };
      case 'aprobada':
        return {
          bg: '#D1FAE5',
          color: '#059669',
          icon: 'checkmark-circle',
          label: 'Aprobada',
        };
      case 'rechazada':
        return {
          bg: '#FEE2E2',
          color: '#DC2626',
          icon: 'close-circle',
          label: 'Rechazada',
        };
      default:
        return {
          bg: '#F3F4F6',
          color: '#6B7280',
          icon: 'help-circle',
          label: estado || 'Desconocido',
        };
    }
  };

  const getProgresoSteps = (estado) => {
    const steps = [
      { id: 'enviada', label: 'Enviada' },
      { id: 'revision', label: 'En revisión' },
      { id: 'analisis', label: 'Análisis' },
      { id: 'resolucion', label: 'Resolución' },
    ];

    let activeIndex = 0;
    if (estado === 'pendiente') activeIndex = 1;
    if (estado === 'en_proceso') activeIndex = 2;
    if (estado === 'aprobada' || estado === 'rechazada') activeIndex = 3;

    return steps.map((step, index) => ({
      ...step,
      completed: index <= activeIndex,
      active: index === activeIndex,
    }));
  };

  // Estadísticas
  const stats = {
    total: impugnaciones.length,
    pendientes: impugnaciones.filter((i) => i.estado === 'pendiente' || i.estado === 'en_proceso').length,
    aprobadas: impugnaciones.filter((i) => i.estado === 'aprobada').length,
    rechazadas: impugnaciones.filter((i) => i.estado === 'rechazada').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando impugnaciones...</Text>
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
        {/* Header */}
        <View style={styles.headerCard}>
          <Ionicons name="scale" size={40} color="#7C3AED" />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mis Impugnaciones</Text>
            <Text style={styles.headerSubtitle}>
              Seguimiento de tus solicitudes de revisión
            </Text>
          </View>
        </View>

        {/* Estadísticas */}
        {impugnaciones.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statItem, styles.statYellow]}>
              <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pendientes}</Text>
              <Text style={styles.statLabel}>En proceso</Text>
            </View>
            <View style={[styles.statItem, styles.statGreen]}>
              <Text style={[styles.statValue, { color: '#059669' }]}>{stats.aprobadas}</Text>
              <Text style={styles.statLabel}>Aprobadas</Text>
            </View>
            <View style={[styles.statItem, styles.statRed]}>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.rechazadas}</Text>
              <Text style={styles.statLabel}>Rechazadas</Text>
            </View>
          </View>
        )}

        {/* Lista de impugnaciones */}
        {impugnaciones.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Sin impugnaciones</Text>
            <Text style={styles.emptyText}>
              No tienes solicitudes de impugnación registradas
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('BuscarMulta')}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Buscar una multa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          impugnaciones.map((impugnacion, index) => {
            const estadoConfig = getEstadoConfig(impugnacion.estado);
            const progresoSteps = getProgresoSteps(impugnacion.estado);

            return (
              <View key={index} style={styles.impugnacionCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardFolio}>
                      Impugnación #{impugnacion.numero || index + 1}
                    </Text>
                    <Text style={styles.cardFecha}>
                      Enviada el {formatFecha(impugnacion.created_at)}
                    </Text>
                  </View>
                  <View style={[styles.estadoBadge, { backgroundColor: estadoConfig.bg }]}>
                    <Ionicons name={estadoConfig.icon} size={14} color={estadoConfig.color} />
                    <Text style={[styles.estadoText, { color: estadoConfig.color }]}>
                      {estadoConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Info de la multa */}
                <View style={styles.multaInfo}>
                  <View style={styles.placaBox}>
                    <Text style={styles.placaLabel}>PLACA</Text>
                    <Text style={styles.placaValue}>{impugnacion.placa}</Text>
                  </View>
                  <View style={styles.multaDetails}>
                    <Text style={styles.multaFolio}>Multa: {impugnacion.folio_multa}</Text>
                    <Text style={styles.multaTipo} numberOfLines={1}>
                      {impugnacion.tipo_infraccion}
                    </Text>
                  </View>
                </View>

                {/* Progreso */}
                <View style={styles.progresoContainer}>
                  <Text style={styles.progresoTitle}>Estado del proceso:</Text>
                  <View style={styles.progresoSteps}>
                    {progresoSteps.map((step, idx) => (
                      <View key={step.id} style={styles.stepContainer}>
                        <View style={[
                          styles.stepDot,
                          step.completed && styles.stepDotCompleted,
                          step.active && styles.stepDotActive,
                        ]}>
                          {step.completed && !step.active && (
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          )}
                        </View>
                        <Text style={[
                          styles.stepLabel,
                          step.active && styles.stepLabelActive,
                        ]}>
                          {step.label}
                        </Text>
                        {idx < progresoSteps.length - 1 && (
                          <View style={[
                            styles.stepLine,
                            step.completed && styles.stepLineCompleted,
                          ]} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Motivo */}
                <View style={styles.motivoContainer}>
                  <Text style={styles.motivoLabel}>Motivo de impugnación:</Text>
                  <Text style={styles.motivoText} numberOfLines={2}>
                    {impugnacion.motivo || 'Sin descripción'}
                  </Text>
                </View>

                {/* Resolución (si existe) */}
                {impugnacion.resolucion && (
                  <View style={[
                    styles.resolucionContainer,
                    impugnacion.estado === 'aprobada' ? styles.resolucionAprobada : styles.resolucionRechazada
                  ]}>
                    <Ionicons
                      name={impugnacion.estado === 'aprobada' ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={impugnacion.estado === 'aprobada' ? '#059669' : '#DC2626'}
                    />
                    <View style={styles.resolucionContent}>
                      <Text style={styles.resolucionTitle}>
                        {impugnacion.estado === 'aprobada' ? 'Resolución favorable' : 'Resolución desfavorable'}
                      </Text>
                      <Text style={styles.resolucionText}>{impugnacion.resolucion}</Text>
                    </View>
                  </View>
                )}

                {/* Acción */}
                <TouchableOpacity
                  style={styles.verDetalleBtn}
                  onPress={() => navigation.navigate('DetalleMulta', { folio: impugnacion.folio_multa })}
                >
                  <Text style={styles.verDetalleText}>Ver multa asociada</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Proceso de impugnación</Text>
          <Text style={styles.infoText}>
            1. <Text style={styles.infoBold}>Enviada:</Text> Tu solicitud fue recibida{'\n'}
            2. <Text style={styles.infoBold}>En revisión:</Text> Un agente la está revisando{'\n'}
            3. <Text style={styles.infoBold}>Análisis:</Text> Se evalúan las evidencias{'\n'}
            4. <Text style={styles.infoBold}>Resolución:</Text> Decisión final (5-10 días hábiles)
          </Text>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  headerContent: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statYellow: {
    backgroundColor: '#FFFBEB',
  },
  statGreen: {
    backgroundColor: '#ECFDF5',
  },
  statRed: {
    backgroundColor: '#FEF2F2',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
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
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  impugnacionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardFolio: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardFecha: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  multaInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
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
  multaDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  multaFolio: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  multaTipo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progresoContainer: {
    marginBottom: 15,
  },
  progresoTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  progresoSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#7C3AED',
  },
  stepDotActive: {
    backgroundColor: '#7C3AED',
    borderWidth: 3,
    borderColor: '#DDD6FE',
  },
  stepLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 12,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  stepLineCompleted: {
    backgroundColor: '#7C3AED',
  },
  motivoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  motivoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  motivoText: {
    fontSize: 14,
    color: '#374151',
  },
  resolucionContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    gap: 10,
  },
  resolucionAprobada: {
    backgroundColor: '#ECFDF5',
  },
  resolucionRechazada: {
    backgroundColor: '#FEF2F2',
  },
  resolucionContent: {
    flex: 1,
  },
  resolucionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resolucionText: {
    fontSize: 13,
    color: '#374151',
  },
  verDetalleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  verDetalleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#EDE9FE',
    margin: 15,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#6D28D9',
    lineHeight: 22,
  },
  infoBold: {
    fontWeight: '600',
  },
});
