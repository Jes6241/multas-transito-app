import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function BuscarFolioScreen({ navigation }) {
  const { user } = useAuth();
  const [folio, setFolio] = useState('');
  const [loading, setLoading] = useState(false);
  const [multa, setMulta] = useState(null);

  const buscarFolio = async () => {
    if (!folio. trim()) {
      Alert.alert('Error', 'Ingresa un número de folio');
      return;
    }

    setLoading(true);
    setMulta(null);

    try {
      const response = await fetch(`${API_URL}/api/multas/folio/${folio. trim().toUpperCase()}`);
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
        Alert. alert('Aviso', 'Esta multa ya está asociada a tu cuenta');
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
    <ScrollView style={styles.container}>
      <View style={styles. searchCard}>
        <Ionicons name="receipt-outline" size={50} color={COLORS.primary} />
        <Text style={styles.title}>Buscar por Folio</Text>
        <Text style={styles.subtitle}>
          Ingresa el número de folio de tu boleta de infracción
        </Text>

        <Input
          placeholder="Ej: MUL-ABC123"
          value={folio}
          onChangeText={setFolio}
          autoCapitalize="characters"
          icon={<Ionicons name="document-text-outline" size={20} color={COLORS.gray[400]} />}
        />

        <Button
          title="Buscar Multa"
          onPress={buscarFolio}
          loading={loading}
          icon={<Ionicons name="search" size={20} color="#fff" />}
        />
      </View>

      {multa && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultFolio}>{multa.folio}</Text>
            <View style={[
              styles.estatusBadge,
              { backgroundColor: multa.estatus === 'pendiente' ? '#FEF3C7' :  '#D1FAE5' }
            ]}>
              <Text style={[
                styles.estatusText,
                { color: multa. estatus === 'pendiente' ? '#F59E0B' : '#10B981' }
              ]}>
                {multa.estatus}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="car" size={18} color={COLORS.gray[500]} />
            <Text style={styles. infoLabel}>Placa: </Text>
            <Text style={styles. infoValue}>{multa.vehiculos?. placa || multa.placa || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="alert-circle" size={18} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Infracción:</Text>
            <Text style={styles.infoValue}>{multa.tipo_infraccion || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={COLORS. gray[500]} />
            <Text style={styles.infoLabel}>Ubicación:</Text>
            <Text style={styles.infoValue}>{multa.direccion || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={18} color={COLORS. gray[500]} />
            <Text style={styles.infoLabel}>Fecha: </Text>
            <Text style={styles. infoValue}>
              {new Date(multa.created_at).toLocaleDateString('es-MX')}
            </Text>
          </View>

          <View style={styles.montoContainer}>
            <Text style={styles.montoLabel}>Monto a pagar:</Text>
            <Text style={styles.montoValue}>
              ${parseFloat(multa.monto_final || 0).toLocaleString('es-MX')}
            </Text>
            {multa.descuento > 0 && (
              <Text style={styles.descuentoText}>
                Incluye {multa. descuento}% de descuento
              </Text>
            )}
          </View>

          <View style={styles.lineaCapturaContainer}>
            <Text style={styles. lineaCapturaLabel}>Línea de captura:</Text>
            <Text style={styles.lineaCaptura}>{multa.linea_captura || 'N/A'}</Text>
          </View>

          {/* Botón para asociar multa */}
          <Button
            title="Agregar a mi cuenta"
            onPress={asociarMulta}
            icon={<Ionicons name="add-circle" size={20} color="#fff" />}
            variant="secondary"
          />

          {multa. estatus === 'pendiente' && (
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
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:  '#F3F4F6',
  },
  searchCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 16,
    padding:  20,
    alignItems: 'center',
    ... SHADOWS.medium,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
  },
  subtitle:  {
    fontSize:  14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 16,
    padding:  20,
    ... SHADOWS.medium,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:  'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth:  1,
    borderBottomColor:  '#E5E7EB',
  },
  resultFolio:  {
    fontSize:  20,
    fontWeight: 'bold',
    color:  COLORS.primary,
  },
  estatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estatusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoRow:  {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoLabel:  {
    color: '#6B7280',
    fontSize: 14,
    width: 80,
  },
  infoValue:  {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  montoContainer:  {
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
});