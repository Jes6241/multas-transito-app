import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../config/theme';
import Button from '../components/Button';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function RecibirVehiculoScreen({ route, navigation }) {
  const { user } = useAuth();
  const solicitudParam = route.params?. solicitud;

  const [loading, setLoading] = useState(false);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(! solicitudParam);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(solicitudParam || null);
  const [corralones, setCorralones] = useState([]);
  const [corralónSeleccionado, setCorralónSeleccionado] = useState(null);

  useEffect(() => {
    if (! solicitudParam) {
      cargarSolicitudesPendientes();
    }
    cargarCorralones();
  }, []);

  const cargarSolicitudesPendientes = async () => {
    try {
      console.log('📋 Cargando solicitudes pendientes.. .');
      const response = await fetch(`${API_URL}/api/solicitudes-grua`);
      
      if (!response. ok) {
        console.error('Error HTTP:', response.status);
        setLoadingSolicitudes(false);
        return;
      }

      const data = await response.json();
      console.log('📋 Solicitudes cargadas:', data. solicitudes?. length || 0);

      if (data.success) {
        const pendientes = data.solicitudes. filter(
          (s) => s.estatus === 'pendiente' || s.estatus === 'en_camino'
        );
        setSolicitudes(pendientes);
        console.log('📋 Solicitudes pendientes:', pendientes.length);
      }
    } catch (error) {
      console.error('❌ Error cargando solicitudes:', error);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const cargarCorralones = async () => {
    try {
      console.log('🏢 Cargando corralones...');
      const response = await fetch(`${API_URL}/api/corralones`);
      
      if (!response.ok) {
        console. error('Error HTTP:', response.status);
        return;
      }

      const data = await response.json();
      console.log('🏢 Corralones cargados:', data.corralones?. length || 0);

      if (data.success && data.corralones. length > 0) {
        setCorralones(data. corralones);
        setCorralónSeleccionado(data. corralones[0]);
      }
    } catch (error) {
      console.error('❌ Error cargando corralones:', error);
    }
  };

  const parseVehiculos = (notas) => {
    try {
      if (!notas) return [];
      if (typeof notas === 'object') return Array.isArray(notas) ? notas : [notas];
      return JSON.parse(notas);
    } catch {
      console.log('⚠️ No se pudo parsear notas:', notas);
      return [];
    }
  };

  const recibirVehiculo = async () => {
    if (!solicitudSeleccionada) {
      Alert.alert('Error', 'Selecciona una solicitud');
      return;
    }

    if (!corralónSeleccionado) {
      Alert.alert('Error', 'Selecciona un corralón');
      return;
    }

    Alert. alert(
      '✅ Confirmar Recepción',
      `¿Recibir vehículo(s) en ${corralónSeleccionado.nombre}? `,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Recibir',
          onPress:  async () => {
            setLoading(true);

            try {
              console. log('📥 ========================================');
              console. log('📥 Enviando solicitud de recepción...');
              console.log('📥 Solicitud ID:', solicitudSeleccionada.id);
              console. log('📥 Corralón ID:', corralónSeleccionado.id);
              console.log('📥 Personal ID:', user?. id);
              console.log('📥 ========================================');

              const bodyData = {
                corralon_id: corralónSeleccionado.id,
                personal_id: user?.id,
              };

              console.log('📥 Body:', JSON.stringify(bodyData));

              const response = await fetch(
                `${API_URL}/api/solicitudes-grua/${solicitudSeleccionada.id}/recibir`,
                {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON. stringify(bodyData),
                }
              );

              console. log('📦 Response status:', response.status);
              console.log('📦 Response ok:', response.ok);

              // Verificar si la respuesta es JSON
              const contentType = response.headers.get('content-type');
              console.log('📦 Content-Type:', contentType);

              if (!contentType || !contentType. includes('application/json')) {
                const textResponse = await response.text();
                console.error('❌ Respuesta no es JSON:', textResponse. substring(0, 200));
                Alert. alert('Error', 'El servidor no respondió correctamente');
                setLoading(false);
                return;
              }

              const data = await response. json();
              console.log('📦 Respuesta:', JSON.stringify(data, null, 2));

              if (data.success) {
                Alert.alert(
                  '✅ Vehículo Recibido',
                  `Registrado en: ${corralónSeleccionado. nombre}\n` +
                    `Folios: ${data.folios?. join(', ') || 'Generados'}\n` +
                    `Vehículos: ${data.registros}`,
                  [{ text: 'OK', onPress:  () => navigation.goBack() }]
                );
              } else {
                Alert.alert('Error', data.error || 'No se pudo registrar');
              }
            } catch (error) {
              console.error('❌ Error completo:', error);
              Alert.alert('Error', 'No se pudo conectar:  ' + error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const vehiculos = solicitudSeleccionada
    ? parseVehiculos(solicitudSeleccionada.notas)
    : [];

  if (loadingSolicitudes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles. container}>
      {/* Seleccionar Solicitud (si no viene por parámetro) */}
      {! solicitudParam && (
        <View style={styles. card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="list" size={20} color="#7C3AED" /> Solicitudes Pendientes
          </Text>

          {solicitudes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={50} color="#10B981" />
              <Text style={styles.emptyTitle}>Sin pendientes</Text>
              <Text style={styles.emptyText}>No hay solicitudes por recibir</Text>
            </View>
          ) : (
            solicitudes.map((sol) => {
              const vehs = parseVehiculos(sol.notas);
              return (
                <TouchableOpacity
                  key={sol. id}
                  style={[
                    styles.solicitudItem,
                    solicitudSeleccionada?. id === sol.id && styles.solicitudItemActivo,
                  ]}
                  onPress={() => setSolicitudSeleccionada(sol)}
                >
                  <View style={styles.solicitudInfo}>
                    <Text style={styles. solicitudGrua}>
                      🚛 {sol.gruas?.numero || 'Grúa'}
                    </Text>
                    <Text style={styles. solicitudOperador}>
                      {sol.gruas?.operador_nombre || 'Sin operador'}
                    </Text>
                    <Text style={styles.solicitudUbicacion}>
                      📍 {sol. ubicacion || 'Sin ubicación'}
                    </Text>
                    <Text style={styles.solicitudVehiculos}>
                      🚗 {vehs.length} vehículo(s)
                    </Text>
                  </View>
                  {solicitudSeleccionada?.id === sol. id && (
                    <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* Detalle de la Solicitud Seleccionada */}
      {solicitudSeleccionada && (
        <View style={styles. card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="car" size={20} color="#7C3AED" /> Vehículos a Recibir
          </Text>

          {/* Info de la grúa */}
          <View style={styles.gruaInfo}>
            <View style={styles.gruaHeader}>
              <Text style={styles.gruaNumero}>
                🚛 {solicitudSeleccionada.gruas?.numero || 'Grúa'}
              </Text>
              <View style={styles.gruaBadge}>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={styles. gruaBadgeText}>Llegó</Text>
              </View>
            </View>
            <Text style={styles.gruaOperador}>
              👷 {solicitudSeleccionada.gruas?.operador_nombre || 'Sin operador'}
            </Text>
            <Text style={styles.gruaTelefono}>
              📞 {solicitudSeleccionada.gruas?.operador_telefono || 'Sin teléfono'}
            </Text>
            <Text style={styles.gruaUbicacion}>
              📍 {solicitudSeleccionada.ubicacion || 'Sin ubicación'}
            </Text>
          </View>

          {/* Lista de vehículos */}
          <Text style={styles.vehiculosLabel}>
            Vehículos ({vehiculos.length}):
          </Text>
          {vehiculos.length === 0 ?  (
            <View style={styles.noVehiculos}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <Text style={styles.noVehiculosText}>
                No hay vehículos registrados en esta solicitud
              </Text>
            </View>
          ) : (
            vehiculos.map((v, i) => (
              <View key={i} style={styles. vehiculoCard}>
                <View style={styles.vehiculoHeader}>
                  <Text style={styles. vehiculoPlaca}>{v.placa || 'Sin placa'}</Text>
                  <View style={styles.vehiculoNumero}>
                    <Text style={styles.vehiculoNumeroText}>{i + 1}</Text>
                  </View>
                </View>
                <View style={styles.vehiculoDetalles}>
                  <Text style={styles.vehiculoInfo}>
                    <Ionicons name="car" size={14} color="#6B7280" /> {v.marca || 'N/A'}
                  </Text>
                  <Text style={styles.vehiculoInfo}>
                    <Ionicons name="color-palette" size={14} color="#6B7280" /> {v.color || 'N/A'}
                  </Text>
                </View>
                <View style={styles. vehiculoMotivo}>
                  <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                  <Text style={styles.vehiculoMotivoText}>{v.motivo || 'Sin motivo'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Seleccionar Corralón */}
      {solicitudSeleccionada && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="business" size={20} color="#7C3AED" /> Seleccionar Corralón
          </Text>

          {corralones.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle" size={40} color="#F59E0B" />
              <Text style={styles.emptyText}>No hay corralones disponibles</Text>
            </View>
          ) : (
            corralones.map((corralon) => {
              const porcentaje = corralon.capacidad
                ? Math.round(((corralon.vehiculos_actuales || 0) / corralon.capacidad) * 100)
                : 0;
              const lleno = porcentaje >= 90;

              return (
                <TouchableOpacity
                  key={corralon.id}
                  style={[
                    styles.corralónItem,
                    corralónSeleccionado?.id === corralon.id && styles.corralónItemActivo,
                    lleno && styles. corralónLleno,
                  ]}
                  onPress={() => ! lleno && setCorralónSeleccionado(corralon)}
                  disabled={lleno}
                >
                  <View style={styles.corralónInfo}>
                    <Text style={styles.corralónNombre}>{corralon. nombre}</Text>
                    <Text style={styles.corralónDireccion}>
                      📍 {corralon. direccion}
                    </Text>
                    <View style={styles.capacidadContainer}>
                      <View style={styles.capacidadBar}>
                        <View
                          style={[
                            styles. capacidadFill,
                            { width: `${Math.min(porcentaje, 100)}%` },
                            porcentaje > 70 && styles.capacidadAlta,
                          ]}
                        />
                      </View>
                      <Text style={styles. capacidadText}>
                        {corralon.vehiculos_actuales || 0} / {corralon.capacidad}
                      </Text>
                    </View>
                    {lleno && (
                      <Text style={styles.llenoText}>⚠️ Corralón lleno</Text>
                    )}
                  </View>
                  {corralónSeleccionado?.id === corralon.id && ! lleno && (
                    <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* Resumen */}
      {solicitudSeleccionada && corralónSeleccionado && (
        <View style={styles.resumenCard}>
          <Text style={styles. resumenTitle}>📋 Resumen</Text>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Grúa:</Text>
            <Text style={styles.resumenValue}>
              {solicitudSeleccionada. gruas?.numero || 'N/A'}
            </Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Vehículos:</Text>
            <Text style={styles.resumenValue}>{vehiculos.length}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Corralón:</Text>
            <Text style={styles.resumenValue}>{corralónSeleccionado. nombre}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Recibe:</Text>
            <Text style={styles.resumenValue}>{user?.nombre || 'N/A'}</Text>
          </View>
        </View>
      )}

      {/* Botón Recibir */}
      {solicitudSeleccionada && corralónSeleccionado && (
        <View style={styles.buttonContainer}>
          <Button
            title={`Recibir ${vehiculos.length} Vehículo(s)`}
            onPress={recibirVehiculo}
            loading={loading}
            icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          />
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems:  'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding:  15,
    ... SHADOWS. small,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  emptyState: { alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color:  '#1F2937', marginTop: 10 },
  emptyText: { color: '#6B7280', marginTop: 5, textAlign: 'center' },
  solicitudItem: {
    flexDirection:  'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  solicitudItemActivo: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  solicitudInfo: { flex: 1 },
  solicitudGrua:  { fontSize: 16, fontWeight: 'bold', color:  '#1F2937' },
  solicitudOperador: { color: '#4B5563', marginTop: 2 },
  solicitudUbicacion: { color: '#6B7280', fontSize: 13, marginTop: 5 },
  solicitudVehiculos:  { color: '#3B82F6', fontSize: 13, marginTop: 5, fontWeight: '600' },
  gruaInfo: {
    backgroundColor: '#EEF2FF',
    padding:  15,
    borderRadius: 10,
    marginBottom: 15,
  },
  gruaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gruaNumero: { fontSize: 18, fontWeight: 'bold', color:  '#4F46E5' },
  gruaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal:  10,
    paddingVertical:  4,
    borderRadius: 12,
    gap: 4,
  },
  gruaBadgeText:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  gruaOperador: { color: '#6366F1', marginTop: 8 },
  gruaTelefono:  { color: '#6366F1' },
  gruaUbicacion:  { color: '#6B7280', marginTop: 5 },
  vehiculosLabel: { fontSize:  14, fontWeight: '600', color: '#4B5563', marginBottom: 10 },
  noVehiculos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  noVehiculosText: { color: '#92400E', flex: 1 },
  vehiculoCard: {
    backgroundColor: '#F0F9FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  vehiculoHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehiculoPlaca: { fontSize: 20, fontWeight: 'bold', color:  '#1E40AF' },
  vehiculoNumero: {
    backgroundColor: '#3B82F6',
    width: 28,
    height:  28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiculoNumeroText: { color: '#fff', fontWeight: 'bold' },
  vehiculoDetalles: { flexDirection: 'row', marginTop: 10, gap: 20 },
  vehiculoInfo: { color: '#4B5563', fontSize: 14 },
  vehiculoMotivo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:  10,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  vehiculoMotivoText: { color: '#92400E', fontSize:  13 },
  corralónItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding:  15,
    borderRadius: 10,
    backgroundColor:  '#F9FAFB',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corralónItemActivo: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  corralónLleno: { opacity: 0.6, backgroundColor: '#FEE2E2' },
  corralónInfo: { flex: 1 },
  corralónNombre: { fontSize: 16, fontWeight:  'bold', color: '#1F2937' },
  corralónDireccion: { color: '#6B7280', fontSize:  13, marginTop: 5 },
  capacidadContainer: { flexDirection: 'row', alignItems:  'center', marginTop: 10, gap: 10 },
  capacidadBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius:  4,
    overflow: 'hidden',
  },
  capacidadFill: { height: '100%', backgroundColor:  '#10B981', borderRadius: 4 },
  capacidadAlta:  { backgroundColor: '#F59E0B' },
  capacidadText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  llenoText: { color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight: '600' },
  resumenCard: {
    backgroundColor: '#EEF2FF',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 15,
  },
  resumenTitle: { fontSize:  16, fontWeight: 'bold', color: '#4F46E5', marginBottom: 10 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  resumenLabel: { color: '#6366F1' },
  resumenValue: { fontWeight: '600', color: '#4F46E5' },
  buttonContainer:  { padding: 15 },
});