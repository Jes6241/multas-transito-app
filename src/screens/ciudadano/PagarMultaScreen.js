import React, { useState, useEffect } from 'react';
import api, { TESORERIA_URL } from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../config/theme';
const API_URL = 'https://multas-transito-api.onrender.com';

export default function PagarMultaScreen({ route, navigation }) {
  const { multa } = route.params;
  const [metodoPago, setMetodoPago] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTarjeta, setModalTarjeta] = useState(false);
  const [modalSubirRecibo, setModalSubirRecibo] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [lineaCaptura, setLineaCaptura] = useState(multa.linea_captura || '');
  const [vigenciaLinea, setVigenciaLinea] = useState(multa.vigencia_linea_captura || null);
  const [lineaVencida, setLineaVencida] = useState(false);
  const [reciboSubido, setReciboSubido] = useState(null);
  const [subiendoRecibo, setSubiendoRecibo] = useState(false);

  const [tarjeta, setTarjeta] = useState({
    numero: '',
    nombre: '',
    expiracion: '',
    cvv: '',
  });

  // Obtener la placa de diferentes fuentes posibles
  const obtenerPlaca = () => {
    if (multa.vehiculos?. placa) return multa.vehiculos.placa;
    if (multa.vehiculo?.placa) return multa.vehiculo.placa;
    if (multa. Vehiculo?.placa) return multa. Vehiculo.placa;
    if (multa. Vehiculos?.placa) return multa.Vehiculos.placa;
    if (multa.placa) return multa.placa;
    if (multa.placa_vehiculo) return multa.placa_vehiculo;
    return 'N/A';
  };

  const placa = obtenerPlaca();

  useEffect(() => {
    verificarVigenciaLinea();
  }, []);

  const verificarVigenciaLinea = () => {
    if (vigenciaLinea) {
      const fechaVigencia = new Date(vigenciaLinea);
      const hoy = new Date();
      if (hoy > fechaVigencia) {
        setLineaVencida(true);
      }
    } else if (! lineaCaptura) {
      setLineaVencida(true);
    }
  };

  const calcularDescuento = () => {
    const fechaMulta = new Date(multa.fecha_infraccion || multa.created_at);
    const hoy = new Date();
    const diasTranscurridos = Math.floor((hoy - fechaMulta) / (1000 * 60 * 60 * 24));

    if (diasTranscurridos <= 15) {
      return {
        aplica: true,
        porcentaje: 50,
        diasRestantes: 15 - diasTranscurridos,
        montoOriginal: multa. monto,
        montoFinal: multa. monto * 0.5,
      };
    } else if (diasTranscurridos <= 30) {
      return {
        aplica: true,
        porcentaje:  25,
        diasRestantes: 30 - diasTranscurridos,
        montoOriginal: multa.monto,
        montoFinal: multa. monto * 0.75,
      };
    }
    return {
      aplica:  false,
      porcentaje: 0,
      diasRestantes: 0,
      montoOriginal: multa. monto,
      montoFinal:  multa.monto_final || multa.monto,
    };
  };

  const descuento = calcularDescuento();

  // Generar línea de captura usando la API de Tesorería
  const generarLineaCapturaTesoreria = async () => {
    setLoading(true);

    // Crear referencia única con timestamp para evitar duplicados
    const timestamp = Date.now();
    const referenciaUnica = `MULTA-${multa.id}-${timestamp}`;

    try {
      // Llamar a la API de Tesorería para generar la línea de captura
      // El monto viene de la multa (con descuento aplicado si corresponde)
      const response = await api.tesoreria.generarLineaCaptura({
        monto: descuento.montoFinal,  // ← Monto de la multa (con descuento)
        concepto: `Multa de tránsito - Folio: ${multa.folio || multa.id}`,
        referencia_externa: referenciaUnica,  // ← Referencia única
      });

      if (response.success && response.linea) {
        const { codigo, fecha_vencimiento } = response.linea;

        // Actualizar la multa con la nueva línea de captura
        try {
          await fetch(`${API_URL}/api/multas/${multa.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              linea_captura: codigo,
              vigencia_linea_captura: fecha_vencimiento,
              linea_captura_id: response.linea.id,
              monto_final: descuento.montoFinal,  // ← Guardar monto con descuento
            }),
          });
        } catch (error) {
          console.log('Error actualizando multa con línea de captura:', error);
        }

        setLineaCaptura(codigo);
        setVigenciaLinea(fecha_vencimiento);
        setLineaVencida(false);
        setLoading(false);
        
        Alert.alert(
          '✅ Línea de Captura Generada',
          `Tu línea de captura es:\n\n${codigo}\n\nMonto a pagar: $${descuento.montoFinal.toLocaleString('es-MX')}\nVigencia: ${new Date(fecha_vencimiento).toLocaleDateString('es-MX')}`,
          [{ text: 'Entendido' }]
        );
      } else {
        throw new Error(response.error || 'Error al generar línea de captura');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Error',
        'No se pudo generar la línea de captura desde Tesorería. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
      console.error('Error generando línea de captura:', error);
    }
  };

  // Alias para mantener compatibilidad
  const regenerarLineaCaptura = generarLineaCapturaTesoreria;

  const metodosPago = [
    {
      id: 'tarjeta',
      nombre: 'Tarjeta de Crédito/Débito',
      icono: 'card',
      color: '#3B82F6',
      descripcion: 'Visa, Mastercard, AMEX',
    },
    {
      id: 'oxxo',
      nombre: 'Pago en OXXO',
      icono: 'storefront',
      color: '#EF4444',
      descripcion: 'Efectivo en tienda',
    },
    {
      id:  'transferencia',
      nombre: 'Transferencia SPEI',
      icono: 'swap-horizontal',
      color:  '#10B981',
      descripcion: 'Desde tu banco',
    },
  ];

  const formatearTarjeta = (texto) => {
    const limpio = texto.replace(/\D/g, '').substring(0, 16);
    const grupos = limpio.match(/.{1,4}/g);
    return grupos ?  grupos. join(' ') : '';
  };

  const formatearExpiracion = (texto) => {
    const limpio = texto.replace(/\D/g, '').substring(0, 4);
    if (limpio.length >= 2) {
      return limpio.substring(0, 2) + '/' + limpio. substring(2);
    }
    return limpio;
  };

  const validarTarjeta = () => {
    const numeroLimpio = tarjeta.numero. replace(/\s/g, '');
    if (numeroLimpio.length !== 16) {
      Alert.alert('Error', 'El número de tarjeta debe tener 16 dígitos');
      return false;
    }
    if (! tarjeta.nombre. trim()) {
      Alert.alert('Error', 'Ingresa el nombre del titular');
      return false;
    }
    if (tarjeta.expiracion. length !== 5) {
      Alert.alert('Error', 'Ingresa la fecha de expiración (MM/YY)');
      return false;
    }
    if (tarjeta.cvv.length < 3) {
      Alert.alert('Error', 'Ingresa el CVV');
      return false;
    }
    return true;
  };

  // Seleccionar imagen de galería
  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tu galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReciboSubido({
          uri: result.assets[0].uri,
          type: 'image',
          name: 'recibo_pago. jpg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con cámara
  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para usar la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality:  0.8,
      });

      if (!result.canceled) {
        setReciboSubido({
          uri: result.assets[0]. uri,
          type: 'image',
          name: 'recibo_pago.jpg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Seleccionar PDF
  const seleccionarPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result. canceled) {
        setReciboSubido({
          uri: result.assets[0].uri,
          type: 'pdf',
          name:  result.assets[0]. name || 'recibo_pago.pdf',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  // Enviar recibo
  const enviarRecibo = async () => {
    if (! reciboSubido) {
      Alert.alert('Error', 'Por favor selecciona o toma una foto del recibo');
      return;
    }

    setSubiendoRecibo(true);

    try {
      // Simular subida del recibo
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Aquí irían las llamadas reales a tu API para subir el archivo
      // const formData = new FormData();
      // formData.append('recibo', {
      //   uri: reciboSubido.uri,
      //   type:  reciboSubido.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
      //   name: reciboSubido.name,
      // });
      // formData.append('multa_id', multa. id);
      // formData. append('linea_captura', lineaCaptura);
      // 
      // await fetch(`${API_URL}/api/multas/subir-recibo`, {
      //   method:  'POST',
      //   body: formData,
      // });

      setSubiendoRecibo(false);
      setModalSubirRecibo(false);
      
      Alert.alert(
        '✅ Recibo Enviado',
        'Tu comprobante de pago ha sido enviado exitosamente.  Validaremos tu pago en las próximas 24-48 horas.',
        [
          {
            text:  'Entendido',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      setSubiendoRecibo(false);
      Alert.alert('Error', 'No se pudo enviar el recibo.  Intenta de nuevo.');
    }
  };

  // Generar HTML del comprobante CON SELLO DE PAGADO
  const generarHTMLComprobante = () => {
    const fechaActual = new Date();

    const opcionesFecha = {
      day: '2-digit',
      month: 'short',
      year:  'numeric',
    };

    const opcionesHora = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const fechaFormateada = fechaActual.toLocaleDateString('es-MX', opcionesFecha);
    const horaFormateada = fechaActual.toLocaleTimeString('es-MX', opcionesHora);

    const folioComprobante = `VCH-${Date.now().toString().substring(5)}`;

    return `
    <! DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size:  A4;
          margin: 10mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Helvetica', Arial, sans-serif; 
          color: #333;
          padding: 15px;
          background:  #fff;
        }
        
        .voucher {
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          max-width: 100%;
          position: relative;
        }
        
        .sello-pagado {
          position: absolute;
          top: 50%;
          left:  50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          width: 180px;
          height: 180px;
          border:  6px double #10B981;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.15;
          z-index: 100;
          background: rgba(16, 185, 129, 0.03);
        }
        . sello-pagado .sello-check {
          font-size: 40px;
          color: #10B981;
          margin-bottom: 3px;
        }
        .sello-pagado .sello-texto {
          font-size: 24px;
          font-weight: bold;
          color:  #10B981;
          letter-spacing: 3px;
        }
        .sello-pagado .sello-fecha {
          font-size: 10px;
          color: #10B981;
          margin-top: 3px;
          font-weight: 600;
        }
        
        .header {
          background:  linear-gradient(135deg, #1E40AF, #3B82F6);
          color: white;
          padding:  15px 20px;
          text-align: center;
        }
        . header h1 { 
          font-size: 20px; 
          font-weight: bold;
          margin-bottom: 3px;
        }
        .header p { 
          font-size: 12px; 
          opacity: 0.9; 
        }
        
        .success-badge {
          background:  #10B981;
          color: white;
          padding: 12px;
          text-align: center;
          font-size: 16px;
          font-weight: bold;
        }
        
        .content {
          padding:  20px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          position: relative;
        }
        
        .left-section {
          flex: 1;
          min-width: 250px;
        }
        
        . right-section {
          flex: 1;
          min-width: 250px;
        }
        
        .monto-section {
          text-align: center;
          padding:  15px;
          background: #F0FDF4;
          border-radius: 10px;
          margin-bottom: 15px;
          border: 2px solid #10B981;
        }
        . monto-label {
          font-size: 11px;
          color: #059669;
          margin-bottom: 3px;
        }
        .monto-value {
          font-size: 32px;
          font-weight: bold;
          color: #065F46;
        }
        .monto-currency {
          font-size:  11px;
          color: #059669;
        }
        
        .folio-box {
          background:  #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius:  8px;
          padding: 10px;
          text-align: center;
          margin-bottom: 15px;
        }
        .folio-label {
          font-size: 9px;
          color: #3B82F6;
          margin-bottom: 2px;
        }
        .folio-value {
          font-size: 14px;
          font-weight: bold;
          color: #1E40AF;
          letter-spacing: 1px;
        }
        
        .detail-section {
          margin-bottom: 15px;
        }
        .detail-title {
          font-size: 11px;
          color: #6B7280;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 5px;
        }
        .detail-row {
          display:  flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 12px;
        }
        .detail-label {
          color: #6B7280;
        }
        .detail-value {
          color: #1F2937;
          font-weight: 600;
          text-align: right;
          max-width: 60%;
        }
        
        .placa-destacada {
          background: #FEF3C7;
          color: #92400E;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
        }
        
        . linea-captura-box {
          background: #F3F4F6;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .linea-captura-label {
          font-size: 9px;
          color: #6B7280;
          margin-bottom:  3px;
        }
        .linea-captura-value {
          font-size: 13px;
          font-weight: bold;
          color: #374151;
          letter-spacing: 1px;
        }
        
        .descuento-tag {
          color: #059669;
          font-weight: bold;
        }
        . monto-tachado {
          text-decoration: line-through;
          color: #9CA3AF;
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          border-top: 1px solid #E5E7EB;
          background: #FAFAFA;
        }
        . footer-text {
          font-size: 11px;
          color: #6B7280;
          line-height: 1.8;
        }
        . footer-text p {
          margin:  0;
        }
      </style>
    </head>
    <body>
      <div class="voucher">
        <div class="sello-pagado">
          <span class="sello-check">✓</span>
          <span class="sello-texto">PAGADO</span>
          <span class="sello-fecha">${fechaActual.toLocaleDateString('es-MX')}</span>
        </div>

        <div class="header">
          <h1>SECRETARÍA DE TRÁNSITO</h1>
          <p>Comprobante de Pago</p>
        </div>
        
        <div class="success-badge">
          ✓ PAGO EXITOSO
        </div>
        
        <div class="content">
          <div class="left-section">
            <div class="monto-section">
              <div class="monto-label">Monto Pagado</div>
              <div class="monto-value">$${descuento.montoFinal.toLocaleString('es-MX')}</div>
              <div class="monto-currency">Pesos Mexicanos (MXN)</div>
            </div>
            
            <div class="folio-box">
              <div class="folio-label">FOLIO DE COMPROBANTE</div>
              <div class="folio-value">${folioComprobante}</div>
            </div>
            
            <div class="linea-captura-box">
              <div class="linea-captura-label">LÍNEA DE CAPTURA</div>
              <div class="linea-captura-value">${lineaCaptura || generarLineaCaptura()}</div>
            </div>
          </div>
          
          <div class="right-section">
            <div class="detail-section">
              <div class="detail-title">Datos de la Multa</div>
              <div class="detail-row">
                <span class="detail-label">Folio Multa: </span>
                <span class="detail-value">${multa.folio || 'MUL-' + multa.id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Placa: </span>
                <span class="detail-value placa-destacada">${placa}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Infracción:</span>
                <span class="detail-value">${multa.tipo_infraccion || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fecha Infracción:</span>
                <span class="detail-value">${new Date(multa. fecha_infraccion || multa.created_at).toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <div class="detail-title">Datos del Pago</div>
              <div class="detail-row">
                <span class="detail-label">Método: </span>
                <span class="detail-value">Tarjeta Crédito/Débito</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${fechaActual.toLocaleDateString('es-MX')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${fechaActual.toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}</span>
              </div>
              ${
                descuento.aplica
                  ? `
              <div class="detail-row">
                <span class="detail-label">Descuento:</span>
                <span class="detail-value descuento-tag">${descuento. porcentaje}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Monto Original:</span>
                <span class="detail-value monto-tachado">$${descuento.montoOriginal.toLocaleString('es-MX')}</span>
              </div>
              `
                  : ''
              }
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            <p>Este documento es un comprobante oficial de infracción de tránsito emitido por la autoridad competente.</p>
            <p>Generado el ${fechaFormateada}, ${horaFormateada} - Sistema de Multas de Tránsito v4.0</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  const generarPDF = async () => {
    try {
      setLoading(true);

      const html = generarHTMLComprobante();
      const { uri } = await Print. printToFileAsync({
        html,
        width: 612,
        height:  792,
      });

      setLoading(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Comprobante de Pago',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Generado', 'El archivo se guardó correctamente');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo generar el PDF');
      console.error(error);
    }
  };

  const procesarPagoTarjeta = async () => {
    if (!validarTarjeta()) return;

    setLoading(true);
    setModalTarjeta(false);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (! lineaCaptura) {
      const nuevaLinea = generarLineaCaptura();
      setLineaCaptura(nuevaLinea);
    }

    try {
      await fetch(`${API_URL}/api/multas/${multa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estatus: 'pagada',
          fecha_pago: new Date().toISOString(),
          metodo_pago: 'tarjeta',
          monto_pagado: descuento.montoFinal,
        }),
      });
    } catch (error) {
      console.log('Error simulado, continuar');
    }

    setLoading(false);
    setPagoExitoso(true);
    setModalVisible(true);

    setTimeout(async () => {
      await generarPDF();
    }, 500);
  };

  const handleMetodoPago = () => {
    if (! metodoPago) {
      Alert.alert('Error', 'Selecciona un método de pago');
      return;
    }

    if (metodoPago === 'tarjeta') {
      setModalTarjeta(true);
    } else {
      // OXXO o Transferencia - Generar línea de captura si no existe
      if (!lineaCaptura || lineaVencida) {
        const nuevaLinea = generarLineaCaptura();
        const nuevaVigencia = calcularVigencia();
        setLineaCaptura(nuevaLinea);
        setVigenciaLinea(nuevaVigencia. toISOString());
        setLineaVencida(false);
      }
      setModalVisible(true);
    }
  };

  return (
    <ScrollView style={styles. container} showsVerticalScrollIndicator={false}>
      {/* Alerta de línea vencida */}
      {lineaVencida && lineaCaptura && (
        <View style={styles.alertaVencida}>
          <Ionicons name="warning" size={24} color="#DC2626" />
          <View style={styles.alertaContent}>
            <Text style={styles.alertaTitle}>Línea de captura vencida</Text>
            <Text style={styles. alertaText}>
              Tu línea de captura ha expirado.  Genera una nueva para continuar.
            </Text>
          </View>
          <TouchableOpacity style={styles.alertaBtn} onPress={regenerarLineaCaptura}>
            <Text style={styles.alertaBtnText}>Renovar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Resumen de la multa */}
      <View style={styles.resumenCard}>
        <Text style={styles.resumenTitle}>Resumen de la Multa</Text>

        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Folio:</Text>
          <Text style={styles.resumenValue}>{multa.folio}</Text>
        </View>

        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Infracción:</Text>
          <Text style={styles.resumenValue}>{multa.tipo_infraccion}</Text>
        </View>

        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Placa:</Text>
          <Text style={[styles.resumenValue, styles.placaDestacada]}>{placa}</Text>
        </View>

        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Fecha: </Text>
          <Text style={styles. resumenValue}>
            {new Date(multa.fecha_infraccion || multa.created_at).toLocaleDateString('es-MX')}
          </Text>
        </View>

        {lineaCaptura && ! lineaVencida && (
          <View style={styles. lineaCapturaInfo}>
            <Text style={styles.lineaCapturaLabel}>Línea de Captura: </Text>
            <Text style={styles. lineaCapturaValue}>{lineaCaptura}</Text>
            <Text style={styles.lineaCapturaVigencia}>
              Vigencia:  {vigenciaLinea ?  new Date(vigenciaLinea).toLocaleDateString('es-MX') : 'N/A'}
            </Text>
          </View>
        )}
      </View>

      {/* Descuento */}
      {descuento.aplica && (
        <View style={styles.descuentoCard}>
          <View style={styles.descuentoHeader}>
            <Ionicons name="pricetag" size={24} color="#059669" />
            <Text style={styles.descuentoTitle}>¡Descuento Disponible!</Text>
          </View>
          <Text style={styles.descuentoPorcentaje}>{descuento. porcentaje}% de descuento</Text>
          <Text style={styles.descuentoDias}>
            Te quedan {descuento.diasRestantes} días para aprovecharlo
          </Text>
          <View style={styles.descuentoMontos}>
            <Text style={styles.montoOriginal}>
              Monto original: ${descuento.montoOriginal.toLocaleString('es-MX')}
            </Text>
            <Text style={styles.montoAhorro}>
              Ahorras: ${(descuento.montoOriginal - descuento.montoFinal).toLocaleString('es-MX')}
            </Text>
          </View>
        </View>
      )}

      {/* Total a pagar */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total a Pagar</Text>
        <Text style={styles. totalMonto}>${descuento. montoFinal. toLocaleString('es-MX')} MXN</Text>
      </View>

      {/* Métodos de pago */}
      <Text style={styles.sectionTitle}>Selecciona método de pago</Text>

      {metodosPago.map((metodo) => (
        <TouchableOpacity
          key={metodo. id}
          style={[styles.metodoCard, metodoPago === metodo.id && styles. metodoCardSelected]}
          onPress={() => setMetodoPago(metodo.id)}
        >
          <View style={[styles.metodoIconContainer, { backgroundColor: `${metodo.color}20` }]}>
            <Ionicons name={metodo. icono} size={28} color={metodo.color} />
          </View>
          <View style={styles.metodoInfo}>
            <Text style={styles.metodoNombre}>{metodo.nombre}</Text>
            <Text style={styles.metodoDescripcion}>{metodo.descripcion}</Text>
          </View>
          <View style={styles.metodoCheck}>
            {metodoPago === metodo.id ?  (
              <Ionicons name="checkmark-circle" size={26} color={COLORS.primary} />
            ) : (
              <Ionicons name="ellipse-outline" size={26} color="#D1D5DB" />
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Botón de pagar */}
      <TouchableOpacity
        style={[styles. pagarBtn, ! metodoPago && styles.pagarBtnDisabled]}
        onPress={handleMetodoPago}
        disabled={!metodoPago || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons
              name={metodoPago === 'tarjeta' ? 'card' : 'document-text'}
              size={20}
              color="#fff"
            />
            <Text style={styles.pagarBtnText}>
              {metodoPago === 'tarjeta' ? 'Pagar con Tarjeta' : 'Ver Línea de Captura'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info seguridad */}
      <View style={styles.seguridadInfo}>
        <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
        <Text style={styles.seguridadText}>Pago 100% seguro.  Tus datos están protegidos.</Text>
      </View>

      {/* Modal de Tarjeta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalTarjeta}
        onRequestClose={() => setModalTarjeta(false)}
      >
        <View style={styles. modalOverlay}>
          <View style={styles. modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleTarjeta}>💳 Pago con Tarjeta</Text>
              <TouchableOpacity onPress={() => setModalTarjeta(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles. tarjetaForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Número de tarjeta</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#9CA3AF"
                value={tarjeta.numero}
                onChangeText={(t) => setTarjeta({ ...tarjeta, numero:  formatearTarjeta(t) })}
                keyboardType="numeric"
                maxLength={19}
              />

              <Text style={styles.inputLabel}>Nombre del titular</Text>
              <TextInput
                style={styles. input}
                placeholder="JUAN PÉREZ"
                placeholderTextColor="#9CA3AF"
                value={tarjeta. nombre}
                onChangeText={(t) => setTarjeta({ ...tarjeta, nombre: t. toUpperCase() })}
                autoCapitalize="characters"
              />

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles. inputLabel}>Expiración</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#9CA3AF"
                    value={tarjeta.expiracion}
                    onChangeText={(t) =>
                      setTarjeta({ ... tarjeta, expiracion: formatearExpiracion(t) })
                    }
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#9CA3AF"
                    value={tarjeta.cvv}
                    onChangeText={(t) =>
                      setTarjeta({ ... tarjeta, cvv: t.replace(/\D/g, '').substring(0, 4) })
                    }
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles. totalPagoCard}>
                <Text style={styles.totalPagoLabel}>Total a pagar: </Text>
                <Text style={styles. totalPagoMonto}>
                  ${descuento.montoFinal.toLocaleString('es-MX')} MXN
                </Text>
              </View>

              <TouchableOpacity
                style={styles.pagarTarjetaBtn}
                onPress={procesarPagoTarjeta}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={20} color="#fff" />
                    <Text style={styles.pagarTarjetaBtnText}>
                      Pagar ${descuento.montoFinal.toLocaleString('es-MX')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.tarjetasAceptadas}>
                <Text style={styles. tarjetasLabel}>Aceptamos: </Text>
                <View style={styles.tarjetasLogos}>
                  <Text style={styles.tarjetaLogo}>VISA</Text>
                  <Text style={styles.tarjetaLogo}>MC</Text>
                  <Text style={styles.tarjetaLogo}>AMEX</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Línea de Captura (OXXO / Transferencia) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible && ! pagoExitoso}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleTarjeta}>
                {metodoPago === 'oxxo' ?  '🏪 Pago en OXXO' : '🏦 Transferencia SPEI'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Línea de Captura Grande */}
            <View style={styles. lineaCapturaGrande}>
              <Text style={styles. lineaCapturaGrandeLabel}>LÍNEA DE CAPTURA</Text>
              <Text style={styles.lineaCapturaGrandeValue}>{lineaCaptura}</Text>
              <View style={styles.lineaCapturaVigenciaBox}>
                <Ionicons name="time-outline" size={16} color="#F59E0B" />
                <Text style={styles.lineaCapturaVigenciaText}>
                  Vigencia: {vigenciaLinea ?  new Date(vigenciaLinea).toLocaleDateString('es-MX') : '48 horas'}
                </Text>
              </View>
            </View>

            {/* Monto a pagar */}
            <View style={styles.montoLineaCaptura}>
              <Text style={styles.montoLineaCapturaLabel}>Monto a pagar: </Text>
              <Text style={styles. montoLineaCapturaValue}>
                ${descuento.montoFinal.toLocaleString('es-MX')} MXN
              </Text>
            </View>

            {/* Instrucciones */}
            <View style={styles.instruccionesBox}>
              <Text style={styles.instruccionesTitle}>
                {metodoPago === 'oxxo' ? '📋 Instrucciones: ' : '📋 Datos para transferencia:'}
              </Text>
              {metodoPago === 'oxxo' ?  (
                <View style={styles.instruccionesList}>
                  <Text style={styles. instruccionItem}>1. Acude a cualquier tienda OXXO</Text>
                  <Text style={styles.instruccionItem}>2. Indica que harás un pago de servicio</Text>
                  <Text style={styles.instruccionItem}>3. Proporciona la línea de captura</Text>
                  <Text style={styles.instruccionItem}>4. Realiza el pago y conserva tu ticket</Text>
                </View>
              ) : (
                <View style={styles. instruccionesList}>
                  <Text style={styles. instruccionItem}>Banco:  BANXICO</Text>
                  <Text style={styles.instruccionItem}>CLABE: 012180001234567890</Text>
                  <Text style={styles.instruccionItem}>Referencia: {lineaCaptura}</Text>
                  <Text style={styles. instruccionItem}>Concepto: Pago multa {multa.folio}</Text>
                </View>
              )}
            </View>

            {/* Aviso importante */}
            <View style={styles. avisoBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.avisoText}>
                Una vez realizado el pago, sube tu comprobante para validar tu transacción. 
              </Text>
            </View>

            {/* Botón Subir Comprobante */}
            <TouchableOpacity
              style={styles.subirComprobanteBtn}
              onPress={() => {
                setModalVisible(false);
                setModalSubirRecibo(true);
              }}
            >
              <Ionicons name="cloud-upload" size={22} color="#fff" />
              <Text style={styles.subirComprobanteBtnText}>Ya pagué, subir comprobante</Text>
            </TouchableOpacity>

            {/* Botón Cerrar */}
            <TouchableOpacity
              style={styles.cerrarModalBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cerrarModalBtnText}>Pagar después</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Pago Exitoso (Solo Tarjeta) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible && pagoExitoso}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconSuccess}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>¡Pago Exitoso!</Text>
            <Text style={styles.modalMessage}>Tu pago ha sido procesado correctamente.</Text>

            <View style={styles.lineaCapturaContainer}>
              <Text style={styles.lineaCapturaModalLabel}>Línea de Captura:</Text>
              <Text style={styles.lineaCapturaModalValue}>{lineaCaptura}</Text>
            </View>

            <View style={styles. modalDetalles}>
              <View style={styles.modalDetalleRow}>
                <Text style={styles.modalDetalleLabel}>Monto: </Text>
                <Text style={styles. modalDetalleValue}>
                  ${descuento.montoFinal.toLocaleString('es-MX')} MXN
                </Text>
              </View>
              <View style={styles.modalDetalleRow}>
                <Text style={styles.modalDetalleLabel}>Folio:</Text>
                <Text style={styles.modalDetalleValue}>{multa.folio}</Text>
              </View>
              <View style={styles.modalDetalleRow}>
                <Text style={styles.modalDetalleLabel}>Placa:</Text>
                <Text style={styles.modalDetalleValue}>{placa}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles. modalBtnText}>Volver al Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalBtnSecondary} onPress={generarPDF}>
              <Ionicons name="download" size={20} color={COLORS.primary} />
              <Text style={styles.modalBtnSecondaryText}>Descargar Comprobante PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Subir Recibo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalSubirRecibo}
        onRequestClose={() => setModalSubirRecibo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles. modalHeader}>
              <Text style={styles.modalTitleTarjeta}>📤 Subir Comprobante</Text>
              <TouchableOpacity onPress={() => setModalSubirRecibo(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subirReciboSubtitle}>
              Sube una foto o PDF del recibo que te dieron al momento de pagar
            </Text>

            {/* Preview del archivo subido */}
            {reciboSubido && (
              <View style={styles. reciboPreview}>
                {reciboSubido. type === 'image' ? (
                  <Image source={{ uri: reciboSubido.uri }} style={styles. reciboImagen} />
                ) : (
                  <View style={styles.reciboPDFPreview}>
                    <Ionicons name="document" size={50} color="#EF4444" />
                    <Text style={styles.reciboPDFName}>{reciboSubido.name}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.eliminarReciboBtn}
                  onPress={() => setReciboSubido(null)}
                >
                  <Ionicons name="trash" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}

            {/* Opciones para subir */}
            {! reciboSubido && (
              <View style={styles. opcionesSubir}>
                <TouchableOpacity style={styles.opcionSubirBtn} onPress={tomarFoto}>
                  <View style={[styles.opcionSubirIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="camera" size={32} color="#3B82F6" />
                  </View>
                  <Text style={styles. opcionSubirText}>Tomar Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.opcionSubirBtn} onPress={seleccionarImagen}>
                  <View style={[styles.opcionSubirIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="images" size={32} color="#10B981" />
                  </View>
                  <Text style={styles.opcionSubirText}>Galería</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.opcionSubirBtn} onPress={seleccionarPDF}>
                  <View style={[styles.opcionSubirIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="document" size={32} color="#EF4444" />
                  </View>
                  <Text style={styles. opcionSubirText}>PDF</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Info de la multa */}
            <View style={styles. infoMultaRecibo}>
              <View style={styles.infoMultaReciboRow}>
                <Text style={styles.infoMultaReciboLabel}>Folio:</Text>
                <Text style={styles.infoMultaReciboValue}>{multa. folio}</Text>
              </View>
              <View style={styles.infoMultaReciboRow}>
                <Text style={styles. infoMultaReciboLabel}>Línea de Captura:</Text>
                <Text style={styles.infoMultaReciboValue}>{lineaCaptura}</Text>
              </View>
              <View style={styles.infoMultaReciboRow}>
                <Text style={styles.infoMultaReciboLabel}>Monto:</Text>
                <Text style={styles.infoMultaReciboValue}>
                  ${descuento.montoFinal.toLocaleString('es-MX')} MXN
                </Text>
              </View>
            </View>

            {/* Botón Enviar */}
            <TouchableOpacity
              style={[styles.enviarReciboBtn, ! reciboSubido && styles.enviarReciboBtnDisabled]}
              onPress={enviarRecibo}
              disabled={!reciboSubido || subiendoRecibo}
            >
              {subiendoRecibo ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles. enviarReciboBtnText}>Enviar Comprobante</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cerrarModalBtn}
              onPress={() => setModalSubirRecibo(false)}
            >
              <Text style={styles.cerrarModalBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:  '#F3F4F6',
    padding: 15,
  },
  alertaVencida: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertaContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  alertaText: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  alertaBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertaBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  resumenCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding:  20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation:  2,
  },
  resumenTitle:  {
    fontSize:  18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resumenLabel:  {
    fontSize:  14,
    color: '#6B7280',
  },
  resumenValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    maxWidth: '60%',
    textAlign: 'right',
  },
  placaDestacada: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    paddingHorizontal:  10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  lineaCapturaInfo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  lineaCapturaLabel: {
    fontSize: 11,
    color:  '#059669',
  },
  lineaCapturaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
    letterSpacing: 1,
    marginTop: 4,
  },
  lineaCapturaVigencia: {
    fontSize: 11,
    color:  '#059669',
    marginTop: 4,
  },
  descuentoCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding:  20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  descuentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  descuentoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
  },
  descuentoPorcentaje: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 5,
  },
  descuentoDias: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 15,
  },
  descuentoMontos: {
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    paddingTop:  10,
  },
  montoOriginal: {
    fontSize: 14,
    color: '#065F46',
    textDecorationLine: 'line-through',
  },
  montoAhorro: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 5,
  },
  totalCard: {
    backgroundColor:  COLORS.primary,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  totalMonto: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom:  15,
  },
  metodoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding:  15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metodoCardSelected: {
    borderColor:  COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  metodoIconContainer: {
    width: 50,
    height:  50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems:  'center',
  },
  metodoInfo: {
    flex: 1,
    marginLeft: 15,
  },
  metodoNombre: {
    fontSize: 16,
    fontWeight:  '600',
    color: '#1F2937',
  },
  metodoDescripcion: {
    fontSize: 13,
    color:  '#6B7280',
    marginTop: 2,
  },
  metodoCheck: {
    marginLeft: 10,
  },
  pagarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  pagarBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  pagarBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seguridadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap:  8,
  },
  seguridadText: {
    fontSize: 13,
    color:  '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor:  'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding:  25,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconSuccess: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalTitleTarjeta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  lineaCapturaContainer: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  lineaCapturaModalLabel: {
    fontSize: 12,
    color:  '#6B7280',
    marginBottom: 5,
  },
  lineaCapturaModalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color:  COLORS.primary,
    letterSpacing: 2,
  },
  modalDetalles: {
    marginBottom: 20,
  },
  modalDetalleRow:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalDetalleLabel: {
    fontSize: 14,
    color:  '#6B7280',
  },
  modalDetalleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize:  16,
    fontWeight: 'bold',
  },
 
  modalBtnSecondary:  {
    flexDirection: 'row',
    alignItems:  'center',
    justifyContent:  'center',
    padding: 15,
    marginTop: 10,
    gap: 8,
  },
  modalBtnSecondaryText: {
    color:  COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  tarjetaForm: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 15,
  },
  inputHalf: {
    flex: 1,
  },
  totalPagoCard: {
    backgroundColor: '#F0FDF4',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalPagoLabel: {
    fontSize: 14,
    color: '#065F46',
  },
  totalPagoMonto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  pagarTarjetaBtn:  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  pagarTarjetaBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tarjetasAceptadas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 20,
    gap: 10,
  },
  tarjetasLabel: {
    fontSize: 12,
    color:  '#6B7280',
  },
  tarjetasLogos: {
    flexDirection: 'row',
    gap: 10,
  },
  tarjetaLogo: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal:  10,
    paddingVertical: 5,
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    overflow: 'hidden',
  },
  // Estilos para Línea de Captura Grande (OXXO/Transferencia)
  lineaCapturaGrande: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor:  '#10B981',
    borderStyle: 'dashed',
  },
  lineaCapturaGrandeLabel: {
    fontSize: 12,
    color:  '#059669',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  lineaCapturaGrandeValue:  {
    fontSize:  28,
    fontWeight: 'bold',
    color: '#065F46',
    letterSpacing: 3,
    textAlign: 'center',
  },
  lineaCapturaVigenciaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal:  12,
    paddingVertical:  6,
    borderRadius: 20,
  },
  lineaCapturaVigenciaText: {
    fontSize: 12,
    color:  '#92400E',
    fontWeight: '600',
  },
  montoLineaCaptura: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  montoLineaCapturaLabel: {
    fontSize: 14,
    color:  '#1E40AF',
  },
  montoLineaCapturaValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  instruccionesBox: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    marginBottom:  15,
  },
  instruccionesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  instruccionesList: {
    gap: 6,
  },
  instruccionItem: {
    fontSize: 13,
    color:  '#4B5563',
    lineHeight: 20,
  },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap:  10,
  },
  avisoText: {
    flex: 1,
    fontSize: 13,
    color:  '#1E40AF',
    lineHeight: 18,
  },
  subirComprobanteBtn: {
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 10,
  },
  subirComprobanteBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cerrarModalBtn: {
    padding: 15,
    alignItems: 'center',
  },
  cerrarModalBtnText:  {
    color:  '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  // Estilos para Modal Subir Recibo
  subirReciboSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  reciboPreview: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  reciboImagen: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  reciboPDFPreview: {
    width: '100%',
    height: 150,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reciboPDFName: {
    fontSize: 14,
    color: '#991B1B',
    marginTop: 10,
    fontWeight: '500',
  },
  eliminarReciboBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  opcionesSubir: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  opcionSubirBtn: {
    alignItems: 'center',
    gap: 8,
  },
  opcionSubirIcon: {
    width: 70,
    height:  70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcionSubirText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  infoMultaRecibo: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoMultaReciboRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoMultaReciboLabel:  {
    fontSize:  13,
    color:  '#6B7280',
  },
  infoMultaReciboValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  enviarReciboBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:  COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 10,
  },
  enviarReciboBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  enviarReciboBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});