import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../config/theme';
import Loading from '../components/Loading';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function MiHistorialScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    hoy: 0,
    semana: 0,
    mes: 0,
    total: 0,
    montoHoy: 0,
    montoMes: 0,
  });
  const [multas, setMultas] = useState([]);
  const [filtro, setFiltro] = useState('hoy');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/multas`);
      const data = await response.json();

      if (data.success) {
        const misMultas = (data.multas || []).filter(m => m.agente_id === user?.id);
        
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana. setDate(hoy.getDate() - hoy.getDay());
        const inicioMes = new Date(hoy. getFullYear(), hoy.getMonth(), 1);

        const multasHoy = misMultas.filter(m => {
          const fecha = new Date(m.created_at);
          return fecha. toDateString() === hoy.toDateString();
        });

        const multasSemana = misMultas.filter(m => {
          const fecha = new Date(m.created_at);
          return fecha >= inicioSemana;
        });

        const multasMes = misMultas. filter(m => {
          const fecha = new Date(m. created_at);
          return fecha >= inicioMes;
        });

        const montoHoy = multasHoy.reduce((sum, m) => sum + parseFloat(m.monto_final || 0), 0);
        const montoMes = multasMes.reduce((sum, m) => sum + parseFloat(m.monto_final || 0), 0);

        setStats({
          hoy: multasHoy.length,
          semana: multasSemana.length,
          mes: multasMes.length,
          total: misMultas.length,
          montoHoy,
          montoMes,
        });

        setMultas(misMultas);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMultasFiltradas = () => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy. getDate() - hoy.getDay());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    switch (filtro) {
      case 'hoy':
        return multas.filter(m => new Date(m.created_at).toDateString() === hoy.toDateString());
      case 'semana': 
        return multas.filter(m => new Date(m.created_at) >= inicioSemana);
      case 'mes': 
        return multas. filter(m => new Date(m.created_at) >= inicioMes);
      default:
        return multas;
    }
  };

  if (loading) return <Loading />;

  const multasFiltradas = getMultasFiltradas();

  return (
    <ScrollView
      style={styles. container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={cargarDatos} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="bar-chart" size={40} color="#fff" />
        </View>
        <Text style={styles. headerTitle}>Mi Desempeño</Text>
        <Text style={styles.headerSubtitle}>{user?.nombre || 'Agente'}</Text>
      </View>

      {/* Stats Cards - Primera fila */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor:  '#DBEAFE' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="today" size={28} color="#3B82F6" />
          </View>
          <Text style={styles.statNumero}>{stats.hoy}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar" size={28} color="#10B981" />
          </View>
          <Text style={styles.statNumero}>{stats.semana}</Text>
          <Text style={styles.statLabel}>Esta Semana</Text>
        </View>
      </View>

      {/* Stats Cards - Segunda fila */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor:  '#FEF3C7' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar-outline" size={28} color="#F59E0B" />
          </View>
          <Text style={styles.statNumero}>{stats. mes}</Text>
          <Text style={styles.statLabel}>Este Mes</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor:  '#E0E7FF' }]}>
          <View style={styles.statIconContainer}>
            <Ionicons name="documents" size={28} color="#6366F1" />
          </View>
          <Text style={styles.statNumero}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Tarjeta de Recaudación */}
      <View style={styles.ingresosCard}>
        <View style={styles.ingresosTitleRow}>
          <Ionicons name="cash" size={24} color="#059669" />
          <Text style={styles.ingresosTitle}>Mi Recaudación</Text>
        </View>
        
        <View style={styles.ingresosContent}>
          <View style={styles.ingresoBox}>
            <Text style={styles.ingresoLabel}>Hoy</Text>
            <Text style={styles.ingresoValor}>
              ${stats. montoHoy. toLocaleString('es-MX')}
            </Text>
          </View>
          
          <View style={styles.ingresoDivider} />
          
          <View style={styles.ingresoBox}>
            <Text style={styles.ingresoLabel}>Este Mes</Text>
            <Text style={styles.ingresoValor}>
              ${stats.montoMes.toLocaleString('es-MX')}
            </Text>
          </View>
        </View>
      </View>

      {/* Sección de Multas */}
      <View style={styles.multasSection}>
        <Text style={styles.multasSectionTitle}>Mis Multas Levantadas</Text>
        
        {/* Filtros */}
        <View style={styles. filtrosContainer}>
          {[
            { key: 'hoy', label: 'Hoy', icon: 'today' },
            { key: 'semana', label: 'Semana', icon:  'calendar' },
            { key:  'mes', label: 'Mes', icon: 'calendar-outline' },
            { key: 'todas', label: 'Todas', icon:  'list' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filtroBtn, filtro === f.key && styles.filtroBtnActivo]}
              onPress={() => setFiltro(f. key)}
            >
              <Ionicons 
                name={f.icon} 
                size={16} 
                color={filtro === f.key ? '#fff' : '#6B7280'} 
              />
              <Text style={[styles.filtroText, filtro === f.key && styles.filtroTextActivo]}>
                {f. label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contador de resultados */}
        <View style={styles.resultadosBar}>
          <Ionicons name="document-text" size={18} color="#6B7280" />
          <Text style={styles.resultadosText}>
            {multasFiltradas.length} multa{multasFiltradas.length !== 1 ? 's' : ''} encontrada{multasFiltradas.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Lista de multas */}
        {multasFiltradas.length > 0 ?  (
          multasFiltradas. map((multa, index) => (
            <TouchableOpacity
              key={multa.id || index}
              style={styles.multaCard}
              onPress={() => navigation.navigate('DetalleMulta', { multa })}
            >
              <View style={styles.multaLeft}>
                <View style={styles.multaIconContainer}>
                  <Ionicons name="document-text" size={24} color="#1E40AF" />
                </View>
              </View>
              
              <View style={styles.multaCenter}>
                <Text style={styles.multaFolio}>{multa.folio}</Text>
                <View style={styles.multaPlacaRow}>
                  <Ionicons name="car" size={14} color="#6B7280" />
                  <Text style={styles.multaPlaca}>{multa. vehiculos?. placa || 'N/A'}</Text>
                </View>
                <Text style={styles.multaTipo} numberOfLines={1}>
                  {multa.tipo_infraccion}
                </Text>
                <Text style={styles.multaFecha}>
                  {new Date(multa.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              
              <View style={styles.multaRight}>
                <Text style={styles.multaMonto}>
                  ${parseFloat(multa. monto_final || 0).toLocaleString('es-MX')}
                </Text>
                <View
                  style={[
                    styles. estatusBadge,
                    { backgroundColor: multa.estatus === 'pagada' ? '#D1FAE5' : '#FEE2E2' },
                  ]}
                >
                  <Text
                    style={[
                      styles. estatusText,
                      { color: multa. estatus === 'pagada' ? '#065F46' : '#991B1B' },
                    ]}
                  >
                    {multa.estatus}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 8 }} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Sin multas</Text>
            <Text style={styles. emptyText}>
              No has levantado multas en este período
            </Text>
            <TouchableOpacity
              style={styles.levantarBtn}
              onPress={() => navigation.navigate('LevantarMulta')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.levantarBtnText}>Levantar Multa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius:  30,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 80,
    height:  80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color:  'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  statsRow: {
    flexDirection:  'row',
    paddingHorizontal: 15,
    marginTop: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    ... SHADOWS. medium,
  },
  statIconContainer:  {
    marginBottom: 10,
  },
  statNumero: {
    fontSize: 36,
    fontWeight: 'bold',
    color:  '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
    fontWeight: '500',
  },
  ingresosCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    ... SHADOWS.medium,
  },
  ingresosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  ingresosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color:  '#1F2937',
  },
  ingresosContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingresoBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  ingresoLabel: {
    fontSize: 14,
    color:  '#6B7280',
    marginBottom: 8,
  },
  ingresoValor: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
  },
  ingresoDivider: {
    width: 1,
    height: 60,
    backgroundColor:  '#E5E7EB',
  },
  multasSection: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 5,
    padding: 20,
    borderRadius:  16,
    ... SHADOWS.medium,
  },
  multasSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  filtrosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  filtroBtn:  {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal:  8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  filtroBtnActivo: {
    backgroundColor:  COLORS.primary,
  },
  filtroText: {
    fontSize: 12,
    color:  '#6B7280',
    fontWeight: '600',
  },
  filtroTextActivo: {
    color: '#fff',
  },
  resultadosBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  resultadosText: {
    fontSize: 14,
    color: '#6B7280',
  },
  multaCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding:  15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor:  '#E5E7EB',
  },
  multaLeft: {
    marginRight: 12,
  },
  multaIconContainer:  {
    backgroundColor: '#DBEAFE',
    width: 50,
    height:  50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multaCenter: {
    flex: 1,
  },
  multaFolio: {
    fontSize: 14,
    fontWeight: 'bold',
    color:  '#1E40AF',
  },
  multaPlacaRow:  {
    flexDirection: 'row',
    alignItems:  'center',
    gap: 5,
    marginTop: 4,
  },
  multaPlaca: {
    fontSize: 16,
    fontWeight: 'bold',
    color:  '#1F2937',
  },
  multaTipo: {
    fontSize: 12,
    color:  '#6B7280',
    marginTop: 4,
  },
  multaFecha: {
    fontSize: 11,
    color:  '#9CA3AF',
    marginTop: 4,
  },
  multaRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  multaMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  estatusBadge:  {
    paddingHorizontal:  10,
    paddingVertical:  4,
    borderRadius: 12,
    marginTop: 6,
  },
  estatusText:  {
    fontSize:  11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState:  {
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    backgroundColor: '#F3F4F6',
    width: 100,
    height:  100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle:  {
    fontSize:  18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyText:  {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  levantarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  levantarBtnText:  {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});