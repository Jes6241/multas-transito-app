import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';

const NUMEROS_EMERGENCIA = {
  policia: '911',
  central: '5555555555', // Número de central de tránsito (cambiar)
};

export default function EmergenciaScreen({ navigation }) {
  const { user } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [location, setLocation] = useState(null);
  const [alertaEnviada, setAlertaEnviada] = useState(false);

  useEffect(() => {
    obtenerUbicacion();
  }, []);

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc. coords);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  };

  const enviarAlertaEmergencia = async () => {
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    setEnviando(true);

    try {
      // Aquí enviarías la alerta al servidor/central
      // Por ahora simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 2000));

      setAlertaEnviada(true);

      Alert.alert(
        '🚨 Alerta Enviada',
        `Se ha notificado a la central de emergencias.\n\nUbicación: ${location ?  `${location.latitude. toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Obteniendo.. .'}\n\nMantén la calma, la ayuda está en camino. `,
        [{ text: 'Entendido' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la alerta.  Llama al 911.');
    } finally {
      setEnviando(false);
    }
  };

  const llamar = (numero) => {
    Linking.openURL(`tel:${numero}`);
  };

  const confirmarEmergencia = () => {
    Vibration.vibrate(100);
    
    Alert.alert(
      '🚨 CONFIRMAR EMERGENCIA',
      '¿Estás seguro de que necesitas ayuda inmediata?\n\nEsto notificará a la central y enviará tu ubicación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'SÍ, NECESITO AYUDA',
          style: 'destructive',
          onPress: enviarAlertaEmergencia,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="warning" size={50} color="#fff" />
        <Text style={styles. headerTitle}>Emergencia</Text>
        <Text style={styles.headerSubtitle}>
          Usa este botón solo en caso de peligro real
        </Text>
      </View>

      {/* Botón principal de emergencia */}
      <View style={styles.mainButtonContainer}>
        <TouchableOpacity
          style={[styles.emergencyButton, alertaEnviada && styles.emergencyButtonSent]}
          onPress={confirmarEmergencia}
          disabled={enviando}
          onLongPress={enviarAlertaEmergencia}
          delayLongPress={1500}
        >
          {enviando ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : alertaEnviada ?  (
            <>
              <Ionicons name="checkmark-circle" size={80} color="#fff" />
              <Text style={styles.emergencyButtonText}>ALERTA ENVIADA</Text>
            </>
          ) : (
            <>
              <Ionicons name="alert-circle" size={80} color="#fff" />
              <Text style={styles. emergencyButtonText}>EMERGENCIA</Text>
              <Text style={styles.emergencyButtonHint}>
                Mantén presionado 2 segundos
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Ubicación actual */}
      <View style={styles. ubicacionCard}>
        <Ionicons name="location" size={24} color="#1E40AF" />
        <View style={styles.ubicacionInfo}>
          <Text style={styles.ubicacionLabel}>Tu ubicación actual</Text>
          {location ?  (
            <Text style={styles.ubicacionCoords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.ubicacionCoords}>Obteniendo...</Text>
          )}
        </View>
        <TouchableOpacity onPress={obtenerUbicacion}>
          <Ionicons name="refresh" size={24} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      {/* Botones de llamada directa */}
      <Text style={styles.llamadasTitle}>Llamadas Directas</Text>
      
      <View style={styles.llamadasContainer}>
        <TouchableOpacity
          style={[styles.llamadaBtn, { backgroundColor: '#DC2626' }]}
          onPress={() => llamar(NUMEROS_EMERGENCIA.policia)}
        >
          <Ionicons name="call" size={30} color="#fff" />
          <Text style={styles.llamadaBtnText}>911</Text>
          <Text style={styles.llamadaBtnLabel}>Emergencias</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles. llamadaBtn, { backgroundColor: '#1E40AF' }]}
          onPress={() => llamar(NUMEROS_EMERGENCIA.central)}
        >
          <Ionicons name="radio" size={30} color="#fff" />
          <Text style={styles.llamadaBtnText}>Central</Text>
          <Text style={styles. llamadaBtnLabel}>Tránsito</Text>
        </TouchableOpacity>
      </View>

      {/* Información del agente */}
      <View style={styles.agenteInfo}>
        <Text style={styles.agenteLabel}>Agente en servicio: </Text>
        <Text style={styles. agenteNombre}>{user?. nombre || 'Usuario'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header:  {
    backgroundColor:  '#DC2626',
    padding: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  mainButtonContainer:  {
    flex: 1,
    justifyContent:  'center',
    alignItems: 'center',
    padding: 30,
  },
  emergencyButton: {
    width: 220,
    height:  220,
    borderRadius: 110,
    backgroundColor:  '#DC2626',
    justifyContent: 'center',
    alignItems:  'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation:  10,
    borderWidth: 5,
    borderColor: '#FCA5A5',
  },
  emergencyButtonSent:  {
    backgroundColor:  '#059669',
    borderColor: '#6EE7B7',
    shadowColor: '#059669',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emergencyButtonHint:  {
    color:  'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop:  8,
  },
  ubicacionCard:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    margin: 15,
    padding:  15,
    borderRadius: 12,
    gap: 12,
  },
  ubicacionInfo:  {
    flex:  1,
  },
  ubicacionLabel: {
    fontSize: 12,
    color:  '#1E40AF',
  },
  ubicacionCoords: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginTop: 2,
  },
  llamadasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 15,
    marginBottom: 10,
  },
  llamadasContainer: {
    flexDirection:  'row',
    paddingHorizontal:  15,
    gap: 10,
  },
  llamadaBtn: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  llamadaBtnText: {
    color: '#fff',
    fontSize:  24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  llamadaBtnLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  agenteInfo: {
    padding: 20,
    alignItems: 'center',
  },
  agenteLabel: {
    fontSize: 12,
    color:  '#6B7280',
  },
  agenteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
});