import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SHADOWS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

const API_URL = 'https://multas-transito-api.onrender.com';

const MOTIVOS_REMISION = [
  'Estacionamiento prohibido',
  'Abandono de vehículo',
  'Accidente vial',
  'Infracción grave',
  'Vehículo sin placas',
  'Operativo alcoholímetro',
  'Otro',
];

// Montos por tipo de infracción
const MONTOS_INFRACCION = {
  'Estacionamiento prohibido': 800,
  'Abandono de vehículo': 1500,
  'Accidente vial': 2000,
  'Infracción grave':  2500,
  'Vehículo sin placas': 1800,
  'Operativo alcoholímetro': 3500,
  'Otro': 1000,
};

export default function SolicitarGruaScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingGruas, setLoadingGruas] = useState(true);
  const [location, setLocation] = useState(null);
  const [gruasDisponibles, setGruasDisponibles] = useState([]);
  const [gruaSeleccionada, setGruaSeleccionada] = useState(null);
  const [vehiculos, setVehiculos] = useState([{ placa: '', marca: '', color: '', motivo: '' }]);
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    getLocation();
  }, []);

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimarTiempoLlegada = (distanciaKm) => {
    if (! distanciaKm) return 'No disponible';
    const tiempoMinutos = Math.round((distanciaKm / 30) * 60);
    if (tiempoMinutos < 1) return '< 1 min';
    if (tiempoMinutos < 60) return `${tiempoMinutos} min`;
    const horas = Math.floor(tiempoMinutos / 60);
    const mins = tiempoMinutos % 60;
    return `${horas}h ${mins}min`;
  };

  const cargarGruasDisponibles = async (userLocation) => {
    try {
      const response = await fetch(`${API_URL}/api/gruas/disponibles`);
      const data = await response.json();

      if (data. success && data.gruas) {
        let gruasConDistancia = data.gruas.map((grua) => {
          const distancia = calcularDistancia(
            userLocation?. latitude,
            userLocation?. longitude,
            parseFloat(grua. latitud),
            parseFloat(grua. longitud)
          );
          return {
            ...grua,
            distancia,
            tiempoEstimado: estimarTiempoLlegada(distancia),
          };
        });

        gruasConDistancia. sort((a, b) => {
          if (! a.distancia) return 1;
          if (!b. distancia) return -1;
          return a.distancia - b.distancia;
        });

        setGruasDisponibles(gruasConDistancia);

        if (gruasConDistancia. length > 0) {
          setGruaSeleccionada(gruasConDistancia[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando grúas:', error);
      Alert.alert('Error', 'No se pudieron cargar las grúas');
    } finally {
      setLoadingGruas(false);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert. alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        cargarGruasDisponibles(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address) {
        setDireccion(
          `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}`
        );
      }

      cargarGruasDisponibles(loc. coords);
    } catch (error) {
      console.error('Error ubicación:', error);
      cargarGruasDisponibles(null);
    }
  };

  const agregarVehiculo = () => {
    setVehiculos([... vehiculos, { placa: '', marca:  '', color: '', motivo: '' }]);
  };

  const actualizarVehiculo = (index, campo, valor) => {
    const nuevos = [...vehiculos];
    nuevos[index][campo] = valor;
    setVehiculos(nuevos);
  };

  const eliminarVehiculo = (index) => {
    if (vehiculos.length > 1) {
      setVehiculos(vehiculos.filter((_, i) => i !== index));
    }
  };

  // =============================================
  // FUNCIÓN PRINCIPAL:  Crear multas y solicitar grúa
  // =============================================
  const enviarSolicitud = async () => {
    if (!gruaSeleccionada) {
      Alert.alert('Error', 'Selecciona una grúa');
      return;
    }

    if (vehiculos.some((v) => !v.placa. trim())) {
      Alert.alert('Error', 'Ingresa la placa de todos los vehículos');
      return;
    }

    if (vehiculos.some((v) => !v.motivo)) {
      Alert. alert('Error', 'Selecciona el motivo para todos los vehículos');
      return;
    }

    setLoading(true);

    try {
      console.log('\n🚗 ========================================');
      console.log('🚗 Iniciando proceso de solicitud de grúa');
      console.log('🚗 ========================================');

      const multasCreadas = [];
      const vehiculosConMulta = [];

      // PASO 1: Crear multa para cada vehículo
      for (const vehiculo of vehiculos) {
        console.log(`\n📝 Creando multa para placa: ${vehiculo.placa}`);

        const monto = MONTOS_INFRACCION[vehiculo.motivo] || 1000;

        const multaData = {
          placa: vehiculo. placa. toUpperCase(),
          tipo_infraccion: vehiculo.motivo,
          descripcion: `${vehiculo.motivo} - Remisión a corralón`,
          monto: monto,
          monto_final: monto,
          descuento: 0,
          direccion: direccion,
          latitud: location?. latitude || null,
          longitud: location?.longitude || null,
          agente_id: user?.id || null,
          fotos: [],
        };

        const response = await fetch(`${API_URL}/api/multas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(multaData),
        });

        const data = await response.json();

        if (data. success && data.multa) {
          console.log(`✅ Multa creada:  ${data.multa.folio}`);
          multasCreadas.push(data.multa);
          vehiculosConMulta.push({
            ... vehiculo,
            placa: vehiculo.placa. toUpperCase(),
            multa_id: data.multa.id,
            folio_multa: data. multa.folio,
          });
        } else {
          console.error(`❌ Error creando multa para ${vehiculo.placa}:`, data.error);
          throw new Error(`No se pudo crear multa para ${vehiculo.placa}:  ${data.error || 'Error desconocido'}`);
        }
      }

      console.log(`\n✅ ${multasCreadas. length} multa(s) creada(s)`);

      // PASO 2: Crear solicitud de grúa con las multas
      console.log('\n🚛 Creando solicitud de grúa.. .');

      // Usamos el primer multa_id para la solicitud principal
      // y guardamos todos los vehículos con sus multas en notas
      const solicitud = {
        agente_id: user?.id || null,
        grua_id: gruaSeleccionada.id,
        multa_id: multasCreadas[0]?.id || null, // Multa principal
        ubicacion: direccion,
        latitud: location?.latitude || null,
        longitud: location?. longitude || null,
        notas: notas,
        vehiculos: vehiculosConMulta, // Incluye multa_id por cada vehículo
      };

      const response = await fetch(`${API_URL}/api/solicitudes-grua`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitud),
      });

      const data = await response.json();

      if (data.success) {
        console. log('✅ Solicitud de grúa creada exitosamente');
        console.log('🎉 ========================================\n');

        // Construir mensaje de confirmación
        const foliosMultas = multasCreadas.map(m => m.folio).join(', ');

        Alert.alert(
          '✅ Grúa Solicitada',
          `Grúa:  ${gruaSeleccionada.numero}\n` +
            `Operador: ${gruaSeleccionada.operador_nombre}\n` +
            `Teléfono: ${gruaSeleccionada.operador_telefono}\n` +
            `Tiempo estimado: ${gruaSeleccionada.tiempoEstimado}\n\n` +
            `📋 Multas creadas:  ${multasCreadas.length}\n` +
            `Folios:  ${foliosMultas}\n\n` +
            `🚗 Vehículos:  ${vehiculos.length}`,
          [
            {
              text: 'Llamar Operador',
              onPress: () => Linking.openURL(`tel:${gruaSeleccionada.operador_telefono}`),
            },
            { text: 'OK', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        throw new Error(data. error || 'No se pudo crear la solicitud');
      }
    } catch (error) {
      console. error('❌ Error en el proceso:', error);
      Alert.alert('Error', error.message || 'No se pudo completar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Calcular monto total
  const calcularMontoTotal = () => {
    return vehiculos.reduce((total, v) => {
      return total + (MONTOS_INFRACCION[v. motivo] || 0);
    }, 0);
  };

  return (
    <ScrollView style={styles. container}>
      {/* Ubicación */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="location" size={20} color={COLORS.primary} /> Tu Ubicación
        </Text>
        <View style={styles.ubicacionBox}>
          <Ionicons name="navigate" size={20} color="#10B981" />
          <Text style={styles.ubicacionText}>{direccion || 'Obteniendo.. .'}</Text>
          <TouchableOpacity onPress={getLocation}>
            <Ionicons name="refresh" size={20} color={COLORS. primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehículos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles. cardTitle}>
            <Ionicons name="car" size={20} color={COLORS.primary} /> Vehículos ({vehiculos.length})
          </Text>
          <TouchableOpacity onPress={agregarVehiculo}>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {vehiculos.map((vehiculo, index) => (
          <View key={index} style={styles.vehiculoCard}>
            <View style={styles.vehiculoHeader}>
              <Text style={styles.vehiculoNumero}>Vehículo {index + 1}</Text>
              {vehiculos.length > 1 && (
                <TouchableOpacity onPress={() => eliminarVehiculo(index)}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <Input
              placeholder="Placa *"
              value={vehiculo.placa}
              onChangeText={(t) => actualizarVehiculo(index, 'placa', t. toUpperCase())}
              autoCapitalize="characters"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Marca"
                  value={vehiculo.marca}
                  onChangeText={(t) => actualizarVehiculo(index, 'marca', t)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Color"
                  value={vehiculo.color}
                  onChangeText={(t) => actualizarVehiculo(index, 'color', t)}
                />
              </View>
            </View>

            <Text style={styles.label}>Motivo de remisión *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.motivosRow}>
                {MOTIVOS_REMISION.map((motivo) => (
                  <TouchableOpacity
                    key={motivo}
                    style={[styles.motivoBtn, vehiculo.motivo === motivo && styles. motivoBtnActivo]}
                    onPress={() => actualizarVehiculo(index, 'motivo', motivo)}
                  >
                    <Text style={[styles.motivoText, vehiculo.motivo === motivo && styles. motivoTextActivo]}>
                      {motivo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Mostrar monto de la multa */}
            {vehiculo. motivo && (
              <View style={styles.montoPreview}>
                <Ionicons name="cash" size={16} color="#059669" />
                <Text style={styles.montoPreviewText}>
                  Multa:  ${MONTOS_INFRACCION[vehiculo.motivo]?. toLocaleString()} MXN
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Grúas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="car-sport" size={20} color={COLORS. primary} /> Grúas Disponibles
        </Text>

        {loadingGruas ?  (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Buscando grúas cercanas...</Text>
          </View>
        ) : gruasDisponibles. length === 0 ? (
          <View style={styles.noGruas}>
            <Ionicons name="alert-circle" size={40} color="#F59E0B" />
            <Text style={styles.noGruasText}>No hay grúas disponibles</Text>
            <TouchableOpacity style={styles.recargarBtn} onPress={() => cargarGruasDisponibles(location)}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.recargarBtnText}>Recargar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles. cercanaInfo}>
              <Ionicons name="flash" size={16} color="#10B981" />
              <Text style={styles.cercanaText}>
                La grúa más cercana está a {gruasDisponibles[0]?.distancia?. toFixed(1)} km
              </Text>
            </View>

            {gruasDisponibles.map((grua, index) => (
              <TouchableOpacity
                key={grua.id}
                style={[
                  styles.gruaCard,
                  gruaSeleccionada?. id === grua. id && styles.gruaSeleccionada,
                  index === 0 && styles. gruaMasCercana,
                ]}
                onPress={() => setGruaSeleccionada(grua)}
              >
                {index === 0 && (
                  <View style={styles. masCercanaBadge}>
                    <Ionicons name="flash" size={12} color="#fff" />
                    <Text style={styles.masCercanaText}>Más cercana</Text>
                  </View>
                )}

                <View style={styles.gruaContent}>
                  <View style={styles. gruaInfo}>
                    <Text style={styles.gruaNumero}>{grua.numero}</Text>
                    <Text style={styles.gruaOperador}>👷 {grua. operador_nombre}</Text>
                    <Text style={styles.gruaTelefono}>📞 {grua.operador_telefono}</Text>
                    <Text style={styles.gruaUbicacion}>📍 {grua.ubicacion_actual}</Text>
                  </View>

                  <View style={styles.gruaDistancia}>
                    {grua.distancia && (
                      <>
                        <Text style={styles.distanciaNumero}>{grua.distancia.toFixed(1)}</Text>
                        <Text style={styles.distanciaUnidad}>km</Text>
                        <View style={styles.tiempoContainer}>
                          <Ionicons name="time" size={14} color="#6B7280" />
                          <Text style={styles.tiempoText}>{grua.tiempoEstimado}</Text>
                        </View>
                      </>
                    )}
                    {gruaSeleccionada?.id === grua.id && (
                      <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      {/* Notas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="document-text" size={20} color={COLORS.primary} /> Notas adicionales
        </Text>
        <Input placeholder="Instrucciones adicionales..." value={notas} onChangeText={setNotas} multiline />
      </View>

      {/* Resumen */}
      {gruaSeleccionada && (
        <View style={styles.resumenCard}>
          <Text style={styles. resumenTitle}>📋 Resumen</Text>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Grúa:</Text>
            <Text style={styles.resumenValue}>{gruaSeleccionada. numero}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Operador:</Text>
            <Text style={styles.resumenValue}>{gruaSeleccionada.operador_nombre}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles. resumenLabel}>Distancia:</Text>
            <Text style={styles.resumenValue}>{gruaSeleccionada.distancia?. toFixed(1)} km</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Tiempo estimado:</Text>
            <Text style={styles.resumenValue}>{gruaSeleccionada. tiempoEstimado}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Vehículos:</Text>
            <Text style={styles.resumenValue}>{vehiculos. length}</Text>
          </View>
          <View style={[styles.resumenRow, styles.resumenTotal]}>
            <Text style={styles. resumenLabelTotal}>Total multas:</Text>
            <Text style={styles.resumenValueTotal}>
              ${calcularMontoTotal().toLocaleString()} MXN
            </Text>
          </View>
        </View>
      )}

      {/* Botón */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Procesando...' : `Crear Multa${vehiculos.length > 1 ? 's' : ''} y Solicitar Grúa`}
          onPress={enviarSolicitud}
          loading={loading}
          disabled={!gruaSeleccionada || loadingGruas}
          icon={<Ionicons name="send" size={20} color="#fff" />}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  card:  {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 15,
    ... SHADOWS. small,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems:  'center' },
  cardTitle:  { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  ubicacionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  ubicacionText: { flex: 1, color: '#166534', fontWeight: '500' },
  vehiculoCard: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 10, marginBottom: 10 },
  vehiculoHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  vehiculoNumero:  { fontWeight: 'bold', color:  COLORS.primary },
  row: { flexDirection:  'row', gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 10, marginBottom: 8 },
  motivosRow: { flexDirection: 'row', gap: 8 },
  motivoBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB' },
  motivoBtnActivo:  { backgroundColor:  COLORS.primary },
  motivoText: { fontSize:  12, color: '#4B5563' },
  motivoTextActivo:  { color: '#fff', fontWeight: '600' },
  montoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  montoPreviewText:  { color: '#059669', fontWeight:  '600' },
  loadingContainer: { alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 10, color: '#6B7280' },
  noGruas: { alignItems: 'center', padding: 20 },
  noGruasText:  { color: '#F59E0B', marginTop: 10, marginBottom: 15 },
  recargarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:  COLORS.primary,
    paddingHorizontal:  15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  recargarBtnText: { color: '#fff', fontWeight:  '600' },
  cercanaInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  cercanaText:  { color: '#065F46', fontSize: 13, fontWeight: '500' },
  gruaCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gruaSeleccionada: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  gruaMasCercana:  { borderColor: '#10B981', backgroundColor:  '#F0FDF4' },
  masCercanaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    alignSelf: 'flex-start',
    paddingHorizontal:  10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 4,
  },
  masCercanaText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  gruaContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gruaInfo: { flex: 1 },
  gruaNumero: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  gruaOperador: { fontSize:  14, color: '#4B5563', marginTop: 4 },
  gruaTelefono:  { fontSize: 14, color:  COLORS.primary },
  gruaUbicacion:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  gruaDistancia: { alignItems: 'center' },
  distanciaNumero:  { fontSize: 24, fontWeight: 'bold', color: '#1E40AF' },
  distanciaUnidad: { fontSize:  12, color:  '#6B7280' },
  tiempoContainer: { flexDirection: 'row', alignItems:  'center', marginTop: 5, gap: 4 },
  tiempoText: { fontSize: 12, color: '#6B7280' },
  resumenCard: {
    backgroundColor: '#EEF2FF',
    margin: 15,
    marginBottom: 0,
    borderRadius:  12,
    padding: 15,
  },
  resumenTitle: { fontSize:  16, fontWeight: 'bold', color: '#4F46E5', marginBottom: 10 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  resumenLabel: { color: '#6366F1' },
  resumenValue: { fontWeight: '600', color: '#4F46E5' },
  resumenTotal: { 
    marginTop: 10, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#C7D2FE' 
  },
  resumenLabelTotal: { color: '#4F46E5', fontWeight: 'bold' },
  resumenValueTotal: { fontWeight: 'bold', color:  '#059669', fontSize: 16 },
  buttonContainer: { padding: 15 },
});