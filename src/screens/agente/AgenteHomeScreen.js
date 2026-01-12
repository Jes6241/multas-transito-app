import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../config/theme';
import { offlineService } from '../../config/offlineService';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function AgenteHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [multasOffline, setMultasOffline] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [multasHoy, setMultasHoy] = useState([]);
  const [stats, setStats] = useState({
    multasHoy: 0,
    multasPendientes: 0,
    gruasSolicitadas: 0,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarDatos();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarDatos = async () => {
    try {
      const online = await offlineService.isOnline();
      setIsOnline(online);

      const multas = await offlineService.obtenerMultasOffline();
      setMultasOffline(multas);

      let gruasHoyCount = 0;
      let multasDeHoy = [];

      if (online) {
        try {
          const responseMultas = await fetch(`${API_URL}/api/multas`);
          const dataMultas = await responseMultas.json();

          if (dataMultas. success) {
            const hoy = new Date();
            // Filtrar solo las multas del agente actual
            const misMultas = (dataMultas.multas || []).filter(m => m.agente_id === user?. id);
            multasDeHoy = misMultas.filter((m) => {
              const fechaMulta = new Date(m.created_at);
              return (
                fechaMulta.getDate() === hoy.getDate() &&
                fechaMulta.getMonth() === hoy.getMonth() &&
                fechaMulta.getFullYear() === hoy.getFullYear()
              );
            });
            setMultasHoy(multasDeHoy);
          }
        } catch (error) {
          console.error('Error cargando multas:', error);
        }

        try {
          const responseGruas = await fetch(`${API_URL}/api/solicitudes-grua/hoy`);
          const dataGruas = await responseGruas.json();

          if (dataGruas.success) {
            gruasHoyCount = dataGruas.total || 0;
          }
        } catch (error) {
          console.error('Error cargando grúas:', error);
        }
      }

      setStats({
        multasHoy: multasDeHoy.length,
        multasPendientes: multas.length,
        gruasSolicitadas: gruasHoyCount,
      });
    } catch (error) {
      console. error('Error cargando datos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sincronizar = async () => {
    if (!isOnline) {
      Alert.alert('Sin conexión', 'No hay conexión a internet');
      return;
    }

    Alert.alert('Sincronizar', '¿Deseas sincronizar las multas pendientes?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sincronizar',
        onPress: async () => {
          const resultado = await offlineService.sincronizarMultas();
          if (resultado.success) {
            Alert.alert('✅ Éxito', 'Multas sincronizadas correctamente');
            cargarDatos();
          } else {
            Alert.alert('❌ Error', resultado.message);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro? ', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress:  logout, style: 'destructive' },
    ]);
  };

  return (
    <ScrollView
      style={styles. container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={cargarDatos} />
      }
    >
      <View style={styles. header}>
        <View>
          <Text style={styles.greeting}>Agente</Text>
          <Text style={styles. userName}>{user?.nombre || 'Usuario'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isOnline ? '#10B981' : '#EF4444' },
            ]}
          >
            <Ionicons
              name={isOnline ? 'wifi' : 'wifi-outline'}
              size={16}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {isOnline ? 'En línea' : 'Sin conexión'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles. logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {! isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={24} color="#F59E0B" />
          <Text style={styles.offlineText}>
            Modo sin conexión.  Las multas se guardarán localmente. 
          </Text>
        </View>
      )}

      <View style={styles. statsContainer}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}
          onPress={() => navigation.navigate('MiHistorial')}
        >
          <Ionicons name="document-text" size={28} color="#3B82F6" />
          <Text style={styles.statNumero}>{stats.multasHoy}</Text>
          <Text style={styles.statLabel}>Mis Multas Hoy</Text>
          <Text style={styles.verMas}>Ver →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}
          onPress={() => navigation.navigate('MultasOffline')}
        >
          <Ionicons name="cloud-upload" size={28} color="#F59E0B" />
          <Text style={styles.statNumero}>{stats.multasPendientes}</Text>
          <Text style={styles. statLabel}>Pendientes</Text>
          <Text style={styles.verMas}>Ver →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#E0E7FF' }]}
          onPress={() => navigation.navigate('GruasSolicitadas')}
        >
          <Ionicons name="car" size={28} color="#6366F1" />
          <Text style={styles.statNumero}>{stats.gruasSolicitadas}</Text>
          <Text style={styles.statLabel}>Grúas</Text>
          <Text style={styles. verMas}>Ver →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.menuGrid}>
        {/* Escanear Placa */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ScanPlaca')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="scan" size={30} color="#059669" />
          </View>
          <Text style={styles.menuText}>Escanear Placa</Text>
        </TouchableOpacity>

        {/* Levantar Multa */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('LevantarMulta')}
        >
          <View style={[styles. menuIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="add-circle" size={30} color="#EF4444" />
          </View>
          <Text style={styles.menuText}>Levantar Multa</Text>
        </TouchableOpacity>

        {/* Parquímetros */}
        <TouchableOpacity
          style={styles. menuItem}
          onPress={() => navigation.navigate('VerificarParquimetro')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#EDE9FE' }]}>
            <Ionicons name="time" size={30} color="#8B5CF6" />
          </View>
          <Text style={styles.menuText}>Parquímetros</Text>
        </TouchableOpacity>

        {/* Solicitar Grúa */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('SolicitarGrua')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#E0E7FF' }]}>
            <Ionicons name="car-sport" size={30} color="#6366F1" />
          </View>
          <Text style={styles.menuText}>Solicitar Grúa</Text>
        </TouchableOpacity>

        {/* Mi Historial */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MiHistorial')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#DBEAFE' }]}>
            <Ionicons name="bar-chart" size={30} color="#3B82F6" />
          </View>
          <Text style={styles.menuText}>Mi Historial</Text>
        </TouchableOpacity>

        {/* Multas Offline */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MultasOffline')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#FEF3C7' }]}>
            <Ionicons name="cloud-offline" size={30} color="#F59E0B" />
          </View>
          <Text style={styles.menuText}>Multas Offline</Text>
          {multasOffline. length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{multasOffline.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {multasOffline.length > 0 && isOnline && (
        <TouchableOpacity style={styles.syncButton} onPress={sincronizar}>
          <Ionicons name="sync" size={24} color="#fff" />
          <Text style={styles. syncButtonText}>
            Sincronizar {multasOffline. length} multa(s)
          </Text>
        </TouchableOpacity>
      )}

      {/* Botón de Emergencia */}
      <TouchableOpacity
        style={styles.emergenciaBtn}
        onPress={() => navigation.navigate('Emergencia')}
      >
        <Ionicons name="warning" size={24} color="#fff" />
        <Text style={styles. emergenciaBtnText}>EMERGENCIA</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Mis Últimas Multas</Text>
      {multasHoy. length > 0 ? (
        multasHoy.slice(0, 3).map((multa, index) => (
          <TouchableOpacity
            key={multa.id || index}
            style={styles.multaCard}
            onPress={() => navigation.navigate('DetalleMultaAgente', { multa })}
          >
            <View style={styles.multaInfo}>
              <Text style={styles.multaFolio}>{multa.folio}</Text>
              <Text style={styles.multaPlaca}>
                {multa. vehiculos?.placa || multa.placa}
              </Text>
              <Text style={styles. multaTipo}>{multa.tipo_infraccion}</Text>
            </View>
            <View style={styles.multaRight}>
              <Text style={styles.multaMonto}>
                ${parseFloat(multa. monto_final || 0).toLocaleString('es-MX')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={50} color="#D1D5DB" />
          <Text style={styles.emptyText}>No has levantado multas hoy</Text>
          <TouchableOpacity
            style={styles. levantarBtn}
            onPress={() => navigation.navigate('LevantarMulta')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.levantarBtnText}>Levantar primera multa</Text>
          </TouchableOpacity>
        </View>
      )}

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
    backgroundColor: '#1E40AF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting:  {
    color: '#93C5FD',
    fontSize: 14,
  },
  userName:  {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:  10,
    paddingVertical:  5,
    borderRadius: 20,
    gap: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    padding: 8,
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 15,
    borderRadius: 10,
    gap: 10,
  },
  offlineText:  {
    flex: 1,
    color: '#92400E',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection:  'row',
    paddingHorizontal:  15,
    marginTop: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumero: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color:  '#6B7280',
    textAlign: 'center',
  },
  verMas: {
    fontSize: 11,
    color:  '#4F46E5',
    marginTop: 5,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 15,
    marginTop: 25,
    marginBottom: 10,
  },
  menuGrid: {
    flexDirection:  'row',
    flexWrap: 'wrap',
    paddingHorizontal:  10,
  },
  menuItem: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding:  20,
    alignItems: 'center',
    margin: '2%',
    ... SHADOWS.small,
  },
  menuIcon: {
    width: 60,
    height:  60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right:  10,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal:  8,
    paddingVertical:  2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  syncButtonText: {
    color: '#fff',
    fontSize:  16,
    fontWeight: 'bold',
  },
  emergenciaBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginTop:  15,
    padding:  15,
    borderRadius: 12,
    gap:  10,
  },
  emergenciaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  multaCard: {
    backgroundColor: '#fff',
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
    flex:  1,
  },
  multaFolio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  multaPlaca: {
    fontSize: 14,
    color:  '#1F2937',
    marginTop: 2,
  },
  multaTipo:  {
    fontSize:  12,
    color:  '#6B7280',
    marginTop: 2,
  },
  multaRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
  },
  multaMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emptyState: {
    alignItems:  'center',
    padding: 30,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 12,
    ... SHADOWS.small,
  },
  emptyText:  {
    color:  '#9CA3AF',
    marginTop: 10,
    marginBottom: 15,
  },
  levantarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal:  20,
    paddingVertical:  10,
    borderRadius: 8,
    gap:  8,
  },
  levantarBtnText:  {
    color:  '#fff',
    fontWeight: '600',
  },
});