import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import Button from '../components/Button';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function DetalleMultaScreen({ route, navigation }) {
  const { multa } = route.params;

  const generarComprobantePDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 30px; }
            . header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
            .header h1 { color: #3B82F6; margin:  0; }
            .header p { color: #666; margin:  5px 0; }
            .section { margin:  20px 0; }
            . section-title { font-size:  14px; color: #666; margin-bottom:  10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { color: #666; }
            .value { font-weight: bold; color: #333; }
            . monto-box { background:  #EEF2FF; padding: 20px; text-align: center; border-radius:  10px; margin: 20px 0; }
            .monto { font-size: 36px; color: #4F46E5; font-weight: bold; }
            .status { display: inline-block; padding:  5px 15px; border-radius: 20px; font-weight: bold; }
            .status. pagada { background: #D1FAE5; color: #10B981; }
            . status.pendiente { background: #FEF3C7; color: #F59E0B; }
            .footer { text-align:  center; margin-top: 30px; color: #999; font-size:  12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚗 Comprobante de Multa</h1>
            <p>Sistema de Multas de Tránsito</p>
          </div>
          
          <div class="section">
            <div class="section-title">INFORMACIÓN DE LA MULTA</div>
            <div class="row">
              <span class="label">Folio:</span>
              <span class="value">${multa.folio}</span>
            </div>
            <div class="row">
              <span class="label">Fecha:</span>
              <span class="value">${new Date(multa.created_at).toLocaleDateString('es-MX')}</span>
            </div>
            <div class="row">
              <span class="label">Estatus:</span>
              <span class="status ${multa.estatus}">${multa.estatus?. toUpperCase()}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">DATOS DEL VEHÍCULO</div>
            <div class="row">
              <span class="label">Placa:</span>
              <span class="value">${multa.vehiculos?. placa || multa.placa || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">INFRACCIÓN</div>
            <div class="row">
              <span class="label">Tipo: </span>
              <span class="value">${multa.tipo_infraccion || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Descripción:</span>
              <span class="value">${multa.descripcion || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Ubicación:</span>
              <span class="value">${multa.direccion || 'N/A'}</span>
            </div>
          </div>

          <div class="monto-box">
            <p style="margin:  0; color: #666;">Monto Total</p>
            <p class="monto">$${parseFloat(multa. monto_final || 0).toLocaleString('es-MX')}</p>
            ${multa.descuento > 0 ? `<p style="color: #10B981;">Incluye ${multa.descuento}% de descuento</p>` : ''}
          </div>

          <div class="section">
            <div class="section-title">LÍNEA DE CAPTURA</div>
            <p style="font-family: monospace; font-size: 18px; text-align: center; background: #f5f5f5; padding: 15px; border-radius:  8px;">
              ${multa.linea_captura || 'N/A'}
            </p>
            <p style="text-align: center; color: #666; font-size: 12px;">
              Fecha de vencimiento: ${multa.fecha_vencimiento || 'N/A'}
            </p>
          </div>

          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString('es-MX')}</p>
            <p>Este documento es un comprobante válido de su multa de tránsito</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el comprobante');
    }
  };

  return (
    <ScrollView style={styles. container}>
      {/* Header con Estatus */}
      <View style={[
        styles.statusHeader,
        { backgroundColor: multa.estatus === 'pendiente' ? '#FEF3C7' :  '#D1FAE5' }
      ]}>
        <Ionicons 
          name={multa.estatus === 'pendiente' ? 'warning' : 'checkmark-circle'} 
          size={40} 
          color={multa.estatus === 'pendiente' ? '#F59E0B' : '#10B981'} 
        />
        <Text style={[
          styles.statusText,
          { color: multa.estatus === 'pendiente' ? '#92400E' : '#065F46' }
        ]}>
          {multa.estatus === 'pendiente' ? 'Multa Pendiente de Pago' : 'Multa Pagada'}
        </Text>
      </View>

      {/* Folio */}
      <View style={styles.card}>
        <View style={styles.folioContainer}>
          <Text style={styles.folioLabel}>Folio</Text>
          <Text style={styles. folio}>{multa. folio}</Text>
        </View>
      </View>

      {/* Información del Vehículo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información del Vehículo</Text>
        <View style={styles.infoRow}>
          <Ionicons name="car" size={20} color={COLORS.gray[500]} />
          <Text style={styles. infoLabel}>Placa: </Text>
          <Text style={styles. infoValue}>{multa.vehiculos?.placa || multa.placa || 'N/A'}</Text>
        </View>
        {multa.vehiculos?.marca && (
          <View style={styles. infoRow}>
            <Ionicons name="information-circle" size={20} color={COLORS. gray[500]} />
            <Text style={styles.infoLabel}>Marca: </Text>
            <Text style={styles. infoValue}>{multa.vehiculos. marca}</Text>
          </View>
        )}
        {multa.vehiculos?.modelo && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={COLORS. gray[500]} />
            <Text style={styles.infoLabel}>Modelo: </Text>
            <Text style={styles. infoValue}>{multa.vehiculos.modelo}</Text>
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
        <View style={styles. infoRow}>
          <Ionicons name="document-text" size={20} color={COLORS.gray[500]} />
          <Text style={styles. infoLabel}>Descripción:</Text>
          <Text style={styles.infoValue}>{multa.descripcion || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={COLORS.gray[500]} />
          <Text style={styles.infoLabel}>Ubicación: </Text>
          <Text style={styles. infoValue}>{multa.direccion || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={COLORS. gray[500]} />
          <Text style={styles.infoLabel}>Fecha: </Text>
          <Text style={styles. infoValue}>
            {new Date(multa.created_at).toLocaleDateString('es-MX')}
          </Text>
        </View>
      </View>

      {/* Monto */}
      <View style={styles.montoCard}>
        <Text style={styles.montoLabel}>Monto a Pagar</Text>
        <Text style={styles.monto}>
          ${parseFloat(multa.monto_final || 0).toLocaleString('es-MX')}
        </Text>
        {multa.descuento > 0 && (
          <View style={styles.descuentoTag}>
            <Ionicons name="pricetag" size={16} color="#10B981" />
            <Text style={styles.descuentoText}>{multa.descuento}% de descuento aplicado</Text>
          </View>
        )}
      </View>

      {/* Línea de Captura */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Línea de Captura</Text>
        <View style={styles.lineaCapturaBox}>
          <Text style={styles.lineaCaptura}>{multa.linea_captura || 'N/A'}</Text>
        </View>
        <Text style={styles.vencimiento}>
          Válida hasta: {multa.fecha_vencimiento || 'N/A'}
        </Text>
      </View>

      {/* Botones de Acción */}
      <View style={styles.actions}>
        {multa.estatus === 'pendiente' && (
          <Button
            title="Pagar Multa"
            onPress={() => navigation.navigate('PagarMulta', { multa })}
            icon={<Ionicons name="card" size={20} color="#fff" />}
          />
        )}
        
        <Button
          title="Descargar Comprobante PDF"
          variant="outline"
          onPress={generarComprobantePDF}
          style={{ marginTop: 10 }}
          icon={<Ionicons name="download-outline" size={20} color={COLORS.primary} />}
        />

        {multa.estatus === 'pendiente' && (
          <Button
            title="Impugnar esta multa"
            variant="outline"
            onPress={() => navigation.navigate('Impugnacion', { folio:  multa.folio })}
            style={{ marginTop: 10 }}
            icon={<Ionicons name="alert-circle-outline" size={20} color={COLORS.primary} />}
          />
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
  card:  {
    backgroundColor:  '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 12,
    padding: 15,
    ... SHADOWS.small,
  },
  folioContainer: {
    alignItems: 'center',
  },
  folioLabel:  {
    fontSize:  14,
    color:  '#6B7280',
  },
  folio: {
    fontSize: 24,
    fontWeight: 'bold',
    color:  COLORS.primary,
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight:  'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  infoRow:  {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 14,
    width: 80,
  },
  infoValue:  {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  montoCard:  {
    backgroundColor:  '#EEF2FF',
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
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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
});