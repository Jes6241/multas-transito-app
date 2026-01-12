import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import api from '../../config/api';
import { COLORS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { guardarPago } from '../../config/pagosStorage';

// Importar componentes y utilidades del módulo pagar
import {
  styles,
  generarComprobantePagoPDF,
  METODOS_PAGO,
  obtenerPlaca,
  calcularDescuento,
  verificarVigenciaLinea,
  formatearTarjeta,
  formatearExpiracion,
  validarTarjeta,
  ModalTarjeta,
  ModalLineaCaptura,
  ModalPagoExitoso,
  ModalSubirRecibo,
  AlertaLineaVencida,
  ResumenMultaCard,
  DescuentoCard,
  TotalCard,
  MetodoPagoCard,
  SeguridadInfo,
} from './pagar';

import { TARIFAS_CORRALON, calcularCostosCorralon } from '../../config/corralon';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function PagarMultaScreen({ route, navigation }) {
  const { multa } = route.params;
  const { user } = useAuth();
  
  // Estados
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

  // Estados para corralón
  const [datosCorralon, setDatosCorralon] = useState(null);
  const [cargandoCorralon, setCargandoCorralon] = useState(true);

  const [tarjeta, setTarjeta] = useState({
    numero: '',
    nombre: '',
    expiracion: '',
    cvv: '',
  });

  // Datos calculados
  const placa = obtenerPlaca(multa);
  const descuentoBase = calcularDescuento(multa);
  
  // Calcular total incluyendo corralón usando la función centralizada
  const costoCorralon = datosCorralon ? (() => {
    const tarifasPersonalizadas = (datosCorralon.costo_grua || datosCorralon.costo_pension) ? {
      COSTO_GRUA: datosCorralon.costo_grua || TARIFAS_CORRALON.COSTO_GRUA,
      COSTO_PENSION_DIARIA: datosCorralon.costo_pension || TARIFAS_CORRALON.COSTO_PENSION_DIARIA,
      PRIMER_DIA_GRATIS: TARIFAS_CORRALON.PRIMER_DIA_GRATIS,
    } : null;
    
    const costos = calcularCostosCorralon(
      datosCorralon.fecha_ingreso,
      0, // No incluir multa aquí, se suma por separado
      tarifasPersonalizadas
    );
    
    return {
      grua: costos.costoGrua,
      pensionDiaria: costos.costoPensionDiaria,
      dias: costos.diasEstancia,
      pensionTotal: costos.costoPensionTotal,
    };
  })() : null;

  const totalCorralon = costoCorralon ? (costoCorralon.grua + costoCorralon.pensionTotal) : 0;
  
  // Si hay corralón asociado, NO aplicar descuento en la multa
  const descuento = datosCorralon ? {
    aplica: false,
    tipo: null,
    porcentaje: 0,
    montoOriginal: multa.monto || multa.monto_final,
    montoDescuento: 0,
    montoFinal: (multa.monto || multa.monto_final) + totalCorralon,
    montoMulta: multa.monto || multa.monto_final,
    incluyeCorralon: true,
    costoCorralon: totalCorralon,
    sinDescuentoPorCorralon: true,
  } : {
    ...descuentoBase,
    montoFinal: descuentoBase.montoFinal,
    montoMulta: descuentoBase.montoFinal,
    incluyeCorralon: false,
    costoCorralon: 0,
  };

  // Verificar vigencia al cargar y consultar fecha de vencimiento real
  useEffect(() => {
    const inicializar = async () => {
      // Consultar si ESTA MULTA ESPECÍFICA tiene vehículo en corralón
      // Solo asociamos el corralón si el multa_id coincide exactamente
      if (multa.id) {
        try {
          const resCorralon = await fetch(`${API_URL}/api/corralon/buscar-por-multa/${multa.id}`);
          const dataCorralon = await resCorralon.json();
          
          if (dataCorralon.success && dataCorralon.vehiculo) {
            console.log('🚗 Esta multa tiene vehículo en corralón:', dataCorralon.vehiculo.folio_remision);
            setDatosCorralon(dataCorralon.vehiculo);
          }
        } catch (error) {
          console.log('Esta multa no tiene vehículo en corralón asociado');
        } finally {
          setCargandoCorralon(false);
        }
      } else {
        setCargandoCorralon(false);
      }

      // Si hay línea de captura, consultar la fecha de vencimiento real
      if (lineaCaptura && !lineaVencida) {
        try {
          const response = await api.tesoreria.consultarLinea(lineaCaptura);
          if (response.success && response.linea) {
            const fechaReal = response.linea.fecha_vencimiento;
            setVigenciaLinea(fechaReal);
            
            // Verificar si está vencida
            const fechaVenc = new Date(fechaReal);
            const hoy = new Date();
            if (hoy > fechaVenc || response.linea.estado === 'usado') {
              setLineaVencida(true);
            }
          }
        } catch (error) {
          console.log('Error consultando línea de captura:', error);
        }
      } else {
        const vencida = verificarVigenciaLinea(vigenciaLinea, lineaCaptura);
        setLineaVencida(vencida);
      }
    };
    
    inicializar();
  }, []);

  // Generar línea de captura usando la API de Tesorería
  const generarLineaCapturaTesoreria = async () => {
    setLoading(true);
    const timestamp = Date.now();
    const referenciaUnica = `MULTA-${multa.id}-${timestamp}`;

    // Construir concepto según si incluye corralón
    let concepto = `Multa de tránsito - Folio: ${multa.folio || multa.id}`;
    if (datosCorralon) {
      concepto += ` + Liberación Corralón (Grúa + ${costoCorralon.dias} días pensión)`;
    }

    try {
      const response = await api.tesoreria.generarLineaCaptura({
        monto: descuento.montoFinal,
        concepto: concepto,
        referencia_externa: referenciaUnica,
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
              monto_final: descuento.montoFinal,
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

  // Funciones para subir recibo
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
          name: 'recibo_pago.jpg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para usar la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReciboSubido({
          uri: result.assets[0].uri,
          type: 'image',
          name: 'recibo_pago.jpg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setReciboSubido({
          uri: result.assets[0].uri,
          type: 'pdf',
          name: result.assets[0].name || 'recibo_pago.pdf',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const enviarRecibo = async () => {
    if (!reciboSubido) {
      Alert.alert('Error', 'Por favor selecciona o toma una foto del recibo');
      return;
    }

    setSubiendoRecibo(true);

    try {
      // Simular subida del recibo
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubiendoRecibo(false);
      setModalSubirRecibo(false);

      Alert.alert(
        '✅ Recibo Enviado',
        'Tu comprobante de pago ha sido enviado exitosamente. Validaremos tu pago en las próximas 24-48 horas.',
        [{ text: 'Entendido', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      setSubiendoRecibo(false);
      Alert.alert('Error', 'No se pudo enviar el recibo. Intenta de nuevo.');
    }
  };

  // Generar PDF del comprobante de pago
  const generarPDF = async () => {
    try {
      setLoading(true);
      
      // Construir datos del corralón si existen
      const datosCorralónPDF = datosCorralon ? {
        corralon_nombre: datosCorralon.corralones?.nombre || 'Corralón Municipal',
        corralon_direccion: datosCorralon.corralones?.direccion || datosCorralon.direccion_corralon,
        folio_remision: datosCorralon.folio_remision,
        tarjeton_resguardo: datosCorralon.tarjeton_resguardo,
        folio_multa: multa.folio,
        monto_multa: multa.monto,
        costo_grua: costoCorralon.grua,
        costo_pension_total: costoCorralon.pensionTotal,
        dias_estancia: costoCorralon.dias,
      } : null;
      
      // Usar el generador unificado de comprobante de pago
      await generarComprobantePagoPDF({
        ...multa,
        monto_pagado: descuento.montoFinal,
        placa: placa,
      }, datosCorralónPDF);
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo generar el PDF');
      console.error(error);
    }
  };

  // Procesar pago con tarjeta
  const procesarPagoTarjeta = async () => {
    const validation = validarTarjeta(tarjeta);
    if (!validation.valid) {
      Alert.alert('Error', validation.error);
      return;
    }

    setLoading(true);
    setModalTarjeta(false);

    // Simular procesamiento del pago (en producción iría al gateway de pago)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const referenciaPago = `TARJETA-${Date.now()}`;
      
      // 1. Marcar la línea de captura como usada en Tesorería
      if (lineaCaptura) {
        const resultadoTesoreria = await api.tesoreria.usarLinea(lineaCaptura, {
          referencia_pago: referenciaPago,
          usado_por: 'ciudadano_app',
        });
        
        console.log('Línea de captura marcada como usada:', resultadoTesoreria);
      }

      // 2. Actualizar estatus de la multa en el servidor
      const datosActualizacion = {
        estatus: 'pagada',
        fecha_pago: new Date().toISOString(),
        metodo_pago: 'tarjeta',
        monto_pagado: descuento.montoFinal,
        referencia_pago: referenciaPago,
      };
      
      const resultadoMulta = await api.actualizarMulta(multa.id, datosActualizacion);
      console.log('Multa actualizada:', resultadoMulta);

      // 2.5. Si hay vehículo en corralón, actualizar estado a listo_liberar
      if (datosCorralon) {
        try {
          await fetch(`${API_URL}/api/corralon/${datosCorralon.id}/pago-completado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referencia_pago: referenciaPago,
              monto_pagado: descuento.montoFinal,
              incluye_multa: true,
              incluye_grua: true,
              incluye_pension: true,
              dias_pension: costoCorralon.dias,
            }),
          });
          console.log('✅ Corralón actualizado - Vehículo listo para liberar');
        } catch (error) {
          console.log('Error actualizando corralón:', error);
        }
      }

      // 3. Actualizar el objeto multa local
      multa.estatus = 'pagada';
      multa.fecha_pago = datosActualizacion.fecha_pago;
      multa.metodo_pago = 'tarjeta';
      multa.monto_pagado = descuento.montoFinal;
      multa.referencia_pago = referenciaPago;

      // 4. Guardar el pago localmente para el historial
      if (user?.id) {
        await guardarPago(user.id, {
          id: multa.id,
          folio: multa.folio,
          placa: placa,
          monto_pagado: descuento.montoFinal,
          fecha_pago: datosActualizacion.fecha_pago,
          metodo_pago: 'tarjeta',
          linea_captura: lineaCaptura,
          referencia_pago: referenciaPago,
          tipo_infraccion: multa.tipo_infraccion,
          direccion: multa.direccion,
          fecha_infraccion: multa.fecha_infraccion || multa.created_at,
        });
      }

      setLoading(false);
      setPagoExitoso(true);
      setModalVisible(true);

      // Generar comprobante de pago
      setTimeout(async () => {
        await generarPDF();
      }, 500);

    } catch (error) {
      console.error('Error procesando pago:', error);
      setLoading(false);
      
      // Aún así mostrar éxito (pago simulado)
      Alert.alert(
        '✅ Pago Procesado',
        'Tu pago fue procesado exitosamente.\n\nNota: La actualización del estado puede tardar unos minutos.',
        [
          {
            text: 'Ver Comprobante',
            onPress: () => {
              setPagoExitoso(true);
              setModalVisible(true);
            }
          }
        ]
      );
    }
  };

  // Manejar selección de método de pago
  const handleMetodoPago = () => {
    if (!metodoPago) {
      Alert.alert('Error', 'Selecciona un método de pago');
      return;
    }

    if (metodoPago === 'tarjeta') {
      setModalTarjeta(true);
    } else if (metodoPago === 'linea_captura') {
      // Línea de captura - Generar si no existe o está vencida
      if (!lineaCaptura || lineaVencida) {
        generarLineaCapturaTesoreria();
      }
      setModalVisible(true);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Alerta de línea vencida */}
      {lineaVencida && lineaCaptura && (
        <AlertaLineaVencida onRenovar={generarLineaCapturaTesoreria} />
      )}

      {/* Resumen de la multa */}
      <ResumenMultaCard
        multa={multa}
        placa={placa}
        lineaCaptura={lineaCaptura}
        vigenciaLinea={vigenciaLinea}
        lineaVencida={lineaVencida}
      />

      {/* Costos de Corralón (si aplica) */}
      {datosCorralon && (
        <View style={styles.corralónCard}>
          <View style={styles.corralónHeader}>
            <Ionicons name="car" size={24} color="#EF4444" />
            <Text style={styles.corralónTitle}>🚨 Vehículo en Corralón</Text>
          </View>
          
          <Text style={styles.corralónSubtitle}>
            Tu vehículo se encuentra en {datosCorralon.corralones?.nombre || 'el corralón'}. 
            Los costos de liberación se incluyen en este pago.
          </Text>

          <View style={styles.corralónDesglose}>
            <View style={styles.corralónRow}>
              <Text style={styles.corralónLabel}>Servicio de grúa:</Text>
              <Text style={styles.corralónValue}>${costoCorralon.grua.toLocaleString('es-MX')}</Text>
            </View>
            
            <View style={styles.corralónRow}>
              <Text style={styles.corralónLabel}>Pensión ({costoCorralon.dias} {costoCorralon.dias === 1 ? 'día' : 'días'} × ${costoCorralon.pensionDiaria}):</Text>
              <Text style={styles.corralónValue}>${costoCorralon.pensionTotal.toLocaleString('es-MX')}</Text>
            </View>

            <View style={[styles.corralónRow, styles.corralónSubtotal]}>
              <Text style={styles.corralónLabelBold}>Subtotal corralón:</Text>
              <Text style={styles.corralónValueBold}>${totalCorralon.toLocaleString('es-MX')}</Text>
            </View>
          </View>

          <Text style={styles.corralónNota}>
            📍 {datosCorralon.corralones?.direccion || datosCorralon.direccion_corralon}
          </Text>
        </View>
      )}

      {cargandoCorralon && (
        <View style={styles.loadingCorralon}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingCorralónText}>Verificando estado del vehículo...</Text>
        </View>
      )}

      {/* Descuento */}
      {descuento.aplica && <DescuentoCard descuento={descuento} />}

      {/* Total a pagar */}
      <TotalCard monto={descuento.montoFinal} />

      {/* Métodos de pago */}
      <Text style={styles.sectionTitle}>Selecciona método de pago</Text>

      {METODOS_PAGO.map((metodo) => (
        <MetodoPagoCard
          key={metodo.id}
          metodo={metodo}
          selected={metodoPago === metodo.id}
          onSelect={() => setMetodoPago(metodo.id)}
        />
      ))}

      {/* Botón de pagar */}
      <TouchableOpacity
        style={[styles.pagarBtn, !metodoPago && styles.pagarBtnDisabled]}
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
      <SeguridadInfo />

      {/* Modales */}
      <ModalTarjeta
        visible={modalTarjeta}
        onClose={() => setModalTarjeta(false)}
        tarjeta={tarjeta}
        setTarjeta={setTarjeta}
        formatearTarjeta={formatearTarjeta}
        formatearExpiracion={formatearExpiracion}
        descuento={descuento}
        onPagar={procesarPagoTarjeta}
        loading={loading}
      />

      <ModalLineaCaptura
        visible={modalVisible && !pagoExitoso}
        onClose={() => setModalVisible(false)}
        metodoPago={metodoPago}
        lineaCaptura={lineaCaptura}
        vigenciaLinea={vigenciaLinea}
        descuento={descuento}
        multa={multa}
        onSubirComprobante={() => {
          setModalVisible(false);
          setModalSubirRecibo(true);
        }}
      />

      <ModalPagoExitoso
        visible={modalVisible && pagoExitoso}
        onClose={() => setModalVisible(false)}
        lineaCaptura={lineaCaptura}
        descuento={descuento}
        multa={multa}
        placa={placa}
        onDescargarPDF={generarPDF}
        navigation={navigation}
      />

      <ModalSubirRecibo
        visible={modalSubirRecibo}
        onClose={() => setModalSubirRecibo(false)}
        reciboSubido={reciboSubido}
        setReciboSubido={setReciboSubido}
        tomarFoto={tomarFoto}
        seleccionarImagen={seleccionarImagen}
        seleccionarPDF={seleccionarPDF}
        multa={multa}
        lineaCaptura={lineaCaptura}
        descuento={descuento}
        onEnviar={enviarRecibo}
        subiendoRecibo={subiendoRecibo}
      />

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}
