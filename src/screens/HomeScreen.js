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
import Loading from '../components/Loading';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumen, setResumen] = useState({
    totalMultas:  0,
    multasPendientes: 0,
    multasPagadas: 0,
    adeudoTotal: 0,
  });
  const [misMultas, setMisMultas] = useState([]);

  useEffect(() => {
    cargarMisMultas();
  }, []);

  const cargarMisMultas = async () => {
    try {
      // Obtener multas guardadas localmente (asociadas a este usuario)
      const multasGuardadas = await AsyncStorage.getItem(`multas_${user?.id}`);
      const multas = multasGuardadas ? JSON.parse(multasGuardadas) : [];

      const pendientes = multas.filter(m => m.estatus === 'pendiente');
      const pagadas = multas.filter(m => m. estatus === 'pagada');
      const adeudo = pendientes.reduce((sum, m) => sum + parseFloat(m.monto_final || 0), 0);

      setResumen({
        totalMultas: multas.length,
        multasPendientes: pendientes.length,
        multasPagadas: pagadas. length,
        adeudoTotal:  adeudo,
      });
      setMisMultas(multas);
    } catch (error) {
      console. error('Error cargando multas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarMisMultas();
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress:  logout, style: 'destructive' },
      ]
    );
  };

  if (loading) return <Loading />;

  return (
    <ScrollView
      style={styles. container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles. header}>
        <View>
          <Text style={styles.greeting}>¡Hola! </Text>
          <Text style={styles. userName}>{user?.nombre || 'Usuario'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tarjeta de Adeudo */}
      <View style={styles.adeudoCard}>
        <Text style={styles. adeudoLabel}>Adeudo Total</Text>
        <Text style={styles.adeudoMonto}>
          ${resumen.adeudoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.adeudoInfo}>
          {resumen.multasPendientes} multa(s) pendiente(s)
        </Text>
      </View>

      {/* Resumen */}
      <View style={styles.resumenContainer}>
        <View style={[styles.resumenCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="warning" size={28} color="#F59E0B" />
          <Text style={styles.resumenNumero}>{resumen.multasPendientes}</Text>
          <Text style={styles.resumenLabel}>Pendientes</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={28} color="#10B981" />
          <Text style={styles.resumenNumero}>{resumen.multasPagadas}</Text>
          <Text style={styles.resumenLabel}>Pagadas</Text>
        </View>
        <View style={[styles.resumenCard, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="car" size={28} color="#3B82F6" />
          <Text style={styles.resumenNumero}>{resumen.totalMultas}</Text>
          <Text style={styles.resumenLabel}>Total</Text>
        </View>
      </View>

      {/* Banner para agregar multas */}
      {misMultas.length === 0 && (
        <View style={styles.emptyBanner}>
          <Ionicons name="search" size={40} color="#6366F1" />
          <Text style={styles.emptyTitle}>¿Tienes una multa?</Text>
          <Text style={styles.emptyText}>
            Busca tu multa por folio o placa para agregarla a tu cuenta
          </Text>
          <View style={styles.emptyButtons}>
            <TouchableOpacity
              style={styles. emptyBtn}
              onPress={() => navigation.navigate('BuscarFolio')}
            >
              <Ionicons name="receipt" size={20} color="#fff" />
              <Text style={styles.emptyBtnText}>Buscar por Folio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: '#10B981' }]}
              onPress={() => navigation.navigate('Buscar')}
            >
              <Ionicons name="car" size={20} color="#fff" />
              <Text style={styles.emptyBtnText}>Buscar por Placa</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menú de Opciones */}
      <Text style={styles.sectionTitle}>¿Qué deseas hacer?</Text>
      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Buscar')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="search" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.menuText}>Buscar por Placa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Historial')}
        >
          <View style={[styles. menuIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="document-text" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.menuText}>Historial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('BuscarFolio')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#D1FAE5' }]}>
            <Ionicons name="receipt" size={24} color="#10B981" />
          </View>
          <Text style={styles.menuText}>Buscar Folio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('PagarMulta', { multa: null })}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#FCE7F3' }]}>
            <Ionicons name="card" size={24} color="#EC4899" />
          </View>
          <Text style={styles.menuText}>Pagar Multa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles. menuItem}
          onPress={() => navigation.navigate('Impugnacion')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#FEE2E2' }]}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
          </View>
          <Text style={styles.menuText}>Impugnar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Corralon')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#E0E7FF' }]}>
            <Ionicons name="location" size={24} color="#6366F1" />
          </View>
          <Text style={styles.menuText}>Corralón</Text>
        </TouchableOpacity>
      </View>

      {/* Mis Multas */}
      {misMultas.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Multas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Historial')}>
              <Text style={styles.verTodo}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          {misMultas.slice(0, 3).map((multa, index) => (
            <TouchableOpacity
              key={multa.id || index}
              style={styles.multaCard}
              onPress={() => navigation.navigate('DetalleMulta', { multa })}
            >
              <View style={styles.multaInfo}>
                <Text style={styles.multaFolio}>{multa.folio}</Text>
                <Text style={styles.multaTipo}>{multa. tipo_infraccion || 'Infracción'}</Text>
                <Text style={styles.multaFecha}>
                  {new Date(multa. created_at).toLocaleDateString('es-MX')}
                </Text>
              </View>
              <View style={styles.multaRight}>
                <Text style={styles.multaMonto}>
                  ${parseFloat(multa. monto_final || 0).toLocaleString('es-MX')}
                </Text>
                <View style={[
                  styles.estatusBadge,
                  { backgroundColor: multa.estatus === 'pendiente' ? '#FEF3C7' : '#D1FAE5' }
                ]}>
                  <Text style={[
                    styles.estatusText,
                    { color: multa. estatus === 'pendiente' ? '#F59E0B' : '#10B981' }
                  ]}>
                    {multa. estatus}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Info de Descuentos */}
      <View style={styles.descuentoCard}>
        <Ionicons name="gift" size={24} color="#10B981" />
        <View style={styles.descuentoInfo}>
          <Text style={styles.descuentoTitle}>¡Aprovecha los descuentos!</Text>
          <Text style={styles.descuentoText}>
            Paga dentro de los primeros 10 días y obtén hasta 50% de descuento
          </Text>
        </View>
      </View>

      {/* Advertencia */}
      <View style={styles. advertenciaCard}>
        <Ionicons name="warning" size={24} color="#EF4444" />
        <View style={styles.advertenciaInfo}>
          <Text style={styles.advertenciaTitle}>Consecuencias por falta de pago</Text>
          <Text style={styles. advertenciaText}>
            • Recargos del 3% mensual{'\n'}
            • Impedimento para trámites vehiculares{'\n'}
            • Posible remisión al corralón
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting:  {
    color: '#fff',
    fontSize:  16,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: 8,
  },
  adeudoCard:  {
    backgroundColor:  '#1E40AF',
    margin: 15,
    marginTop: -20,
    borderRadius: 16,
    padding:  20,
    alignItems: 'center',
    ... SHADOWS.medium,
  },
  adeudoLabel: {
    color: '#93C5FD',
    fontSize: 14,
  },
  adeudoMonto:  {
    color:  '#fff',
    fontSize:  36,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  adeudoInfo:  {
    color: '#93C5FD',
    fontSize: 14,
  },
  resumenContainer: {
    flexDirection: 'row',
    paddingHorizontal:  15,
    gap: 10,
  },
  resumenCard:  {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  resumenNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 5,
  },
  resumenLabel: {
    fontSize: 12,
    color:  '#6B7280',
  },
  emptyBanner: {
    backgroundColor: '#EEF2FF',
    margin: 15,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  emptyTitle:  {
    fontSize: 20,
    fontWeight: 'bold',
    color:  '#4F46E5',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    color:  '#6366F1',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  emptyButtons:  {
    flexDirection: 'row',
    gap: 10,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 20,
  },
  verTodo:  {
    color:  COLORS.primary,
    fontSize:  14,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal:  10,
  },
  menuItem: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding:  15,
    alignItems: 'center',
    margin: '1. 5%',
    ... SHADOWS.small,
  },
  menuIcon: {
    width: 50,
    height:  50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 11,
    color:  '#4B5563',
    textAlign: 'center',
  },
  multaCard:  {
    backgroundColor:  '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ... SHADOWS.small,
  },
  multaInfo:  {
    flex: 1,
  },
  multaFolio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  multaTipo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  multaFecha: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  multaRight: {
    alignItems: 'flex-end',
  },
  multaMonto: {
    fontSize: 18,
    fontWeight:  'bold',
    color: '#1F2937',
  },
  estatusBadge:  {
    paddingHorizontal:  10,
    paddingVertical:  4,
    borderRadius: 12,
    marginTop: 5,
  },
  estatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  descuentoCard: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  descuentoInfo: {
    flex: 1,
  },
  descuentoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color:  '#065F46',
  },
  descuentoText: {
    fontSize: 14,
    color:  '#047857',
    marginTop: 4,
  },
  advertenciaCard: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems:  'flex-start',
    gap: 12,
  },
  advertenciaInfo:  {
    flex:  1,
  },
  advertenciaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  advertenciaText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
});