import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../config/api';

export default function PagarMultaScreen({ route, navigation }) {
  const { multa } = route.params;
  const [metodoPago, setMetodoPago] = useState(null);
  const [loading, setLoading] = useState(false);

  const metodosPago = [
    { id:  'tarjeta', nombre:  '💳 Tarjeta de Crédito/Débito' },
    { id: 'transferencia', nombre:  '🏦 Transferencia Bancaria' },
    { id: 'efectivo', nombre: '💵 Pago en Efectivo (OXXO)' },
  ];

  const procesarPago = async () => {
    if (!metodoPago) {
      Alert.alert('Error', 'Selecciona un método de pago');
      return;
    }

    setLoading(true);
    try {
      const resultado = await api.procesarPago(multa.id, metodoPago);
      
      Alert.alert(
        '✅ Pago Exitoso',
        `Tu pago de $${multa.monto} ha sido procesado correctamente.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo procesar el pago.  Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💳 Pagar Multa</Text>

      <View style={styles. resumenCard}>
        <Text style={styles.resumenLabel}>Folio:  {multa.folio}</Text>
        <Text style={styles.resumenMonto}>${multa.monto}</Text>
      </View>

      <Text style={styles.subtitle}>Selecciona método de pago:</Text>

      {metodosPago. map((metodo) => (
        <TouchableOpacity
          key={metodo.id}
          style={[
            styles.metodoCard,
            metodoPago === metodo.id && styles.metodoSeleccionado,
          ]}
          onPress={() => setMetodoPago(metodo.id)}
        >
          <Text style={[
            styles.metodoText,
            metodoPago === metodo. id && styles.metodoTextSeleccionado,
          ]}>
            {metodo. nombre}
          </Text>
          {metodoPago === metodo.id && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.pagarButton, ! metodoPago && styles. pagarButtonDisabled]}
        onPress={procesarPago}
        disabled={loading || !metodoPago}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.pagarButtonText}>Confirmar Pago</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet. create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  resumenCard:  {
    backgroundColor:  '#007AFF',
    padding: 20,
    borderRadius:  12,
    alignItems: 'center',
    marginBottom: 25,
  },
  resumenLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  resumenMonto: {
    color: '#fff',
    fontSize:  36,
    fontWeight: 'bold',
  },
  subtitle:  {
    fontSize:  16,
    color:  '#666',
    marginBottom: 15,
  },
  metodoCard:  {
    backgroundColor:  '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metodoSeleccionado: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  metodoText: {
    fontSize: 16,
    color: '#333',
  },
  metodoTextSeleccionado: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkmark:  {
    fontSize: 20,
    color:  '#007AFF',
    fontWeight: 'bold',
  },
  pagarButton:  {
    backgroundColor:  '#51cf66',
    padding: 18,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
  },
  pagarButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pagarButtonText: {
    color: '#fff',
    fontSize:  18,
    fontWeight: 'bold',
  },
});