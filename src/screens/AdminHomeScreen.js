import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';
const { width } = Dimensions.get('window');

export default function AdminHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    multasHoy: 0,
    multasTotal: 0,
    multasPendientes: 0,
    multasPagadas: 0,
    gruasActivas: 0,
    gruasDisponibles: 0,
    vehiculosCorralon: 0,
    ingresosMes: 0,
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarEstadisticas);
    return unsubscribe;
  }, [navigation]);

  const cargarEstadisticas = async () => {
    setRefreshing(true);
    try {
      // Cargar multas
      const resMultas = await fetch(`${API_URL}/api/multas`);
      const dataMultas = await resMultas.json();

      if (dataMultas.success) {
        const hoy = new Date().toDateString();
        const multasHoy = dataMultas.multas.filter(
          (m) => new Date(m.created_at).toDateString() === hoy
        ).length;
        const pendientes = dataMultas.multas.filter(
          (m) => m.estatus === 'pendiente'
        ).length;
        const pagadas = dataMultas.multas. filter(
          (m) => m.estatus === 'pagada'
        ).length;
        const ingresos = dataMultas.multas
          .filter((m) => m.estatus === 'pagada')
          .reduce((sum, m) => sum + (m.monto_final || 0), 0);

        setStats((prev) => ({
          ...prev,
          multasHoy,
          multasTotal: dataMultas. multas.length,
          multasPendientes: pendientes,
          multasPagadas: pagadas,
          ingresosMes:  ingresos,
        }));
      }

      // Cargar grúas
      const resGruas = await fetch(`${API_URL}/api/gruas`);
      const dataGruas = await resGruas. json();

      if (dataGruas.success) {
        const disponibles = dataGruas.gruas. filter((g) => g.disponible).length;
        const activas = dataGruas.gruas.filter((g) => !g.disponible).length;

        setStats((prev) => ({
          ...prev,
          gruasDisponibles: disponibles,
          gruasActivas: activas,
        }));
      }

      // Cargar corralón
      const resCorralon = await fetch(`${API_URL}/api/corralon`);
      const dataCorralon = await resCorralon.json();

      if (dataCorralon.success) {
        const retenidos = dataCorralon.vehiculos.filter(
          (v) => v.estatus === 'retenido'
        ).length;

        setStats((prev) => ({
          ...prev,
          vehiculosCorralon: retenidos,
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro? ', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, salir', onPress:  logout, style: 'destructive' },
    ]);
  };

  const formatMoney = (amount) => {
    return new Intl. NumberFormat('es-MX', {
      style: 'currency',
      currency:  'MXN',
    }).format(amount);
  };

  return (
    <ScrollView
      style={styles. container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={cargarEstadisticas} />
      }
    >
      {/* Header */}
      <View style={styles. header}>
        <View>
          <Text style={styles.headerSubtitle}>Panel de Administración</Text>
          <Text style={styles.headerTitle}>Hola, {user?. nombre}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications" size={24} color="#fff" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ingresos del mes */}
      <View style={styles.ingresoCard}>
        <View style={styles.ingresoHeader}>
          <Text style={styles.ingresoLabel}>Ingresos por Multas</Text>
          <Ionicons name="trending-up" size={24} color="#10B981" />
        </View>
        <Text style={styles.ingresoMonto}>{formatMoney(stats.ingresosMes)}</Text>
        <Text style={styles.ingresoPeriodo}>Total recaudado (multas pagadas)</Text>
      </View>

      {/* Estadísticas principales */}
      <View style={styles. statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}
          onPress={() => navigation.navigate('Historial')}
        >
          <Ionicons name="document-text" size={28} color="#3B82F6" />
          <Text style={styles.statNumber}>{stats.multasTotal}</Text>
          <Text style={styles.statLabel}>Multas Total</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="today" size={28} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.multasHoy}</Text>
          <Text style={styles.statLabel}>Multas Hoy</Text>
        </View>

        <View style={[styles. statCard, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="time" size={28} color="#EF4444" />
          <Text style={styles.statNumber}>{stats.multasPendientes}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>

        <View style={[styles. statCard, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={28} color="#10B981" />
          <Text style={styles.statNumber}>{stats.multasPagadas}</Text>
          <Text style={styles.statLabel}>Pagadas</Text>
        </View>
      </View>

      {/* Grúas y Corralón */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚛 Grúas y Corralón</Text>
        <View style={styles.gruasCorralon}>
          <TouchableOpacity
            style={styles.gruaCard}
            onPress={() => navigation.navigate('GruasSolicitadas')}
          >
            <View style={styles.gruaIconContainer}>
              <Ionicons name="car-sport" size={32} color="#6366F1" />
            </View>
            <View style={styles.gruaInfo}>
              <Text style={styles.gruaTitle}>Grúas</Text>
              <View style={styles.gruaStats}>
                <View style={styles.gruaStat}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.gruaStatText}>
                    {stats. gruasDisponibles} disponibles
                  </Text>
                </View>
                <View style={styles. gruaStat}>
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.gruaStatText}>
                    {stats.gruasActivas} activas
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.corralónCard}
            onPress={() => navigation.navigate('VehiculosCorralón')}
          >
            <View style={styles.corralónIconContainer}>
              <Ionicons name="business" size={32} color="#7C3AED" />
            </View>
            <View style={styles.corralónInfo}>
              <Text style={styles.corralónTitle}>Corralón</Text>
              <Text style={styles.corralónStats}>
                {stats.vehiculosCorralon} vehículos retenidos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Acciones Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
        <View style={styles.accionesGrid}>
          <TouchableOpacity
            style={styles.accionCard}
            onPress={() => navigation.navigate('Historial')}
          >
            <View style={[styles.accionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="search" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.accionText}>Buscar Multas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accionCard}
            onPress={() => navigation.navigate('GruasSolicitadas')}
          >
            <View style={[styles. accionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="car-sport" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.accionText}>Ver Grúas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accionCard}
            onPress={() => navigation.navigate('VehiculosCorralón')}
          >
            <View style={[styles.accionIcon, { backgroundColor:  '#E0E7FF' }]}>
              <Ionicons name="business" size={24} color="#6366F1" />
            </View>
            <Text style={styles.accionText}>Corralón</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accionCard}
            onPress={() => Alert.alert('Próximamente', 'Función en desarrollo')}
          >
            <View style={[styles. accionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="stats-chart" size={24} color="#10B981" />
            </View>
            <Text style={styles.accionText}>Reportes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accionCard}
            onPress={() => Alert.alert('Próximamente', 'Función en desarrollo')}
          >
            <View style={[styles.accionIcon, { backgroundColor:  '#FCE7F3' }]}>
              <Ionicons name="people" size={24} color="#EC4899" />
            </View>
            <Text style={styles.accionText}>Usuarios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accionCard}
            onPress={() => Alert.alert('Próximamente', 'Función en desarrollo')}
          >
            <View style={[styles.accionIcon, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="settings" size={24} color="#6B7280" />
            </View>
            <Text style={styles.accionText}>Configuración</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info del sistema */}
      <View style={styles. systemInfo}>
        <Text style={styles. systemInfoTitle}>ℹ️ Sistema</Text>
        <View style={styles.systemInfoRow}>
          <Text style={styles.systemInfoLabel}>Versión: </Text>
          <Text style={styles. systemInfoValue}>2.0.0</Text>
        </View>
        <View style={styles. systemInfoRow}>
          <Text style={styles.systemInfoLabel}>Servidor:</Text>
          <View style={styles.serverStatus}>
            <View style={styles.serverDot} />
            <Text style={styles.systemInfoValue}>En línea</Text>
          </View>
        </View>
        <View style={styles.systemInfoRow}>
          <Text style={styles. systemInfoLabel}>Última actualización:</Text>
          <Text style={styles.systemInfoValue}>
            {new Date().toLocaleDateString('es-MX')}
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header:  {
    backgroundColor: '#1E40AF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: { color: '#93C5FD', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  notifBtn: { position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 18,
    height:  18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: { color:  '#fff', fontSize: 10, fontWeight: 'bold' },
  ingresoCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    ... SHADOWS.medium,
  },
  ingresoHeader: {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'center',
  },
  ingresoLabel: { color: '#6B7280', fontSize: 14 },
  ingresoMonto: { fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginTop: 10 },
  ingresoPeriodo:  { color: '#9CA3AF', fontSize: 12, marginTop: 5 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    paddingTop: 0,
    gap: 10,
  },
  statCard: {
    width: (width - 50) / 2,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  section: { padding: 15, paddingTop: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  gruasCorralon:  { gap: 12 },
  gruaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    ... SHADOWS.small,
  },
  gruaIconContainer: {
    width: 56,
    height:  56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gruaInfo: { flex: 1, marginLeft: 15 },
  gruaTitle: { fontSize: 16, fontWeight:  'bold', color: '#1F2937' },
  gruaStats: { marginTop: 5 },
  gruaStat: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dot:  { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  gruaStatText: { fontSize: 13, color: '#6B7280' },
  corralónCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    ...SHADOWS. small,
  },
  corralónIconContainer: {
    width: 56,
    height:  56,
    borderRadius: 28,
    backgroundColor:  '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corralónInfo: { flex: 1, marginLeft: 15 },
  corralónTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  corralónStats: { fontSize: 13, color: '#6B7280', marginTop: 3 },
  accionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  accionCard: {
    width: (width - 54) / 3,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  accionIcon: {
    width: 48,
    height:  48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  accionText:  { fontSize: 11, color: '#4B5563', textAlign: 'center', fontWeight: '500' },
  systemInfo: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    ... SHADOWS.small,
  },
  systemInfoTitle:  { fontSize: 14, fontWeight: 'bold', color:  '#1F2937', marginBottom: 10 },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  systemInfoLabel:  { color: '#6B7280', fontSize: 13 },
  systemInfoValue: { color:  '#1F2937', fontSize: 13, fontWeight: '500' },
  serverStatus: { flexDirection: 'row', alignItems:  'center', gap: 6 },
  serverDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
});