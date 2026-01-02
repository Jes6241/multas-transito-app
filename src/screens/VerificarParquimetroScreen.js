import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function VerificarParquimetroScreen({ navigation }) {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const verificarParquimetro = async () => {
    if (!placa.trim()) {
      Alert.alert('Error', 'Ingresa el número de placa');
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const response = await fetch(`${API_URL}/api/parquimetros/${placa. toUpperCase()}`);
      const data = await response.json();

      if (data.success) {
        setResultado(data);
      } else {
        Alert.alert('Error', data.error || 'No se pudo verificar');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const irAMulta = () => {
    navigation.navigate('LevantarMulta', {
      placaPrecargada: placa. toUpperCase(),
      infraccionPrecargada:  'parquimetro',
    });
  };

  const irAPedirGrua = () => {
    navigation.navigate('SolicitarGrua', {
      placaPrecargada: placa. toUpperCase(),
      motivoPrecargado: 'Tiempo de parquímetro expirado',
    });
  };

  const limpiar = () => {
    setPlaca('');
    setResultado(null);
  };

  return (
    <ScrollView style={styles. container}>
      {/* Header */}
      <View style={styles. header}>
        <View style={styles.iconContainer}>
          <Ionicons name="time" size={50} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Verificar Parquímetro</Text>
        <Text style={styles.headerSubtitle}>
          Consulta el tiempo de estacionamiento
        </Text>
      </View>

      {/* Input de placa */}
      <View style={styles.card}>
        <Text style={styles.label}>Número de Placa</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="car" size={24} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Ej: ABC-123"
            value={placa}
            onChangeText={(text) => setPlaca(text. toUpperCase())}
            autoCapitalize="characters"
            maxLength={10}
          />
          {placa. length > 0 && (
            <TouchableOpacity onPress={limpiar}>
              <Ionicons name="close-circle" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.btnVerificar, ! placa.trim() && styles.btnDisabled]}
          onPress={verificarParquimetro}
          disabled={loading || !placa.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.btnVerificarText}>Verificar Tiempo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Resultado */}
      {resultado && (
        <View style={styles. resultadoContainer}>
          {! resultado.encontrado ? (
            // No encontrado
            <View style={styles.cardNoEncontrado}>
              <Ionicons name="help-circle" size={60} color="#F59E0B" />
              <Text style={styles.noEncontradoTitle}>Sin Registro</Text>
              <Text style={styles. noEncontradoText}>
                No se encontró pago de parquímetro para la placa{'\n'}
                <Text style={styles. placaDestacada}>{resultado.placa}</Text>
              </Text>

              <View style={styles.accionesContainer}>
                <TouchableOpacity style={styles.btnMulta} onPress={irAMulta}>
                  <Ionicons name="document-text" size={24} color="#fff" />
                  <Text style={styles.btnAccionText}>Levantar Multa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles. btnGrua} onPress={irAPedirGrua}>
                  <Ionicons name="car-sport" size={24} color="#fff" />
                  <Text style={styles.btnAccionText}>Pedir Grúa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : resultado.expirado ? (
            // Expirado
            <View style={styles.cardExpirado}>
              <View style={styles.estatusBadge}>
                <Ionicons name="close-circle" size={70} color="#DC2626" />
                <Text style={styles.estatusExpirado}>TIEMPO EXPIRADO</Text>
              </View>

              <View style={styles.tiempoDestacado}>
                <Text style={styles.tiempoLabel}>Expiró hace</Text>
                <Text style={styles. tiempoExpiradoValor}>{resultado.tiempo_expirado}</Text>
                <Text style={styles.tiempoSubtitle}>
                  ({resultado.tiempo_expirado_min} minutos)
                </Text>
              </View>

              <View style={styles. infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="car" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Placa: </Text>
                  <Text style={styles.infoValue}>{resultado.placa}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Zona:</Text>
                  <Text style={styles. infoValue}>{resultado.zona}</Text>
                </View>
                {resultado.ubicacion && (
                  <View style={styles. infoRow}>
                    <Ionicons name="navigate" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Ubicación: </Text>
                    <Text style={styles.infoValue}>{resultado.ubicacion}</Text>
                  </View>
                )}
                <View style={styles. infoRow}>
                  <Ionicons name="alarm" size={20} color="#EF4444" />
                  <Text style={styles.infoLabel}>Venció:</Text>
                  <Text style={[styles.infoValue, styles.textoRojo]}>
                    {new Date(resultado.hora_fin).toLocaleTimeString('es-MX', {
                      hour:  '2-digit',
                      minute:  '2-digit',
                    })} hrs
                  </Text>
                </View>
              </View>

              <View style={styles.accionesContainer}>
                <TouchableOpacity style={styles. btnMulta} onPress={irAMulta}>
                  <Ionicons name="document-text" size={24} color="#fff" />
                  <Text style={styles.btnAccionText}>Levantar Multa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGrua} onPress={irAPedirGrua}>
                  <Ionicons name="car-sport" size={24} color="#fff" />
                  <Text style={styles.btnAccionText}>Pedir Grúa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Vigente
            <View style={styles.cardVigente}>
              <View style={styles.estatusBadge}>
                <Ionicons name="checkmark-circle" size={70} color="#10B981" />
                <Text style={styles.estatusVigente}>TIEMPO VIGENTE</Text>
              </View>

              <View style={styles.tiempoDestacado}>
                <Text style={styles.tiempoLabel}>Tiempo Restante</Text>
                <Text style={styles. tiempoVigenteValor}>{resultado.tiempo_restante}</Text>
                <Text style={styles.tiempoSubtitle}>
                  ({resultado. tiempo_restante_min} minutos)
                </Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles. infoRow}>
                  <Ionicons name="car" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Placa:</Text>
                  <Text style={styles. infoValue}>{resultado.placa}</Text>
                </View>
                <View style={styles. infoRow}>
                  <Ionicons name="location" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Zona:</Text>
                  <Text style={styles.infoValue}>{resultado.zona}</Text>
                </View>
                {resultado. ubicacion && (
                  <View style={styles.infoRow}>
                    <Ionicons name="navigate" size={20} color="#6B7280" />
                    <Text style={styles.infoLabel}>Ubicación:</Text>
                    <Text style={styles.infoValue}>{resultado. ubicacion}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="cash" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Pagó:</Text>
                  <Text style={styles.infoValue}>
                    ${resultado.monto_pagado} ({resultado.tiempo_pagado} min)
                  </Text>
                </View>
                <View style={styles. infoRow}>
                  <Ionicons name="alarm" size={20} color="#10B981" />
                  <Text style={styles.infoLabel}>Vence:</Text>
                  <Text style={[styles.infoValue, styles.textoVerde]}>
                    {new Date(resultado.hora_fin).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} hrs
                  </Text>
                </View>
              </View>

              <View style={styles.mensajeOk}>
                <Ionicons name="shield-checkmark" size={24} color="#065F46" />
                <Text style={styles.mensajeOkText}>
                  El vehículo tiene tiempo vigente.  No requiere acción.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius:  30,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color:  '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color:  'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    ... SHADOWS.medium,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor:  '#E5E7EB',
  },
  input:  {
    flex:  1,
    fontSize: 22,
    fontWeight: 'bold',
    paddingVertical: 15,
    paddingHorizontal:  10,
    letterSpacing: 2,
  },
  btnVerificar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:  COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 15,
  },
  btnDisabled:  {
    backgroundColor:  '#9CA3AF',
  },
  btnVerificarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultadoContainer: {
    paddingHorizontal:  15,
  },
  cardNoEncontrado: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding:  25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    ... SHADOWS.medium,
  },
  noEncontradoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#92400E',
    marginTop: 10,
  },
  noEncontradoText: {
    fontSize: 14,
    color:  '#92400E',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  placaDestacada: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardExpirado: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor:  '#DC2626',
    ...SHADOWS.medium,
  },
  cardVigente: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding:  20,
    borderWidth: 2,
    borderColor: '#10B981',
    ...SHADOWS.medium,
  },
  estatusBadge: {
    alignItems: 'center',
    marginBottom: 15,
  },
  estatusExpirado: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#991B1B',
    marginTop: 10,
  },
  estatusVigente:  {
    fontSize:  22,
    fontWeight: 'bold',
    color: '#065F46',
    marginTop: 10,
  },
  tiempoDestacado: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding:  20,
    alignItems: 'center',
    marginBottom: 15,
  },
  tiempoLabel:  {
    fontSize:  14,
    color: '#6B7280',
  },
  tiempoExpiradoValor: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  tiempoVigenteValor:  {
    fontSize:  50,
    fontWeight: 'bold',
    color: '#059669',
    fontFamily: 'monospace',
  },
  tiempoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius:  12,
    padding:  15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color:  '#6B7280',
    width: 70,
  },
  infoValue:  {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  textoRojo: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  textoVerde: {
    color: '#059669',
    fontWeight: 'bold',
  },
  accionesContainer: {
    flexDirection:  'row',
    gap: 10,
    marginTop: 20,
  },
  btnMulta:  {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    padding: 15,
    borderRadius:  12,
    gap: 8,
  },
  btnGrua: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  btnAccionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mensajeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A7F3D0',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    gap: 10,
  },
  mensajeOkText: {
    flex: 1,
    color: '#065F46',
    fontSize: 14,
    fontWeight:  '500',
  },
});