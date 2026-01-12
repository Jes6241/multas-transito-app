import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

export default function BuscarMultaScreen({ navigation }) {
  const { user } = useAuth();
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [multas, setMultas] = useState([]);

  const buscar = async () => {
    if (!placa.trim()) {
      Alert.alert('Error', 'Por favor ingresa una placa');
      return;
    }

    setLoading(true);
    try {
      const resultado = await api.buscarPorPlaca(placa. toUpperCase());
      
      if (resultado.success && resultado. multas) {
        setMultas(resultado. multas);
        if (resultado.multas.length === 0) {
          Alert.alert('Info', 'No se encontraron multas para esta placa');
        }
      } else {
        setMultas([]);
        Alert.alert('Info', 'No se encontraron multas');
      }
    } catch (error) {
      console. error(error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Función para asociar multa al usuario
  const asociarMulta = async (multa) => {
    try {
      const multasGuardadas = await AsyncStorage.getItem(`multas_${user?.id}`);
      const multasUsuario = multasGuardadas ? JSON. parse(multasGuardadas) : [];

      const yaExiste = multasUsuario.some(m => m.folio === multa. folio);
      if (yaExiste) {
        Alert.alert('Aviso', 'Esta multa ya está en tu cuenta');
        return;
      }

      multasUsuario.push(multa);
      await AsyncStorage. setItem(`multas_${user?.id}`, JSON.stringify(multasUsuario));

      Alert.alert('✅ Multa Agregada', 'La multa se agregó a tu cuenta');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la multa');
    }
  };

  const renderMulta = ({ item }) => (
    <View style={styles.multaCard}>
      <View style={styles.multaHeader}>
        <Text style={styles.multaFolio}>Folio: {item. folio}</Text>
        <Text style={[
          styles.estado,
          { backgroundColor: item.estatus === 'pendiente' ? '#FEF3C7' : '#D1FAE5',
            color: item.estatus === 'pendiente' ? '#F59E0B' :  '#10B981' }
        ]}>
          {item. estatus?. toUpperCase()}
        </Text>
      </View>
      <Text style={styles.multaInfo}>📅 Fecha: {new Date(item. created_at).toLocaleDateString('es-MX')}</Text>
      <Text style={styles.multaInfo}>🚗 Placa: {item. vehiculos?.placa || item.placa}</Text>
      <Text style={styles. multaInfo}>📍 {item.tipo_infraccion || 'Infracción'}</Text>
      <Text style={styles.multaMonto}>💰 ${parseFloat(item.monto_final || 0).toLocaleString('es-MX')}</Text>
      
      <View style={styles. botonesContainer}>
        <TouchableOpacity
          style={styles.agregarBtn}
          onPress={() => asociarMulta(item)}
        >
          <Ionicons name="add-circle" size={18} color="#fff" />
          <Text style={styles.agregarBtnText}>Agregar a mi cuenta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.verBtn}
          onPress={() => navigation.navigate('DetalleMulta', { multa: item })}
        >
          <Ionicons name="eye" size={18} color="#4F46E5" />
          <Text style={styles.verBtnText}>Ver detalle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Buscar por Placa</Text>

      <TextInput
        style={styles. input}
        placeholder="Ingresa la placa (ej: ABC-123)"
        value={placa}
        onChangeText={setPlaca}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={buscar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Buscar</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={multas}
        renderItem={renderMulta}
        keyExtractor={(item, index) => item.id?. toString() || index.toString()}
        style={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          ! loading && (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={50} color="#D1D5DB" />
              <Text style={styles.emptyText}>Ingresa una placa para buscar multas</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign:  'center',
    color: '#1F2937',
  },
  input:  {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:  '#E5E7EB',
    marginBottom: 15,
    fontSize:  16,
  },
  button:  {
    backgroundColor:  '#4F46E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize:  16,
    fontWeight: 'bold',
  },
  lista:  {
    marginTop: 20,
  },
  multaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation:  3,
  },
  multaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  multaFolio: {
    fontWeight: 'bold',
    fontSize:  16,
    color:  '#1F2937',
  },
  estado: {
    paddingHorizontal:  10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  multaInfo: {
    color: '#6B7280',
    marginBottom: 4,
  },
  multaMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginTop: 8,
  },
  botonesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  agregarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  agregarBtnText:  {
    color:  '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  verBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  verBtnText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText:  {
    color:  '#9CA3AF',
    marginTop: 10,
  },
});