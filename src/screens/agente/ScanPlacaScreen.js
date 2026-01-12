import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function ScanPlacaScreen({ navigation }) {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState(null);
  const [consultado, setConsultado] = useState(false);

  const consultarPlaca = async () => {
    if (!placa. trim()) {
      Alert.alert('Error', 'Ingresa el número de placa');
      return;
    }

    const placaLimpia = placa. toUpperCase().trim();
    setLoading(true);
    setConsultado(false);

    try {
      // Consultar historial del vehículo
      const response = await fetch(`${API_URL}/api/vehiculos/${placaLimpia}/historial`);
      const data = await response.json();

      if (data.success) {
        setHistorial(data);
      } else {
        setHistorial({ 
          encontrado: false, 
          placa: placaLimpia,
          multas: [], 
          total: 0, 
          pendientes: 0, 
          montoTotal: 0 
        });
      }
      setConsultado(true);
    } catch (error) {
      console.error('Error consultando:', error);
      setHistorial({ 
        encontrado: false, 
        placa: placaLimpia,
        multas: [], 
        total: 0, 
        pendientes: 0, 
        montoTotal: 0,
        error: true 
      });
      setConsultado(true);
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setPlaca('');
    setHistorial(null);
    setConsultado(false);
  };

  const irAMultar = () => {
    navigation.navigate('LevantarMulta', { placaPrecargada: placa. toUpperCase() });
  };

  const irAParquimetro = () => {
    navigation.navigate('VerificarParquimetro', { placaPrecargada: placa.toUpperCase() });
  };

  const irAGrua = () => {
    navigation.navigate('SolicitarGrua', { placaPrecargada: placa.toUpperCase() });
  };

  return (
    <ScrollView style={styles. container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="search" size={50} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Consultar Vehículo</Text>
        <Text style={styles.headerSubtitle}>
          Ingresa la placa para ver el historial
        </Text>
      </View>

      {/* Input de placa */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Número de Placa</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="car" size={24} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="ABC-123"
            placeholderTextColor="#9CA3AF"
            value={placa}
            onChangeText={(text) => setPlaca(text. toUpperCase())}
            autoCapitalize="characters"
            maxLength={10}
            returnKeyType="search"
            onSubmitEditing={consultarPlaca}
          />
          {placa. length > 0 && (
            <TouchableOpacity onPress={limpiar}>
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnConsultar, ! placa.trim() && styles.btnDisabled]}
          onPress={consultarPlaca}
          disabled={loading || ! placa.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={22} color="#fff" />
              <Text style={styles.btnConsultarText}>Consultar Historial</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Resultado */}
      {consultado && historial && (
        <View style={styles.resultadoContainer}>
          {/* Placa consultada */}
          <View style={styles.placaCard}>
            <Ionicons name="car-sport" size={30} color="#fff" />
            <Text style={styles. placaValor}>{historial.placa || placa. toUpperCase()}</Text>
          </View>

          {/* Historial */}
          {historial.error ?  (
            <View style={styles.errorCard}>
              <Ionicons name="cloud-offline" size={50} color="#EF4444" />
              <Text style={styles.errorTitle}>Error de conexión</Text>
              <Text style={styles.errorText}>No se pudo consultar el historial</Text>
              <TouchableOpacity style={styles.reintentar} onPress={consultarPlaca}>
                <Ionicons name="refresh" size={20} color="#1E40AF" />
                <Text style={styles.reintentarText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : historial.total > 0 ?  (
            /* Tiene historial */
            <View style={styles.historialCard}>
              <View style={styles.historialHeader}>
                <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                <Text style={styles.historialTitle}>Vehículo con historial</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.statNumero}>{historial.total}</Text>
                  <Text style={styles.statLabel}>Multas Totales</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.statNumero}>{historial.pendientes}</Text>
                  <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles. statNumero}>
                    ${(historial.montoTotal || 0).toLocaleString()}
                  </Text>
                  <Text style={styles. statLabel}>Adeudo</Text>
                </View>
              </View>

              {historial.ultimaMulta && (
                <View style={styles.ultimaMulta}>
                  <Text style={styles. ultimaMultaLabel}>Última infracción: </Text>
                  <Text style={styles.ultimaMultaTipo}>{historial.ultimaMulta.tipo}</Text>
                  <Text style={styles.ultimaMultaFecha}>
                    {new Date(historial.ultimaMulta.fecha).toLocaleDateString('es-MX')}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* Sin historial */
            <View style={styles.sinHistorialCard}>
              <View style={styles.sinHistorialIcon}>
                <Ionicons name="checkmark-circle" size={60} color="#10B981" />
              </View>
              <Text style={styles.sinHistorialTitle}>Vehículo sin multas</Text>
              <Text style={styles.sinHistorialText}>
                No se encontraron infracciones registradas para esta placa
              </Text>
            </View>
          )}

          {/* Acciones */}
          <Text style={styles.accionesTitle}>¿Qué deseas hacer?</Text>
          <View style={styles.accionesGrid}>
            <TouchableOpacity style={styles.accionBtn} onPress={irAMultar}>
              <View style={[styles.accionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="document-text" size={30} color="#EF4444" />
              </View>
              <Text style={styles.accionText}>Levantar Multa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles. accionBtn} onPress={irAParquimetro}>
              <View style={[styles.accionIcon, { backgroundColor:  '#EDE9FE' }]}>
                <Ionicons name="time" size={30} color="#8B5CF6" />
              </View>
              <Text style={styles.accionText}>Parquímetro</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accionBtn} onPress={irAGrua}>
              <View style={[styles.accionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="car-sport" size={30} color="#3B82F6" />
              </View>
              <Text style={styles.accionText}>Solicitar Grúa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles. accionBtn} onPress={limpiar}>
              <View style={[styles. accionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="refresh" size={30} color="#10B981" />
              </View>
              <Text style={styles.accionText}>Nueva Consulta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet. create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#059669',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 90,
    height:  90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle:  {
    fontSize:  14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  inputCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: -20,
    padding:  20,
    borderRadius: 16,
    ... SHADOWS.medium,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal:  15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 15,
    paddingHorizontal: 10,
    letterSpacing: 3,
    color:  '#1F2937',
  },
  btnConsultar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 15,
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  btnConsultarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultadoContainer: {
    paddingHorizontal: 15,
  },
  placaCard: {
    backgroundColor: '#1E40AF',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 15,
  },
  placaValor: {
    color: '#fff',
    fontSize:  32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#991B1B',
    marginTop: 15,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    marginTop: 5,
  },
  reintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 5,
  },
  reintentarText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  historialCard: {
    backgroundColor: '#fff',
    padding:  20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#F59E0B',
    ... SHADOWS.small,
  },
  historialHeader:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  historialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color:  '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  ultimaMulta: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  ultimaMultaLabel: {
    fontSize: 12,
    color:  '#92400E',
  },
  ultimaMultaTipo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginTop: 4,
  },
  ultimaMultaFecha: {
    fontSize: 12,
    color:  '#92400E',
    marginTop: 2,
  },
  sinHistorialCard: {
    backgroundColor: '#D1FAE5',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  sinHistorialIcon: {
    marginBottom: 15,
  },
  sinHistorialTitle:  {
    fontSize:  20,
    fontWeight: 'bold',
    color: '#065F46',
  },
  sinHistorialText: {
    fontSize: 14,
    color:  '#047857',
    textAlign: 'center',
    marginTop: 8,
  },
  accionesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  accionesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  accionBtn:  {
    width: '47%',
    backgroundColor: '#fff',
    padding:  20,
    borderRadius: 16,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  accionIcon:  {
    width: 60,
    height:  60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  accionText:  {
    fontSize:  14,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
});