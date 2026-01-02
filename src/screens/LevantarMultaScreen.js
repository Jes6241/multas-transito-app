import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, SHADOWS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { offlineService } from '../config/offlineService';
import Input from '../components/Input';
import Button from '../components/Button';
import SignaturePad from '../components/SignaturePad';

const API_URL = 'https://multas-transito-api.onrender.com';

const TIPOS_INFRACCION = [
  { id: 'estacionamiento', label: 'Estacionamiento prohibido', monto: 800 },
  { id: 'velocidad', label: 'Exceso de velocidad', monto: 1500 },
  { id: 'semaforo', label:  'Pasarse el semáforo en rojo', monto: 2000 },
  { id: 'cinturon', label: 'No usar cinturón de seguridad', monto: 500 },
  { id: 'celular', label: 'Uso de celular al conducir', monto:  1000 },
  { id: 'alcoholemia', label: 'Conducir en estado de ebriedad', monto: 5000 },
  { id: 'documentos', label: 'Sin documentos', monto: 600 },
  { id: 'luces', label: 'Circular sin luces', monto: 400 },
  { id: 'casco', label: 'No usar casco (moto)', monto: 700 },
  { id: 'doble_fila', label: 'Estacionarse en doble fila', monto: 900 },
];

export default function LevantarMultaScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [fotos, setFotos] = useState([]);

  // Firmas
  const [firmaAgente, setFirmaAgente] = useState(null);
  const [firmaInfractor, setFirmaInfractor] = useState(null);
  const [showFirmaAgente, setShowFirmaAgente] = useState(false);
  const [showFirmaInfractor, setShowFirmaInfractor] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [otraInfraccion, setOtraInfraccion] = useState({ descripcion: '', monto: '' });
  const [infraccionesPersonalizadas, setInfraccionesPersonalizadas] = useState([]);

  const [form, setForm] = useState({
    placa: '',
    infraccionesSeleccionadas: [],
    descripcion: '',
    direccion: '',
  });

  useEffect(() => {
    checkConnectivity();
    getLocation();
    despertarServidor();
  }, []);

  const despertarServidor = async () => {
    try {
      await fetch(`${API_URL}/`);
      console.log('Servidor despierto');
    } catch {
      console.log('Servidor no disponible');
    }
  };

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_URL}/`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    }
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert. alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location. Accuracy. Balanced,
        timeout: 10000,
      });

      setLocation(loc. coords);

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (address) {
          const partes = [];
          if (address.street) partes.push(address.street);
          if (address.streetNumber) partes.push(address.streetNumber);
          if (address.district) partes.push(address.district);
          if (address.city) partes.push(address. city);

          const direccion = partes.join(', ') || `${loc.coords.latitude. toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`;
          setForm((prev) => ({ ...prev, direccion }));
        }
      } catch (geocodeError) {
        console.log('Geocoding no disponible, usando coordenadas');
        const direccion = `Lat: ${loc.coords.latitude.toFixed(6)}, Lng: ${loc.coords.longitude.toFixed(6)}`;
        setForm((prev) => ({ ...prev, direccion }));
      }
    } catch (error) {
      console. error('Error obteniendo ubicación:', error);
      setForm((prev) => ({ ...prev, direccion: 'Ubicación no disponible' }));
    } finally {
      setLocationLoading(false);
    }
  };

  const toggleInfraccion = (id) => {
    setForm((prev) => {
      const seleccionadas = prev.infraccionesSeleccionadas;
      if (seleccionadas.includes(id)) {
        return { ...prev, infraccionesSeleccionadas: seleccionadas.filter((i) => i !== id) };
      } else {
        return { ...prev, infraccionesSeleccionadas: [... seleccionadas, id] };
      }
    });
  };

  const agregarOtraInfraccion = () => {
    if (! otraInfraccion.descripcion. trim()) {
      Alert.alert('Error', 'Ingresa la descripción de la infracción');
      return;
    }
    if (!otraInfraccion.monto || isNaN(parseFloat(otraInfraccion.monto))) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    const nuevaInfraccion = {
      id: `otro_${Date.now()}`,
      label: otraInfraccion.descripcion. trim(),
      monto: parseFloat(otraInfraccion.monto),
      esPersonalizada: true,
    };

    setInfraccionesPersonalizadas([...infraccionesPersonalizadas, nuevaInfraccion]);
    setForm((prev) => ({
      ...prev,
      infraccionesSeleccionadas: [... prev.infraccionesSeleccionadas, nuevaInfraccion. id],
    }));

    setOtraInfraccion({ descripcion: '', monto: '' });
    setModalVisible(false);
  };

  const eliminarInfraccionPersonalizada = (id) => {
    setInfraccionesPersonalizadas(infraccionesPersonalizadas.filter((i) => i. id !== id));
    setForm((prev) => ({
      ...prev,
      infraccionesSeleccionadas: prev.infraccionesSeleccionadas. filter((i) => i !== id),
    }));
  };

  const calcularMontoTotal = () => {
    let total = 0;
    form.infraccionesSeleccionadas. forEach((id) => {
      const infraccion = TIPOS_INFRACCION.find((t) => t.id === id);
      if (infraccion) {
        total += infraccion.monto;
      } else {
        const personalizada = infraccionesPersonalizadas. find((t) => t.id === id);
        if (personalizada) {
          total += personalizada.monto;
        }
      }
    });
    return total;
  };

  const getInfraccionesTexto = () => {
    const textos = [];
    form.infraccionesSeleccionadas.forEach((id) => {
      const infraccion = TIPOS_INFRACCION.find((t) => t.id === id);
      if (infraccion) {
        textos.push(infraccion.label);
      } else {
        const personalizada = infraccionesPersonalizadas.find((t) => t.id === id);
        if (personalizada) {
          textos.push(personalizada.label);
        }
      }
    });
    return textos. join(', ');
  };

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]. base64) {
        setFotos([... fotos, { uri: result.assets[0].uri, base64: result.assets[0].base64 }]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:  ['images'],
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const nuevasFotos = result. assets
          .filter((asset) => asset.base64)
          .map((asset) => ({ uri: asset.uri, base64: asset.base64 }));
        setFotos([...fotos, ...nuevasFotos]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const eliminarFoto = (index) => {
    const nuevasFotos = [... fotos];
    nuevasFotos.splice(index, 1);
    setFotos(nuevasFotos);
  };

  const validarFormulario = () => {
    if (!form.placa. trim()) {
      Alert.alert('Error', 'Ingresa el número de placa');
      return false;
    }
    if (form.infraccionesSeleccionadas.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una infracción');
      return false;
    }
    if (! firmaAgente) {
      Alert.alert('Error', 'La firma del agente es obligatoria');
      return false;
    }
    return true;
  };

  const generarFolioTemporal = () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math. random() * 10000).toString().padStart(4, '0');
    return `MUL-${año}${mes}${dia}${random}`;
  };

  const generarLineaCaptura = () => {
    return 'LC' + Date.now().toString().slice(-12);
  };

  const generarFechaVencimiento = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    return fecha.toISOString().split('T')[0];
  };

  // Generar PDF (con soporte offline)
  const generarPDF = async (datosMulta) => {
    const fechaMulta = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month:  'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const urlPago = `https://pagos.transito. gob.mx/${datosMulta. folio}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/? size=150x150&format=png&data=${encodeURIComponent(urlPago)}`;

    // Sección de línea de captura (diferente si es offline)
    const lineaCapturaHTML = datosMulta.esOffline ? `
      <div class="linea-section" style="background:  #FEF3C7; border-color: #F59E0B;">
        <div class="linea-label" style="color: #92400E;">Línea de Captura</div>
        <div class="linea-value" style="font-size: 16px; color: #92400E; letter-spacing: 0;">PENDIENTE</div>
        <div class="linea-vence" style="color: #92400E; margin-top:  8px; line-height: 1.5;">
          Disponible en 24 horas. <br/>
          Consulte en la app o sitio web con el folio: <br/>
          <strong style="font-size: 14px;">${datosMulta.folio}</strong>
        </div>
      </div>
    ` : `
      <div class="linea-section">
        <div class="linea-label">Línea de Captura</div>
        <div class="linea-value">${datosMulta.linea_captura}</div>
        <div class="linea-vence">Vigencia: ${datosMulta.fecha_vencimiento}</div>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Boleta - ${datosMulta. folio}</title>
        <style>
          @page { margin: 0; size: A4; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height:  100%; width: 100%; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #2d3748; font-size: 11px; line-height: 1.4; }
          
          .page { width: 210mm; height: 297mm; padding: 12mm; display: flex; flex-direction: column; }
          
          .header { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px 6px 0 0; }
          . header-title { font-size:  16px; font-weight: 700; letter-spacing: 0. 5px; }
          . header-subtitle { font-size:  11px; opacity: 0.85; margin-top: 2px; }
          . folio-box { background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 5px; text-align: right; }
          .folio-label { font-size:  9px; opacity: 0.8; letter-spacing: 1px; }
          .folio-value { font-size:  16px; font-weight: 700; letter-spacing:  1px; }
          
          .placa-section { background: linear-gradient(135deg, #2c5282 0%, #3182ce 100%); color: white; text-align: center; padding: 15px; }
          .placa-label { font-size: 10px; opacity: 0.9; letter-spacing:  2px; text-transform: uppercase; }
          .placa-value { font-size: 36px; font-weight: 800; letter-spacing:  6px; margin-top: 3px; }
          
          .main-grid { display: flex; flex:  1; border: 1px solid #e2e8f0; border-top: none; }
          .col-left { flex: 1. 3; padding: 20px; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
          .col-right { flex: 0.7; padding: 20px; background: #f8fafc; display: flex; flex-direction: column; }
          
          . section { margin-bottom: 20px; }
          .section:last-child { margin-bottom: 0; }
          . section-title { font-size: 12px; font-weight: 700; color: #1a365d; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
          .section-number { background: #1a365d; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
          
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
          .info-row:last-child { border-bottom:  none; }
          . info-label { color: #718096; font-size: 11px; }
          .info-value { font-weight: 600; color: #2d3748; font-size: 11px; text-align: right; max-width: 60%; }
          
          .monto-section { background: linear-gradient(135deg, #276749 0%, #38a169 100%); color: white; text-align: center; padding: 20px; border-radius: 8px; margin-top: auto; }
          . monto-label { font-size: 11px; opacity: 0.9; letter-spacing:  1px; text-transform: uppercase; }
          .monto-value { font-size: 42px; font-weight: 800; margin:  8px 0; }
          . monto-currency { font-size:  12px; opacity: 0.85; }
          
          . linea-section { background: #fffbeb; border:  2px solid #d69e2e; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 15px; }
          .linea-label { font-size:  10px; color: #975a16; font-weight: 700; letter-spacing:  1px; text-transform: uppercase; }
          .linea-value { font-size: 18px; font-weight: 700; color: #744210; font-family: 'Courier New', monospace; letter-spacing: 2px; margin:  10px 0; }
          .linea-vence { font-size: 10px; color: #975a16; }
          
          . qr-section { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding:  15px; text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .qr-title { font-size:  11px; color: #1a365d; font-weight: 700; margin-bottom: 12px; letter-spacing: 1px; text-transform: uppercase; }
          .qr-image { width: 110px; height: 110px; }
          .qr-instruction { font-size:  10px; color: #718096; margin-top: 12px; line-height: 1.4; }
          
          .pago-grid { display: flex; justify-content: space-between; margin-top: 15px; gap: 6px; }
          .pago-item { flex: 1; text-align: center; padding: 10px 6px; background: #edf2f7; border-radius: 6px; }
          .pago-icon { font-size:  16px; color: #1a365d; font-weight: bold; margin-bottom: 4px; }
          .pago-text { font-size:  8px; color: #4a5568; font-weight: 600; }
          
          . aviso-section { background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); border-left: 4px solid #c53030; padding: 10px 15px; margin:  12px 0; border-radius: 0 6px 6px 0; }
          .aviso-title { font-weight: 700; color: #c53030; font-size: 11px; margin-bottom: 3px; }
          .aviso-text { color: #742a2a; font-size: 10px; line-height: 1.4; }
          
          .firmas-section { display: flex; gap:  50px; padding: 15px 0; border-top: 1px solid #e2e8f0; }
          .firma-box { flex: 1; text-align: center; }
          .firma-title { font-size:  9px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .firma-area { height: 50px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; }
          .firma-area img { max-height: 45px; max-width: 90%; }
          . firma-line { border-top: 2px solid #2d3748; margin-top: 5px; padding-top: 8px; }
          . firma-name { font-size:  11px; color: #2d3748; font-weight: 600; }
          .firma-negado { color: #c53030; font-style: italic; }
          
          .footer { text-align: center; padding: 10px; color: #a0aec0; font-size: 9px; border-top: 1px solid #e2e8f0; margin-top: 10px; }
          
          .offline-notice { background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 10px; }
          .offline-notice-text { color: #92400E; font-size: 10px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="header-left">
              <div class="header-title">SECRETARÍA DE TRÁNSITO DE LA CIUDAD DE MÉXICO</div>
              <div class="header-subtitle">Boleta Oficial de Infracción</div>
            </div>
            <div class="folio-box">
              <div class="folio-label">FOLIO</div>
              <div class="folio-value">${datosMulta. folio}</div>
            </div>
          </div>

          <div class="placa-section">
            <div class="placa-label">Placa del Vehículo Infractor</div>
            <div class="placa-value">${datosMulta.placa}</div>
          </div>

          <div class="main-grid">
            <div class="col-left">
              <div class="section">
                <div class="section-title">
                  <span class="section-number">1</span>
                  DATOS DE LA INFRACCIÓN
                </div>
                <div class="info-row">
                  <span class="info-label">Tipo de Infracción:</span>
                  <span class="info-value">${datosMulta. tipo_infraccion}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Descripción:</span>
                  <span class="info-value">${datosMulta.descripcion || datosMulta.tipo_infraccion}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha y Hora:</span>
                  <span class="info-value">${fechaMulta}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ubicación:</span>
                  <span class="info-value">${datosMulta.direccion || 'N/A'}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">
                  <span class="section-number">2</span>
                  DATOS DEL VEHÍCULO
                </div>
                <div class="info-row">
                  <span class="info-label">Placa:</span>
                  <span class="info-value">${datosMulta. placa}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Marca:</span>
                  <span class="info-value">N/A</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Modelo:</span>
                  <span class="info-value">N/A</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Color:</span>
                  <span class="info-value">N/A</span>
                </div>
              </div>

              <div class="monto-section">
                <div class="monto-label">Total a Pagar</div>
                <div class="monto-value">$${datosMulta.monto. toLocaleString()}</div>
                <div class="monto-currency">Pesos Mexicanos (MXN)</div>
              </div>
            </div>

            <div class="col-right">
              ${lineaCapturaHTML}

              <div class="qr-section">
                <div class="qr-title">Pago en Línea</div>
                <img src="${qrUrl}" class="qr-image" alt="QR"/>
                <div class="qr-instruction">Escanea este código QR con tu celular para realizar el pago</div>
              </div>

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

          <div class="aviso-section">
            <div class="aviso-title">IMPORTANTE</div>
            <div class="aviso-text">
              ${datosMulta.esOffline 
                ? `Esta multa fue registrada sin conexión. La línea de captura estará disponible en 24 horas.  Consulte con el folio ${datosMulta. folio} en la app o sitio web para obtener los datos de pago.`
                : `Realice el pago antes del ${datosMulta. fecha_vencimiento} para evitar recargos.  Después de la fecha de vencimiento, el monto podría incrementarse.  Conserve este documento como comprobante oficial.`
              }
            </div>
          </div>

          <div class="firmas-section">
            <div class="firma-box">
              <div class="firma-title">Firma del Agente</div>
              <div class="firma-area">
                ${datosMulta. firma_agente ?  `<img src="${datosMulta.firma_agente}" alt="Firma"/>` : ''}
              </div>
              <div class="firma-line">
                <div class="firma-name">Agente de Tránsito</div>
              </div>
            </div>
            <div class="firma-box">
              <div class="firma-title">Firma del Infractor</div>
              <div class="firma-area">
                ${datosMulta.firma_infractor ? `<img src="${datosMulta.firma_infractor}" alt="Firma"/>` : ''}
              </div>
              <div class="firma-line">
                <div class="firma-name ${! datosMulta. firma_infractor ?  'firma-negado' :  ''}">
                  ${datosMulta.firma_infractor ? 'Recibí original' : 'Se negó a firmar'}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            Este documento es un comprobante oficial de infracción de tránsito emitido por la autoridad competente. <br/>
            Generado el ${new Date().toLocaleString('es-MX')} | Sistema de Multas de Tránsito v4.0
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir Boleta de Infracción',
          UTI: 'com. adobe.pdf',
        });
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const levantarMulta = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    const montoTotal = calcularMontoTotal();
    const infraccionesTexto = getInfraccionesTexto();
    const folio = generarFolioTemporal();
    const lineaCaptura = generarLineaCaptura();
    const fechaVencimiento = generarFechaVencimiento();

    const datosMulta = {
      placa: form.placa.toUpperCase(),
      tipo_infraccion: infraccionesTexto,
      descripcion:  form.descripcion || infraccionesTexto,
      monto: montoTotal,
      monto_final: montoTotal,
      direccion: form.direccion,
      latitud: location?. latitude,
      longitud:  location?.longitude,
      agente_id: user?.id,
      fotos: fotos. map((f) => f.base64),
      firma_agente: firmaAgente,
      firma_infractor: firmaInfractor,
      folio:  folio,
      linea_captura:  lineaCaptura,
      fecha_vencimiento: fechaVencimiento,
      esOffline: false,
    };

    console.log('=== DATOS A ENVIAR ===');
    console.log('Firma agente:', firmaAgente ?  'SÍ (longitud: ' + firmaAgente.length + ')' : 'NO');
    console.log('Firma infractor:', firmaInfractor ? 'SÍ (longitud: ' + firmaInfractor. length + ')' : 'NO');
    console.log('======================');

    try {
      console.log('Enviando multa al servidor...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${API_URL}/api/multas`, {
        method: 'POST',
        headers:  { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosMulta),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success) {
        datosMulta.folio = data.multa?. folio || folio;
        datosMulta.linea_captura = data.multa?. linea_captura || lineaCaptura;
        datosMulta.esOffline = false;

        Alert. alert(
          '✅ Multa Levantada',
          `Folio: ${datosMulta.folio}\n` +
            `Placa: ${datosMulta.placa}\n` +
            `Monto: $${montoTotal.toLocaleString('es-MX')}\n\n` +
            `¿Deseas generar el PDF para el infractor?`,
          [
            { text:  'No', onPress: () => navigation.goBack() },
            {
              text: 'Generar PDF',
              onPress: async () => {
                await generarPDF(datosMulta);
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo crear la multa');
      }
    } catch (error) {
      console.error('Error de conexión:', error. message);

      if (error.name === 'AbortError') {
        Alert.alert(
          '⏱️ Tiempo Agotado',
          'El servidor tardó demasiado.  ¿Deseas guardar la multa localmente?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Guardar Offline',
              onPress: () => guardarOffline(datosMulta),
            },
          ]
        );
      } else {
        Alert. alert(
          '⚠️ Sin Conexión',
          '¿Deseas guardar la multa localmente para sincronizarla después?',
          [
            { text:  'Cancelar', style: 'cancel' },
            {
              text:  'Guardar Offline',
              onPress: () => guardarOffline(datosMulta),
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const guardarOffline = async (datosMulta) => {
    try {
      // Marcar como offline para el PDF
      datosMulta.esOffline = true;

      await offlineService.guardarMultaOffline(datosMulta);

      Alert.alert(
        '📱 Guardado Offline',
        'La multa se guardó localmente.\n\n¿Deseas generar el PDF para el infractor?',
        [
          { text: 'No', onPress: () => navigation.goBack() },
          {
            text: 'Generar PDF',
            onPress: async () => {
              await generarPDF(datosMulta);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (offlineError) {
      Alert.alert('Error', 'No se pudo guardar la multa');
    }
  };

  const todasLasInfracciones = [... TIPOS_INFRACCION, ...infraccionesPersonalizadas];

  return (
    <ScrollView style={styles. container}>
      {/* Modal para agregar otra infracción */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles. modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Otra Infracción</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Descripción de la infracción *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Obstrucción de vía pública"
              value={otraInfraccion. descripcion}
              onChangeText={(text) => setOtraInfraccion({ ...otraInfraccion, descripcion: text })}
            />

            <Text style={styles. modalLabel}>Monto de la multa *</Text>
            <View style={styles.montoInputContainer}>
              <Text style={styles.montoPrefix}>$</Text>
              <TextInput
                style={styles.montoInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={otraInfraccion.monto}
                onChangeText={(text) =>
                  setOtraInfraccion({ ...otraInfraccion, monto: text.replace(/[^0-9.]/g, '') })
                }
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles. modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAddBtn} onPress={agregarOtraInfraccion}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.modalAddText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Banner de conectividad */}
      <View style={[styles.connectivityBanner, { backgroundColor: isOnline ? '#D1FAE5' : '#FEF3C7' }]}>
        <Ionicons name={isOnline ? 'wifi' : 'wifi-outline'} size={20} color={isOnline ? '#10B981' : '#F59E0B'} />
        <Text style={[styles.connectivityText, { color: isOnline ? '#065F46' : '#92400E' }]}>
          {isOnline ? 'Conectado al servidor' : 'Sin conexión - Se guardará localmente'}
        </Text>
        {! isOnline && (
          <TouchableOpacity onPress={checkConnectivity}>
            <Ionicons name="refresh" size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles. card}>
        {/* Placa */}
        <Input
          label="Número de Placa *"
          placeholder="ABC-123"
          value={form.placa}
          onChangeText={(text) => setForm({ ... form, placa:  text. toUpperCase() })}
          autoCapitalize="characters"
          icon={<Ionicons name="car" size={20} color={COLORS.gray[400]} />}
        />

        {/* Infracciones */}
        <View style={styles. infraccionesHeader}>
          <Text style={styles.label}>Tipo de Infracción(es) *</Text>
          <View style={styles.contadorBadge}>
            <Text style={styles. contadorText}>{form.infraccionesSeleccionadas. length} seleccionada(s)</Text>
          </View>
        </View>

        <Text style={styles.hint}>Puedes seleccionar múltiples infracciones</Text>

        <View style={styles. tiposGrid}>
          {TIPOS_INFRACCION.map((tipo) => {
            const isSelected = form.infraccionesSeleccionadas.includes(tipo. id);
            return (
              <TouchableOpacity
                key={tipo.id}
                style={[styles.tipoBtn, isSelected && styles.tipoBtnActivo]}
                onPress={() => toggleInfraccion(tipo.id)}
              >
                <View style={styles.tipoBtnContent}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                  <Text style={[styles.tipoText, isSelected && styles.tipoTextActivo]}>{tipo.label}</Text>
                </View>
                <Text style={[styles.tipoMonto, isSelected && styles.tipoMontoActivo]}>${tipo.monto}</Text>
              </TouchableOpacity>
            );
          })}

          {infraccionesPersonalizadas.map((tipo) => {
            const isSelected = form.infraccionesSeleccionadas. includes(tipo.id);
            return (
              <View
                key={tipo. id}
                style={[styles.tipoBtn, styles.tipoBtnPersonalizado, isSelected && styles.tipoBtnActivo]}
              >
                <TouchableOpacity style={styles.tipoBtnContent} onPress={() => toggleInfraccion(tipo.id)}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                  <Text style={[styles.tipoText, isSelected && styles.tipoTextActivo]}>{tipo. label}</Text>
                </TouchableOpacity>
                <View style={styles.personalizadaActions}>
                  <Text style={[styles.tipoMonto, isSelected && styles.tipoMontoActivo]}>${tipo.monto}</Text>
                  <TouchableOpacity onPress={() => eliminarInfraccionPersonalizada(tipo.id)}>
                    <Ionicons name="trash-outline" size={18} color={isSelected ? '#fff' : '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.agregarOtraBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
            <Text style={styles.agregarOtraText}>Agregar otra infracción</Text>
          </TouchableOpacity>
        </View>

        {/* Descripción */}
        <Input
          label="Descripción adicional"
          placeholder="Detalles adicionales..."
          value={form.descripcion}
          onChangeText={(text) => setForm({ ...form, descripcion: text })}
          icon={<Ionicons name="document-text" size={20} color={COLORS.gray[400]} />}
        />

        {/* Ubicación */}
        <View style={styles.ubicacionContainer}>
          <Text style={styles.label}>Ubicación</Text>
          <View style={styles. ubicacionInfo}>
            {locationLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles. ubicacionText}>Obteniendo ubicación... </Text>
              </>
            ) : (
              <>
                <Ionicons name="location" size={20} color={COLORS.primary} />
                <Text style={styles. ubicacionText}>{form.direccion || 'Ubicación no disponible'}</Text>
                <TouchableOpacity onPress={getLocation}>
                  <Ionicons name="refresh" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
          {location && (
            <Text style={styles.coordenadas}>
              Lat: {location.latitude. toFixed(6)}, Lng: {location.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Evidencias */}
        <View style={styles. evidenciasHeader}>
          <Text style={styles.label}>Evidencias Fotográficas</Text>
          <View style={styles.fotosContador}>
            <Ionicons name="camera" size={16} color="#6B7280" />
            <Text style={styles.fotosContadorText}>{fotos.length} foto(s)</Text>
          </View>
        </View>

        <View style={styles.fotosContainer}>
          {fotos.map((foto, index) => (
            <View key={index} style={styles.fotoWrapper}>
              <Image source={{ uri: foto.uri }} style={styles. fotoPreview} />
              <TouchableOpacity style={styles.eliminarFoto} onPress={() => eliminarFoto(index)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.agregarFoto} onPress={tomarFoto}>
            <Ionicons name="camera" size={30} color={COLORS.primary} />
            <Text style={styles.agregarFotoText}>Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.agregarFoto} onPress={seleccionarFoto}>
            <Ionicons name="images" size={30} color={COLORS.primary} />
            <Text style={styles. agregarFotoText}>Galería</Text>
          </TouchableOpacity>
        </View>

        {/* FIRMAS */}
        <Text style={styles.label}>Firmas *</Text>
        <View style={styles.firmasContainer}>
          {/* Firma Agente */}
          <TouchableOpacity
            style={[styles.firmaBox, firmaAgente && styles.firmaBoxCompletada]}
            onPress={() => setShowFirmaAgente(true)}
          >
            {firmaAgente ?  (
              <>
                <Image source={{ uri: firmaAgente }} style={styles.firmaPreview} />
                <Text style={styles.firmaCompletadaText}>✓ Agente</Text>
              </>
            ) : (
              <>
                <Ionicons name="pencil-outline" size={30} color="#6B7280" />
                <Text style={styles.firmaPlaceholder}>Firma Agente *</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Firma Infractor */}
          <TouchableOpacity
            style={[styles.firmaBox, firmaInfractor && styles.firmaBoxCompletadaInfractor]}
            onPress={() => setShowFirmaInfractor(true)}
          >
            {firmaInfractor ? (
              <>
                <Image source={{ uri: firmaInfractor }} style={styles.firmaPreview} />
                <Text style={styles.firmaCompletadaTextInfractor}>✓ Infractor</Text>
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

        {! firmaAgente && (
          <View style={styles.alertaFirma}>
            <Ionicons name="information-circle" size={18} color="#1E40AF" />
            <Text style={styles.alertaFirmaText}>La firma del agente es obligatoria</Text>
          </View>
        )}

        {/* Resumen */}
        {form.infraccionesSeleccionadas.length > 0 && (
          <View style={styles.resumen}>
            <Text style={styles.resumenTitle}>📋 Resumen de la Multa</Text>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Placa:</Text>
              <Text style={styles.resumenValue}>{form.placa || '-'}</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Infracciones: </Text>
              <Text style={styles. resumenValue}>{form.infraccionesSeleccionadas.length}</Text>
            </View>

            <View style={styles.infraccionesLista}>
              {form.infraccionesSeleccionadas. map((id) => {
                const inf = todasLasInfracciones.find((t) => t.id === id);
                return (
                  <View key={id} style={styles.infraccionItem}>
                    <Text style={styles.infraccionItemText}>• {inf?. label}</Text>
                    <Text style={styles.infraccionItemMonto}>${inf?. monto?. toLocaleString('es-MX')}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Evidencias:</Text>
              <Text style={styles.resumenValue}>{fotos.length} foto(s)</Text>
            </View>

            <View style={styles.resumenRow}>
              <Text style={styles. resumenLabel}>Firma Agente: </Text>
              <Text style={[styles.resumenValue, { color: firmaAgente ? '#10B981' : '#EF4444' }]}>
                {firmaAgente ? '✓ Firmado' : '✗ Pendiente'}
              </Text>
            </View>

            <View style={styles. montoTotalContainer}>
              <Text style={styles.montoTotalLabel}>MONTO TOTAL: </Text>
              <Text style={styles. montoTotalValue}>${calcularMontoTotal().toLocaleString('es-MX')}</Text>
            </View>
          </View>
        )}

        <Button
          title={`Levantar Multa ${
            form.infraccionesSeleccionadas.length > 0 ? `($${calcularMontoTotal().toLocaleString('es-MX')})` : ''
          }`}
          onPress={levantarMulta}
          loading={loading}
          icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          style={{ marginTop: 20 }}
        />
      </View>

      <View style={{ height: 30 }} />

      {/* Modales de Firma */}
      <SignaturePad
        visible={showFirmaAgente}
        titulo="Firma del Agente"
        onOK={(signature) => {
          setFirmaAgente(signature);
          setShowFirmaAgente(false);
        }}
        onCancel={() => setShowFirmaAgente(false)}
      />

      <SignaturePad
        visible={showFirmaInfractor}
        titulo="Firma del Infractor"
        onOK={(signature) => {
          setFirmaInfractor(signature);
          setShowFirmaInfractor(false);
        }}
        onCancel={() => setShowFirmaInfractor(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  connectivityBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  connectivityText: { flex: 1, fontSize: 13 },
  card: { backgroundColor: '#fff', margin: 15, borderRadius: 16, padding: 20, ... SHADOWS. medium },
  label: { fontSize: 14, fontWeight: '600', color:  COLORS.gray[700], marginBottom: 10, marginTop: 15 },
  infraccionesHeader: { flexDirection:  'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  contadorBadge:  { backgroundColor: '#EEF2FF', paddingHorizontal:  10, paddingVertical: 4, borderRadius: 12 },
  contadorText: { color: '#4F46E5', fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  tiposGrid: { gap: 8 },
  tipoBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth:  1,
    borderColor: '#E5E7EB',
  },
  tipoBtnActivo: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  tipoBtnPersonalizado: { borderColor: '#A5B4FC', backgroundColor: '#EEF2FF' },
  tipoBtnContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  tipoText: { flex: 1, fontSize: 14, color: '#4B5563' },
  tipoTextActivo: { color: '#fff', fontWeight: '600' },
  tipoMonto: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  tipoMontoActivo: { color: '#fff' },
  personalizadaActions:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agregarOtraBtn:  {
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4F46E5',
    gap: 10,
    marginTop: 5,
  },
  agregarOtraText: { color:  '#4F46E5', fontSize: 14, fontWeight: '600' },
  ubicacionContainer: { marginTop: 15 },
  ubicacionInfo: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding:  12,
    borderRadius: 8,
    gap: 10,
  },
  ubicacionText: { flex: 1, fontSize: 14, color: '#4B5563' },
  coordenadas: { fontSize: 11, color: '#9CA3AF', marginTop: 5, textAlign: 'center' },
  evidenciasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems:  'center', marginTop: 15 },
  fotosContador: { flexDirection: 'row', alignItems:  'center', gap: 5 },
  fotosContadorText:  { fontSize: 12, color: '#6B7280' },
  fotosContainer: { flexDirection:  'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  fotoWrapper: { position: 'relative' },
  fotoPreview: { width: 80, height: 80, borderRadius: 8 },
  eliminarFoto: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },
  agregarFoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor:  '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agregarFotoText:  { fontSize: 10, color:  COLORS.primary, marginTop: 5 },

  // Firmas
  firmasContainer: { flexDirection: 'row', gap: 10, marginTop: 5 },
  firmaBox: {
    flex: 1,
    height: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
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
  firmaPreview: { width:  '90%', height: 60, resizeMode: 'contain' },
  firmaPlaceholder: { color: '#6B7280', marginTop: 5, fontSize: 12, fontWeight: '600' },
  firmaOpcional: { color: '#9CA3AF', fontSize: 10 },
  firmaCompletadaText:  { color: '#059669', fontWeight: 'bold', marginTop: 5, fontSize: 12 },
  firmaCompletadaTextInfractor: { color: '#1E40AF', fontWeight: 'bold', marginTop: 5, fontSize: 12 },
  alertaFirma:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  alertaFirmaText: { color: '#1E40AF', fontSize: 12, flex: 1 },

  resumen: { backgroundColor: '#F0F9FF', padding: 15, borderRadius: 12, marginTop:  20 },
  resumenTitle:  { fontSize: 16, fontWeight: 'bold', color:  '#0369A1', marginBottom: 10 },
  resumenRow: { flexDirection: 'row', justifyContent:  'space-between', marginBottom: 5 },
  resumenLabel: { color: '#0369A1' },
  resumenValue: { fontWeight: '600', color: '#0369A1' },
  infraccionesLista: { backgroundColor: '#E0F2FE', padding: 10, borderRadius: 8, marginVertical: 10 },
  infraccionItem: { flexDirection:  'row', justifyContent: 'space-between', marginBottom: 4 },
  infraccionItemText: { fontSize: 13, color: '#0369A1', flex: 1 },
  infraccionItemMonto: { fontSize: 13, fontWeight: '600', color: '#0369A1' },
  montoTotalContainer:  {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
    paddingTop: 10,
    marginTop: 10,
  },
  montoTotalLabel: { fontSize: 16, fontWeight: 'bold', color:  '#0369A1' },
  montoTotalValue:  { fontSize: 24, fontWeight: 'bold', color:  '#0369A1' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding:  20,
    width:  '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection:  'row',
    justifyContent:  'space-between',
    alignItems: 'center',
    marginBottom:  20,
  },
  modalTitle: { fontSize: 18, fontWeight:  'bold', color: '#1F2937' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8, marginTop: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor:  '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor:  '#F9FAFB',
  },
  montoInputContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  montoPrefix: { paddingLeft: 12, fontSize: 18, color: '#6B7280', fontWeight: 'bold' },
  montoInput: { flex: 1, padding: 12, fontSize: 18, fontWeight: 'bold' },
  modalButtons: { flexDirection:  'row', gap: 10, marginTop: 25 },
  modalCancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor:  '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: { color: '#6B7280', fontWeight: '600' },
  modalAddBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  modalAddText: { color: '#fff', fontWeight: '600' },
});