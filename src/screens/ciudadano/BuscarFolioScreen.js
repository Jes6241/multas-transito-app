import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function BuscarFolioScreen({ navigation }) {
  const { user } = useAuth();
  const [folio, setFolio] = useState('');
  const [loading, setLoading] = useState(false);
  const [multa, setMulta] = useState(null);
  const inputRef = useRef(null);

  const buscarFolio = async () => {
    if (!folio.trim()) {
      Alert.alert('Error', 'Ingresa un número de folio');
      return;
    }

    setLoading(true);
    setMulta(null);

    try {
      const response = await fetch(`${API_URL}/api/multas/folio/${folio.trim().toUpperCase()}`);
      const data = await response.json();

      if (data.success && data.multa) {
        setMulta(data.multa);
      } else {
        Alert.alert('No encontrado', 'No se encontró ninguna multa con ese folio');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  // Función para asociar multa al usuario
  const asociarMulta = async () => {
    try {
      // Obtener multas guardadas del usuario
      const multasGuardadas = await AsyncStorage.getItem(`multas_${user?.id}`);
      const multas = multasGuardadas ? JSON.parse(multasGuardadas) : [];

      // Verificar si ya existe
      const yaExiste = multas.some(m => m.folio === multa.folio);
      if (yaExiste) {
        Alert.alert('Aviso', 'Esta multa ya está asociada a tu cuenta');
        return;
      }

      // Agregar la multa
      multas.push(multa);
      await AsyncStorage.setItem(`multas_${user?.id}`, JSON.stringify(multas));

      Alert.alert(
        '✅ Multa Asociada',
        'La multa se agregó a tu cuenta correctamente',
        [{ text: 'OK', onPress: () => navigation.navigate('Inicio') }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo asociar la multa');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header con icono */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Buscar por Folio</Text>
          <Text style={styles.subtitle}>
            Ingresa el número de folio que aparece en tu boleta de infracción
          </Text>
        </View>

        {/* Campo de búsqueda */}
        <View style={styles.searchSection}>
          <Text style={styles.inputLabel}>Número de Folio</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ej: MUL-2026-001234"
              placeholderTextColor="#9CA3AF"
              value={folio}
              onChangeText={setFolio}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={buscarFolio}
            />
            {folio.length > 0 && (
              <TouchableOpacity onPress={() => setFolio('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={buscarFolio}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="search" size={22} color="#fff" />
            )}
            <Text style={styles.searchButtonText}>
              {loading ? 'Buscando...' : 'Buscar Multa'}
            </Text>
          </TouchableOpacity>
        </View>

      {multa && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.resultLabel}>Folio de Multa</Text>
              <Text style={styles.resultFolio}>{multa.folio}</Text>
            </View>
            <View style={[
              styles.estatusBadge,
              { backgroundColor: multa.estatus === 'pendiente' ? '#FEF3C7' : '#D1FAE5' }
            ]}>
              <Text style={[
                styles.estatusText,
                { color: multa.estatus === 'pendiente' ? '#F59E0B' : '#10B981' }
              ]}>
                {multa.estatus === 'pendiente' ? 'Pendiente' : 'Pagada'}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="car" size={20} color={COLORS.primary} />
              <Text style={styles.infoItemLabel}>Placa</Text>
              <Text style={styles.infoItemValue}>{multa.vehiculos?.placa || multa.placa || 'N/A'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.infoItemLabel}>Fecha</Text>
              <Text style={styles.infoItemValue}>
                {new Date(multa.created_at).toLocaleDateString('es-MX')}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="alert-circle" size={18} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Infracción:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{multa.tipo_infraccion || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Ubicación:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{multa.direccion || 'N/A'}</Text>
          </View>

          <View style={styles.montoContainer}>
            <Text style={styles.montoLabel}>Monto a pagar</Text>
            <Text style={styles.montoValue}>
              ${parseFloat(multa.monto_final || multa.monto || 0).toLocaleString('es-MX')}
            </Text>
            {multa.descuento > 0 && (
              <Text style={styles.descuentoText}>
                Incluye {multa.descuento}% de descuento
              </Text>
            )}
          </View>

          {multa.linea_captura && (
            <View style={styles.lineaCapturaContainer}>
              <Text style={styles.lineaCapturaLabel}>Línea de captura:</Text>
              <Text style={styles.lineaCaptura}>{multa.linea_captura}</Text>
            </View>
          )}

          {/* Botones de acción */}
          <View style={styles.actionsContainer}>
            {user && (
              <Button
                title="Agregar a mi cuenta"
                onPress={asociarMulta}
                icon={<Ionicons name="add-circle" size={20} color="#fff" />}
                variant="secondary"
              />
            )}

            {multa.estatus === 'pendiente' && (
              <Button
                title="Pagar esta multa"
                onPress={() => navigation.navigate('PagarMulta', { multa })}
                icon={<Ionicons name="card" size={20} color="#fff" />}
                style={{ marginTop: 10 }}
              />
            )}

            <Button
              title="Ver detalles completos"
              variant="outline"
              onPress={() => navigation.navigate('DetalleMulta', { multa })}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      )}

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
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  searchSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 52,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: 1,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultFolio: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  estatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoItemLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  montoContainer: {
    backgroundColor: '#EEF2FF',
    padding: 15,
    borderRadius: 12,
    marginVertical: 15,
    alignItems: 'center',
  },
  montoLabel: {
    color: '#4F46E5',
    fontSize: 14,
  },
  montoValue: {
    color: '#4F46E5',
    fontSize: 32,
    fontWeight: 'bold',
  },
  descuentoText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 5,
  },
  lineaCapturaContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  lineaCapturaLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  lineaCaptura: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  actionsContainer: {
    marginTop: 5,
  },
});