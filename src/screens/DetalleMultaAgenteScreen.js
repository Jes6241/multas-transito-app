import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, SHADOWS } from '../config/theme';
import SignaturePad from '../components/SignaturePad';

const API_URL = 'https://multas-transito-api.onrender. com';

export default function DetalleMultaAgenteScreen({ route, navigation }) {
  const { multa:  multaInicial } = route.params;
  const [multa, setMulta] = useState(multaInicial);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [guardandoFirma, setGuardandoFirma] = useState(false);
  const [firmaAgente, setFirmaAgente] = useState(multaInicial.firma_agente || null);
  const [firmaInfractor, setFirmaInfractor] = useState(multaInicial.firma_infractor || null);
  const [showFirmaAgente, setShowFirmaAgente] = useState(false);
  const [showFirmaInfractor, setShowFirmaInfractor] = useState(false);
  const [yaFirmado, setYaFirmado] = useState(!! multaInicial.firma_agente);

  useEffect(() => {
    cargarMulta();
  }, []);

  // CORREGIDO: Mejor manejo de errores
  const cargarMulta = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/multas/${multa. id}`, {
        signal: controller. signal,
      });

      clearTimeout(timeoutId);

      const contentType = response. headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console. log('Servidor no disponible, usando datos locales');
        return;
      }

      const text = await response.text();

      let data;
      try {
        data = JSON. parse(text);
      } catch (parseError) {
        console.log('Respuesta no es JSON válido, usando datos locales');
        return;
      }

      if (data.success && data. multa) {
        setMulta(data.multa);
        if (data.multa.firma_agente) {
          setFirmaAgente(data.multa.firma_agente);
          setYaFirmado(true);
        }
        if (data.multa.firma_infractor) {
          setFirmaInfractor(data.multa. firma_infractor);
        }
      }
    } catch (error) {
      console.log('Usando datos locales (servidor no disponible)');
    }
  };

  // CORREGIDO:  Mejor manejo de errores
  const guardarFirmas = async (firmaAgenteNueva, firmaInfractorNueva) => {
    setGuardandoFirma(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_URL}/api/multas/${multa.id}/firmas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:  JSON.stringify({
          firma_agente: firmaAgenteNueva || firmaAgente,
          firma_infractor: firmaInfractorNueva || firmaInfractor,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      if (!contentType || ! contentType.includes('application/json')) {
        Alert.alert('Error', 'Servidor no disponible.  Intenta más tarde.');
        return false;
      }

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        Alert.alert('Error', 'Respuesta inválida del servidor');
        return false;
      }

      if (data. success) {
        setYaFirmado(true);
        Alert.alert('Firmas Guardadas', 'Las firmas se han guardado correctamente.');
        return true;
      } else {
        Alert.alert('Error', data.error || 'No se pudieron guardar las firmas');
        return false;
      }
    } catch (error) {
      console.error('Error guardando firmas:', error);
      if (error.name === 'AbortError') {
        Alert.alert('Tiempo Agotado', 'El servidor tardó demasiado. Intenta de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo conectar con el servidor');
      }
      return false;
    } finally {
      setGuardandoFirma(false);
    }
  };

  const handleFirmaAgente = async (signature) => {
    setFirmaAgente(signature);
    setShowFirmaAgente(false);
  };

  const handleFirmaInfractor = async (signature) => {
    setFirmaInfractor(signature);
    setShowFirmaInfractor(false);
  };

  const confirmarYGuardarFirmas = async () => {
    if (!firmaAgente) {
      Alert.alert('Firma Requerida', 'Debes firmar como agente primero.');
      return;
    }

    Alert.alert(
      'Confirmar Firmas',
      '¿Deseas guardar las firmas?  Una vez guardadas, no podrán modificarse.',
      [
        { text:  'Cancelar', style: 'cancel' },
        {
          text: 'Guardar Firmas',
          onPress: async () => {
            const guardado = await guardarFirmas(firmaAgente, firmaInfractor);
            if (guardado) {
              setYaFirmado(true);
            }
          },
        },
      ]
    );
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFechaCorta = (fecha) => {
    if (! fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month:  'short',
      year:  'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstatusInfo = (estatus) => {
    switch (estatus) {
      case 'pendiente':
        return { bg: '#FEF3C7', text: '#92400E', label: 'Pendiente', icon: 'time' };
      case 'pagada':
        return { bg: '#D1FAE5', text: '#065F46', label:  'Pagada', icon: 'checkmark-circle' };
      case 'vencida':
        return { bg: '#FEE2E2', text:  '#991B1B', label: 'Vencida', icon:  'alert-circle' };
      case 'impugnada':
        return { bg: '#DBEAFE', text:  '#1E40AF', label:  'Impugnada', icon:  'document-text' };
      default:
        return { bg: '#E5E7EB', text: '#374151', label: estatus || 'N/A', icon:  'help' };
    }
  };

  const generarPDFMulta = async () => {
    if (!firmaAgente) {
      Alert. alert(
        'Firma Requerida',
        'Debes firmar como agente antes de generar la boleta.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (!yaFirmado) {
      const guardado = await guardarFirmas(firmaAgente, firmaInfractor);
      if (! guardado) return;
    }

    setGenerandoPDF(true);

    const fechaMulta = formatFechaCorta(multa.created_at);
    const fechaVencimiento = multa.fecha_vencimiento || 'N/A';

    const urlPago = `https://pagos.transito. gob.mx/${multa.folio}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/? size=150x150&format=png&data=${encodeURIComponent(urlPago)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Boleta - ${multa.folio}</title>
        <style>
          @page { 
            margin: 0; 
            size: A4; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            height: 100%;
            width: 100%;
          }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            color: #2d3748; 
            font-size: 11px;
            line-height: 1.4;
          }
          
          .page { 
            width: 210mm;
            height: 297mm;
            padding: 12mm;
            display: flex;
            flex-direction: column;
          }
          
          /* Header */
          .header {
            background:  linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
            color:  white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 6px 6px 0 0;
          }
          . header-left {}
          .header-title { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
          .header-subtitle { font-size:  11px; opacity: 0.85; margin-top: 2px; }
          . folio-box {
            background: rgba(255,255,255,0.2);
            padding:  8px 15px;
            border-radius: 5px;
            text-align: right;
          }
          .folio-label { font-size:  9px; opacity: 0.8; letter-spacing: 1px; }
          .folio-value { font-size:  16px; font-weight: 700; letter-spacing: 1px; }
          
          /* Placa */
          . placa-section {
            background:  linear-gradient(135deg, #2c5282 0%, #3182ce 100%);
            color: white;
            text-align: center;
            padding: 15px;
          }
          .placa-label { font-size:  10px; opacity: 0.9; letter-spacing:  2px; text-transform: uppercase; }
          .placa-value { font-size: 36px; font-weight: 800; letter-spacing:  6px; margin-top: 3px; }
          
          /* Main Grid */
          .main-grid {
            display: flex;
            flex:  1;
            border:  1px solid #e2e8f0;
            border-top: none;
          }
          .col-left {
            flex: 1.3;
            padding: 20px;
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
          }
          .col-right {
            flex: 0.7;
            padding: 20px;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
          }
          
          /* Sections */
          .section { margin-bottom: 20px; }
          .section:last-child { margin-bottom: 0; }
          . section-title {
            font-size: 12px;
            font-weight: 700;
            color: #1a365d;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 12px;
            display: flex;
            align-items:  center;
            gap: 8px;
          }
          .section-number {
            background: #1a365d;
            color: white;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
          }
          
          /* Info Rows */
          .info-row {
            display: flex;
            justify-content:  space-between;
            padding: 10px 0;
            border-bottom: 1px solid #edf2f7;
          }
          . info-row:last-child { border-bottom: none; }
          . info-label { color: #718096; font-size: 11px; }
          .info-value { 
            font-weight: 600; 
            color: #2d3748; 
            font-size: 11px; 
            text-align: right; 
            max-width: 60%; 
          }
          
          /* Monto */
          . monto-section {
            background: linear-gradient(135deg, #276749 0%, #38a169 100%);
            color:  white;
            text-align: center;
            padding:  20px;
            border-radius: 8px;
            margin-top: auto;
          }
          .monto-label { font-size: 11px; opacity: 0.9; letter-spacing: 1px; text-transform: uppercase; }
          .monto-value { font-size: 42px; font-weight: 800; margin:  8px 0; }
          . monto-currency { font-size: 12px; opacity: 0.85; }
          
          /* Linea Captura */
          .linea-section {
            background: #fffbeb;
            border:  2px solid #d69e2e;
            border-radius:  8px;
            padding: 15px;
            text-align: center;
            margin-bottom: 15px;
          }
          .linea-label { font-size: 10px; color: #975a16; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          .linea-value { 
            font-size: 18px; 
            font-weight: 700; 
            color: #744210; 
            font-family: 'Courier New', monospace; 
            letter-spacing: 2px; 
            margin:  10px 0; 
          }
          . linea-vence { font-size:  10px; color: #975a16; }
          
          /* QR */
          .qr-section {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-title { 
            font-size: 11px; 
            color: #1a365d; 
            font-weight: 700; 
            margin-bottom: 12px; 
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .qr-image { width: 110px; height: 110px; }
          . qr-instruction { font-size:  10px; color: #718096; margin-top: 12px; line-height: 1.4; }
          
          /* Pago Grid */
          .pago-grid {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            gap: 6px;
          }
          .pago-item {
            flex: 1;
            text-align: center;
            padding: 10px 6px;
            background: #edf2f7;
            border-radius: 6px;
          }
          .pago-icon { font-size: 16px; color: #1a365d; font-weight: bold; margin-bottom: 4px; }
          .pago-text { font-size:  8px; color: #4a5568; font-weight: 600; }
          
          /* Aviso */
          . aviso-section {
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            border-left: 4px solid #c53030;
            padding: 10px 15px;
            margin:  12px 0;
            border-radius:  0 6px 6px 0;
          }
          .aviso-title { font-weight: 700; color: #c53030; font-size: 11px; margin-bottom: 3px; }
          .aviso-text { color: #742a2a; font-size: 10px; line-height: 1.4; }
          
          /* Firmas */
          . firmas-section {
            display: flex;
            gap: 50px;
            padding: 15px 0;
            border-top: 1px solid #e2e8f0;
          }
          .firma-box { 
            flex: 1; 
            text-align: center; 
          }
          .firma-title { 
            font-size: 9px; 
            color: #718096; 
            text-transform: uppercase; 
            letter-spacing:  1px;
            margin-bottom: 8px; 
          }
          .firma-area {
            height: 50px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 5px;
          }
          .firma-area img { max-height: 45px; max-width: 90%; }
          . firma-line {
            border-top: 2px solid #2d3748;
            margin-top:  5px;
            padding-top: 8px;
          }
          .firma-name { font-size: 11px; color: #2d3748; font-weight: 600; }
          . firma-negado { color: #c53030; font-style: italic; }
          
          /* Footer */
          .footer {
            text-align: center;
            padding: 10px;
            color: #a0aec0;
            font-size:  9px;
            border-top: 1px solid #e2e8f0;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <div class="header-title">SECRETARÍA DE TRÁNSITO DE LA CIUDAD DE MÉXICO</div>
              <div class="header-subtitle">Boleta Oficial de Infracción</div>
            </div>
            <div class="folio-box">
              <div class="folio-label">FOLIO</div>
              <div class="folio-value">${multa.folio}</div>
            </div>
          </div>

          <!-- Placa -->
          <div class="placa-section">
            <div class="placa-label">Placa del Vehículo Infractor</div>
            <div class="placa-value">${multa.vehiculos?. placa || multa.placa || 'N/A'}</div>
          </div>

          <!-- Grid Principal -->
          <div class="main-grid">
            <!-- Columna Izquierda -->
            <div class="col-left">
              <!-- Datos Infracción -->
              <div class="section">
                <div class="section-title">
                  <span class="section-number">1</span>
                  DATOS DE LA INFRACCIÓN
                </div>
                <div class="info-row">
                  <span class="info-label">Tipo de Infracción:</span>
                  <span class="info-value">${multa.tipo_infraccion || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Descripción:</span>
                  <span class="info-value">${multa.descripcion || multa.tipo_infraccion || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha y Hora:</span>
                  <span class="info-value">${fechaMulta}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ubicación:</span>
                  <span class="info-value">${multa.direccion || 'N/A'}</span>
                </div>
              </div>

              <!-- Datos Vehículo -->
              <div class="section">
                <div class="section-title">
                  <span class="section-number">2</span>
                  DATOS DEL VEHÍCULO
                </div>
                <div class="info-row">
                  <span class="info-label">Marca:</span>
                  <span class="info-value">${multa.vehiculos?.marca || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Modelo:</span>
                  <span class="info-value">${multa.vehiculos?.modelo || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Color:</span>
                  <span class="info-value">${multa.vehiculos?.color || 'N/A'}</span>
                </div>
              </div>

              <!-- Monto -->
              <div class="monto-section">
                <div class="monto-label">Total a Pagar</div>
                <div class="monto-value">$${(multa.monto_final || multa.monto || 0).toLocaleString()}</div>
                <div class="monto-currency">Pesos Mexicanos (MXN)</div>
              </div>
            </div>

            <!-- Columna Derecha -->
            <div class="col-right">
              <!-- Línea de Captura -->
              <div class="linea-section">
                <div class="linea-label">Línea de Captura</div>
                <div class="linea-value">${multa.linea_captura || 'N/A'}</div>
                <div class="linea-vence">Vigencia:  ${fechaVencimiento}</div>
              </div>

              <!-- QR -->
              <div class="qr-section">
                <div class="qr-title">Pago en Línea</div>
                <img src="${qrUrl}" class="qr-image" alt="QR"/>
                <div class="qr-instruction">Escanea este código QR con tu celular para realizar el pago</div>
              </div>

              <!-- Opciones de Pago -->
              <div class="pago-grid">
                <div class="pago-item">
                  <div class="pago-icon">$</div>
                  <div class="pago-text">OXXO</div>
                </div>
                <div class="pago-item">
                  <div class="pago-icon">B</div>
                  <div class="pago-text">BANCO</div>
                </div>
                <div class="pago-item">
                  <div class="pago-icon">W</div>
                  <div class="pago-text">WEB</div>
                </div>
                <div class="pago-item">
                  <div class="pago-icon">O</div>
                  <div class="pago-text">OFICINA</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aviso -->
          <div class="aviso-section">
            <div class="aviso-title">IMPORTANTE</div>
            <div class="aviso-text">
              Realice el pago antes del ${fechaVencimiento} para evitar recargos. 
              Después de la fecha de vencimiento, el monto podría incrementarse.  
              Conserve este documento como comprobante oficial. 
            </div>
          </div>

          <!-- Firmas -->
          <div class="firmas-section">
            <div class="firma-box">
              <div class="firma-title">Firma del Agente</div>
              <div class="firma-area">
                ${firmaAgente ?  `<img src="${firmaAgente}" alt="Firma"/>` : ''}
              </div>
              <div class="firma-line">
                <div class="firma-name">Agente de Tránsito</div>
              </div>
            </div>
            <div class="firma-box">
              <div class="firma-title">Firma del Infractor</div>
              <div class="firma-area">
                ${firmaInfractor ? `<img src="${firmaInfractor}" alt="Firma"/>` : ''}
              </div>
              <div class="firma-line">
                <div class="firma-name ${! firmaInfractor ? 'firma-negado' :  ''}">
                  ${firmaInfractor ?  'Recibí original' : 'Se negó a firmar'}
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            Este documento es un comprobante oficial de infracción de tránsito emitido por la autoridad competente.  <br/>
            Generado el ${new Date().toLocaleString('es-MX')} | Sistema de Multas de Tránsito v4.0
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      setGenerandoPDF(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Boleta de Infracción',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Generado', `Archivo guardado en: ${uri}`);
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      setGenerandoPDF(false);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const estatusInfo = getEstatusInfo(multa.estatus);

  return (
    <ScrollView style={styles. container}>
      {/* Header con estatus */}
      <View style={[styles.headerCard, { backgroundColor: estatusInfo.bg }]}>
        <Ionicons name={estatusInfo.icon} size={40} color={estatusInfo.text} />
        <Text style={[styles.headerEstatus, { color:  estatusInfo.text }]}>
          {estatusInfo. label}
        </Text>
        <Text style={[styles.headerFolio, { color:  estatusInfo.text }]}>
          {multa.folio}
        </Text>
        {yaFirmado && (
          <View style={styles.firmadoBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.firmadoText}>Firmado</Text>
          </View>
        )}
      </View>

      {/* Datos del Vehículo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="car" size={20} color={COLORS.primary} /> Datos del Vehículo
        </Text>

        <View style={styles.placaContainer}>
          <Text style={styles.placaLabel}>PLACA</Text>
          <Text style={styles.placaValor}>
            {multa. vehiculos?.placa || multa.placa || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Marca</Text>
            <Text style={styles. infoValue}>{multa.vehiculos?.marca || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Modelo</Text>
            <Text style={styles.infoValue}>{multa.vehiculos?.modelo || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Color</Text>
            <Text style={styles.infoValue}>{multa.vehiculos?. color || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Datos de la Infracción */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="warning" size={20} color={COLORS.primary} /> Datos de la Infracción
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="alert-circle" size={18} color="#6B7280" />
          <Text style={styles.infoLabel2}>Tipo: </Text>
          <Text style={styles. infoValue2}>{multa. tipo_infraccion || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="document-text" size={18} color="#6B7280" />
          <Text style={styles.infoLabel2}>Descripción:</Text>
          <Text style={styles.infoValue2}>{multa.descripcion || multa.tipo_infraccion || 'N/A'}</Text>
        </View>

        <View style={styles. infoRow}>
          <Ionicons name="location" size={18} color="#6B7280" />
          <Text style={styles. infoLabel2}>Ubicación:</Text>
          <Text style={styles.infoValue2}>{multa.direccion || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={18} color="#6B7280" />
          <Text style={styles.infoLabel2}>Fecha: </Text>
          <Text style={styles. infoValue2}>{formatFecha(multa.created_at)}</Text>
        </View>
      </View>

      {/* Monto */}
      <View style={styles.montoCard}>
        <Text style={styles.montoLabel}>Monto de la Multa</Text>
        <Text style={styles. montoValor}>
          ${(multa.monto_final || multa.monto || 0).toLocaleString()} MXN
        </Text>
      </View>

      {/* Línea de Captura */}
      <View style={styles.lineaCapturaCard}>
        <Text style={styles. lineaCapturaLabel}>Línea de Captura</Text>
        <Text style={styles.lineaCapturaValor}>{multa.linea_captura || 'N/A'}</Text>
        <Text style={styles.lineaCapturaVence}>
          Válida hasta: {multa.fecha_vencimiento || 'N/A'}
        </Text>
      </View>

      {/* Evidencias/Fotos */}
      {multa.evidencias && multa.evidencias.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="camera" size={20} color={COLORS. primary} /> Evidencias ({multa.evidencias.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.evidenciasContainer}>
              {multa.evidencias. map((evidencia, index) => (
                <Image
                  key={evidencia.id || index}
                  source={{ uri: evidencia. url }}
                  style={styles.evidenciaImage}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Sección de Firmas */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles. cardTitle}>
            <Ionicons name="pencil" size={20} color={COLORS.primary} /> Firmas
          </Text>
          {yaFirmado && (
            <View style={styles.guardadoBadge}>
              <Ionicons name="cloud-done" size={14} color="#059669" />
              <Text style={styles. guardadoText}>Guardadas</Text>
            </View>
          )}
        </View>

        <View style={styles.firmasContainer}>
          {/* Firma del Agente */}
          <TouchableOpacity
            style={[
              styles.firmaBox,
              firmaAgente && styles.firmaBoxCompletada,
              yaFirmado && styles.firmaBoxBloqueada,
            ]}
            onPress={() => ! yaFirmado && setShowFirmaAgente(true)}
            disabled={yaFirmado}
          >
            {firmaAgente ?  (
              <>
                <Image source={{ uri: firmaAgente }} style={styles.firmaPreview} />
                <Text style={styles.firmaCompletadaText}>Agente</Text>
              </>
            ) : (
              <>
                <Ionicons name="pencil-outline" size={30} color="#6B7280" />
                <Text style={styles.firmaPlaceholder}>Firma Agente *</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Firma del Infractor */}
          <TouchableOpacity
            style={[
              styles.firmaBox,
              firmaInfractor && styles. firmaBoxCompletadaInfractor,
              yaFirmado && styles.firmaBoxBloqueada,
            ]}
            onPress={() => !yaFirmado && setShowFirmaInfractor(true)}
            disabled={yaFirmado}
          >
            {firmaInfractor ? (
              <>
                <Image source={{ uri: firmaInfractor }} style={styles.firmaPreview} />
                <Text style={styles. firmaCompletadaTextInfractor}>Infractor</Text>
              </>
            ) : (
              <>
                <Ionicons name="person-outline" size={30} color="#6B7280" />
                <Text style={styles.firmaPlaceholder}>Firma Infractor</Text>
                <Text style={styles.firmaOpcional}>(opcional)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {! firmaAgente && ! yaFirmado && (
          <View style={styles.alertaFirma}>
            <Ionicons name="information-circle" size={18} color="#1E40AF" />
            <Text style={styles.alertaFirmaText}>
              La firma del agente es obligatoria para generar la boleta
            </Text>
          </View>
        )}

        {yaFirmado && (
          <View style={styles.alertaGuardado}>
            <Ionicons name="lock-closed" size={18} color="#059669" />
            <Text style={styles.alertaGuardadoText}>
              Las firmas están guardadas y no pueden modificarse
            </Text>
          </View>
        )}
      </View>

      {/* Botones */}
      <View style={styles.botonesContainer}>
        {/* Botón Guardar Firmas */}
        {! yaFirmado && firmaAgente && (
          <TouchableOpacity
            style={styles.guardarFirmasBtn}
            onPress={confirmarYGuardarFirmas}
            disabled={guardandoFirma}
          >
            {guardandoFirma ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={22} color="#fff" />
                <Text style={styles. guardarFirmasBtnText}>Guardar Firmas</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Botón Imprimir */}
        <TouchableOpacity
          style={[
            styles.imprimirBtn,
            ! firmaAgente && styles.imprimirBtnDisabled,
          ]}
          onPress={generarPDFMulta}
          disabled={generandoPDF || ! firmaAgente}
        >
          {generandoPDF ?  (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="print" size={24} color="#fff" />
              <Text style={styles.imprimirBtnText}>
                {firmaAgente ? 'Imprimir / Compartir Boleta' : 'Firma requerida'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />

      {/* Modales de Firma */}
      <SignaturePad
        visible={showFirmaAgente}
        titulo="Firma del Agente"
        onOK={handleFirmaAgente}
        onCancel={() => setShowFirmaAgente(false)}
      />

      <SignaturePad
        visible={showFirmaInfractor}
        titulo="Firma del Infractor"
        onOK={handleFirmaInfractor}
        onCancel={() => setShowFirmaInfractor(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerCard: {
    margin: 15,
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    ... SHADOWS. medium,
  },
  headerEstatus:  { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  headerFolio: { fontSize: 14, marginTop: 5, opacity: 0.8 },
  firmadoBadge:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal:  12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    gap: 5,
  },
  firmadoText: { color: '#059669', fontWeight: '600', fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding:  15,
    ... SHADOWS.small,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  guardadoBadge:  {
    flexDirection: 'row',
    alignItems:  'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  guardadoText: { color: '#059669', fontSize: 11, fontWeight: '600' },

  placaContainer: {
    backgroundColor: '#1a365d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  placaLabel: { color: '#93C5FD', fontSize: 12 },
  placaValor: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 3 },

  infoGrid:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems:  'center',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius:  8,
    marginHorizontal: 3,
  },
  infoLabel:  { fontSize: 11, color: '#6B7280' },
  infoValue: { fontSize:  14, fontWeight: '600', color: '#1F2937', marginTop: 4 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  infoLabel2: { color: '#6B7280', fontSize: 13, width: 80 },
  infoValue2: { flex: 1, fontSize: 13, color: '#1F2937', fontWeight: '500' },

  montoCard: {
    backgroundColor: '#276749',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  montoLabel: { color:  '#9AE6B4', fontSize: 14 },
  montoValor: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: 5 },

  lineaCapturaCard:  {
    backgroundColor:  '#FFFBEB',
    margin:  15,
    marginTop: 0,
    padding:  15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D69E2E',
  },
  lineaCapturaLabel:  { color: '#975A16', fontSize: 12, fontWeight: '600' },
  lineaCapturaValor:  {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#744210',
    marginTop: 8,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  lineaCapturaVence: { color: '#975A16', fontSize:  12, marginTop: 8 },

  evidenciasContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  evidenciaImage: {
    width: 100,
    height:  100,
    borderRadius: 8,
  },

  firmasContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  firmaBox: {
    flex: 1,
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor:  '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firmaBoxCompletada: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    backgroundColor: '#D1FAE5',
  },
  firmaBoxCompletadaInfractor: {
    borderColor: '#3B82F6',
    borderStyle:  'solid',
    backgroundColor: '#DBEAFE',
  },
  firmaBoxBloqueada: {
    opacity: 0.8,
  },
  firmaPreview: {
    width: '90%',
    height: 70,
    resizeMode: 'contain',
  },
  firmaPlaceholder: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  firmaOpcional: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  firmaCompletadaText:  {
    color:  '#059669',
    fontWeight: 'bold',
    marginTop: 5,
  },
  firmaCompletadaTextInfractor: {
    color: '#1E40AF',
    fontWeight: 'bold',
    marginTop: 5,
  },
  alertaFirma:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  alertaFirmaText: { color: '#1E40AF', fontSize: 12, flex: 1 },
  alertaGuardado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
    marginTop:  12,
    gap: 8,
  },
  alertaGuardadoText: { color: '#059669', fontSize: 12, flex: 1 },

  botonesContainer: { padding: 15, gap: 10 },
  guardarFirmasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    gap:  10,
  },
  guardarFirmasBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imprimirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a365d',
    padding: 16,
    borderRadius:  12,
    gap: 10,
  },
  imprimirBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  imprimirBtnText:  { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});