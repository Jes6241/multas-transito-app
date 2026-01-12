import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function CorralanScreen({ navigation }) {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehiculo, setVehiculo] = useState(null);

  const buscarVehiculo = async () => {
    if (!placa.trim()) {
      Alert.alert('Error', 'Ingresa el número de placa');
      return;
    }

    setLoading(true);
    setVehiculo(null);

    // Simulación de búsqueda
    setTimeout(() => {
      setLoading(false);
      // Datos de ejemplo
      setVehiculo({
        placa: placa. toUpperCase(),
        enCorralon: Math.random() > 0.5,
        ubicacion: 'Corralón Municipal Norte',
        direccion: 'Av. Principal #1234, Col. Centro',
        telefono: '555-123-4567',
        fechaIngreso: '2025-12-05',
        diasEstancia: 4,
        montoAdeudo: 2500,
        montoCorralon: 800,
        estatusPago: 'pendiente',
        motivoRemision: 'Estacionamiento prohibido',
        folioRemision: 'REM-2025-001234',
      });
    }, 1500);
  };

  const abrirMapa = () => {
    const url = 'https://maps.google.com/? q=Corralon+Municipal';
    Linking. openURL(url);
  };

  const llamarCorralon = () => {
    Linking.openURL('tel:5551234567');
  };

  const solicitarLiberacion = () => {
    Alert.alert(
      'Solicitar Liberación',
      '¿Deseas iniciar el proceso de liberación vehicular?\n\nDeberás realizar el pago de la multa y los gastos de corralón.',
      [
        { text:  'Cancelar', style: 'cancel' },
        { 
          text: 'Continuar', 
          onPress: () => navigation.navigate('PagarMulta', { 
            multa: { 
              folio: vehiculo.folioRemision,
              monto_final: vehiculo.montoAdeudo + vehiculo.montoCorralon
            }
          })
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchCard}>
        <Ionicons name="car-sport" size={50} color={COLORS.primary} />
        <Text style={styles.title}>Consultar Corralón</Text>
        <Text style={styles.subtitle}>
          Verifica si tu vehículo se encuentra en el corralón y su estatus
        </Text>

        <Input
          placeholder="Ingresa número de placa"
          value={placa}
          onChangeText={setPlaca}
          autoCapitalize="characters"
          icon={<Ionicons name="car" size={20} color={COLORS.gray[400]} />}
        />

        <Button
          title="Buscar Vehículo"
          onPress={buscarVehiculo}
          loading={loading}
          icon={<Ionicons name="search" size={20} color="#fff" />}
        />
      </View>

      {vehiculo && (
        <>
          {vehiculo.enCorralon ? (
            <View style={styles.resultCard}>
              <View style={styles.alertBanner}>
                <Ionicons name="warning" size={24} color="#fff" />
                <Text style={styles. alertText}>Vehículo en Corralón</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Información del Vehículo</Text>
                
                <View style={styles.infoRow}>
                  <Ionicons name="car" size={18} color={COLORS.gray[500]} />
                  <Text style={styles.infoLabel}>Placa:</Text>
                  <Text style={styles. infoValue}>{vehiculo.placa}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="document-text" size={18} color={COLORS.gray[500]} />
                  <Text style={styles.infoLabel}>Folio Remisión:</Text>
                  <Text style={styles.infoValue}>{vehiculo.folioRemision}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.gray[500]} />
                  <Text style={styles.infoLabel}>Motivo: </Text>
                  <Text style={styles.infoValue}>{vehiculo.motivoRemision}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={18} color={COLORS.gray[500]} />
                  <Text style={styles.infoLabel}>Fecha Ingreso:</Text>
                  <Text style={styles.infoValue}>{vehiculo.fechaIngreso}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time" size={18} color={COLORS. gray[500]} />
                  <Text style={styles.infoLabel}>Días Estancia:</Text>
                  <Text style={styles. infoValue}>{vehiculo.diasEstancia} días</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Ubicación del Corralón</Text>
                <Text style={styles.ubicacionNombre}>{vehiculo.ubicacion}</Text>
                <Text style={styles.ubicacionDir}>{vehiculo.direccion}</Text>
                
                <View style={styles.botonesUbicacion}>
                  <TouchableOpacity style={styles.btnUbicacion} onPress={abrirMapa}>
                    <Ionicons name="map" size={20} color={COLORS.primary} />
                    <Text style={styles.btnUbicacionText}>Ver en Mapa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnUbicacion} onPress={llamarCorralon}>
                    <Ionicons name="call" size={20} color={COLORS.primary} />
                    <Text style={styles.btnUbicacionText}>Llamar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles. adeudoSection}>
                <Text style={styles. adeudoTitle}>Adeudo Total</Text>
                <View style={styles. adeudoRow}>
                  <Text style={styles. adeudoLabel}>Multa:</Text>
                  <Text style={styles.adeudoMonto}>${vehiculo.montoAdeudo. toLocaleString('es-MX')}</Text>
                </View>
                <View style={styles.adeudoRow}>
                  <Text style={styles.adeudoLabel}>Gastos Corralón ({vehiculo.diasEstancia} días):</Text>
                  <Text style={styles.adeudoMonto}>${vehiculo.montoCorralon.toLocaleString('es-MX')}</Text>
                </View>
                <View style={[styles.adeudoRow, styles. adeudoTotal]}>
                  <Text style={styles.adeudoTotalLabel}>Total a pagar:</Text>
                  <Text style={styles. adeudoTotalMonto}>
                    ${(vehiculo.montoAdeudo + vehiculo.montoCorralon).toLocaleString('es-MX')}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  title="Solicitar Liberación"
                  onPress={solicitarLiberacion}
                  icon={<Ionicons name="key" size={20} color="#fff" />}
                />

                <Button
                  title="Descargar Comprobante"
                  variant="outline"
                  onPress={() => Alert.alert('PDF', 'Generando comprobante.. .')}
                  style={{ marginTop: 10 }}
                  icon={<Ionicons name="download-outline" size={20} color={COLORS.primary} />}
                />
              </View>
            </View>
          ) : (
            <View style={styles.noCorralon}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
              <Text style={styles.noCorralanTitle}>¡Tu vehículo no está en corralón!</Text>
              <Text style={styles.noCorralanText}>
                El vehículo con placa {vehiculo. placa} no se encuentra registrado en ningún corralón. 
              </Text>
            </View>
          )}
        </>
      )}

      {/* Info adicional */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles. infoCardContent}>
          <Text style={styles.infoCardTitle}>Información Importante</Text>
          <Text style={styles.infoCardText}>
            • El costo por día de resguardo es de $200 MXN{'\n'}
            • Horario de liberación:  Lun-Vie 8:00-18:00{'\n'}
            • Documentos requeridos: INE, tarjeta de circulación{'\n'}
            • El pago debe realizarse antes de la liberación
          </Text>
        </View>
      </View>

      <View style={{ height: 30 }} />
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
    padding: 20,
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
    margin:  15,
    marginTop: 0,
    borderRadius: 16,
    overflow: 'hidden',
    ... SHADOWS.medium,
  },
  alertBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  alertText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle:  {
    fontSize:  16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom:  15,
  },
  infoRow:  {
    flexDirection: 'row',
    alignItems:  'center',
    marginBottom: 10,
    gap: 10,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 14,
    width: 100,
  },
  infoValue:  {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  ubicacionNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  ubicacionDir: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  botonesUbicacion: {
    flexDirection:  'row',
    marginTop: 15,
    gap: 15,
  },
  btnUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnUbicacionText: {
    color:  COLORS.primary,
    fontWeight: '600',
  },
  adeudoSection: {
    backgroundColor: '#FEF2F2',
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  adeudoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color:  '#991B1B',
    marginBottom: 10,
  },
  adeudoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adeudoLabel: {
    color: '#7F1D1D',
    fontSize: 14,
  },
  adeudoMonto:  {
    color:  '#7F1D1D',
    fontSize:  14,
    fontWeight: '600',
  },
  adeudoTotal: {
    borderTopWidth: 1,
    borderTopColor: '#FCA5A5',
    paddingTop:  10,
    marginTop: 5,
  },
  adeudoTotalLabel: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adeudoTotalMonto: {
    color: '#991B1B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionButtons: {
    padding: 20,
    paddingTop: 0,
  },
  noCorralon: {
    backgroundColor: '#ECFDF5',
    margin: 15,
    marginTop: 0,
    borderRadius: 16,
    padding:  30,
    alignItems: 'center',
    ... SHADOWS.medium,
  },
  noCorralanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065F46',
    marginTop: 15,
    textAlign: 'center',
  },
  noCorralanText: {
    fontSize: 14,
    color:  '#047857',
    textAlign: 'center',
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    margin: 15,
    borderRadius: 12,
    padding:  15,
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
    color: '#1E40AF',
    marginTop: 5,
    lineHeight: 18,
  },
});