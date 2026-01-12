import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { getPDFStyles } from './pdfStyles';
import { TIPOS_INFRACCION, formatearFundamento } from '../constants/infracciones';

// URL de la API de Tesorería
const TESORERIA_URL = 'https://lineas-captura-api.onrender.com';

/**
 * Formatea una fecha para mostrar en el PDF
 */
export const formatFechaCorta = (fecha) => {
  if (!fecha) return 'N/A';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formatea una fecha completa
 */
export const formatFechaCompleta = (fecha) => {
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

/**
 * Calcula el dígito verificador usando algoritmo módulo 10 (similar a Luhn)
 * @param {string} numeros - Cadena de 10 dígitos
 * @returns {string} - Dígito verificador (0-9)
 */
const calcularDigitoVerificador = (numeros) => {
  let suma = 0;
  for (let i = 0; i < numeros.length; i++) {
    let digito = parseInt(numeros[i], 10);
    // Multiplicar por 2 los dígitos en posiciones impares (0-indexed)
    if (i % 2 === 0) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
  }
  const resto = suma % 10;
  return resto === 0 ? '0' : (10 - resto).toString();
};

/**
 * Mapeo de IDs de infracción a códigos de folio
 * Basado en el Reglamento de Tránsito de la CDMX
 */
const CODIGOS_INFRACCION = {
  'estacionamiento': '01',
  'exceso_velocidad': '02',
  'semaforo': '03',
  'carril_confinado': '04',
  'sin_licencia': '05',
  'verificacion': '06',
  'doble_fila': '07',
  'obstruccion': '08',
  'cinturon': '10',
  'celular': '11',
  'alcoholemia': '12',
  'luces': '13',
  'casco': '14',
  'documentos': '15',
  'vuelta_prohibida': '16',
  'paso_peatonal': '17',
  'hoy_no_circula': '18',
  'invasion_ciclovia': '19',
  'bloqueo_crucero': '20',
};

/**
 * Genera un folio único con formato oficial de multas de tránsito CDMX
 * 
 * ONLINE (11 caracteres): TT-AAA-TTTTT-V
 * - 2 dígitos: tipo de infracción (01-20)
 * - 3 dígitos: ID del agente (garantiza unicidad entre agentes)
 * - 5 dígitos: timestamp único (últimos 5 dígitos del timestamp en segundos)
 * - 1 dígito: verificador (Luhn)
 * 
 * OFFLINE (14 caracteres): AAA-TT-SSSSSSSS-V
 * - 3 dígitos: ID del agente
 * - 2 dígitos: tipo de infracción (01-20)
 * - 8 dígitos: timestamp completo (garantiza unicidad temporal)
 * - 1 dígito: verificador (Luhn)
 * 
 * El folio generado es DEFINITIVO y no debe cambiar nunca.
 */
export const generarFolioTemporal = (tipoInfraccionId = 'otros', esOffline = false, agenteId = null) => {
  // Obtener código de infracción (default: 09 para "otros")
  const codigo = CODIGOS_INFRACCION[tipoInfraccionId] || '09';
  
  // ID del agente (3 dígitos) - usar 000 si no hay ID
  const agenteCode = agenteId 
    ? (parseInt(agenteId) % 1000).toString().padStart(3, '0')
    : Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // Timestamp actual
  const now = Date.now();
  
  let folioBase;
  
  if (esOffline) {
    // OFFLINE (14 caracteres sin verificador):
    // Formato: AAA + TT + SSSSSSSS (3+2+8 = 13 + 1 verificador = 14)
    // Usamos timestamp completo para máxima unicidad
    const timestampFull = (now % 100000000).toString().padStart(8, '0');
    folioBase = agenteCode + codigo + timestampFull;
  } else {
    // ONLINE (11 caracteres sin verificador):
    // Formato: TT + AAA + SSSSS (2+3+5 = 10 + 1 verificador = 11)
    // Combinamos ID de agente + timestamp para garantizar unicidad
    const timestampShort = (now % 100000).toString().padStart(5, '0');
    folioBase = codigo + agenteCode + timestampShort;
  }
  
  // Calcular dígito verificador
  const digitoVerificador = calcularDigitoVerificador(folioBase);
  
  return `${folioBase}${digitoVerificador}`;
};

/**
 * Genera una línea de captura local (SOLO para fallback offline)
 * Formato: XXXX-XXXX-XXXX-XXXX-XXXX (20 dígitos)
 */
export const generarLineaCapturaLocal = () => {
  const parte1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const parte2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const parte3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const parte4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const parte5 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${parte1}-${parte2}-${parte3}-${parte4}-${parte5}`;
};

// Alias para compatibilidad
export const generarLineaCaptura = generarLineaCapturaLocal;

/**
 * Genera una línea de captura usando la API de Tesorería
 * @param {Object} datos - Datos de la multa
 * @param {number} datos.monto - Monto de la multa
 * @param {string} datos.folio - Folio de la multa
 * @param {string} datos.concepto - Descripción de la infracción
 * @param {string} datos.placa - Placa del vehículo (opcional, para referencia)
 * @returns {Promise<Object>} - Objeto con código y fecha_vencimiento
 */
export const generarLineaCapturaTesoreria = async (datos) => {
  // Crear referencia única: FOLIO + TIMESTAMP (garantiza que nunca se repita)
  const timestamp = Date.now();
  const referenciaUnica = `MULTA-${datos.folio}-${timestamp}`;
  
  try {
    const response = await fetch(`${TESORERIA_URL}/api/lineas/generar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monto: datos.monto,
        concepto: datos.concepto || `Multa de tránsito - Folio: ${datos.folio}`,
        referencia_externa: referenciaUnica,
      }),
    });

    const result = await response.json();

    if (result.success && result.linea) {
      return {
        success: true,
        codigo: result.linea.codigo,
        fecha_vencimiento: result.linea.fecha_vencimiento,
        id: result.linea.id,
        estado: result.linea.estado,
        referencia_externa: referenciaUnica,
      };
    } else {
      throw new Error(result.error || 'Error al generar línea de captura');
    }
  } catch (error) {
    console.error('Error llamando a API de Tesorería:', error);
    // Fallback a línea local si falla la API
    return {
      success: false,
      codigo: generarLineaCapturaLocal(),
      fecha_vencimiento: generarFechaVencimiento(),
      esLocal: true,
      error: error.message,
      referencia_externa: referenciaUnica,
    };
  }
};

/**
 * Genera fecha de vencimiento (30 días después)
 */
export const generarFechaVencimiento = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 30);
  return fecha.toISOString().split('T')[0];
};

/**
 * Genera la URL del código QR
 */
const generarQRUrl = (folio) => {
  const urlPago = `https://pagos.transito.gob.mx/${folio}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=png&data=${encodeURIComponent(urlPago)}`;
};

/**
 * Genera la sección de línea de captura según si es offline o no
 */
const generarLineaCapturaHTML = (datosMulta) => {
  if (datosMulta.esOffline) {
    return `
      <div class="linea-section" style="background: #FEF3C7; border-color: #F59E0B;">
        <div class="linea-label" style="color: #92400E;">Línea de Captura</div>
        <div class="linea-value" style="font-size: 16px; color: #92400E; letter-spacing: 0;">PENDIENTE</div>
        <div class="linea-vence" style="color: #92400E; margin-top: 8px; line-height: 1.5;">
          Disponible en 24 horas. <br/>
          Consulte en la app o sitio web con el folio: <br/>
          <strong style="font-size: 14px;">${datosMulta.folio}</strong>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="linea-section">
      <div class="linea-label">Línea de Captura</div>
      <div class="linea-value">${datosMulta.linea_captura}</div>
      <div class="linea-vence">Vigencia: ${datosMulta.fecha_vencimiento}</div>
    </div>
  `;
};

/**
 * Obtiene el fundamento legal a partir del tipo de infracción
 * Si ya existe fundamento_legal lo usa, sino lo genera desde TIPOS_INFRACCION
 */
const obtenerFundamentoLegal = (datosMulta) => {
  // Si ya tiene fundamento legal, usarlo
  if (datosMulta.fundamento_legal && datosMulta.fundamento_legal !== 'Reglamento de Tránsito CDMX') {
    return datosMulta.fundamento_legal;
  }
  
  // Intentar generar fundamento desde el tipo de infracción
  const tipoInfraccion = datosMulta.tipo_infraccion || '';
  const tiposTexto = tipoInfraccion.split(', ');
  
  const fundamentos = tiposTexto.map(tipo => {
    // Buscar en TIPOS_INFRACCION por label
    const infraccion = TIPOS_INFRACCION.find(inf => 
      inf.label.toLowerCase().includes(tipo.toLowerCase()) ||
      tipo.toLowerCase().includes(inf.label.toLowerCase())
    );
    
    if (infraccion && infraccion.fundamento) {
      return formatearFundamento(infraccion.fundamento);
    }
    return null;
  }).filter(Boolean);
  
  if (fundamentos.length > 0) {
    return fundamentos.join('; ');
  }
  
  // Si no se pudo generar, usar valor por defecto
  return 'Art. 38 y 39, Reglamento de Tránsito CDMX';
};

/**
 * Genera el HTML completo para el PDF de la boleta
 */
const generarHTMLBoleta = (datosMulta, opciones = {}) => {
  const {
    fechaMulta = formatFechaCorta(new Date()),
    firmaAgente = datosMulta.firma_agente,
    firmaInfractor = datosMulta.firma_infractor,
  } = opciones;

  const qrUrl = generarQRUrl(datosMulta.folio);
  const lineaCapturaHTML = generarLineaCapturaHTML(datosMulta);
  const styles = getPDFStyles();
  const fundamentoLegal = obtenerFundamentoLegal(datosMulta);

  const avisoTexto = datosMulta.esOffline
    ? `Esta multa fue registrada sin conexión. La línea de captura estará disponible en 24 horas. Consulte con el folio ${datosMulta.folio} en la app o sitio web para obtener los datos de pago.`
    : `Realice el pago antes del ${datosMulta.fecha_vencimiento} para evitar recargos. Después de la fecha de vencimiento, el monto podría incrementarse. Conserve este documento como comprobante oficial.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Boleta - ${datosMulta.folio}</title>
      <style>${styles}</style>
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
            <div class="folio-value">${datosMulta.folio}</div>
          </div>
        </div>

        <!-- Placa -->
        <div class="placa-section">
          <div class="placa-label">Placa del Vehículo Infractor</div>
          <div class="placa-value">${datosMulta.vehiculos?.placa || datosMulta.placa || 'N/A'}</div>
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
                <span class="info-value">${datosMulta.tipo_infraccion || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fundamento Legal:</span>
                <span class="info-value">${fundamentoLegal}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Descripción:</span>
                <span class="info-value">${datosMulta.descripcion || datosMulta.tipo_infraccion || 'N/A'}</span>
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

            <!-- Datos Vehículo -->
            <div class="section">
              <div class="section-title">
                <span class="section-number">2</span>
                DATOS DEL VEHÍCULO
              </div>
              <div class="info-row">
                <span class="info-label">Placa:</span>
                <span class="info-value">${datosMulta.vehiculos?.placa || datosMulta.placa || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Marca:</span>
                <span class="info-value">${datosMulta.vehiculos?.marca || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Modelo:</span>
                <span class="info-value">${datosMulta.vehiculos?.modelo || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Color:</span>
                <span class="info-value">${datosMulta.vehiculos?.color || 'N/A'}</span>
              </div>
            </div>

            <!-- Monto -->
            <div class="monto-section">
              <div class="monto-label">Total a Pagar</div>
              <div class="monto-value">$${(datosMulta.monto_final || datosMulta.monto || 0).toLocaleString()}</div>
              <div class="monto-currency">Pesos Mexicanos (MXN)</div>
            </div>
          </div>

          <!-- Columna Derecha -->
          <div class="col-right">
            ${lineaCapturaHTML}

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
          <div class="aviso-text">${avisoTexto}</div>
        </div>

        <!-- Firmas -->
        <div class="firmas-section">
          <div class="firma-box">
            <div class="firma-title">Firma del Agente</div>
            <div class="firma-area">
              ${firmaAgente ? `<img src="${firmaAgente}" alt="Firma"/>` : ''}
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
              <div class="firma-name ${!firmaInfractor ? 'firma-negado' : ''}">
                ${firmaInfractor ? 'Recibí original' : 'Se negó a firmar'}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          Este documento es un comprobante oficial de infracción de tránsito emitido por la autoridad competente. <br/>
          Generado el ${new Date().toLocaleString('es-MX')} | Sistema de Multas de Tránsito v4.0
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera y comparte el PDF de una multa
 * @param {Object} datosMulta - Datos de la multa
 * @param {Object} opciones - Opciones adicionales (fechaMulta, firmaAgente, firmaInfractor)
 * @returns {Promise<boolean>} - true si se generó correctamente
 */
export const generarPDF = async (datosMulta, opciones = {}) => {
  try {
    const htmlContent = generarHTMLBoleta(datosMulta, opciones);
    
    const { uri } = await Print.printToFileAsync({ 
      html: htmlContent, 
      base64: false 
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Boleta de Infracción',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Generado', `Archivo guardado en: ${uri}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);
    Alert.alert('Error', 'No se pudo generar el PDF');
    return false;
  }
};

export default {
  generarPDF,
  generarFolioTemporal,
  generarLineaCaptura,
  generarFechaVencimiento,
  formatFechaCorta,
  formatFechaCompleta,
};
