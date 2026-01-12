import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS } from '../../config/theme';

const API_URL = 'https://multas-transito-api.onrender.com';
const { width } = Dimensions.get('window');

// Configuración de costos
const COSTOS = {
  arrastre: 850,
  porDia: 150,
  primerDiaGratis: false,
};

export default function DetalleVehiculoCorralónScreen({ route, navigation }) {
  const { vehiculo } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingMulta, setLoadingMulta] = useState(true);
  const [loadingFotos, setLoadingFotos] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [multa, setMulta] = useState(null);
  const [fotosIngreso, setFotosIngreso] = useState([]);
  const [fotosLiberacion, setFotosLiberacion] = useState([]);
  const [fotosNuevasLiberacion, setFotosNuevasLiberacion] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    if (vehiculo.multa_id) {
      cargarMulta();
    } else {
      setLoadingMulta(false);
    }
    cargarFotos();
  };

  const cargarMulta = async () => {
    try {
      const response = await fetch(`${API_URL}/api/multas`);
      const data = await response.json();

      if (data. success) {
        const multaEncontrada = data.multas.find((m) => m.id === vehiculo.multa_id);
        if (multaEncontrada) {
          setMulta(multaEncontrada);
        }
      }
    } catch (error) {
      console.error('Error cargando multa:', error);
    } finally {
      setLoadingMulta(false);
    }
  };

  const cargarFotos = async () => {
    try {
      console.log('📷 Cargando fotos del vehículo:', vehiculo.id);
      const response = await fetch(`${API_URL}/api/corralon/${vehiculo. id}/fotos`);
      const data = await response.json();

      if (data.success && data.fotos) {
        const ingreso = data.fotos.filter((f) => f.tipo === 'ingreso');
        const liberacion = data. fotos.filter((f) => f.tipo === 'liberacion');
        setFotosIngreso(ingreso);
        setFotosLiberacion(liberacion);
        console.log(`✅ Fotos cargadas:  ${ingreso.length} ingreso, ${liberacion.length} liberación`);
      }
    } catch (error) {
      console.error('Error cargando fotos:', error);
    } finally {
      setLoadingFotos(false);
    }
  };

  const abrirFoto = (foto) => {
    setFotoSeleccionada(foto);
    setModalVisible(true);
  };

  const calcularDiasRetenido = () => {
    if (!vehiculo.fecha_ingreso) return 1;
    const ingreso = new Date(vehiculo. fecha_ingreso);
    const hoy = new Date();
    const dias = Math.ceil((hoy - ingreso) / (1000 * 60 * 60 * 24));
    return dias < 1 ? 1 : dias;
  };

  const calcularCostos = () => {
    const dias = calcularDiasRetenido();
    const diasCobrar = COSTOS. primerDiaGratis ? Math.max(0, dias - 1) : dias;
    const costoArrastre = COSTOS.arrastre;
    const costoEstancia = diasCobrar * COSTOS.porDia;
    const costoMulta = multa?. monto_final || 0;
    const total = costoArrastre + costoEstancia + costoMulta;

    return { dias, diasCobrar, costoArrastre, costoEstancia, costoMulta, total };
  };

  const costos = calcularCostos();
  const multaPagada = multa?. estatus === 'pagada';
  const yaLiberado = vehiculo.estatus === 'liberado';

  // Tomar foto de liberación
  const tomarFotoLiberacion = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing:  false,
        quality:  0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFotosNuevasLiberacion([...fotosNuevasLiberacion, {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        }]);
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
    }
  };

  const eliminarFotoNueva = (index) => {
    setFotosNuevasLiberacion(fotosNuevasLiberacion. filter((_, i) => i !== index));
  };

  // Generar recibo PDF
  const generarReciboPDF = async () => {
    setGenerandoPDF(true);

    const fechaActual = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const fechaIngreso = new Date(vehiculo.fecha_ingreso).toLocaleDateString('es-MX', {
      year:  'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo de Liberación</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica', Arial, sans-serif; padding: 20px; color: #1F2937; }
          .header { text-align: center; border-bottom: 3px solid #7C3AED; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size:  24px; font-weight: bold; color: #7C3AED; }
          .titulo { font-size:  20px; color: #1F2937; margin-top: 10px; }
          .subtitulo { font-size: 12px; color: #6B7280; margin-top: 5px; }
          .seccion { margin-bottom:  20px; padding: 15px; background-color: #F9FAFB; border-radius: 8px; }
          .seccion-titulo { font-size: 14px; font-weight: bold; color: #7C3AED; margin-bottom: 10px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; }
          .fila { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
          .fila:last-child { border-bottom:  none; }
          .etiqueta { color: #6B7280; font-size: 12px; }
          .valor { font-weight:  600; font-size: 12px; text-align: right; }
          .total-seccion { background-color: #7C3AED; color: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .total-titulo { font-size:  14px; opacity: 0.9; }
          .total-valor { font-size: 28px; font-weight: bold; text-align: right; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 20px; }
          .estado-pagado { background-color: #D1FAE5; color:  #059669; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          . firma-seccion { margin-top: 40px; display: flex; justify-content: space-between; }
          .firma-box { width: 45%; text-align:  center; }
          .firma-linea { border-top: 1px solid #1F2937; margin-top: 50px; padding-top: 5px; font-size: 11px; color: #6B7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🚗 CORRALÓN MUNICIPAL</div>
          <div class="titulo">RECIBO DE LIBERACIÓN DE VEHÍCULO</div>
          <div class="subtitulo">Folio: ${vehiculo. folio_remision}</div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">📋 DATOS DE LA REMISIÓN</div>
          <div class="fila"><span class="etiqueta">Folio de Remisión:</span><span class="valor">${vehiculo.folio_remision}</span></div>
          <div class="fila"><span class="etiqueta">Tarjetón de Resguardo:</span><span class="valor">${vehiculo.tarjeton_resguardo}</span></div>
          <div class="fila"><span class="etiqueta">Ubicación de Infracción:</span><span class="valor">${vehiculo.ubicacion || 'N/A'}</span></div>
          <div class="fila"><span class="etiqueta">Corralón:</span><span class="valor">${vehiculo.corralones?. nombre || 'N/A'}</span></div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">📅 FECHAS</div>
          <div class="fila"><span class="etiqueta">Fecha de Ingreso: </span><span class="valor">${fechaIngreso}</span></div>
          <div class="fila"><span class="etiqueta">Fecha de Liberación: </span><span class="valor">${fechaActual}</span></div>
          <div class="fila"><span class="etiqueta">Días en Corralón: </span><span class="valor">${costos.dias} día${costos.dias !== 1 ? 's' : ''}</span></div>
        </div>

        ${multa ? `
        <div class="seccion">
          <div class="seccion-titulo">📝 DATOS DE LA MULTA</div>
          <div class="fila"><span class="etiqueta">Folio de Multa:</span><span class="valor">${multa.folio}</span></div>
          <div class="fila"><span class="etiqueta">Tipo de Infracción:</span><span class="valor">${multa.tipo_infraccion}</span></div>
          <div class="fila"><span class="etiqueta">Estado de Pago:</span><span class="valor"><span class="estado-pagado">✓ PAGADA</span></span></div>
        </div>
        ` : ''}

        <div class="seccion">
          <div class="seccion-titulo">💰 DESGLOSE DE COSTOS</div>
          <div class="fila"><span class="etiqueta">Servicio de Arrastre (Grúa):</span><span class="valor">$${costos.costoArrastre. toLocaleString()} MXN</span></div>
          <div class="fila"><span class="etiqueta">Estancia en Corralón (${costos.dias} días × $${COSTOS.porDia}):</span><span class="valor">$${costos.costoEstancia.toLocaleString()} MXN</span></div>
          ${multa ? `<div class="fila"><span class="etiqueta">Multa:</span><span class="valor">$${costos.costoMulta.toLocaleString()} MXN</span></div>` : ''}
        </div>

        <div class="total-seccion">
          <div class="total-titulo">TOTAL PAGADO</div>
          <div class="total-valor">$${costos.total.toLocaleString()} MXN</div>
        </div>

        <div class="firma-seccion">
          <div class="firma-box"><div class="firma-linea">Firma del Personal</div></div>
          <div class="firma-box"><div class="firma-linea">Firma del Propietario</div></div>
        </div>

        <div class="footer">
          <p>Este documento es un comprobante oficial de liberación de vehículo.</p>
          <p>Conserve este recibo para cualquier aclaración. </p>
          <p style="margin-top:  10px;">Generado el ${fechaActual}</p>
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
          dialogTitle: 'Compartir Recibo de Liberación',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Generado', `Archivo guardado en: ${uri}`);
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      setGenerandoPDF(false);
      Alert.alert('Error', 'No se pudo generar el recibo PDF');
    }
  };

  const liberarVehiculo = () => {
    if (multa && ! multaPagada) {
      Alert.alert(
        '❌ No se puede liberar',
        `La multa ${multa.folio} aún no ha sido pagada.\n\n` +
        `💰 TOTAL A PAGAR: $${costos.total.toLocaleString()} MXN\n\n` +
        `El ciudadano debe pagar la multa primero. `,
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (fotosNuevasLiberacion.length === 0) {
      Alert.alert(
        '📷 Fotos requeridas',
        'Debes tomar al menos una foto del vehículo antes de liberarlo.',
        [{ text:  'Entendido' }]
      );
      return;
    }

    confirmarLiberacion();
  };

  const confirmarLiberacion = () => {
    Alert.alert(
      '🔓 Confirmar Liberación',
      `¿Confirmas la liberación del vehículo?\n\n` +
      `Folio: ${vehiculo.folio_remision}\n` +
      `Total cobrado: $${costos.total.toLocaleString()} MXN\n` +
      `Fotos tomadas: ${fotosNuevasLiberacion.length}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Liberar',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(
                `${API_URL}/api/corralon/${vehiculo.id}/liberar`,
                {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON. stringify({
                    fotos_liberacion: fotosNuevasLiberacion. map((f) => f.base64),
                  }),
                }
              );

              const data = await response. json();

              if (data.success) {
                Alert. alert(
                  '✅ Vehículo Liberado',
                  '¿Deseas generar el recibo PDF?',
                  [
                    { text:  'No', onPress: () => navigation.goBack() },
                    {
                      text:  'Sí, generar',
                      onPress: async () => {
                        await generarReciboPDF();
                        navigation.goBack();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', data.error || 'No se pudo liberar');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo conectar con el servidor');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getEstatusInfo = (estatus) => {
    switch (estatus) {
      case 'ingresado':
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'Ingresado', icon: 'enter' };
      case 'pendiente_pago':
        return { bg: '#FEF3C7', text: '#92400E', label: 'Pendiente Pago', icon:  'card' };
      case 'listo_liberar':
        return { bg: '#D1FAE5', text: '#065F46', label:  'Listo para Liberar', icon: 'checkmark-circle' };
      case 'liberado':
        return { bg: '#E5E7EB', text: '#374151', label: 'Liberado', icon: 'exit' };
      default:
        return { bg: '#E5E7EB', text: '#374151', label: estatus, icon: 'help' };
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const estatusInfo = getEstatusInfo(vehiculo.estatus);

  return (
    <ScrollView style={styles. container}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: estatusInfo.bg }]}>
        <Ionicons name={estatusInfo.icon} size={50} color={estatusInfo.text} />
        <Text style={[styles.headerEstatus, { color:  estatusInfo.text }]}>
          {estatusInfo. label}
        </Text>
        {! yaLiberado && (
          <Text style={[styles. headerDias, { color: estatusInfo.text }]}>
            {costos.dias} día{costos.dias !== 1 ? 's' : ''} en corralón
          </Text>
        )}
      </View>

      {/* Información */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="document-text" size={20} color={COLORS.primary} /> Información
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Folio:</Text>
          <Text style={styles.infoValue}>{vehiculo.folio_remision}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles. infoLabel}>Tarjetón: </Text>
          <Text style={styles. infoValue}>{vehiculo.tarjeton_resguardo}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ingreso:</Text>
          <Text style={styles.infoValue}>{formatFecha(vehiculo.fecha_ingreso)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Corralón:</Text>
          <Text style={styles.infoValue}>{vehiculo.corralones?.nombre || 'N/A'}</Text>
        </View>
        {vehiculo.fecha_liberacion && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Liberado:</Text>
            <Text style={[styles.infoValue, { color: '#059669' }]}>
              {formatFecha(vehiculo.fecha_liberacion)}
            </Text>
          </View>
        )}
      </View>

      {/* Fotos de Ingreso */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="camera" size={20} color={COLORS.primary} /> Fotos de Ingreso
        </Text>

        {loadingFotos ?  (
          <View style={styles.loadingFotos}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingFotosText}>Cargando fotos...</Text>
          </View>
        ) : fotosIngreso.length > 0 ? (
          <View style={styles.fotosGrid}>
            {fotosIngreso.map((foto, index) => (
              <TouchableOpacity
                key={foto.id || index}
                style={styles.fotoContainer}
                onPress={() => abrirFoto(foto)}
              >
                <Image source={{ uri: foto. url }} style={styles. fotoThumbnail} />
                <View style={styles.fotoOverlay}>
                  <Ionicons name="expand" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noFotos}>
            <Ionicons name="image-outline" size={40} color="#D1D5DB" />
            <Text style={styles.noFotosText}>No hay fotos de ingreso</Text>
          </View>
        )}
      </View>

      {/* Fotos de Liberación (si ya fue liberado) */}
      {yaLiberado && fotosLiberacion. length > 0 && (
        <View style={styles. card}>
          <Text style={styles. cardTitle}>
            <Ionicons name="camera" size={20} color="#059669" /> Fotos de Liberación
          </Text>
          <View style={styles.fotosGrid}>
            {fotosLiberacion.map((foto, index) => (
              <TouchableOpacity
                key={foto.id || index}
                style={styles.fotoContainer}
                onPress={() => abrirFoto(foto)}
              >
                <Image source={{ uri: foto.url }} style={styles.fotoThumbnail} />
                <View style={[styles.fotoOverlay, { backgroundColor:  'rgba(5, 150, 105, 0.5)' }]}>
                  <Ionicons name="expand" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Multa */}
      <View style={styles. card}>
        <Text style={styles. cardTitle}>
          <Ionicons name="receipt" size={20} color={COLORS. primary} /> Multa
        </Text>
        {loadingMulta ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : multa ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Folio:</Text>
              <Text style={styles.infoValue}>{multa.folio}</Text>
            </View>
            <View style={styles. infoRow}>
              <Text style={styles.infoLabel}>Monto:</Text>
              <Text style={styles.infoValueMoney}>${multa.monto_final?. toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado:</Text>
              <View style={[styles.badge, multaPagada ? styles.badgePagado : styles.badgePendiente]}>
                <Text style={[styles.badgeText, { color: multaPagada ? '#059669' : '#DC2626' }]}>
                  {multaPagada ?  '✓ PAGADA' : '✗ NO PAGADA'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.noMulta}>No hay multa asociada</Text>
        )}
      </View>

      {/* Costos */}
      {! yaLiberado && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="calculator" size={20} color={COLORS. primary} /> Costos
          </Text>
          <View style={styles.costoRow}>
            <Text style={styles.costoLabel}>Arrastre (grúa)</Text>
            <Text style={styles. costoValor}>${costos.costoArrastre.toLocaleString()}</Text>
          </View>
          <View style={styles.costoRow}>
            <Text style={styles.costoLabel}>Estancia ({costos.dias} días)</Text>
            <Text style={styles. costoValor}>${costos.costoEstancia.toLocaleString()}</Text>
          </View>
          {multa && (
            <View style={styles.costoRow}>
              <Text style={[styles.costoLabel, ! multaPagada && { color: '#DC2626' }]}>
                Multa {multaPagada ? '(pagada)' : '(pendiente)'}
              </Text>
              <Text style={styles.costoValor}>${costos.costoMulta.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles. totalLabel}>TOTAL</Text>
            <Text style={styles. totalValor}>${costos.total. toLocaleString()}</Text>
          </View>
        </View>
      )}

      {/* Fotos para liberación (solo si no está liberado) */}
      {! yaLiberado && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="camera" size={20} color={COLORS.primary} /> Fotos de Liberación *
          </Text>
          <Text style={styles.cardSubtitle}>
            Toma fotos del estado del vehículo al momento de liberarlo
          </Text>

          <View style={styles. fotosNuevasContainer}>
            {fotosNuevasLiberacion.map((foto, index) => (
              <TouchableOpacity
                key={index}
                style={styles.fotoNuevaWrapper}
                onPress={() => eliminarFotoNueva(index)}
              >
                <Image source={{ uri:  foto.uri }} style={styles. fotoNuevaPreview} />
                <View style={styles.fotoNuevaDelete}>
                  <Ionicons name="close" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}

            {fotosNuevasLiberacion.length < 5 && (
              <TouchableOpacity style={styles.agregarFoto} onPress={tomarFotoLiberacion}>
                <Ionicons name="camera" size={28} color={COLORS.primary} />
                <Text style={styles.agregarFotoText}>Tomar foto</Text>
              </TouchableOpacity>
            )}
          </View>

          {fotosNuevasLiberacion.length === 0 && (
            <View style={styles.alerta}>
              <Ionicons name="warning" size={18} color="#F59E0B" />
              <Text style={styles.alertaText}>Debes tomar al menos una foto</Text>
            </View>
          )}
        </View>
      )}

      {/* Botones */}
      {!yaLiberado && (
        <View style={styles. botonesContainer}>
          <TouchableOpacity
            style={[
              styles.liberarBtn,
              (multaPagada || ! multa) && fotosNuevasLiberacion.length > 0
                ?  styles.liberarBtnActivo
                : styles.liberarBtnDisabled,
            ]}
            onPress={liberarVehiculo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={multaPagada || !multa ? 'lock-open' : 'lock-closed'} size={22} color="#fff" />
                <Text style={styles.liberarBtnText}>
                  {multaPagada || !multa ?  'Liberar Vehículo' : 'Multa Pendiente'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Ya liberado */}
      {yaLiberado && (
        <View style={styles.liberadoContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#059669" />
          <Text style={styles.liberadoText}>Vehículo Liberado</Text>
          <Text style={styles.liberadoFecha}>{formatFecha(vehiculo.fecha_liberacion)}</Text>

          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={generarReciboPDF}
            disabled={generandoPDF}
          >
            {generandoPDF ?  (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.pdfBtnText}>Generar Recibo PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 30 }} />

      {/* Modal para ver foto grande */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles. modalContainer}>
          <TouchableOpacity
            style={styles. modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>

          {fotoSeleccionada && (
            <Image
              source={{ uri:  fotoSeleccionada.url }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}

          {fotoSeleccionada?. descripcion && (
            <Text style={styles.modalDescripcion}>{fotoSeleccionada.descripcion}</Text>
          )}
        </View>
      </Modal>
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
  headerEstatus: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  headerDias: { fontSize: 14, marginTop: 5, opacity: 0.8 },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding:  15,
    ... SHADOWS.small,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: { color: '#6B7280', fontSize: 14 },
  infoValue: { fontWeight: '600', fontSize: 14, color: '#1F2937', flex: 1, textAlign: 'right' },
  infoValueMoney:  { fontWeight: 'bold', fontSize: 16, color: '#1E40AF' },
  badge: { paddingHorizontal:  10, paddingVertical: 4, borderRadius: 12 },
  badgePagado: { backgroundColor: '#D1FAE5' },
  badgePendiente: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  noMulta: { color:  '#6B7280', fontStyle: 'italic' },

  // Fotos de ingreso/liberación
  loadingFotos:  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingFotosText: { color: '#6B7280' },
  fotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fotoContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fotoThumbnail:  {
    width:  (width - 70) / 3,
    height: (width - 70) / 3,
    borderRadius: 8,
  },
  fotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right:  0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 5,
    alignItems: 'center',
  },
  noFotos: {
    alignItems: 'center',
    padding: 20,
  },
  noFotosText:  { color: '#9CA3AF', marginTop: 10 },

  // Costos
  costoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  costoLabel:  { color: '#4B5563', fontSize: 14 },
  costoValor: { fontWeight: '600', fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: { fontWeight: 'bold', fontSize: 16, color: '#1F2937' },
  totalValor:  { fontWeight: 'bold', fontSize:  22, color: '#059669' },

  // Fotos nuevas para liberación
  fotosNuevasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fotoNuevaWrapper: { position: 'relative' },
  fotoNuevaPreview: { width: 70, height: 70, borderRadius: 8 },
  fotoNuevaDelete: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 20,
    height:  20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agregarFoto: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor:  COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4FF',
  },
  agregarFotoText:  { fontSize: 9, color:  COLORS.primary, marginTop: 2 },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  alertaText: { color: '#92400E', fontSize: 13 },

  // Botones
  botonesContainer: { padding: 15 },
  liberarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  liberarBtnActivo: { backgroundColor: '#059669' },
  liberarBtnDisabled:  { backgroundColor: '#9CA3AF' },
  liberarBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Liberado
  liberadoContainer: {
    alignItems: 'center',
    padding:  25,
    margin: 15,
    backgroundColor: '#D1FAE5',
    borderRadius:  16,
  },
  liberadoText: { fontSize: 18, fontWeight: 'bold', color: '#059669', marginTop: 10 },
  liberadoFecha: { fontSize: 14, color: '#065F46', marginTop: 5 },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal:  20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  pdfBtnText: { color: '#fff', fontWeight: '600' },

  // Modal
  modalContainer:  {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose:  {
    position:  'absolute',
    top: 50,
    right:  20,
    zIndex: 10,
  },
  modalImage: {
    width: width - 40,
    height:  width - 40,
    borderRadius: 12,
  },
  modalDescripcion: {
    color: '#fff',
    fontSize:  14,
    marginTop: 15,
    textAlign: 'center',
  },
});