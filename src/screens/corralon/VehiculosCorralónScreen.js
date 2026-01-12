import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function VehiculosCorralónScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarVehiculos();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarVehiculos);
    return unsubscribe;
  }, [navigation]);

  const cargarVehiculos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/corralon`);
      const data = await response.json();

      if (data. success) {
        setVehiculos(data.vehiculos || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getEstatusInfo = (estatus) => {
    switch (estatus) {
      case 'ingresado':
        return { color: '#F59E0B', bg: '#FEF3C7', icon: 'enter', texto: 'Ingresado' };
      case 'pendiente_pago':
        return { color: '#3B82F6', bg: '#DBEAFE', icon:  'card', texto: 'Pendiente Pago' };
      case 'listo_liberar': 
        return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle', texto: 'Listo Liberar' };
      case 'liberado':
        return { color: '#6B7280', bg: '#E5E7EB', icon: 'exit', texto: 'Liberado' };
      default: 
        return { color:  '#6B7280', bg: '#F3F4F6', icon: 'help', texto: estatus || 'Desconocido' };
    }
  };

  const calcularDiasRetenido = (fechaIngreso) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diff = Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ARREGLADO:  El filtro "retenidos" ahora busca 'ingresado', 'pendiente_pago', 'listo_liberar'
  const vehiculosFiltrados = vehiculos.filter((v) => {
    // Filtro por estatus
    if (filtro === 'retenidos') {
      // Todos los que NO están liberados
      if (v.estatus === 'liberado') return false;
    }
    if (filtro === 'liberados' && v.estatus !== 'liberado') return false;

    // Filtro por búsqueda
    if (busqueda) {
      const busquedaLower = busqueda. toLowerCase();
      return (
        v.folio_remision?. toLowerCase().includes(busquedaLower) ||
        v.tarjeton_resguardo?.toLowerCase().includes(busquedaLower) ||
        v.ubicacion?.toLowerCase().includes(busquedaLower)
      );
    }

    return true;
  });

  // ARREGLADO: Contar todos los que NO están liberados
  const retenidos = vehiculos.filter((v) => v.estatus !== 'liberado').length;
  const liberados = vehiculos.filter((v) => v.estatus === 'liberado').length;

  const renderVehiculo = ({ item }) => {
    const estatusInfo = getEstatusInfo(item.estatus);
    const diasRetenido = calcularDiasRetenido(item.fecha_ingreso);
    const noLiberado = item. estatus !== 'liberado';

    return (
      <TouchableOpacity
        style={[styles.vehiculoCard, noLiberado && styles.vehiculoRetenido]}
        onPress={() => navigation.navigate('DetalleVehiculoCorralon', { vehiculo: item })}
      >
        {/* Header */}
        <View style={styles. vehiculoHeader}>
          <View>
            <Text style={styles.folioRemision}>{item. folio_remision}</Text>
            <Text style={styles.tarjeton}>🏷️ {item. tarjeton_resguardo}</Text>
          </View>
          <View style={[styles.estatusBadge, { backgroundColor: estatusInfo.bg }]}>
            <Ionicons name={estatusInfo.icon} size={14} color={estatusInfo.color} />
            <Text style={[styles.estatusText, { color: estatusInfo.color }]}>
              {estatusInfo.texto}
            </Text>
          </View>
        </View>

        {/* Información */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Origen: {item.ubicacion || 'Sin ubicación'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Corralón: {item. corralones?. nombre || item.direccion_corralon || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Ingreso: {new Date(item.fecha_ingreso).toLocaleDateString('es-MX')}
            </Text>
          </View>
          {item.fecha_liberacion && (
            <View style={styles.infoRow}>
              <Ionicons name="exit" size={16} color="#10B981" />
              <Text style={[styles.infoText, { color: '#10B981' }]}>
                Liberado:  {new Date(item.fecha_liberacion).toLocaleDateString('es-MX')}
              </Text>
            </View>
          )}
        </View>

        {/* Días retenido */}
        {noLiberado && (
          <View style={styles.diasContainer}>
            <View style={[styles.diasBadge, diasRetenido > 30 && styles.diasAlerta]}>
              <Ionicons
                name="time"
                size={16}
                color={diasRetenido > 30 ? '#EF4444' :  '#F59E0B'}
              />
              <Text
                style={[styles.diasText, diasRetenido > 30 && styles. diasTextAlerta]}
              >
                {diasRetenido} día{diasRetenido !== 1 ? 's' : ''} retenido
              </Text>
            </View>
          </View>
        )}

        {/* Indicador de toque */}
        <View style={styles. verDetalleContainer}>
          <Text style={styles. verDetalleText}>Ver detalle y liberar →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles. loadingText}>Cargando vehículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resumen */}
      <View style={styles.resumenContainer}>
        <View style={[styles.resumenCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="lock-closed" size={24} color="#F59E0B" />
          <Text style={styles.resumenNumero}>{retenidos}</Text>
          <Text style={styles. resumenLabel}>Retenidos</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="lock-open" size={24} color="#10B981" />
          <Text style={styles.resumenNumero}>{liberados}</Text>
          <Text style={styles.resumenLabel}>Liberados</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="car" size={24} color="#3B82F6" />
          <Text style={styles.resumenNumero}>{vehiculos.length}</Text>
          <Text style={styles.resumenLabel}>Total</Text>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por folio, tarjetón..."
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#9CA3AF"
        />
        {busqueda. length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {[
          { key:  'todos', label: 'Todos' },
          { key: 'retenidos', label:  'Retenidos' },
          { key: 'liberados', label:  'Liberados' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtroBtn, filtro === f.key && styles.filtroBtnActivo]}
            onPress={() => setFiltro(f. key)}
          >
            <Text
              style={[styles.filtroText, filtro === f.key && styles.filtroTextActivo]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={vehiculosFiltrados}
        renderItem={renderVehiculo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={cargarVehiculos} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={60} color="#D1D5DB" />
            <Text style={styles. emptyTitle}>Sin vehículos</Text>
            <Text style={styles. emptyText}>
              {filtro === 'todos'
                ? 'No hay vehículos registrados'
                :  `No hay vehículos ${filtro}`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems:  'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  resumenContainer: { flexDirection: 'row', padding: 15, gap: 10 },
  resumenCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  resumenNumero: { fontSize: 24, fontWeight:  'bold', color: '#1F2937', marginTop: 5 },
  resumenLabel: { fontSize: 11, color: '#6B7280' },
  searchContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    ... SHADOWS.small,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal:  10, fontSize: 14 },
  filtros: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10, gap: 8 },
  filtroBtn: {
    paddingHorizontal:  16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor:  '#fff',
    ... SHADOWS.small,
  },
  filtroBtnActivo:  { backgroundColor: '#7C3AED' },
  filtroText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filtroTextActivo:  { color: '#fff', fontWeight: '600' },
  lista:  { padding: 15, paddingTop: 5, paddingBottom:  30 },
  vehiculoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    ... SHADOWS.small,
  },
  vehiculoRetenido: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  vehiculoHeader: {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  folioRemision: { fontSize: 16, fontWeight: 'bold', color:  '#1E40AF' },
  tarjeton:  { fontSize: 13, color: '#6B7280', marginTop: 2 },
  estatusBadge:  {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:  10,
    paddingVertical:  5,
    borderRadius: 12,
    gap:  5,
  },
  estatusText: { fontSize: 12, fontWeight: '600' },
  infoContainer: {
    backgroundColor: '#F9FAFB',
    padding:  12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoRow:  { flexDirection: 'row', alignItems:  'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 13, color: '#4B5563', flex: 1 },
  diasContainer: { marginBottom: 12 },
  diasBadge: {
    flexDirection:  'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap:  6,
  },
  diasAlerta: { backgroundColor: '#FEE2E2' },
  diasText:  { color: '#92400E', fontSize:  13, fontWeight: '600' },
  diasTextAlerta: { color: '#B91C1C' },
  verDetalleContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop:  12,
    alignItems: 'center',
  },
  verDetalleText: { color: '#7C3AED', fontWeight: '600', fontSize: 14 },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor:  '#fff',
    borderRadius: 12,
    ... SHADOWS.small,
  },
  emptyTitle:  { fontSize: 18, fontWeight: 'bold', color:  '#1F2937', marginTop: 15 },
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 5 },
});