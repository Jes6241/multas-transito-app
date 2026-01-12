import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';
import Loading from '../../components/Loading';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function MultasHoyScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [multasHoy, setMultasHoy] = useState([]);
  const [totalMonto, setTotalMonto] = useState(0);

  useEffect(() => {
    cargarMultasHoy();
  }, []);

  const cargarMultasHoy = async () => {
    try {
      const response = await fetch(`${API_URL}/api/multas`);
      const data = await response.json();

      if (data.success) {
        // Filtrar multas de hoy
        const hoy = new Date();
        const multasDeHoy = (data.multas || []).filter(m => {
          const fechaMulta = new Date(m.created_at);
          return (
            fechaMulta.getDate() === hoy.getDate() &&
            fechaMulta. getMonth() === hoy.getMonth() &&
            fechaMulta.getFullYear() === hoy.getFullYear()
          );
        });

        setMultasHoy(multasDeHoy);
        
        // Calcular total recaudado
        const total = multasDeHoy.reduce((sum, m) => sum + parseFloat(m.monto_final || 0), 0);
        setTotalMonto(total);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderMulta = ({ item, index }) => (
    <TouchableOpacity
      style={styles.multaCard}
      onPress={() => navigation.navigate('DetalleMultaAgente', { multa: item })}
    >
      <View style={styles.multaHeader}>
        <View style={styles.numeroContainer}>
          <Text style={styles.numero}>#{index + 1}</Text>
        </View>
        <View style={styles.folioContainer}>
          <Text style={styles.folio}>{item.folio}</Text>
          <Text style={styles.hora}>
            {new Date(item.created_at).toLocaleTimeString('es-MX', { hour:  '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[
          styles.estatusBadge,
          { backgroundColor: item.estatus === 'pendiente' ? '#FEF3C7' : '#D1FAE5' }
        ]}>
          <Text style={[
            styles.estatusText,
            { color: item. estatus === 'pendiente' ? '#F59E0B' : '#10B981' }
          ]}>
            {item.estatus}
          </Text>
        </View>
      </View>

      <View style={styles.multaBody}>
        <View style={styles.infoRow}>
          <Ionicons name="car" size={18} color={COLORS.gray[500]} />
          <Text style={styles. infoText}>
            Placa: <Text style={styles. infoValue}>{item.vehiculos?. placa || item.placa || 'N/A'}</Text>
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="alert-circle" size={18} color={COLORS. gray[500]} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.tipo_infraccion || 'Infracción de tránsito'}
          </Text>
        </View>

        <View style={styles. infoRow}>
          <Ionicons name="location" size={18} color={COLORS.gray[500]} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item. direccion || 'Sin ubicación'}
          </Text>
        </View>
      </View>

      <View style={styles.multaFooter}>
        <Text style={styles. monto}>
          ${parseFloat(item.monto_final || 0).toLocaleString('es-MX')}
        </Text>
        <View style={styles.verDetalle}>
          <Text style={styles. verDetalleText}>Ver detalle</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <Loading mensaje="Cargando multas de hoy..." />;

  return (
    <View style={styles.container}>
      {/* Resumen */}
      <View style={styles.resumenCard}>
        <View style={styles.resumenItem}>
          <Ionicons name="document-text" size={30} color="#3B82F6" />
          <Text style={styles.resumenNumero}>{multasHoy. length}</Text>
          <Text style={styles.resumenLabel}>Multas Hoy</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Ionicons name="cash" size={30} color="#10B981" />
          <Text style={styles. resumenNumero}>
            ${totalMonto.toLocaleString('es-MX')}
          </Text>
          <Text style={styles.resumenLabel}>Total Recaudado</Text>
        </View>
      </View>

      {/* Fecha */}
      <View style={styles. fechaContainer}>
        <Ionicons name="calendar" size={18} color="#6B7280" />
        <Text style={styles.fechaText}>
          {new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', 
            day: 'numeric', 
            month:  'long', 
            year: 'numeric' 
          })}
        </Text>
      </View>

      {/* Lista de multas */}
      <FlatList
        data={multasHoy}
        renderItem={renderMulta}
        keyExtractor={(item) => item.id?. toString() || item.folio}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={cargarMultasHoy} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay multas hoy</Text>
            <Text style={styles.emptyText}>
              Las multas que levantes hoy aparecerán aquí
            </Text>
            <TouchableOpacity
              style={styles.levantarBtn}
              onPress={() => navigation.navigate('LevantarMulta')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.levantarBtnText}>Levantar Multa</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  resumenCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 16,
    padding:  20,
    flexDirection: 'row',
    alignItems: 'center',
    ... SHADOWS.medium,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenDivider: {
    width: 1,
    height: 60,
    backgroundColor:  '#E5E7EB',
  },
  resumenNumero:  {
    fontSize:  24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 5,
  },
  resumenLabel:  {
    fontSize:  12,
    color:  '#6B7280',
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:  15,
    marginBottom: 10,
    gap: 8,
  },
  fechaText:  {
    color: '#6B7280',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  lista: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  multaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding:  15,
    marginBottom: 10,
    ... SHADOWS.small,
  },
  multaHeader:  {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  numeroContainer: {
    width: 30,
    height:  30,
    borderRadius: 15,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numero:  {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  folioContainer:  {
    flex: 1,
  },
  folio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  hora:  {
    fontSize:  12,
    color: '#9CA3AF',
  },
  estatusBadge: {
    paddingHorizontal:  10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  multaBody: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText:  {
    fontSize:  14,
    color:  '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontWeight: '600',
    color: '#1F2937',
  },
  multaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:  'center',
    marginTop: 12,
  },
  monto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  verDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:  5,
  },
  verDetalleText: {
    color:  COLORS.primary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor:  '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight:  'bold',
    color: '#1F2937',
    marginTop: 15,
  },
  emptyText:  {
    color:  '#6B7280',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  levantarBtn:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  levantarBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});