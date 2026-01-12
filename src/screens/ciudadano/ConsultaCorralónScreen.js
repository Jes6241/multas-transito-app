import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';
import { API_URL } from '../../config/api';
import { generarComprobantePagoPDF } from './pagar/comprobantePagoPDF';
import { TARIFAS_CORRALON, calcularCostosCorralon } from '../../config/corralon';

export default function ConsultaCorralónScreen({ navigation }) {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [vehiculo, setVehiculo] = useState(null);

  // Función para generar comprobante de liberación usando el formato unificado
  const generarComprobanteLiberacion = async () => {
    if (!vehiculo) return;
    
    setGenerandoPDF(true);
    
    try {
      // Construir objeto multa con los datos necesarios
      const multaData = {
        folio: vehiculo.folio_multa,
        placa: vehiculo.placa,
        monto: vehiculo.monto_multa,
        monto_pagado: vehiculo.total_adeudo,
        monto_final: vehiculo.total_adeudo,
        fecha_pago: vehiculo.fecha_pago || new Date().toISOString(),
        metodo_pago: vehiculo.metodo_pago || 'Tarjeta',
        referencia_pago: vehiculo.referencia_pago || `LIB-${Date.now().toString().substring(5)}`,
        linea_captura: vehiculo.linea_captura,
        fecha_infraccion: vehiculo.multa?.fecha_infraccion || vehiculo.fecha_infraccion,
        tipo_infraccion: vehiculo.multa?.tipo_infraccion || 'Infracción de tránsito',
        direccion: vehiculo.multa?.direccion || vehiculo.multa?.ubicacion || 'N/A',
        vehiculos: {
          placa: vehiculo.placa,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          color: vehiculo.color,
        },
      };

      // Construir datos del corralón
      const datosCorralon = {
        corralon_nombre: vehiculo.corralon_nombre,
        corralon_direccion: vehiculo.corralon_direccion,
        folio_remision: vehiculo.folio_remision,
        tarjeton_resguardo: vehiculo.tarjeton_resguardo,
        folio_multa: vehiculo.folio_multa,
        monto_multa: vehiculo.monto_multa,
        costo_grua: vehiculo.costo_grua,
        costo_pension_total: vehiculo.costo_pension_total,
        dias_estancia: vehiculo.dias_estancia,
      };

      await generarComprobantePagoPDF(multaData, datosCorralon);
    } catch (error) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el comprobante');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const buscarVehiculo = async () => {
    if (!placa.trim()) {
      Alert.alert('Error', 'Por favor ingresa una placa');
      return;
    }

    try {
      setLoading(true);
      setVehiculo(null);
      
      // Buscar vehículo en corralón por placa
      const response = await fetch(`${API_URL}/api/corralon/buscar-placa/${placa.toUpperCase()}`);
      const data = await response.json();
      
      if (data.success && data.vehiculo) {
        const vehiculoData = data.vehiculo;
        
        // Monto de la multa asociada
        const montoMulta = vehiculoData.multa?.monto_final || vehiculoData.multa?.monto || 0;
        
        // Usar tarifas del corralón si vienen del backend, sino usar las centralizadas
        const tarifasPersonalizadas = (vehiculoData.costo_grua || vehiculoData.costo_pension) ? {
          COSTO_GRUA: vehiculoData.costo_grua || TARIFAS_CORRALON.COSTO_GRUA,
          COSTO_PENSION_DIARIA: vehiculoData.costo_pension || TARIFAS_CORRALON.COSTO_PENSION_DIARIA,
          PRIMER_DIA_GRATIS: TARIFAS_CORRALON.PRIMER_DIA_GRATIS,
        } : null;
        
        // Calcular costos usando la función centralizada
        const costos = calcularCostosCorralon(
          vehiculoData.fecha_ingreso,
          montoMulta,
          tarifasPersonalizadas
        );
        
        setVehiculo({
          ...vehiculoData,
          // Datos del vehículo desde la multa
          placa: vehiculoData.multa?.vehiculos?.placa || placa.toUpperCase(),
          marca: vehiculoData.multa?.vehiculos?.marca || 'N/A',
          modelo: vehiculoData.multa?.vehiculos?.modelo || '',
          color: vehiculoData.multa?.vehiculos?.color || 'N/A',
          // Datos de la multa
          folio_multa: vehiculoData.multa?.folio || 'N/A',
          monto_multa: montoMulta,
          estatus_multa: vehiculoData.multa?.estatus || 'pendiente',
          linea_captura: vehiculoData.multa?.linea_captura || null,
          // Costos del corralón (desde función centralizada)
          dias_estancia: costos.diasEstancia,
          costo_grua: costos.costoGrua,
          costo_pension_diaria: costos.costoPensionDiaria,
          costo_pension_total: costos.costoPensionTotal,
          total_adeudo: costos.total,
          // Datos del corralón
          corralon_nombre: vehiculoData.corralones?.nombre || 'Corralón Municipal',
          corralon_direccion: vehiculoData.corralones?.direccion || vehiculoData.direccion_corralon,
          corralon_telefono: vehiculoData.corralones?.telefono || '(555) 123-4567',
        });
      } else {
        // No encontrado - mostrar mensaje positivo
        Alert.alert(
          '¡Buenas noticias!',
          'No se encontró ningún vehículo con esta placa en el corralón.',
          [{ text: 'Entendido' }]
        );
      }
    } catch (error) {
      console.log('Error buscando en corralón:', error);
      Alert.alert(
        'Error',
        'No se pudo conectar con el servidor. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getEstatusBadge = (estatus) => {
    const estatusConfig = {
      'resguardo': { color: '#F59E0B', bg: '#FEF3C7', texto: 'En Resguardo' },
      'liberado': { color: '#10B981', bg: '#D1FAE5', texto: 'Liberado' },
      'pendiente': { color: '#EF4444', bg: '#FEE2E2', texto: 'Pendiente Pago' },
    };
    return estatusConfig[estatus] || estatusConfig['resguardo'];
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={40} color="#EF4444" />
          </View>
          <Text style={styles.title}>Consulta de Corralón</Text>
          <Text style={styles.subtitle}>
            Verifica si tu vehículo fue remitido al corralón y conoce su ubicación
          </Text>
        </View>

        {/* Buscador */}
        <View style={styles.searchSection}>
          <Text style={styles.inputLabel}>Número de Placa</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="car" size={22} color={COLORS.gray[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Ej: ABC-123"
              placeholderTextColor="#9CA3AF"
              value={placa}
              onChangeText={(text) => setPlaca(text.toUpperCase())}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={buscarVehiculo}
            />
            {placa.length > 0 && (
              <TouchableOpacity onPress={() => setPlaca('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, (!placa.trim() || loading) && styles.searchButtonDisabled]}
            onPress={buscarVehiculo}
            disabled={!placa.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>Buscar Vehículo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Resultado */}
        {vehiculo && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultLabel}>Vehículo</Text>
                <Text style={styles.resultPlaca}>{vehiculo.placa}</Text>
              </View>
              <View style={[
                styles.estatusBadge,
                { backgroundColor: getEstatusBadge(vehiculo.estatus).bg }
              ]}>
                <Text style={[
                  styles.estatusText,
                  { color: getEstatusBadge(vehiculo.estatus).color }
                ]}>
                  {getEstatusBadge(vehiculo.estatus).texto}
                </Text>
              </View>
            </View>

            {/* Información del vehículo */}
            <View style={styles.vehiculoInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="car-sport" size={18} color={COLORS.gray[500]} />
                <Text style={styles.infoLabel}>Marca/Modelo:</Text>
                <Text style={styles.infoValue}>
                  {vehiculo.marca || 'N/A'} {vehiculo.modelo || ''}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="color-palette" size={18} color={COLORS.gray[500]} />
                <Text style={styles.infoLabel}>Color:</Text>
                <Text style={styles.infoValue}>{vehiculo.color || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color={COLORS.gray[500]} />
                <Text style={styles.infoLabel}>Fecha ingreso:</Text>
                <Text style={styles.infoValue}>
                  {vehiculo.fecha_ingreso 
                    ? new Date(vehiculo.fecha_ingreso).toLocaleDateString('es-MX')
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Ubicación del corralón */}
            <View style={styles.ubicacionCard}>
              <View style={styles.ubicacionHeader}>
                <Ionicons name="location" size={24} color="#EF4444" />
                <Text style={styles.ubicacionTitle}>Ubicación del Corralón</Text>
              </View>
              
              <Text style={styles.ubicacionNombre}>
                {vehiculo.corralon_nombre || 'Corralón Municipal #1'}
              </Text>
              <Text style={styles.ubicacionDireccion}>
                {vehiculo.corralon_direccion || 'Av. Tecnológico #500, Col. Centro'}
              </Text>

              <View style={styles.horarioContainer}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.horarioText}>
                  Horario de atención: Lun-Vie 8:00 - 18:00
                </Text>
              </View>

              <View style={styles.telefonoContainer}>
                <Ionicons name="call" size={16} color="#6B7280" />
                <Text style={styles.telefonoText}>
                  Tel: {vehiculo.corralon_telefono || '(555) 123-4567'}
                </Text>
              </View>
            </View>

            {/* Datos de identificación del vehículo en corralón */}
            <View style={styles.identificacionCard}>
              <View style={styles.identificacionHeader}>
                <Ionicons name="document-text" size={24} color="#2563EB" />
                <Text style={styles.identificacionTitle}>Datos para Recoger tu Vehículo</Text>
              </View>
              
              <Text style={styles.identificacionSubtitle}>
                Presenta estos datos en el corralón para ubicar tu vehículo:
              </Text>

              <View style={styles.identificacionRow}>
                <View style={styles.identificacionItem}>
                  <Text style={styles.identificacionLabel}>📋 Folio de Remisión</Text>
                  <Text style={styles.identificacionValue}>
                    {vehiculo.folio_remision || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.identificacionRow}>
                <View style={styles.identificacionItem}>
                  <Text style={styles.identificacionLabel}>🎫 Tarjetón de Resguardo</Text>
                  <Text style={styles.identificacionValue}>
                    {vehiculo.tarjeton_resguardo || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.identificacionRow}>
                <View style={styles.identificacionItem}>
                  <Text style={styles.identificacionLabel}>📄 Folio de Multa</Text>
                  <Text style={styles.identificacionValue}>
                    {vehiculo.folio_multa || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.identificacionNota}>
                <Ionicons name="information-circle" size={16} color="#1D4ED8" />
                <Text style={styles.identificacionNotaText}>
                  Al llegar al corralón, proporciona el folio de remisión o tarjetón para que localicen tu vehículo rápidamente.
                </Text>
              </View>
            </View>

            {/* Costos estimados */}
            <View style={styles.costosCard}>
              <Text style={styles.costosTitle}>💰 Desglose de Adeudo</Text>
              
              {/* Multa */}
              <View style={styles.costoRow}>
                <Text style={styles.costoLabel}>Multa (Folio: {vehiculo.folio_multa}):</Text>
                <Text style={styles.costoValue}>
                  ${parseFloat(vehiculo.monto_multa || 0).toLocaleString('es-MX')}
                </Text>
              </View>

              <View style={styles.costoRow}>
                <Text style={styles.costoLabel}>Servicio de grúa:</Text>
                <Text style={styles.costoValue}>
                  ${parseFloat(vehiculo.costo_grua || 1500).toLocaleString('es-MX')}
                </Text>
              </View>

              <View style={styles.costoRow}>
                <Text style={styles.costoLabel}>Pensión diaria:</Text>
                <Text style={styles.costoValue}>
                  ${parseFloat(vehiculo.costo_pension_diaria || 180).toLocaleString('es-MX')}/día
                </Text>
              </View>

              <View style={styles.costoRow}>
                <Text style={styles.costoLabel}>Días en corralón:</Text>
                <Text style={[styles.costoValue, { color: '#EF4444' }]}>
                  {vehiculo.dias_estancia} {vehiculo.dias_estancia === 1 ? 'día' : 'días'}
                </Text>
              </View>

              <View style={styles.costoRow}>
                <Text style={styles.costoLabel}>Subtotal pensión:</Text>
                <Text style={styles.costoValue}>
                  ${parseFloat(vehiculo.costo_pension_total || 0).toLocaleString('es-MX')}
                </Text>
              </View>

              <View style={styles.separador} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL A PAGAR:</Text>
                <Text style={styles.totalValue}>
                  ${parseFloat(vehiculo.total_adeudo || 0).toLocaleString('es-MX')}
                </Text>
              </View>

              <Text style={styles.advertencia}>
                ⚠️ El monto de pensión aumenta ${vehiculo.costo_pension_diaria || 180} MXN por cada día adicional
              </Text>
            </View>

            {/* Requisitos para liberar */}
            <View style={styles.requisitosCard}>
              <Text style={styles.requisitosTitle}>📋 Requisitos para Liberar</Text>
              
              <View style={styles.requisitoItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.requisitoText}>Identificación oficial (INE/IFE)</Text>
              </View>

              <View style={styles.requisitoItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.requisitoText}>Tarjeta de circulación original</Text>
              </View>

              <View style={styles.requisitoItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.requisitoText}>Comprobante de pago de multa(s)</Text>
              </View>

              <View style={styles.requisitoItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.requisitoText}>Pago de servicios de corralón</Text>
              </View>

              <View style={styles.requisitoItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.requisitoText}>Póliza de seguro vigente</Text>
              </View>
            </View>

            {/* Botón para pagar y liberar */}
            {vehiculo.estatus_multa === 'pendiente' ? (
              <TouchableOpacity
                style={styles.pagarBtn}
                onPress={() => {
                  // Navegar a pagar con la multa específica asociada al corralón
                  const multaAsociada = {
                    id: vehiculo.multa?.id,
                    folio: vehiculo.folio_multa,
                    placa: vehiculo.placa,
                    marca: vehiculo.marca,
                    modelo: vehiculo.modelo,
                    color: vehiculo.color,
                    monto: vehiculo.monto_multa,
                    monto_final: vehiculo.monto_multa,
                    tipo_infraccion: vehiculo.multa?.tipo_infraccion || 'Remisión a corralón',
                    estatus: vehiculo.estatus_multa,
                    linea_captura: vehiculo.linea_captura,
                    direccion: vehiculo.multa?.direccion || vehiculo.ubicacion,
                    created_at: vehiculo.multa?.created_at,
                    vehiculos: {
                      placa: vehiculo.placa,
                      marca: vehiculo.marca,
                      modelo: vehiculo.modelo,
                      color: vehiculo.color,
                    },
                  };
                  navigation.navigate('PagarMulta', { multa: multaAsociada });
                }}
              >
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.pagarBtnText}>
                  Pagar ${parseFloat(vehiculo.total_adeudo || 0).toLocaleString('es-MX')} y Liberar Vehículo
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.pagadoContainer}>
                <View style={styles.pagadoCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.pagadoText}>
                    ¡Pago completado! Presenta tu comprobante en el corralón para liberar tu vehículo
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.descargarBtn}
                  onPress={generarComprobanteLiberacion}
                  disabled={generandoPDF}
                >
                  {generandoPDF ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="download" size={20} color="#fff" />
                      <Text style={styles.descargarBtnText}>Descargar Comprobante de Liberación</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Info folio */}
            <View style={styles.folioInfo}>
              <Text style={styles.folioLabel}>Folio de multa asociado:</Text>
              <Text style={styles.folioValue}>{vehiculo.folio_multa}</Text>
              <Text style={styles.folioNota}>
                Solo puedes pagar el adeudo del corralón a través de esta multa
              </Text>
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>¿Tu auto fue remitido?</Text>
            <Text style={styles.infoText}>
              Si tu vehículo fue llevado al corralón, primero debes pagar las multas pendientes 
              y luego acudir personalmente con los documentos requeridos para liberarlo.
            </Text>
          </View>
        </View>

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
    backgroundColor: '#FEE2E2',
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
    paddingHorizontal: 10,
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
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
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
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultPlaca: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
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
  vehiculoInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 14,
    width: 100,
  },
  infoValue: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  ubicacionCard: {
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  ubicacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  ubicacionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  ubicacionNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  ubicacionDireccion: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 10,
  },
  horarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  horarioText: {
    fontSize: 13,
    color: '#6B7280',
  },
  telefonoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telefonoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  identificacionCard: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  identificacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  identificacionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  identificacionSubtitle: {
    fontSize: 13,
    color: '#3B82F6',
    marginBottom: 15,
  },
  identificacionRow: {
    marginBottom: 12,
  },
  identificacionItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  identificacionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  identificacionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    letterSpacing: 1,
  },
  identificacionNota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 5,
  },
  identificacionNotaText: {
    flex: 1,
    fontSize: 12,
    color: '#1D4ED8',
    lineHeight: 18,
  },
  costosCard: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  costosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 12,
  },
  costoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costoLabel: {
    fontSize: 14,
    color: '#78350F',
  },
  costoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350F',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
  separador: {
    height: 1,
    backgroundColor: '#FCD34D',
    marginVertical: 10,
  },
  advertencia: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  requisitosCard: {
    backgroundColor: '#ECFDF5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  requisitosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 12,
  },
  requisitoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requisitoText: {
    fontSize: 14,
    color: '#065F46',
  },
  pagarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 15,
  },
  pagarBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 15,
    borderRadius: 12,
    gap: 10,
    marginBottom: 10,
  },
  pagadoText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  pagadoContainer: {
    marginBottom: 15,
  },
  descargarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  descargarBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  folioInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  folioLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  folioValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  folioNota: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  verMultasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  verMultasBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding: 15,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 20,
  },
});
