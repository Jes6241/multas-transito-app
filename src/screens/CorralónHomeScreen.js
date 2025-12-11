import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function CorralónHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendientes: 0,
    enCorralon: 0,
    hoy: 0,
  });
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarDatos);
    return unsubscribe;
  }, [navigation]);

  const cargarDatos = async () => {
    setRefreshing(true);
    try {
      // Cargar solicitudes pendientes
      const resSolicitudes = await fetch(`${API_URL}/api/solicitudes-grua`);
      const dataSolicitudes = await resSolicitudes.json();

      if (dataSolicitudes.success) {
        const pendientes = dataSolicitudes.solicitudes.filter(
          (s) => s.estatus === 'pendiente' || s.estatus === 'en_camino'
        );
        setSolicitudesPendientes(pendientes);
        setStats((prev) => ({ ...prev, pendientes: pendientes.length }));
      }

      // Cargar vehículos en corralón
      const resCorralon = await fetch(`${API_URL}/api/corralon`);
      const dataCorralon = await resCorralon.json();

      if (dataCorralon.success) {
        const enCorralon = dataCorralon.vehiculos.filter(
          (v) => v.estatus === 'retenido'
        ).length;
        const hoy = dataCorralon.vehiculos.filter((v) => {
          const fecha = new Date(v.fecha_ingreso).toDateString();
          return fecha === new Date().toDateString();
        }).length;

        setStats((prev) => ({ ...prev, enCorralon, hoy }));
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

  const parseVehiculos = (notas) => {
    try {
      return JSON.parse(notas || '[]');
    } catch {
      return [];
    }
  };

  return (
    <ScrollView
      style={styles. container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={cargarDatos} />
      }
    >
      {/* Header */}
      <View style={styles. header}>
        <View>
          <Text style={styles.headerSubtitle}>Agente Corralón</Text>
          <Text style={styles.headerTitle}>{user?.nombre}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.onlineBadge}>
            <Ionicons name="wifi" size={14} color="#fff" />
            <Text style={styles. onlineText}>En línea</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}
          onPress={() => navigation.navigate('RecibirVehiculo')}
        >
          <Ionicons name="time" size={28} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.pendientes}</Text>
          <Text style={styles.statLabel}>Por Recibir</Text>
          <Text style={styles.verMas}>Ver →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}
          onPress={() => navigation.navigate('VehiculosCorralón')}
        >
          <Ionicons name="car" size={28} color="#3B82F6" />
          <Text style={styles.statNumber}>{stats. enCorralon}</Text>
          <Text style={styles. statLabel}>En Corralón</Text>
          <Text style={styles.verMas}>Ver →</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="today" size={28} color="#10B981" />
          <Text style={styles.statNumber}>{stats.hoy}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RecibirVehiculo')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="download" size={28} color="#EF4444" />
            </View>
            <Text style={styles.actionText}>Recibir Vehículo</Text>
            {stats.pendientes > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendientes}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('VehiculosCorralón')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="car-sport" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Ver Corralón</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Solicitudes Pendientes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          🚛 Grúas en Camino ({solicitudesPendientes.length})
        </Text>

        {solicitudesPendientes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={50} color="#10B981" />
            <Text style={styles.emptyTitle}>Todo en orden</Text>
            <Text style={styles.emptyText}>No hay vehículos por recibir</Text>
          </View>
        ) : (
          solicitudesPendientes.map((solicitud) => {
            const vehiculos = parseVehiculos(solicitud.notas);
            return (
              <TouchableOpacity
                key={solicitud. id}
                style={styles.solicitudCard}
                onPress={() =>
                  navigation. navigate('RecibirVehiculo', { solicitud })
                }
              >
                <View style={styles.solicitudHeader}>
                  <Text style={styles. solicitudGrua}>
                    🚛 {solicitud. gruas?. numero || 'Grúa'}
                  </Text>
                  <View style={styles.enCaminoBadge}>
                    <Ionicons name="time" size={14} color="#F59E0B" />
                    <Text style={styles. enCaminoText}>En camino</Text>
                  </View>
                </View>

                <Text style={styles.solicitudOperador}>
                  👷 {solicitud. gruas?.operador_nombre}
                </Text>
                <Text style={styles.solicitudTelefono}>
                  📞 {solicitud.gruas?.operador_telefono}
                </Text>
                <Text style={styles.solicitudUbicacion}>
                  📍 {solicitud.ubicacion || 'Sin ubicación'}
                </Text>

                <View style={styles.vehiculosList}>
                  <Text style={styles.vehiculosTitle}>
                    Vehículos:  {vehiculos.length}
                  </Text>
                  {vehiculos.map((v, i) => (
                    <View key={i} style={styles.vehiculoItem}>
                      <Text style={styles. vehiculoPlaca}>🚗 {v.placa}</Text>
                      <Text style={styles. vehiculoInfo}>
                        {v.marca} • {v.color} • {v.motivo}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles. recibirBtn}>
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles. recibirBtnText}>Recibir Vehículo</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header:  {
    backgroundColor: '#7C3AED',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: { color: '#DDD6FE', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  onlineBadge:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal:  10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  onlineText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', padding: 15, gap: 10 },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS. small,
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color:  '#1F2937', marginTop: 5 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  verMas: { fontSize:  12, color:  '#3B82F6', marginTop: 5 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  actionsGrid: { flexDirection: 'row', gap: 15 },
  actionCard:  {
    flex: 1,
    backgroundColor: '#fff',
    padding:  20,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS.small,
    position: 'relative',
  },
  actionIcon: {
    width: 56,
    height:  56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    width: 24,
    height:  24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyState:  {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  emptyTitle:  { fontSize: 18, fontWeight: 'bold', color:  '#1F2937', marginTop: 15 },
  emptyText: { color: '#6B7280', marginTop: 5 },
  solicitudCard: {
    backgroundColor: '#fff',
    padding:  15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    ...SHADOWS.small,
  },
  solicitudHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  solicitudGrua: { fontSize: 18, fontWeight: 'bold', color:  '#1F2937' },
  enCaminoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  enCaminoText: { color: '#92400E', fontSize: 12, fontWeight:  '600' },
  solicitudOperador: { color: '#4B5563', marginBottom: 2 },
  solicitudTelefono: { color: '#6366F1', marginBottom: 2 },
  solicitudUbicacion:  { color: '#6B7280', fontSize: 13, marginBottom: 10 },
  vehiculosList: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom:  15,
  },
  vehiculosTitle: { fontSize: 14, fontWeight: '600', color: '#0369A1', marginBottom: 8 },
  vehiculoItem: {
    backgroundColor: '#fff',
    padding:  10,
    borderRadius: 8,
    marginBottom:  5,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  vehiculoPlaca: { fontSize: 15, fontWeight: 'bold', color:  '#1E40AF' },
  vehiculoInfo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  recibirBtn: {
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  recibirBtnText:  { color: '#fff', fontWeight: '600', fontSize: 16 },
});