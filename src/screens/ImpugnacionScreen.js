import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import Button from '../components/Button';
import Input from '../components/Input';

export default function ImpugnacionScreen({ navigation, route }) {
  const folioInicial = route.params?.folio || '';
  const [tipo, setTipo] = useState(null);
  const [folio, setFolio] = useState(folioInicial);
  const [motivo, setMotivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const motivos = [
    { id: 'error_datos', label: 'Error en los datos de la multa' },
    { id: 'no_infraccion', label: 'No cometí la infracción' },
    { id:  'vehiculo_robado', label: 'Vehículo robado en esa fecha' },
    { id: 'error_placa', label: 'La placa no corresponde a mi vehículo' },
    { id: 'otro', label: 'Otro motivo' },
  ];

  const enviarSolicitud = async () => {
    if (!folio. trim()) {
      Alert.alert('Error', 'Ingresa el folio de la multa');
      return;
    }
    if (!motivo) {
      Alert. alert('Error', 'Selecciona un motivo');
      return;
    }
    if (!descripcion. trim()) {
      Alert.alert('Error', 'Describe tu situación');
      return;
    }

    setLoading(true);

    // Simular envío
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '✅ Solicitud Enviada',
        `Tu solicitud de ${tipo === 'impugnacion' ? 'impugnación' :  'regularización'} ha sido recibida.\n\nFolio de seguimiento: IMP-${Date.now().toString(36).toUpperCase()}\n\nRecibirás una respuesta en un plazo de 5 a 10 días hábiles. `,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 2000);
  };

  // Pantalla de selección de tipo
  if (! tipo) {
    return (
      <ScrollView style={styles. container}>
        <View style={styles.card}>
          <Ionicons name="document-text-outline" size={60} color={COLORS.primary} />
          <Text style={styles.title}>¿Qué deseas hacer?</Text>
          <Text style={styles.subtitle}>
            Selecciona el tipo de solicitud que deseas realizar
          </Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setTipo('impugnacion')}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={30} color="#EF4444" />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Impugnar Multa</Text>
              <Text style={styles.optionDesc}>
                Si consideras que la multa fue aplicada incorrectamente
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setTipo('regularizacion')}
          >
            <View style={[styles. optionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="card" size={30} color="#3B82F6" />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Regularización de Pago</Text>
              <Text style={styles.optionDesc}>
                Solicita un plan de pagos o prórrogas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setTipo('error')}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="warning" size={30} color="#F59E0B" />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles. optionTitle}>Reportar Error en Datos</Text>
              <Text style={styles.optionDesc}>
                Corregir información incorrecta en tu multa
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.infoCardContent}>
            <Text style={styles. infoCardTitle}>Información Importante</Text>
            <Text style={styles.infoCardText}>
              • El tiempo de respuesta es de 5 a 10 días hábiles{'\n'}
              • Puedes adjuntar evidencias fotográficas{'\n'}
              • Recibirás notificaciones por correo electrónico
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Pantalla de formulario
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setTipo(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>
          {tipo === 'impugnacion' && '📋 Solicitud de Impugnación'}
          {tipo === 'regularizacion' && '💳 Regularización de Pago'}
          {tipo === 'error' && '⚠️ Reportar Error en Datos'}
        </Text>

        <Input
          label="Folio de la multa"
          placeholder="Ej: MUL-ABC123"
          value={folio}
          onChangeText={setFolio}
          autoCapitalize="characters"
          icon={<Ionicons name="document-text-outline" size={20} color={COLORS.gray[400]} />}
        />

        <Text style={styles.label}>Motivo de la solicitud</Text>
        {motivos.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.motivoBtn, motivo === m.id && styles.motivoBtnActivo]}
            onPress={() => setMotivo(m.id)}
          >
            <Ionicons
              name={motivo === m.id ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={motivo === m. id ? COLORS. primary : COLORS. gray[400]}
            />
            <Text style={[styles.motivoText, motivo === m.id && styles.motivoTextActivo]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Descripción detallada</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Explica tu situación con el mayor detalle posible..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <View style={styles.adjuntarBox}>
          <TouchableOpacity style={styles.adjuntarBtn}>
            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            <Text style={styles.adjuntarText}>Adjuntar fotos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles. adjuntarBtn}>
            <Ionicons name="document-attach-outline" size={24} color={COLORS.primary} />
            <Text style={styles.adjuntarText}>Adjuntar documentos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Al enviar esta solicitud, aceptas que la información proporcionada es verídica y puede ser verificada. 
          </Text>
        </View>

        <Button
          title="Enviar Solicitud"
          onPress={enviarSolicitud}
          loading={loading}
          icon={<Ionicons name="send" size={20} color="#fff" />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  {
    flex:  1,
    backgroundColor: '#F3F4F6',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 16,
    padding:  20,
    ... SHADOWS.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color:  '#6B7280',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 25,
  },
  optionCard:  {
    flexDirection: 'row',
    alignItems:  'center',
    backgroundColor: '#F9FAFB',
    padding:  15,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  optionIcon:  {
    width:  50,
    height:  50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight:  'bold',
    color: '#1F2937',
  },
  optionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop:  2,
  },
  infoCard:  {
    backgroundColor:  '#EFF6FF',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  infoCardText: {
    fontSize: 12,
    color:  '#1E40AF',
    marginTop: 5,
    lineHeight: 18,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 15,
  },
  backText: {
    color: COLORS.primary,
    fontSize:  16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom:  20,
  },
  label:  {
    fontSize:  14,
    fontWeight: '600',
    color:  COLORS.gray[700],
    marginBottom: 10,
    marginTop: 15,
  },
  motivoBtn:  {
    flexDirection: 'row',
    alignItems:  'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    gap: 10,
  },
  motivoBtnActivo: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  motivoText:  {
    fontSize:  14,
    color: '#4B5563',
  },
  motivoTextActivo: {
    color:  COLORS.primary,
    fontWeight: '600',
  },
  textArea:  {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding:  15,
    fontSize: 16,
    minHeight: 120,
  },
  adjuntarBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  adjuntarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor:  '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  adjuntarText: {
    color:  COLORS.primary,
    fontSize: 14,
  },
  infoBox:  {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#1E40AF',
    fontSize: 13,
  },
});