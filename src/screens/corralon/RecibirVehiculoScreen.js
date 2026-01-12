import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function RecibirVehiculoScreen({ route, navigation }) {
  const { user } = useAuth();
  const solicitudParam = route.params?. solicitud;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(solicitudParam || null);
  const [corralones, setCorralones] = useState([]);
  const [corralónSeleccionado, setCorralónSeleccionado] = useState(null);
  const [fotos, setFotos] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar solicitudes pendientes
      if (! solicitudParam) {
        const resSolicitudes = await fetch(`${API_URL}/api/solicitudes-grua`);
        const dataSolicitudes = await resSolicitudes. json();
        if (dataSolicitudes.success) {
          const pendientes = dataSolicitudes.solicitudes.filter(
            (s) => s.estatus === 'pendiente' || s.estatus === 'en_camino'
          );
          setSolicitudes(pendientes);
        }
      }

      // Cargar corralones
      const resCorralones = await fetch(`${API_URL}/api/corralones`);
      const dataCorralones = await resCorralones.json();
      if (dataCorralones.success) {
        setCorralones(dataCorralones.corralones);
        if (dataCorralones.corralones. length > 0) {
          setCorralónSeleccionado(dataCorralones.corralones[0]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoadingData(false);
    }
  };

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing:  false,
        quality:  0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const nuevaFoto = {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          timestamp: new Date().toISOString(),
        };
        setFotos([...fotos, nuevaFoto]);
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarDeGaleria = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions. Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const nuevasFotos = result. assets.map((asset) => ({
          uri: asset.uri,
          base64: asset.base64,
          timestamp:  new Date().toISOString(),
        }));
        setFotos([...fotos, ... nuevasFotos]);
      }
    } catch (error) {
      console.error('Error seleccionando foto:', error);
    }
  };

  const eliminarFoto = (index) => {
    Alert.alert('Eliminar foto', '¿Estás seguro? ', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const nuevasFotos = fotos.filter((_, i) => i !== index);
          setFotos(nuevasFotos);
        },
      },
    ]);
  };

  const parseVehiculos = (notas) => {
    try {
      return JSON.parse(notas || '[]');
    } catch {
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

    if (fotos.length === 0) {
      Alert.alert(
        '📷 Fotos requeridas',
        'Debes tomar al menos una foto del vehículo antes de recibirlo.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    setLoading(true);

    try {
      console.log('📥 Recibiendo vehículo.. .');
      console.log('📥 Solicitud:', solicitudSeleccionada. id);
      console.log('📥 Corralón:', corralónSeleccionado.id);
      console.log('📷 Fotos:', fotos.length);

      const response = await fetch(
        `${API_URL}/api/solicitudes-grua/${solicitudSeleccionada.id}/recibir`,
        {
          method: 'POST',
          headers:  { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            corralon_id: corralónSeleccionado. id,
            personal_id: user?. id,
            fotos_ingreso: fotos. map((f) => f.base64),
          }),
        }
      );

      const data = await response.json();
      console.log('📦 Respuesta:', data);

      if (data.success) {
        Alert. alert(
          '✅ Vehículo Recibido',
          `El vehículo ha sido registrado en ${corralónSeleccionado.nombre}.\n\n` +
            `Folios generados: ${data. folios?. join(', ') || 'N/A'}\n` +
            `Fotos guardadas: ${fotos.length}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo recibir el vehículo');
      }
    } catch (error) {
      console. error('Error:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando... </Text>
      </View>
    );
  }

  const vehiculos = solicitudSeleccionada
    ? parseVehiculos(solicitudSeleccionada.notas)
    : [];

  return (
    <ScrollView style={styles. container}>
      {/* Seleccionar solicitud */}
      {! solicitudParam && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="list" size={20} color={COLORS.primary} /> Solicitudes Pendientes
          </Text>

          {solicitudes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
            </View>
          ) : (
            solicitudes.map((solicitud) => (
              <TouchableOpacity
                key={solicitud. id}
                style={[
                  styles.solicitudItem,
                  solicitudSeleccionada?. id === solicitud. id && styles.solicitudSeleccionada,
                ]}
                onPress={() => setSolicitudSeleccionada(solicitud)}
              >
                <View style={styles.solicitudInfo}>
                  <Text style={styles. solicitudGrua}>
                    🚛 {solicitud. gruas?.numero || 'Grúa'}
                  </Text>
                  <Text style={styles. solicitudUbicacion}>
                    📍 {solicitud.ubicacion}
                  </Text>
                </View>
                {solicitudSeleccionada?. id === solicitud. id && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Información de la solicitud seleccionada */}
      {solicitudSeleccionada && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="car" size={20} color={COLORS. primary} /> Vehículos a Recibir
          </Text>

          {vehiculos.map((vehiculo, index) => (
            <View key={index} style={styles. vehiculoItem}>
              <Text style={styles.vehiculoPlaca}>🚗 {vehiculo.placa}</Text>
              <Text style={styles. vehiculoInfo}>
                {vehiculo.marca} • {vehiculo.color}
              </Text>
              <Text style={styles.vehiculoMotivo}>📋 {vehiculo.motivo}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Seleccionar corralón */}
      <View style={styles. card}>
        <Text style={styles. cardTitle}>
          <Ionicons name="business" size={20} color={COLORS. primary} /> Seleccionar Corralón
        </Text>

        {corralones.map((corralon) => (
          <TouchableOpacity
            key={corralon.id}
            style={[
              styles. corralónItem,
              corralónSeleccionado?.id === corralon.id && styles.corralónSeleccionado,
            ]}
            onPress={() => setCorralónSeleccionado(corralon)}
          >
            <View style={styles.corralónInfo}>
              <Text style={styles.corralónNombre}>{corralon. nombre}</Text>
              <Text style={styles.corralónDireccion}>{corralon. direccion}</Text>
              <Text style={styles.corralónCapacidad}>
                🚗 {corralon.vehiculos_actuales || 0} / {corralon.capacidad || 100}
              </Text>
            </View>
            {corralónSeleccionado?.id === corralon.id && (
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Fotos del vehículo */}
      <View style={styles. card}>
        <Text style={styles. cardTitle}>
          <Ionicons name="camera" size={20} color={COLORS. primary} /> Fotos del Vehículo *
        </Text>
        <Text style={styles.cardSubtitle}>
          Toma fotos del estado actual del vehículo al recibirlo
        </Text>

        <View style={styles.fotosContainer}>
          {fotos.map((foto, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fotoWrapper}
              onPress={() => eliminarFoto(index)}
            >
              <Image source={{ uri: foto. uri }} style={styles.fotoPreview} />
              <View style={styles.fotoDeleteBadge}>
                <Ionicons name="close" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}

          {fotos. length < 10 && (
            <View style={styles.botonesfotos}>
              <TouchableOpacity style={styles.agregarFotoBtn} onPress={tomarFoto}>
                <Ionicons name="camera" size={30} color={COLORS.primary} />
                <Text style={styles.agregarFotoText}>Cámara</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles. agregarFotoBtn} onPress={seleccionarDeGaleria}>
                <Ionicons name="images" size={30} color={COLORS. primary} />
                <Text style={styles.agregarFotoText}>Galería</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {fotos.length > 0 && (
          <Text style={styles.fotosCount}>
            📷 {fotos.length} foto{fotos.length !== 1 ? 's' : ''} tomada{fotos.length !== 1 ? 's' : ''}
          </Text>
        )}

        {fotos.length === 0 && (
          <View style={styles.alertaFotos}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.alertaFotosText}>
              Debes tomar al menos una foto del vehículo
            </Text>
          </View>
        )}
      </View>

      {/* Botón recibir */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles. recibirBtn,
            (! solicitudSeleccionada || ! corralónSeleccionado || fotos.length === 0) &&
              styles. recibirBtnDisabled,
          ]}
          onPress={recibirVehiculo}
          disabled={loading || !solicitudSeleccionada || ! corralónSeleccionado || fotos.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download" size={24} color="#fff" />
              <Text style={styles.recibirBtnText}>Recibir Vehículo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 15,
    ... SHADOWS. small,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 15 },
  emptyState: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#6B7280', marginTop: 10 },
  solicitudItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  solicitudSeleccionada: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  solicitudInfo: { flex: 1 },
  solicitudGrua: { fontSize: 16, fontWeight: 'bold', color:  '#1F2937' },
  solicitudUbicacion: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  vehiculoItem: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  vehiculoPlaca: { fontSize: 16, fontWeight: 'bold', color:  '#1E40AF' },
  vehiculoInfo: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  vehiculoMotivo:  { fontSize: 12, color: '#6B7280', marginTop: 4 },
  corralónItem: {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth:  2,
    borderColor: 'transparent',
  },
  corralónSeleccionado: { borderColor: '#10B981', backgroundColor:  '#ECFDF5' },
  corralónInfo:  { flex: 1 },
  corralónNombre:  { fontSize: 16, fontWeight: 'bold', color:  '#1F2937' },
  corralónDireccion: { fontSize:  13, color:  '#6B7280', marginTop: 2 },
  corralónCapacidad: { fontSize:  12, color: '#3B82F6', marginTop: 4 },
  
  // Estilos para fotos
  fotosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fotoWrapper: {
    position: 'relative',
  },
  fotoPreview: {
    width: 80,
    height:  80,
    borderRadius: 8,
  },
  fotoDeleteBadge:  {
    position:  'absolute',
    top: -5,
    right:  -5,
    backgroundColor: '#EF4444',
    width: 22,
    height:  22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonesfotos: {
    flexDirection: 'row',
    gap: 10,
  },
  agregarFotoBtn:  {
    width: 80,
    height:  80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor:  COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4FF',
  },
  agregarFotoText: { fontSize: 11, color: COLORS.primary, marginTop: 4 },
  fotosCount: {
    marginTop: 10,
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  alertaFotos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  alertaFotosText: { color: '#92400E', fontSize: 13, flex: 1 },
  
  buttonContainer: { padding: 15 },
  recibirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  recibirBtnDisabled: { backgroundColor:'#9CA3AF' },
  recibirBtnText: { color: '#fff', fontSize: 18, fontWeight:'bold' },
}); 