import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../config/theme';
import { API_URL } from '../../config/api';

export default function MisVehiculosScreen({ navigation }) {
  const { user } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    placa: '',
    alias: '',
  });
  const [agregando, setAgregando] = useState(false);

  const cargarVehiculos = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${user?.id}/vehiculos`);
      const data = await response.json();
      if (data.success) {
        setVehiculos(data.vehiculos || []);
      }
    } catch (error) {
      console.log('Error cargando vehículos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    cargarVehiculos();
  }, [cargarVehiculos]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarVehiculos();
  };

  const agregarVehiculo = async () => {
    if (!nuevoVehiculo.placa || nuevoVehiculo.placa.length < 5) {
      Alert.alert('Error', 'Ingresa una placa válida');
      return;
    }

    setAgregando(true);
    try {
      const response = await fetch(`${API_URL}/api/usuarios/${user?.id}/vehiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placa: nuevoVehiculo.placa.toUpperCase(),
          alias: nuevoVehiculo.alias || null,
        }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert('✅ Vehículo Agregado', 'Ahora recibirás notificaciones de multas para esta placa.');
        setModalVisible(false);
        setNuevoVehiculo({ placa: '', alias: '' });
        cargarVehiculos();
      } else {
        Alert.alert('Error', data.message || 'No se pudo agregar el vehículo');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setAgregando(false);
    }
  };

  const eliminarVehiculo = (vehiculo) => {
    Alert.alert(
      'Eliminar Vehículo',
      `¿Deseas eliminar ${vehiculo.alias || vehiculo.placa} de tu lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/api/usuarios/${user?.id}/vehiculos/${vehiculo.placa}`,
                { method: 'DELETE' }
              );
              const data = await response.json();
              if (data.success) {
                Alert.alert('✅ Eliminado', 'El vehículo fue eliminado de tu lista');
                cargarVehiculos();
              } else {
                Alert.alert('Error', data.error || 'No se pudo eliminar');
              }
            } catch (error) {
              console.log('Error eliminando:', error);
              Alert.alert('Error', 'No se pudo conectar con el servidor');
            }
          },
        },
      ]
    );
  };

  const verMultas = (placa) => {
    // Navegar a buscar multa con la placa pre-llenada
    navigation.navigate('BuscarMulta', { placaInicial: placa });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando vehículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Ionicons name="car-sport" size={40} color={COLORS.primary} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mis Vehículos</Text>
            <Text style={styles.headerSubtitle}>
              Registra tus placas para recibir alertas de multas
            </Text>
          </View>
        </View>

        {/* Lista de vehículos */}
        {vehiculos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="car-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Sin vehículos registrados</Text>
            <Text style={styles.emptyText}>
              Agrega tus placas para monitorear multas y recibir notificaciones
            </Text>
          </View>
        ) : (
          vehiculos.map((vehiculo, index) => (
            <View key={index} style={styles.vehiculoCard}>
              <View style={styles.vehiculoHeader}>
                <View style={styles.placaContainer}>
                  <Text style={styles.placaLabel}>PLACA</Text>
                  <Text style={styles.placaValue}>{vehiculo.placa}</Text>
                </View>
                {vehiculo.alias && (
                  <Text style={styles.aliasText}>{vehiculo.alias}</Text>
                )}
              </View>

              <View style={styles.vehiculoInfo}>
                {vehiculo.marca && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Marca:</Text>
                    <Text style={styles.infoValue}>{vehiculo.marca}</Text>
                  </View>
                )}
                {vehiculo.modelo && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Modelo:</Text>
                    <Text style={styles.infoValue}>{vehiculo.modelo}</Text>
                  </View>
                )}
                {vehiculo.color && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Color:</Text>
                    <Text style={styles.infoValue}>{vehiculo.color}</Text>
                  </View>
                )}
              </View>

              {/* Estado de multas */}
              <View style={styles.estadoContainer}>
                {vehiculo.multas_pendientes > 0 ? (
                  <View style={styles.alertaBadge}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.alertaText}>
                      {vehiculo.multas_pendientes} multa{vehiculo.multas_pendientes > 1 ? 's' : ''} pendiente{vehiculo.multas_pendientes > 1 ? 's' : ''}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.okBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.okText}>Sin multas pendientes</Text>
                  </View>
                )}
              </View>

              {/* Acciones */}
              <View style={styles.vehiculoActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => verMultas(vehiculo.placa)}
                >
                  <Ionicons name="search" size={18} color={COLORS.primary} />
                  <Text style={styles.actionBtnText}>Ver Multas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => eliminarVehiculo(vehiculo)}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Beneficios de registrar tus vehículos</Text>
          <Text style={styles.tipsText}>
            • Notificaciones automáticas de nuevas multas{'\n'}
            • Alertas de vencimiento de pago{'\n'}
            • Descuentos por pronto pago{'\n'}
            • Historial completo de infracciones
          </Text>
        </View>
      </ScrollView>

      {/* Botón flotante para agregar */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal para agregar vehículo */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Vehículo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Número de Placa *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: ABC-123"
              value={nuevoVehiculo.placa}
              onChangeText={(text) => setNuevoVehiculo({ ...nuevoVehiculo, placa: text.toUpperCase() })}
              autoCapitalize="characters"
              maxLength={10}
            />

            <Text style={styles.inputLabel}>Alias (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Mi carro, Auto de mamá"
              value={nuevoVehiculo.alias}
              onChangeText={(text) => setNuevoVehiculo({ ...nuevoVehiculo, alias: text })}
            />

            <TouchableOpacity
              style={[styles.submitBtn, agregando && styles.submitBtnDisabled]}
              onPress={agregarVehiculo}
              disabled={agregando}
            >
              {agregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Agregar Vehículo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  headerContent: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  vehiculoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.medium,
  },
  vehiculoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placaContainer: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  placaLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  placaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  aliasText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  vehiculoInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    width: 60,
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  estadoContainer: {
    marginBottom: 12,
  },
  alertaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  alertaText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  okBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  okText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  vehiculoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  actionBtnDanger: {
    flex: 0,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
