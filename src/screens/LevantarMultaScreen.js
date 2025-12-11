import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, SHADOWS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { offlineService } from '../config/offlineService';
import Input from '../components/Input';
import Button from '../components/Button';

const API_URL = 'https://multas-transito-api.onrender.com';

const TIPOS_INFRACCION = [
  { id: 'estacionamiento', label: 'Estacionamiento prohibido', monto: 800 },
  { id: 'velocidad', label: 'Exceso de velocidad', monto: 1500 },
  { id: 'semaforo', label:  'Pasarse el semáforo en rojo', monto: 2000 },
  { id: 'cinturon', label: 'No usar cinturón de seguridad', monto: 500 },
  { id: 'celular', label: 'Uso de celular al conducir', monto:  1000 },
  { id: 'alcoholemia', label: 'Conducir en estado de ebriedad', monto: 5000 },
  { id: 'documentos', label: 'Sin documentos', monto: 600 },
  { id: 'luces', label: 'Circular sin luces', monto: 400 },
  { id:  'casco', label: 'No usar casco (moto)', monto: 700 },
  { id: 'doble_fila', label: 'Estacionarse en doble fila', monto: 900 },
];

export default function LevantarMultaScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState(null);
  const [fotos, setFotos] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [otraInfraccion, setOtraInfraccion] = useState({ descripcion: '', monto: '' });
  const [infraccionesPersonalizadas, setInfraccionesPersonalizadas] = useState([]);

  const [form, setForm] = useState({
    placa: '',
    infraccionesSeleccionadas: [],
    descripcion: '',
    direccion: '',
  });

  useEffect(() => {
    checkConnectivity();
    getLocation();
  }, []);

  const checkConnectivity = async () => {
    try {
      const response = await fetch(`${API_URL}/`, { method: 'GET' });
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert. alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc. coords);

      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address) {
        const direccion = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}`;
        setForm((prev) => ({ ...prev, direccion:  direccion. trim() }));
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  };

  const toggleInfraccion = (id) => {
    setForm((prev) => {
      const seleccionadas = prev.infraccionesSeleccionadas;
      if (seleccionadas.includes(id)) {
        return { ...prev, infraccionesSeleccionadas: seleccionadas.filter((i) => i !== id) };
      } else {
        return { ...prev, infraccionesSeleccionadas: [...seleccionadas, id] };
      }
    });
  };

  const agregarOtraInfraccion = () => {
    if (! otraInfraccion.descripcion. trim()) {
      Alert.alert('Error', 'Ingresa la descripción de la infracción');
      return;
    }
    if (!otraInfraccion. monto || isNaN(parseFloat(otraInfraccion.monto))) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    const nuevaInfraccion = {
      id: `otro_${Date.now()}`,
      label: otraInfraccion.descripcion. trim(),
      monto: parseFloat(otraInfraccion.monto),
      esPersonalizada: true,
    };

    setInfraccionesPersonalizadas([...infraccionesPersonalizadas, nuevaInfraccion]);
    setForm((prev) => ({
      ...prev,
      infraccionesSeleccionadas: [... prev.infraccionesSeleccionadas, nuevaInfraccion. id],
    }));

    setOtraInfraccion({ descripcion: '', monto: '' });
    setModalVisible(false);
  };

  const eliminarInfraccionPersonalizada = (id) => {
    setInfraccionesPersonalizadas(infraccionesPersonalizadas.filter((i) => i. id !== id));
    setForm((prev) => ({
      ... prev,
      infraccionesSeleccionadas: prev. infraccionesSeleccionadas.filter((i) => i !== id),
    }));
  };

  const calcularMontoTotal = () => {
    let total = 0;
    form.infraccionesSeleccionadas. forEach((id) => {
      const infraccion = TIPOS_INFRACCION.find((t) => t.id === id);
      if (infraccion) {
        total += infraccion. monto;
      } else {
        const personalizada = infraccionesPersonalizadas. find((t) => t.id === id);
        if (personalizada) {
          total += personalizada.monto;
        }
      }
    });
    return total;
  };

  const getInfraccionesTexto = () => {
    const textos = [];
    form.infraccionesSeleccionadas.forEach((id) => {
      const infraccion = TIPOS_INFRACCION.find((t) => t.id === id);
      if (infraccion) {
        textos.push(infraccion. label);
      } else {
        const personalizada = infraccionesPersonalizadas.find((t) => t.id === id);
        if (personalizada) {
          textos. push(personalizada. label);
        }
      }
    });
    return textos.join(', ');
  };

  // CORREGIDO: Usar nueva API de ImagePicker
  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // Nueva forma
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]. base64) {
        setFotos([... fotos, { uri: result.assets[0].uri, base64: result.assets[0].base64 }]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // CORREGIDO:  Usar nueva API de ImagePicker
  const seleccionarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Nueva forma
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const nuevasFotos = result.assets
          .filter((asset) => asset.base64)
          .map((asset) => ({ uri: asset.uri, base64: asset.base64 }));
        setFotos([...fotos, ...nuevasFotos]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const eliminarFoto = (index) => {
    const nuevasFotos = [... fotos];
    nuevasFotos.splice(index, 1);
    setFotos(nuevasFotos);
  };

  const validarFormulario = () => {
    if (!form.placa.trim()) {
      Alert.alert('Error', 'Ingresa el número de placa');
      return false;
    }
    if (form.infraccionesSeleccionadas.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una infracción');
      return false;
    }
    return true;
  };

  // CORREGIDO:  Mejor manejo de conexión con timeout
  const levantarMulta = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    const montoTotal = calcularMontoTotal();
    const infraccionesTexto = getInfraccionesTexto();

    const datosMulta = {
      placa: form. placa. toUpperCase(),
      tipo_infraccion: infraccionesTexto,
      descripcion: form.descripcion || infraccionesTexto,
      monto: montoTotal,
      monto_final: montoTotal,
      direccion: form.direccion,
      latitud: location?. latitude,
      longitud: location?.longitude,
      agente_id: user?.id,
      fotos: fotos. map((f) => f.base64),
    };

    try {
      console.log('Enviando multa al servidor...');
      console.log('Fotos a enviar:', datosMulta.fotos. length);

      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      const response = await fetch(`${API_URL}/api/multas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosMulta),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success) {
        Alert.alert(
          '✅ Multa Levantada',
          `Folio: ${data.multa?. folio || 'Generado'}\n` +
            `Infracciones:  ${form.infraccionesSeleccionadas. length}\n` +
            `Monto Total: $${montoTotal. toLocaleString('es-MX')}\n` +
            `Evidencias: ${data.multa?.evidencias?. length || 0} foto(s)`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert. alert('Error', data.error || 'No se pudo crear la multa');
      }
    } catch (error) {
      console.error('Error de conexión:', error. message);

      // Verificar si es timeout o error de red
      if (error.name === 'AbortError') {
        Alert. alert(
          '⏱️ Tiempo Agotado',
          'El servidor tardó demasiado en responder. ¿Deseas guardar la multa localmente?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Guardar Offline',
              onPress: () => guardarOffline(datosMulta),
            },
          ]
        );
      } else {
        Alert.alert(
          '⚠️ Error de Conexión',
          '¿Deseas guardar la multa localmente para sincronizarla después?',
          [
            { text:  'Cancelar', style: 'cancel' },
            {
              text:  'Guardar Offline',
              onPress: () => guardarOffline(datosMulta),
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const guardarOffline = async (datosMulta) => {
    try {
      await offlineService.guardarMultaOffline(datosMulta);
      Alert.alert(
        '📱 Guardado Offline',
        'La multa se guardó localmente.\nSe sincronizará cuando haya conexión.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (offlineError) {
      Alert.alert('Error', 'No se pudo guardar la multa');
    }
  };

  // Despertar el servidor al cargar la pantalla
  useEffect(() => {
    const despertarServidor = async () => {
      try {
        await fetch(`${API_URL}/`);
        console.log('Servidor despierto');
      } catch {
        console.log('Servidor no disponible');
      }
    };
    despertarServidor();
  }, []);

  const todasLasInfracciones = [... TIPOS_INFRACCION, ...infraccionesPersonalizadas];

  return (
    <ScrollView style={styles.container}>
      {/* Modal para agregar otra infracción */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles. modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles. modalTitle}>Agregar Otra Infracción</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Descripción de la infracción *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Obstrucción de vía pública"
              value={otraInfraccion.descripcion}
              onChangeText={(text) => setOtraInfraccion({ ... otraInfraccion, descripcion:  text })}
            />

            <Text style={styles.modalLabel}>Monto de la multa *</Text>
            <View style={styles.montoInputContainer}>
              <Text style={styles.montoPrefix}>$</Text>
              <TextInput
                style={styles.montoInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={otraInfraccion.monto}
                onChangeText={(text) =>
                  setOtraInfraccion({ ...otraInfraccion, monto: text. replace(/[^0-9.]/g, '') })
                }
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn} onPress={agregarOtraInfraccion}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.modalAddText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.connectivityBanner, { backgroundColor: isOnline ? '#D1FAE5' : '#FEF3C7' }]}>
        <Ionicons name={isOnline ? 'wifi' : 'wifi-outline'} size={20} color={isOnline ? '#10B981' : '#F59E0B'} />
        <Text style={[styles.connectivityText, { color: isOnline ? '#065F46' : '#92400E' }]}>
          {isOnline ? 'Conectado al servidor' : 'Sin conexión - Se guardará localmente'}
        </Text>
        {! isOnline && (
          <TouchableOpacity onPress={checkConnectivity}>
            <Ionicons name="refresh" size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Input
          label="Número de Placa *"
          placeholder="ABC-123"
          value={form.placa}
          onChangeText={(text) => setForm({ ...form, placa: text. toUpperCase() })}
          autoCapitalize="characters"
          icon={<Ionicons name="car" size={20} color={COLORS.gray[400]} />}
        />

        <View style={styles.infraccionesHeader}>
          <Text style={styles.label}>Tipo de Infracción(es) *</Text>
          <View style={styles.contadorBadge}>
            <Text style={styles. contadorText}>{form.infraccionesSeleccionadas. length} seleccionada(s)</Text>
          </View>
        </View>

        <Text style={styles.hint}>Puedes seleccionar múltiples infracciones</Text>

        <View style={styles.tiposGrid}>
          {TIPOS_INFRACCION.map((tipo) => {
            const isSelected = form.infraccionesSeleccionadas.includes(tipo.id);
            return (
              <TouchableOpacity
                key={tipo.id}
                style={[styles.tipoBtn, isSelected && styles.tipoBtnActivo]}
                onPress={() => toggleInfraccion(tipo.id)}
              >
                <View style={styles.tipoBtnContent}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                  <Text style={[styles.tipoText, isSelected && styles.tipoTextActivo]}>{tipo.label}</Text>
                </View>
                <Text style={[styles.tipoMonto, isSelected && styles.tipoMontoActivo]}>${tipo.monto}</Text>
              </TouchableOpacity>
            );
          })}

          {infraccionesPersonalizadas.map((tipo) => {
            const isSelected = form.infraccionesSeleccionadas. includes(tipo.id);
            return (
              <View
                key={tipo. id}
                style={[styles.tipoBtn, styles.tipoBtnPersonalizado, isSelected && styles.tipoBtnActivo]}
              >
                <TouchableOpacity style={styles.tipoBtnContent} onPress={() => toggleInfraccion(tipo.id)}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                  <Text style={[styles.tipoText, isSelected && styles.tipoTextActivo]}>{tipo. label}</Text>
                </TouchableOpacity>
                <View style={styles.personalizadaActions}>
                  <Text style={[styles.tipoMonto, isSelected && styles.tipoMontoActivo]}>${tipo.monto}</Text>
                  <TouchableOpacity onPress={() => eliminarInfraccionPersonalizada(tipo. id)}>
                    <Ionicons name="trash-outline" size={18} color={isSelected ? '#fff' : '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.agregarOtraBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
            <Text style={styles.agregarOtraText}>Agregar otra infracción</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Descripción adicional"
          placeholder="Detalles adicionales..."
          value={form.descripcion}
          onChangeText={(text) => setForm({ ... form, descripcion:  text })}
          icon={<Ionicons name="document-text" size={20} color={COLORS.gray[400]} />}
        />

        <View style={styles.ubicacionContainer}>
          <Text style={styles.label}>Ubicación</Text>
          <View style={styles.ubicacionInfo}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles. ubicacionText}>{form.direccion || 'Obteniendo ubicación.. .'}</Text>
            <TouchableOpacity onPress={getLocation}>
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.evidenciasHeader}>
          <Text style={styles.label}>Evidencias Fotográficas</Text>
          <View style={styles.fotosContador}>
            <Ionicons name="camera" size={16} color="#6B7280" />
            <Text style={styles.fotosContadorText}>{fotos.length} foto(s)</Text>
          </View>
        </View>

        <View style={styles.fotosContainer}>
          {fotos.map((foto, index) => (
            <View key={index} style={styles.fotoWrapper}>
              <Image source={{ uri: foto. uri }} style={styles.fotoPreview} />
              <TouchableOpacity style={styles.eliminarFoto} onPress={() => eliminarFoto(index)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.agregarFoto} onPress={tomarFoto}>
            <Ionicons name="camera" size={30} color={COLORS.primary} />
            <Text style={styles.agregarFotoText}>Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles. agregarFoto} onPress={seleccionarFoto}>
            <Ionicons name="images" size={30} color={COLORS. primary} />
            <Text style={styles.agregarFotoText}>Galería</Text>
          </TouchableOpacity>
        </View>

        {form.infraccionesSeleccionadas. length > 0 && (
          <View style={styles. resumen}>
            <Text style={styles. resumenTitle}>📋 Resumen de la Multa</Text>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Placa:</Text>
              <Text style={styles.resumenValue}>{form.placa || '-'}</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Infracciones:</Text>
              <Text style={styles.resumenValue}>{form. infraccionesSeleccionadas.length}</Text>
            </View>

            <View style={styles.infraccionesLista}>
              {form.infraccionesSeleccionadas.map((id) => {
                const inf = todasLasInfracciones.find((t) => t.id === id);
                return (
                  <View key={id} style={styles.infraccionItem}>
                    <Text style={styles. infraccionItemText}>• {inf?.label}</Text>
                    <Text style={styles.infraccionItemMonto}>${inf?.monto?. toLocaleString('es-MX')}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Evidencias:</Text>
              <Text style={styles.resumenValue}>{fotos.length} foto(s)</Text>
            </View>

            <View style={styles.montoTotalContainer}>
              <Text style={styles. montoTotalLabel}>MONTO TOTAL: </Text>
              <Text style={styles. montoTotalValue}>${calcularMontoTotal().toLocaleString('es-MX')}</Text>
            </View>
          </View>
        )}

        <Button
          title={`Levantar Multa ${
            form.infraccionesSeleccionadas.length > 0 ? `($${calcularMontoTotal().toLocaleString('es-MX')})` : ''
          }`}
          onPress={levantarMulta}
          loading={loading}
          icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          style={{ marginTop: 20 }}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  connectivityBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  connectivityText: { flex: 1, fontSize: 13 },
  card:  { backgroundColor: '#fff', margin: 15, borderRadius: 16, padding: 20, ... SHADOWS.medium },
  label: { fontSize: 14, fontWeight:  '600', color:  COLORS.gray[700], marginBottom: 10, marginTop: 15 },
  infraccionesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  contadorBadge:  { backgroundColor: '#EEF2FF', paddingHorizontal:  10, paddingVertical: 4, borderRadius: 12 },
  contadorText: { color: '#4F46E5', fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  tiposGrid: { gap: 8 },
  tipoBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor:  '#E5E7EB',
  },
  tipoBtnActivo: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  tipoBtnPersonalizado: { borderColor: '#A5B4FC', backgroundColor: '#EEF2FF' },
  tipoBtnContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  tipoText: { flex: 1, fontSize: 14, color: '#4B5563' },
  tipoTextActivo: { color: '#fff', fontWeight: '600' },
  tipoMonto: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  tipoMontoActivo: { color: '#fff' },
  personalizadaActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agregarOtraBtn: {
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4F46E5',
    gap: 10,
    marginTop: 5,
  },
  agregarOtraText: { color:  '#4F46E5', fontSize: 14, fontWeight: '600' },
  ubicacionContainer: { marginTop: 15 },
  ubicacionInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding:  12,
    borderRadius: 8,
    gap: 10,
  },
  ubicacionText: { flex: 1, fontSize: 14, color: '#4B5563' },
  evidenciasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems:  'center', marginTop: 15 },
  fotosContador: { flexDirection: 'row', alignItems: 'center', gap:  5 },
  fotosContadorText:  { fontSize: 12, color: '#6B7280' },
  fotosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  fotoWrapper: { position: 'relative' },
  fotoPreview: { width: 80, height: 80, borderRadius: 8 },
  eliminarFoto: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },
  agregarFoto: {
    width: 80,
    height:  80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agregarFotoText:  { fontSize: 10, color:  COLORS.primary, marginTop: 5 },
  resumen:  { backgroundColor: '#F0F9FF', padding: 15, borderRadius:  12, marginTop: 20 },
  resumenTitle: { fontSize: 16, fontWeight: 'bold', color:  '#0369A1', marginBottom: 10 },
  resumenRow: { flexDirection: 'row', justifyContent:  'space-between', marginBottom: 5 },
  resumenLabel: { color: '#0369A1' },
  resumenValue: { fontWeight: '600', color: '#0369A1' },
  infraccionesLista: { backgroundColor: '#E0F2FE', padding: 10, borderRadius: 8, marginVertical: 10 },
  infraccionItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  infraccionItemText: { fontSize: 13, color: '#0369A1', flex: 1 },
  infraccionItemMonto: { fontSize: 13, fontWeight: '600', color: '#0369A1' },
  montoTotalContainer:  {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
    paddingTop: 10,
    marginTop: 10,
  },
  montoTotalLabel: { fontSize:  16, fontWeight: 'bold', color:  '#0369A1' },
  montoTotalValue:  { fontSize: 24, fontWeight: 'bold', color:  '#0369A1' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width:  '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:  'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize:  18, fontWeight: 'bold', color: '#1F2937' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8, marginTop: 10 },
  modalInput: {
    borderWidth:  1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor:  '#F9FAFB',
  },
  montoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  montoPrefix: { paddingLeft: 12, fontSize: 18, color: '#6B7280', fontWeight: 'bold' },
  montoInput: { flex: 1, padding: 12, fontSize: 18, fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 25 },
  modalCancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: { color: '#6B7280', fontWeight: '600' },
  modalAddBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  modalAddText:  { color: '#fff', fontWeight: '600' },
});