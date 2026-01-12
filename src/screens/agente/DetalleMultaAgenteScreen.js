import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import SignaturePad from '../../components/SignaturePad';

// Importar desde archivos separados
import { getEstatusInfo } from './constants';
import { generarPDF, formatFechaCorta, formatFechaCompleta } from './utils';
import { styles } from './styles/detalleMultaAgenteStyles';

const API_URL = 'https://multas-transito-api.onrender.com';

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

  const generarPDFMulta = async () => {
    if (!firmaAgente) {
      Alert.alert(
        'Firma Requerida',
        'Debes firmar como agente antes de generar la boleta.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (!yaFirmado) {
      const guardado = await guardarFirmas(firmaAgente, firmaInfractor);
      if (!guardado) return;
    }

    setGenerandoPDF(true);

    try {
      await generarPDF(multa, {
        fechaMulta: formatFechaCorta(multa.created_at),
        firmaAgente,
        firmaInfractor,
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setGenerandoPDF(false);
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
          <Text style={styles. infoValue2}>{formatFechaCompleta(multa.created_at)}</Text>
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