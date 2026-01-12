import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';
import { offlineService } from '../../config/offlineService';
import Button from '../../components/Button';
import Loading from '../../components/Loading';

export default function MultasOfflineScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [multas, setMultas] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    cargarMultas();
  }, []);

  const cargarMultas = async () => {
    const online = await offlineService.isOnline();
    setIsOnline(online);

    const multasOffline = await offlineService.obtenerMultasOffline();
    setMultas(multasOffline);
    setLoading(false);
  };

  const sincronizar = async () => {
    if (! isOnline) {
      Alert.alert('Sin conexión', 'No hay conexión a internet para sincronizar');
      return;
    }

    setSyncing(true);
    const resultado = await offlineService.sincronizarMultas();
    setSyncing(false);

    const exitosas = resultado.resultados?.filter(r => r.success).length || 0;
    const fallidas = resultado.resultados?.filter(r => !r.success) || [];

    if (exitosas > 0 && fallidas.length === 0) {
      Alert.alert(
        '✅ Sincronización Completa',
        `Multas sincronizadas: ${exitosas}`
      );
      cargarMultas();
    } else if (exitosas > 0 && fallidas.length > 0) {
      // Algunas éxitosas, algunas fallidas
      const errores = fallidas.map(f => `• ${f.placa}: ${f.error}`).join('\n');
      Alert.alert(
        '⚠️ Sincronización Parcial',
        `Sincronizadas: ${exitosas}\nCon errores: ${fallidas.length}\n\nErrores:\n${errores}`
      );
      cargarMultas();
    } else if (fallidas.length > 0) {
      // Todas fallaron
      const errores = fallidas.map(f => `• ${f.placa}: ${f.error}`).join('\n');
      Alert.alert(
        '❌ Error de Sincronización',
        `No se pudieron sincronizar las multas.\n\nErrores:\n${errores}`
      );
    } else {
      Alert.alert('Info', resultado.message || 'No hay multas para sincronizar');
    }
  };

  const eliminarMulta = (id_temporal) => {
    Alert.alert(
      'Eliminar Multa',
      '¿Estás seguro de eliminar esta multa?  Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await offlineService.eliminarMultaOffline(id_temporal);
            cargarMultas();
          },
        },
      ]
    );
  };

  const renderMulta = ({ item }) => (
    <View style={styles.multaCard}>
      <View style={styles.multaHeader}>
        <View style={styles.placaContainer}>
          <Ionicons name="car" size={20} color={COLORS.primary} />
          <Text style={styles. placa}>{item.placa}</Text>
        </View>
        <View style={styles.pendienteBadge}>
          <Ionicons name="cloud-offline" size={14} color="#F59E0B" />
          <Text style={styles.pendienteText}>Pendiente</Text>
        </View>
      </View>

      <Text style={styles.infraccion}>{item.tipo_infraccion}</Text>

      <View style={styles. multaInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.direccion || 'Sin ubicación'}
          </Text>
        </View>
        <View style={styles. infoItem}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            {new Date(item.fecha_guardado).toLocaleDateString('es-MX')}
          </Text>
        </View>
      </View>

      <View style={styles.multaFooter}>
        <Text style={styles.monto}>
          ${parseFloat(item.monto || 0).toLocaleString('es-MX')}
        </Text>
        <TouchableOpacity
          style={styles.eliminarBtn}
          onPress={() => eliminarMulta(item.id_temporal)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {item.fotos && item.fotos.length > 0 && (
        <View style={styles.fotosIndicador}>
          <Ionicons name="camera" size={14} color="#6B7280" />
          <Text style={styles.fotosText}>{item.fotos.length} foto(s)</Text>
        </View>
      )}
    </View>
  );

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      {/* Header de conexión */}
      <View style={[
        styles.connectionBanner,
        { backgroundColor: isOnline ? '#D1FAE5' : '#FEF3C7' }
      ]}>
        <Ionicons
          name={isOnline ? 'wifi' : 'wifi-outline'}
          size={20}
          color={isOnline ? '#10B981' : '#F59E0B'}
        />
        <Text style={[
          styles.connectionText,
          { color: isOnline ?  '#065F46' : '#92400E' }
        ]}>
          {isOnline ? 'Conectado a internet' : 'Sin conexión a internet'}
        </Text>
      </View>

      {/* Resumen */}
      <View style={styles.resumen}>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNumero}>{multas.length}</Text>
          <Text style={styles. resumenLabel}>Multas pendientes</Text>
        </View>
      </View>

      {/* Botón sincronizar */}
      {multas.length > 0 && (
        <View style={styles.syncContainer}>
          <Button
            title={syncing ? 'Sincronizando...' : `Sincronizar ${multas.length} multa(s)`}
            onPress={sincronizar}
            loading={syncing}
            disabled={! isOnline}
            icon={<Ionicons name="cloud-upload" size={20} color="#fff" />}
            style={! isOnline && styles.btnDisabled}
          />
          {! isOnline && (
            <Text style={styles.syncWarning}>
              Conecta a internet para sincronizar
            </Text>
          )}
        </View>
      )}

      {/* Lista de multas */}
      <FlatList
        data={multas}
        renderItem={renderMulta}
        keyExtractor={(item) => item.id_temporal}
        contentContainerStyle={styles. lista}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            <Text style={styles.emptyTitle}>¡Todo sincronizado!</Text>
            <Text style={styles.emptyText}>
              No hay multas pendientes de sincronizar
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  connectionBanner: {
    flexDirection:  'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resumen: {
    backgroundColor: '#fff',
    margin: 15,
    padding:  20,
    borderRadius: 12,
    alignItems: 'center',
    ... SHADOWS.small,
  },
  resumenItem:  {
    alignItems: 'center',
  },
  resumenNumero: {
    fontSize: 36,
    fontWeight: 'bold',
    color:  COLORS.primary,
  },
  resumenLabel: {
    fontSize: 14,
    color:  '#6B7280',
  },
  syncContainer: {
    paddingHorizontal:  15,
    marginBottom: 10,
  },
  btnDisabled:  {
    opacity: 0.5,
  },
  syncWarning: {
    textAlign: 'center',
    color: '#F59E0B',
    fontSize: 12,
    marginTop: 5,
  },
  lista: {
    padding: 15,
    paddingTop: 5,
  },
  multaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ... SHADOWS.small,
  },
  multaHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  placaContainer:  {
    flexDirection: 'row',
    alignItems:  'center',
    gap: 8,
  },
  placa: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pendienteBadge: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal:  10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  pendienteText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  infraccion: {
    fontSize: 14,
    color:  '#4B5563',
    marginBottom: 10,
  },
  multaInfo: {
    gap: 5,
  },
  infoItem:  {
    flexDirection: 'row',
    alignItems:  'center',
    gap: 8,
  },
  infoText:  {
    fontSize:  13,
    color:  '#6B7280',
    flex: 1,
  },
  multaFooter: {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  monto: {
    fontSize: 20,
    fontWeight: 'bold',
    color:  COLORS.primary,
  },
  eliminarBtn: {
    padding: 8,
  },
  fotosIndicador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  fotosText:  {
    fontSize:  12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065F46',
    marginTop: 15,
  },
  emptyText:  {
    fontSize:  14,
    color:  '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
});