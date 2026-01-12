import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

export default function ReportarErrorScreen({ navigation, route }) {
  const { multa } = route.params || {};
  const { user, isAuthenticated } = useAuth();
  
  const [folio, setFolio] = useState(multa?.folio || '');
  const [tipoError, setTipoError] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [evidencias, setEvidencias] = useState([]);
  const [contacto, setContacto] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: '',
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const tiposError = [
    { id: 'datos_incorrectos', label: 'Datos incorrectos', icon: 'create', desc: 'Placa, fecha u otros datos erróneos' },
    { id: 'no_soy_propietario', label: 'No soy el propietario', icon: 'person-remove', desc: 'El vehículo ya no me pertenece' },
    { id: 'infraccion_invalida', label: 'Infracción inválida', icon: 'alert-circle', desc: 'No cometí la infracción indicada' },
    { id: 'monto_incorrecto', label: 'Monto incorrecto', icon: 'cash', desc: 'El monto calculado es erróneo' },
    { id: 'duplicado', label: 'Multa duplicada', icon: 'copy', desc: 'Tengo otra multa por el mismo hecho' },
    { id: 'otro', label: 'Otro error', icon: 'help-circle', desc: 'Problema no listado arriba' },
  ];

  const pickImage = async () => {
    if (evidencias.length >= 5) {
      Alert.alert('Límite alcanzado', 'Máximo 5 evidencias permitidas');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setEvidencias([...evidencias, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    if (evidencias.length >= 5) {
      Alert.alert('Límite alcanzado', 'Máximo 5 evidencias permitidas');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setEvidencias([...evidencias, result.assets[0].uri]);
    }
  };

  const removeEvidencia = (index) => {
    setEvidencias(evidencias.filter((_, i) => i !== index));
  };

  const enviarReporte = async () => {
    // Validaciones
    if (!folio.trim()) {
      Alert.alert('Error', 'Ingresa el folio de la multa');
      return;
    }
    if (!tipoError) {
      Alert.alert('Error', 'Selecciona el tipo de error');
      return;
    }
    if (!descripcion.trim() || descripcion.length < 20) {
      Alert.alert('Error', 'La descripción debe tener al menos 20 caracteres');
      return;
    }
    if (!contacto.nombre.trim() || !contacto.email.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre y correo electrónico');
      return;
    }

    try {
      setLoading(true);

      // Generar número de ticket
      const ticket = `REP-${Date.now().toString(36).toUpperCase()}`;
      
      // Aquí iría la llamada al API
      // await api.post('/api/reportes', { ... });

      // Simulamos envío exitoso
      await new Promise(resolve => setTimeout(resolve, 1500));

      setTicketNumber(ticket);
      setEnviado(true);

    } catch (error) {
      console.log('Error enviando reporte:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito
  if (enviado) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          
          <Text style={styles.successTitle}>¡Reporte Enviado!</Text>
          <Text style={styles.successSubtitle}>
            Tu solicitud ha sido registrada y será revisada por nuestro equipo
          </Text>

          <View style={styles.ticketCard}>
            <Text style={styles.ticketLabel}>Número de Ticket</Text>
            <Text style={styles.ticketNumber}>{ticketNumber}</Text>
            <Text style={styles.ticketHint}>Guarda este número para dar seguimiento</Text>
          </View>

          <View style={styles.tiempoCard}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <View style={styles.tiempoContent}>
              <Text style={styles.tiempoTitle}>Tiempo de respuesta</Text>
              <Text style={styles.tiempoText}>5-10 días hábiles</Text>
            </View>
          </View>

          <Text style={styles.notaText}>
            Recibirás una notificación por correo electrónico cuando tu caso sea revisado.
          </Text>

          <TouchableOpacity
            style={styles.volverBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.volverBtnText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="flag" size={40} color="#F59E0B" />
          </View>
          <Text style={styles.title}>Reportar Error en Multa</Text>
          <Text style={styles.subtitle}>
            Si encontraste un error en los datos de tu multa, repórtalo aquí
          </Text>
        </View>

        {/* Folio de la multa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Folio de la Multa</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text" size={22} color={COLORS.gray[400]} />
            <TextInput
              style={styles.textInput}
              placeholder="Ej: MUL-2024-001234"
              placeholderTextColor="#9CA3AF"
              value={folio}
              onChangeText={setFolio}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Tipo de error */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Error</Text>
          <View style={styles.tiposGrid}>
            {tiposError.map((tipo) => (
              <TouchableOpacity
                key={tipo.id}
                style={[
                  styles.tipoCard,
                  tipoError === tipo.id && styles.tipoCardSelected
                ]}
                onPress={() => setTipoError(tipo.id)}
              >
                <Ionicons
                  name={tipo.icon}
                  size={24}
                  color={tipoError === tipo.id ? COLORS.primary : '#6B7280'}
                />
                <Text style={[
                  styles.tipoLabel,
                  tipoError === tipo.id && styles.tipoLabelSelected
                ]}>
                  {tipo.label}
                </Text>
                <Text style={styles.tipoDesc}>{tipo.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción del Error</Text>
          <Text style={styles.sectionHint}>
            Explica detalladamente cuál es el error y por qué consideras que es incorrecto
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe el problema con todos los detalles posibles..."
            placeholderTextColor="#9CA3AF"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {descripcion.length}/500 caracteres (mínimo 20)
          </Text>
        </View>

        {/* Evidencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidencias (Opcional)</Text>
          <Text style={styles.sectionHint}>
            Adjunta fotos o documentos que respalden tu reporte
          </Text>

          <View style={styles.evidenciasContainer}>
            {evidencias.map((uri, index) => (
              <View key={index} style={styles.evidenciaItem}>
                <Image source={{ uri }} style={styles.evidenciaImage} />
                <TouchableOpacity
                  style={styles.removeEvidenciaBtn}
                  onPress={() => removeEvidencia(index)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {evidencias.length < 5 && (
              <View style={styles.addEvidenciaButtons}>
                <TouchableOpacity style={styles.addEvidenciaBtn} onPress={pickImage}>
                  <Ionicons name="images" size={24} color={COLORS.primary} />
                  <Text style={styles.addEvidenciaText}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addEvidenciaBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color={COLORS.primary} />
                  <Text style={styles.addEvidenciaText}>Cámara</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Datos de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de Contacto</Text>
          
          <Text style={styles.inputLabel}>Nombre completo</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color={COLORS.gray[400]} />
            <TextInput
              style={styles.textInput}
              placeholder="Tu nombre"
              placeholderTextColor="#9CA3AF"
              value={contacto.nombre}
              onChangeText={(text) => setContacto({...contacto, nombre: text})}
            />
          </View>

          <Text style={styles.inputLabel}>Correo electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={COLORS.gray[400]} />
            <TextInput
              style={styles.textInput}
              placeholder="tu@email.com"
              placeholderTextColor="#9CA3AF"
              value={contacto.email}
              onChangeText={(text) => setContacto({...contacto, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>Teléfono (opcional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={20} color={COLORS.gray[400]} />
            <TextInput
              style={styles.textInput}
              placeholder="10 dígitos"
              placeholderTextColor="#9CA3AF"
              value={contacto.telefono}
              onChangeText={(text) => setContacto({...contacto, telefono: text})}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Aviso */}
        <View style={styles.avisoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.avisoText}>
            Al enviar este reporte, un agente de tránsito revisará tu caso. 
            Recibirás una respuesta en tu correo electrónico en un plazo de 5 a 10 días hábiles.
          </Text>
        </View>

        {/* Botón enviar */}
        <TouchableOpacity
          style={[styles.enviarBtn, loading && styles.enviarBtnDisabled]}
          onPress={enviarReporte}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.enviarBtnText}>Enviar Reporte</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  sectionHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 5,
    marginTop: 10,
  },
  tiposGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tipoCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  tipoCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  tipoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  tipoLabelSelected: {
    color: COLORS.primary,
  },
  tipoDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 3,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 5,
  },
  evidenciasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  evidenciaItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
  },
  evidenciaImage: {
    width: '100%',
    height: '100%',
  },
  removeEvidenciaBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  addEvidenciaButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addEvidenciaBtn: {
    width: 80,
    height: 80,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addEvidenciaText: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 5,
  },
  avisoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    gap: 12,
    alignItems: 'flex-start',
  },
  avisoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  enviarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 15,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  enviarBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  enviarBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
  },
  ticketCard: {
    backgroundColor: '#EEF2FF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  ticketLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  ticketNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'monospace',
    marginVertical: 8,
  },
  ticketHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tiempoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  tiempoContent: {
    flex: 1,
  },
  tiempoTitle: {
    fontSize: 14,
    color: '#92400E',
  },
  tiempoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  notaText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  volverBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  volverBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
