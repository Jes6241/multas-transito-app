import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function GruasSolicitadasScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarSolicitudes();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarSolicitudes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/solicitudes-grua`);
      const data = await response. json();

      if (data.success) {
        setSolicitudes(data.solicitudes || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cancelarSolicitud = async (solicitud) => {
    Alert.alert(
      '❌ Cancelar Solicitud',
      '¿Estás seguro?  La grúa quedará disponible.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/api/solicitudes-grua/${solicitud.id}/cancelar`,
                { method: 'PATCH' }
              );
              const data = await response.json();

              if (data. success) {
                Alert.alert('Cancelado', 'La solicitud fue cancelada');
                cargarSolicitudes();
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar');
            }
          },
        },
      ]
    );
  };

  const getEstatusInfo = (estatus) => {
    switch (estatus) {
      case 'pendiente':
        return { color: '#F59E0B', bg: '#FEF3C7', icon: 'time', texto: 'En Camino' };
      case 'en_camino': 
        return { color:  '#3B82F6', bg: '#DBEAFE', icon:  'car', texto: 'En Servicio' };
      case 'completada':
        return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle', texto: 'Completada' };
      case 'cancelada':
        return { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle', texto: 'Cancelada' };
      default: 
        return { color: '#6B7280', bg: '#F3F4F6', icon: 'help', texto: 'Pendiente' };
    }
  };

  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (filtro === 'todas') return true;
    if (filtro === 'activas') return s.estatus === 'pendiente' || s.estatus === 'en_camino';
    return s.estatus === filtro;
  });

  const llamarOperador = (telefono) => {
    if (telefono) Linking.openURL(`tel:${telefono}`);
  };

  const parseVehiculos = (notas) => {
    try {
      if (! notas) return [];
      const parsed = JSON.parse(notas);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const renderSolicitud = ({ item }) => {
    const estatusInfo = getEstatusInfo(item.estatus);
    const grua = item.gruas;
    const vehiculos = parseVehiculos(item.notas);
    const esActiva = item.estatus === 'pendiente' || item. estatus === 'en_camino';

    return (
      <View style={[styles.solicitudCard, esActiva && styles. solicitudActiva]}>
        <View style={styles.solicitudHeader}>
          <View>
            <Text style={styles.solicitudId}>#{item.id?. slice(0, 8)}</Text>
            <Text style={styles.solicitudFecha}>
              {new Date(item.created_at).toLocaleString('es-MX')}
            </Text>
          </View>
          <View style={[styles.estatusBadge, { backgroundColor: estatusInfo.bg }]}>
            <Ionicons name={estatusInfo.icon} size={14} color={estatusInfo.color} />
            <Text style={[styles.estatusText, { color: estatusInfo.color }]}>
              {estatusInfo.texto}
            </Text>
          </View>
        </View>

        {grua && (
          <View style={styles.gruaInfo}>
            <Ionicons name="car-sport" size={24} color="#6366F1" />
            <View style={styles.gruaInfoText}>
              <Text style={styles.gruaNumero}>{grua.numero}</Text>
              <Text style={styles. gruaOperador}>👷 {grua.operador_nombre}</Text>
              <Text style={styles.gruaTelefono}>📞 {grua. operador_telefono}</Text>
            </View>
            <TouchableOpacity
              style={styles.llamarBtn}
              onPress={() => llamarOperador(grua.operador_telefono)}
            >
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.ubicacionContainer}>
          <Ionicons name="location" size={18} color="#6B7280" />
          <Text style={styles.ubicacionText}>{item.ubicacion || 'Sin ubicación'}</Text>
        </View>

        {vehiculos.length > 0 && (
          <View style={styles.vehiculosContainer}>
            <Text style={styles. vehiculosTitle}>🚗 Vehículos:  {vehiculos.length}</Text>
            {vehiculos.map((v, index) => (
              <View key={index} style={styles.vehiculoItem}>
                <Text style={styles.vehiculoPlaca}>{v. placa}</Text>
                <Text style={styles.vehiculoInfo}>
                  {v.marca} • {v.color} • {v.motivo}
                </Text>
              </View>
            ))}
          </View>
        )}

        {esActiva && (
          <View style={styles.accionesContainer}>
            <View style={styles.esperandoInfo}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={styles.esperandoText}>
                Se completará automáticamente al llegar al corralón
              </Text>
            </View>
            <TouchableOpacity style={styles.cancelarBtn} onPress={() => cancelarSolicitud(item)}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text style={styles.cancelarBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS. primary} />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
      </View>
    );
  }

  const activas = solicitudes.filter(
    (s) => s.estatus === 'pendiente' || s.estatus === 'en_camino'
  ).length;
  const completadas = solicitudes. filter((s) => s.estatus === 'completada').length;
  const canceladas = solicitudes.filter((s) => s.estatus === 'cancelada').length;

  return (
    <View style={styles.container}>
      {/* Resumen */}
      <View style={styles.resumenContainer}>
        <View style={[styles.resumenCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="time" size={24} color="#F59E0B" />
          <Text style={styles.resumenNumero}>{activas}</Text>
          <Text style={styles. resumenLabel}>Activas</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles. resumenNumero}>{completadas}</Text>
          <Text style={styles.resumenLabel}>Completadas</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor:  '#FEE2E2' }]}>
          <Ionicons name="close-circle" size={24} color="#EF4444" />
          <Text style={styles. resumenNumero}>{canceladas}</Text>
          <Text style={styles.resumenLabel}>Canceladas</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {['todas', 'activas', 'completada', 'cancelada'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBtn, filtro === f && styles.filtroBtnActivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextActivo]}>
              {f === 'todas'
                ? 'Todas'
                : f === 'activas'
                ? 'Activas'
                :  f === 'completada'
                ? 'Completadas'
                : 'Canceladas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={solicitudesFiltradas}
        renderItem={renderSolicitud}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={cargarSolicitudes} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay solicitudes</Text>
            <Text style={styles.emptyText}>Las grúas que solicites aparecerán aquí</Text>
            <TouchableOpacity
              style={styles. solicitarBtn}
              onPress={() => navigation.navigate('SolicitarGrua')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.solicitarBtnText}>Solicitar Grúa</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SolicitarGrua')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems:  'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  resumenContainer:  { flexDirection: 'row', padding: 15, gap: 10 },
  resumenCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  resumenNumero: { fontSize: 24, fontWeight:  'bold', color: '#1F2937', marginTop: 5 },
  resumenLabel: { fontSize: 11, color: '#6B7280' },
  filtros: { flexDirection:  'row', paddingHorizontal:  15, marginBottom: 10, gap: 8 },
  filtroBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor:  '#fff',
    ... SHADOWS.small,
  },
  filtroBtnActivo:  { backgroundColor: '#1E40AF' },
  filtroText: { fontSize: 12, color: '#6B7280' },
  filtroTextActivo: { color: '#fff', fontWeight: '600' },
  lista: { padding: 15, paddingTop: 5, paddingBottom:  100 },
  solicitudCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    ... SHADOWS.small,
  },
  solicitudActiva: { borderLeftWidth: 4, borderLeftColor:  '#F59E0B' },
  solicitudHeader: {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  solicitudId:  { fontSize: 14, fontWeight: 'bold', color:  '#1F2937' },
  solicitudFecha: { fontSize:  12, color:  '#9CA3AF' },
  estatusBadge:  {
    flexDirection:  'row',
    alignItems: 'center',
    paddingHorizontal:  10,
    paddingVertical:  5,
    borderRadius: 12,
    gap: 5,
  },
  estatusText: { fontSize: 12, fontWeight: '600' },
  gruaInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 12,
  },
  gruaInfoText: { flex: 1 },
  gruaNumero: { fontSize: 16, fontWeight: 'bold', color: '#4F46E5' },
  gruaOperador: { fontSize:  13, color: '#6366F1', marginTop: 2 },
  gruaTelefono:  { fontSize: 13, color: '#6366F1' },
  llamarBtn: { backgroundColor: '#10B981', padding: 12, borderRadius: 25 },
  ubicacionContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  ubicacionText: { flex: 1, fontSize: 13, color: '#4B5563' },
  vehiculosContainer: {
    marginTop: 5,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
  },
  vehiculosTitle: { fontSize:  14, fontWeight: '600', color: '#0369A1', marginBottom: 8 },
  vehiculoItem: {
    backgroundColor: '#fff',
    padding:  10,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  vehiculoPlaca: { fontSize: 15, fontWeight: 'bold', color:  '#1E40AF' },
  vehiculoInfo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  accionesContainer: { marginTop: 15, gap: 10 },
  esperandoInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  esperandoText: { flex: 1, fontSize: 12, color: '#92400E' },
  cancelarBtn: {
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding:  12,
    borderRadius: 8,
    gap:  8,
  },
  cancelarBtnText: { color: '#EF4444', fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor:  '#fff',
    borderRadius: 12,
    ... SHADOWS.small,
  },
  emptyTitle:  { fontSize: 18, fontWeight: 'bold', color:  '#1F2937', marginTop: 15 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 5, marginBottom: 20 },
  solicitarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal:  20,
    paddingVertical: 12,
    borderRadius: 8,
    gap:  8,
  },
  solicitarBtnText: { color: '#fff', fontWeight:  '600' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent:  'center',
    alignItems: 'center',
    ... SHADOWS.medium,
  },
});