import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';
import Button from '../../components/Button';

// Importar el generador de PDF de boleta de infracción
import { generarPDF as generarBoletaPDF } from '../agente/utils/pdfGenerator';
// Importar el generador de comprobante de pago
import { generarComprobantePagoPDF } from './pagar/comprobantePagoPDF';

export default function DetalleMultaScreen({ route, navigation }) {
  const { multa } = route.params;
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // ✅ Función para obtener la placa de cualquier fuente
  const obtenerPlaca = () => {
    if (multa?.vehiculos?.placa) return multa.vehiculos.placa;
    if (multa?.vehiculo?.placa) return multa.vehiculo.placa;
    if (multa?.Vehiculo?.placa) return multa.Vehiculo.placa;
    if (multa?.Vehiculos?.placa) return multa.Vehiculos.placa;
    if (multa?.placa) return multa.placa;
    return 'N/A';
  };

  const placa = obtenerPlaca();

  // ✅ Generar el PDF de la boleta de infracción oficial
  const generarComprobantePDF = async () => {
    setGenerandoPDF(true);
    try {
      // Preparar datos de la multa para el generador de PDF
      const datosParaPDF = {
        ...multa,
        placa: placa,
        vehiculo: {
          placa: placa,
          marca: multa.vehiculos?.marca || multa.vehiculo?.marca || 'N/A',
          modelo: multa.vehiculos?.modelo || multa.vehiculo?.modelo || 'N/A',
          color: multa.vehiculos?.color || multa.vehiculo?.color || 'N/A',
        },
        infraccion: multa.tipo_infraccion,
        monto: multa.monto || multa.monto_final,
        linea_captura: multa.linea_captura,
        fecha_vencimiento: multa.fecha_vencimiento || multa.vigencia_linea_captura,
        ubicacion: multa.direccion || multa.ubicacion || 'N/A',
        agente: {
          nombre: multa.agente_nombre || multa.agentes?.nombre || 'Agente de Tránsito',
          numero_placa: multa.agente_placa || multa.agentes?.numero_placa || 'N/A',
        },
      };

      await generarBoletaPDF(datosParaPDF);
    } catch (error) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el comprobante');
    } finally {
      setGenerandoPDF(false);
    }
  };

  // ✅ Generar comprobante de pago (cuando la multa está pagada)
  const descargarComprobantePago = async () => {
    setGenerandoPDF(true);
    try {
      await generarComprobantePagoPDF({
        ...multa,
        placa: placa,
      });
    } catch (error) {
      console.error('Error generando comprobante de pago:', error);
      Alert.alert('Error', 'No se pudo generar el comprobante de pago');
    } finally {
      setGenerandoPDF(false);
    }
  };

  // ✅ Función para navegar a PagarMulta con la placa incluida
  const irAPagar = () => {
    navigation.navigate('PagarMulta', {
      multa:  {
        ...multa,
        placa: placa, // ✅ Aseguramos que la placa esté incluida
      },
    });
  };

  // ✅ Función para navegar a Impugnación
  const irAImpugnar = () => {
    navigation.navigate('Impugnacion', {
      folio: multa.folio,
      multa: {
        ...multa,
        placa: placa,
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header con Estatus */}
      <View
        style={[
          styles.statusHeader,
          { backgroundColor: multa.estatus === 'pendiente' ? '#FEF3C7' : '#D1FAE5' },
        ]}
      >
        <Ionicons
          name={multa.estatus === 'pendiente' ?  'warning' : 'checkmark-circle'}
          size={40}
          color={multa.estatus === 'pendiente' ? '#F59E0B' :  '#10B981'}
        />
        <Text
          style={[
            styles.statusText,
            { color: multa.estatus === 'pendiente' ? '#92400E' : '#065F46' },
          ]}
        >
          {multa.estatus === 'pendiente' ? 'Multa Pendiente de Pago' : 'Multa Pagada'}
        </Text>
      </View>

      {/* Folio */}
      <View style={styles.card}>
        <View style={styles.folioContainer}>
          <Text style={styles.folioLabel}>Folio</Text>
          <Text style={styles.folio}>{multa.folio}</Text>
        </View>
      </View>

      {/* Información del Vehículo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información del Vehículo</Text>
        <View style={styles.infoRow}>
          <Ionicons name="car" size={20} color={COLORS.gray[500]} />
          <Text style={styles.infoLabel}>Placa:</Text>
          <Text style={[styles.infoValue, styles.placaDestacada]}>{placa}</Text>
        </View>
        {(multa.vehiculos?.marca || multa.vehiculo?.marca) && (
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Marca:</Text>
            <Text style={styles.infoValue}>
              {multa.vehiculos?.marca || multa.vehiculo?.marca}
            </Text>
          </View>
        )}
        {(multa.vehiculos?.modelo || multa.vehiculo?.modelo) && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Modelo: </Text>
            <Text style={styles.infoValue}>
              {multa.vehiculos?.modelo || multa.vehiculo?.modelo}
            </Text>
          </View>
        )}
        {(multa.vehiculos?.color || multa.vehiculo?.color) && (
          <View style={styles.infoRow}>
            <Ionicons name="color-palette" size={20} color={COLORS.gray[500]} />
            <Text style={styles.infoLabel}>Color:</Text>
            <Text style={styles.infoValue}>
              {multa.vehiculos?.color || multa.vehiculo?.color}
            </Text>
          </View>
        )}
      </View>

      {/* Detalles de la Infracción */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalles de la Infracción</Text>
        <View style={styles.infoRow}>
          <Ionicons name="alert-circle" size={20} color={COLORS.gray[500]} />
          <Text style={styles.infoLabel}>Tipo:</Text>
          <Text style={styles.infoValue}>{multa.tipo_infraccion || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="document-text" size={20} color={COLORS.gray[500]} />
          <Text style={styles.infoLabel}>Descripción:</Text>
          <Text style={styles.infoValue}>{multa.descripcion || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={COLORS.gray[500]} />
          <Text style={styles.infoLabel}>Ubicación: </Text>
          <Text style={styles.infoValue}>{multa.direccion || multa.ubicacion || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={COLORS.gray[500]} />
          <Text style={styles.infoLabel}>Fecha: </Text>
          <Text style={styles.infoValue}>
            {new Date(multa.fecha_infraccion || multa.created_at).toLocaleDateString('es-MX')}
          </Text>
        </View>
      </View>

      {/* Monto */}
      <View style={styles.montoCard}>
        <Text style={styles.montoLabel}>Monto a Pagar</Text>
        <Text style={styles.monto}>
          ${parseFloat(multa.monto_final || multa.monto || 0).toLocaleString('es-MX')}
        </Text>
        {multa.descuento > 0 && (
          <View style={styles.descuentoTag}>
            <Ionicons name="pricetag" size={16} color="#10B981" />
            <Text style={styles.descuentoText}>{multa.descuento}% de descuento aplicado</Text>
          </View>
        )}
      </View>

      {/* Línea de Captura */}
      {multa.linea_captura && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Línea de Captura</Text>
          <View style={styles.lineaCapturaBox}>
            <Text style={styles.lineaCaptura}>{multa.linea_captura}</Text>
          </View>
          {multa.fecha_vencimiento && (
            <Text style={styles.vencimiento}>
              Válida hasta: {new Date(multa.fecha_vencimiento).toLocaleDateString('es-MX')}
            </Text>
          )}
        </View>
      )}

      {/* Botones de Acción */}
      <View style={styles.actions}>
        {multa.estatus === 'pagada' ? (
          // UI para multa pagada - solo mostrar comprobante de pago
          <>
            <View style={styles.pagadaInfo}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.pagadaText}>Pagada el {new Date(multa.fecha_pago || multa.updated_at).toLocaleDateString('es-MX')}</Text>
            </View>
            
            <Button
              title={generandoPDF ? "Generando..." : "📝 Descargar Comprobante de Pago"}
              onPress={descargarComprobantePago}
              disabled={generandoPDF}
              icon={generandoPDF 
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="receipt" size={20} color="#fff" />
              }
            />
            
            <Button
              title="Ver Boleta de Infracción Original"
              variant="outline"
              onPress={generarComprobantePDF}
              disabled={generandoPDF}
              style={{ marginTop: 10 }}
              icon={<Ionicons name="document-text-outline" size={20} color={COLORS.primary} />}
            />
          </>
        ) : (
          // UI para multa pendiente
          <>
            <Button
              title="Pagar Multa"
              onPress={irAPagar}
              icon={<Ionicons name="card" size={20} color="#fff" />}
            />

            <Button
              title={generandoPDF ? "Generando PDF..." : "Descargar Boleta de Infracción"}
              variant="outline"
              onPress={generarComprobantePDF}
              disabled={generandoPDF}
              style={{ marginTop: 10 }}
              icon={generandoPDF 
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
              }
            />

            <Button
              title="Impugnar esta multa"
              variant="outline"
              onPress={irAImpugnar}
              style={{ marginTop: 10 }}
              icon={<Ionicons name="alert-circle-outline" size={20} color={COLORS.primary} />}
            />
          </>
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  statusHeader: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    margin:  15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.small,
  },
  folioContainer:  {
    alignItems: 'center',
  },
  folioLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  folio: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight:  'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:  12,
    gap: 10,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  placaDestacada: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    paddingHorizontal:  10,
    paddingVertical:  4,
    borderRadius: 6,
    fontWeight: 'bold',
    fontSize: 16,
    overflow: 'hidden',
  },
  montoCard: {
    backgroundColor: '#EEF2FF',
    margin: 15,
    marginBottom: 0,
    borderRadius:  12,
    padding: 20,
    alignItems: 'center',
  },
  montoLabel: {
    color: '#4F46E5',
    fontSize: 14,
  },
  monto: {
    color: '#4F46E5',
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  descuentoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  descuentoText: {
    color: '#10B981',
    fontSize: 14,
  },
  lineaCapturaBox:  {
    backgroundColor:  '#F3F4F6',
    padding: 15,
    borderRadius: 8,
    alignItems:  'center',
  },
  lineaCaptura: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#1F2937',
    letterSpacing: 2,
  },
  vencimiento:  {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    marginTop: 10,
  },
  actions: {
    padding: 15,
  },
  pagadaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    gap: 10,
  },
  pagadaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
  },
});