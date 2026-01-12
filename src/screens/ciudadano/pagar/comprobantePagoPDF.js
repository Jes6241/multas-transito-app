import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Genera el HTML del comprobante de pago (multa pagada)
 * Soporta información de corralón si está incluida
 */
const generarHTMLComprobantePago = (multa, datosCorralon = null) => {
  const fechaPago = multa.fecha_pago 
    ? new Date(multa.fecha_pago).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('es-MX');

  const folioComprobante = `VCH-${Date.now().toString().substring(5)}`;
  const placa = multa.vehiculos?.placa || multa.vehiculo?.placa || multa.placa || 'N/A';
  const montoPagado = multa.monto_pagado || multa.monto_final || multa.monto || 0;
  
  // Información del corralón
  const incluyeCorralon = !!datosCorralon;
  const montoMulta = datosCorralon?.monto_multa || multa.monto || 0;
  const costoGrua = datosCorralon?.costo_grua || 0;
  const costoPension = datosCorralon?.costo_pension_total || 0;
  const diasPension = datosCorralon?.dias_estancia || 0;

  // Sección de corralón para el HTML
  const seccionCorralon = incluyeCorralon ? `
    <div class="info-box full corralon-box">
      <h3>🚗 Liberación de Corralón</h3>
      <div class="info-row">
        <span class="info-label">Corralón:</span>
        <span class="info-value">${datosCorralon.corralon_nombre || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Dirección:</span>
        <span class="info-value">${datosCorralon.corralon_direccion || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Folio Remisión:</span>
        <span class="info-value">${datosCorralon.folio_remision || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tarjetón:</span>
        <span class="info-value">${datosCorralon.tarjeton_resguardo || 'N/A'}</span>
      </div>
    </div>
    
    <div class="info-box full desglose-box">
      <h3>💰 Desglose del Pago</h3>
      <div class="info-row">
        <span class="info-label">Multa (Folio ${multa.folio || datosCorralon.folio_multa}):</span>
        <span class="info-value">$${parseFloat(montoMulta).toLocaleString('es-MX')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Servicio de Grúa:</span>
        <span class="info-value">$${parseFloat(costoGrua).toLocaleString('es-MX')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Pensión (${diasPension} días):</span>
        <span class="info-value">$${parseFloat(costoPension).toLocaleString('es-MX')}</span>
      </div>
      <div class="info-row total-row-desglose">
        <span class="info-label" style="font-weight: bold; color: #059669;">Total:</span>
        <span class="info-value" style="font-weight: bold; color: #059669;">$${parseFloat(montoPagado).toLocaleString('es-MX')}</span>
      </div>
    </div>
  ` : '';

  const estilosCorralon = incluyeCorralon ? `
    .corralon-box {
      background: #FEF2F2 !important;
      border-color: #FECACA !important;
    }
    .corralon-box h3 { color: #991B1B !important; }
    .desglose-box {
      background: #F0FDF4 !important;
      border-color: #BBF7D0 !important;
    }
    .desglose-box h3 { color: #166534 !important; }
    .total-row-desglose {
      border-top: 2px solid #10B981;
      padding-top: 10px;
      margin-top: 8px;
    }
    .requisitos-liberacion {
      background: #FFFBEB;
      border: 1px solid #FCD34D;
      border-radius: 10px;
      padding: 15px;
      margin-top: 15px;
    }
    .requisitos-liberacion h4 {
      color: #92400E;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .requisitos-liberacion li {
      color: #78350F;
      font-size: 11px;
      margin-bottom: 5px;
    }
  ` : '';

  const seccionRequisitosLiberacion = incluyeCorralon ? `
    <div class="requisitos-liberacion">
      <h4>📋 Requisitos para liberar tu vehículo:</h4>
      <ul>
        <li>✓ Este comprobante de pago (impreso o digital)</li>
        <li>✓ Identificación oficial vigente (INE/IFE)</li>
        <li>✓ Tarjeta de circulación original</li>
        <li>✓ Póliza de seguro vigente</li>
      </ul>
    </div>
  ` : '';

  const mensajeImportante = incluyeCorralon 
    ? '⚠️ Presenta este comprobante en el corralón para liberar tu vehículo'
    : '⚠️ Conserve este comprobante como respaldo de su pago';

  const tituloComprobante = incluyeCorralon 
    ? 'Comprobante de Pago - Liberación de Corralón'
    : 'Comprobante Oficial de Pago';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprobante de Pago - ${multa.folio}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Helvetica', Arial, sans-serif; 
          color: #333;
          padding: 20px;
          background: #fff;
        }
        
        .comprobante {
          border: 3px solid #10B981;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }
        
        /* Sello de PAGADO */
        .sello-pagado {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-15deg);
          width: 220px;
          height: 220px;
          border: 8px double #10B981;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.12;
          z-index: 100;
        }
        .sello-pagado .check { font-size: 50px; color: #10B981; }
        .sello-pagado .texto { font-size: 32px; font-weight: bold; color: #10B981; letter-spacing: 4px; }
        .sello-pagado .fecha { font-size: 14px; color: #10B981; margin-top: 5px; }
        
        .header {
          background: linear-gradient(135deg, #059669, #10B981);
          color: white;
          padding: 25px;
          text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .header p { font-size: 14px; opacity: 0.9; }
        
        ${estilosCorralon}
        
        .success-banner {
          background: #D1FAE5;
          padding: 20px;
          text-align: center;
          border-bottom: 2px solid #10B981;
        }
        .success-banner h2 {
          color: #065F46;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .content { padding: 25px; position: relative; }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        
        .info-box {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 15px;
        }
        .info-box.full { grid-column: 1 / -1; }
        .info-box h3 {
          font-size: 11px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }
        .info-label { color: #6B7280; }
        .info-value { color: #1F2937; font-weight: 600; text-align: right; }
        
        .monto-box {
          background: linear-gradient(135deg, #D1FAE5, #ECFDF5);
          border: 2px solid #10B981;
          border-radius: 16px;
          padding: 25px;
          text-align: center;
          margin-bottom: 25px;
        }
        .monto-label { font-size: 12px; color: #065F46; margin-bottom: 5px; }
        .monto-value { font-size: 42px; font-weight: bold; color: #059669; }
        .monto-currency { font-size: 14px; color: #065F46; }
        
        .placa-box {
          background: #FEF3C7;
          border: 2px solid #F59E0B;
          border-radius: 12px;
          padding: 15px;
          text-align: center;
          margin-bottom: 25px;
        }
        .placa-label { font-size: 11px; color: #92400E; }
        .placa-value { font-size: 28px; font-weight: bold; color: #92400E; letter-spacing: 3px; }
        
        .folio-box {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
          margin-bottom: 20px;
        }
        .folio-label { font-size: 10px; color: #3B82F6; }
        .folio-value { font-size: 16px; font-weight: bold; color: #1E40AF; letter-spacing: 1px; }
        
        .footer {
          background: #F9FAFB;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #E5E7EB;
        }
        .footer p { font-size: 11px; color: #6B7280; line-height: 1.8; }
        .footer .importante {
          background: #FEF3C7;
          color: #92400E;
          padding: 10px;
          border-radius: 8px;
          margin-top: 10px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="comprobante">
        <div class="sello-pagado">
          <span class="check">✓</span>
          <span class="texto">PAGADO</span>
          <span class="fecha">${new Date(multa.fecha_pago || new Date()).toLocaleDateString('es-MX')}</span>
        </div>
        
        <div class="header">
          <h1>SECRETARÍA DE TRÁNSITO</h1>
          <p>${tituloComprobante}</p>
        </div>
        
        <div class="success-banner">
          <h2>✓ PAGO REALIZADO EXITOSAMENTE</h2>
        </div>
        
        <div class="content">
          <div class="monto-box">
            <div class="monto-label">MONTO PAGADO</div>
            <div class="monto-value">$${parseFloat(montoPagado).toLocaleString('es-MX')}</div>
            <div class="monto-currency">Pesos Mexicanos (MXN)</div>
          </div>
          
          <div class="placa-box">
            <div class="placa-label">PLACA DEL VEHÍCULO</div>
            <div class="placa-value">${placa}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <h3>Datos del Pago</h3>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${fechaPago}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Método:</span>
                <span class="info-value">${(multa.metodo_pago || 'Tarjeta').charAt(0).toUpperCase() + (multa.metodo_pago || 'tarjeta').slice(1)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Referencia:</span>
                <span class="info-value">${multa.referencia_pago || folioComprobante}</span>
              </div>
            </div>
            
            <div class="info-box">
              <h3>Datos de la Multa</h3>
              <div class="info-row">
                <span class="info-label">Folio:</span>
                <span class="info-value">${multa.folio || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Línea de Captura:</span>
                <span class="info-value">${multa.linea_captura || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha Infracción:</span>
                <span class="info-value">${new Date(multa.fecha_infraccion || multa.created_at).toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            
            <div class="info-box full">
              <h3>Infracción</h3>
              <div class="info-row">
                <span class="info-label">Tipo:</span>
                <span class="info-value">${multa.tipo_infraccion || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ubicación:</span>
                <span class="info-value">${multa.direccion || multa.ubicacion || 'N/A'}</span>
              </div>
              ${multa.descuento ? `
              <div class="info-row">
                <span class="info-label">Descuento aplicado:</span>
                <span class="info-value" style="color: #059669;">${multa.descuento}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Monto original:</span>
                <span class="info-value" style="text-decoration: line-through; color: #9CA3AF;">$${parseFloat(multa.monto || 0).toLocaleString('es-MX')}</span>
              </div>
              ` : ''}
            </div>
            
            ${seccionCorralon}
          </div>
          
          ${seccionRequisitosLiberacion}
          
          <div class="folio-box">
            <div class="folio-label">FOLIO DE COMPROBANTE</div>
            <div class="folio-value">${folioComprobante}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>
            Este documento es un comprobante oficial de pago de infracción de tránsito.<br/>
            Generado el ${new Date().toLocaleString('es-MX')} - Sistema de Multas de Tránsito v4.0
          </p>
          <p class="importante">
            ${mensajeImportante}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera y comparte el PDF del comprobante de pago
 * @param {Object} multa - Datos de la multa
 * @param {Object|null} datosCorralon - Datos del corralón (opcional)
 */
export const generarComprobantePagoPDF = async (multa, datosCorralon = null) => {
  try {
    const html = generarHTMLComprobantePago(multa, datosCorralon);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: datosCorralon ? 'Comprobante de Liberación' : 'Comprobante de Pago',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF Generado', `Archivo guardado en: ${uri}`);
    }

    return true;
  } catch (error) {
    console.error('Error generando comprobante de pago:', error);
    Alert.alert('Error', 'No se pudo generar el comprobante de pago');
    return false;
  }
};

export default { generarComprobantePagoPDF };
