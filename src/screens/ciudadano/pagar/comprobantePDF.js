/**
 * Genera el HTML del comprobante de pago con sello de PAGADO
 */
export const generarHTMLComprobante = ({ multa, descuento, lineaCaptura, placa }) => {
  const fechaActual = new Date();

  const opcionesFecha = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @page {
        size: A4;
        margin: 10mm;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Helvetica', Arial, sans-serif; 
        color: #333;
        padding: 15px;
        background: #fff;
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
        left: 50%;
        transform: translate(-50%, -50%) rotate(-20deg);
        width: 180px;
        height: 180px;
        border: 6px double #10B981;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0.15;
        z-index: 100;
        background: rgba(16, 185, 129, 0.03);
      }
      .sello-pagado .sello-check {
        font-size: 40px;
        color: #10B981;
        margin-bottom: 3px;
      }
      .sello-pagado .sello-texto {
        font-size: 24px;
        font-weight: bold;
        color: #10B981;
        letter-spacing: 3px;
      }
      .sello-pagado .sello-fecha {
        font-size: 10px;
        color: #10B981;
        margin-top: 3px;
        font-weight: 600;
      }
      
      .header {
        background: linear-gradient(135deg, #1E40AF, #3B82F6);
        color: white;
        padding: 15px 20px;
        text-align: center;
      }
      .header h1 { 
        font-size: 20px; 
        font-weight: bold;
        margin-bottom: 3px;
      }
      .header p { 
        font-size: 12px; 
        opacity: 0.9; 
      }
      
      .success-badge {
        background: #10B981;
        color: white;
        padding: 12px;
        text-align: center;
        font-size: 16px;
        font-weight: bold;
      }
      
      .content {
        padding: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        position: relative;
      }
      
      .left-section {
        flex: 1;
        min-width: 250px;
      }
      
      .right-section {
        flex: 1;
        min-width: 250px;
      }
      
      .monto-section {
        text-align: center;
        padding: 15px;
        background: #F0FDF4;
        border-radius: 10px;
        margin-bottom: 15px;
        border: 2px solid #10B981;
      }
      .monto-label {
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
        font-size: 11px;
        color: #059669;
      }
      
      .folio-box {
        background: #EFF6FF;
        border: 1px solid #BFDBFE;
        border-radius: 8px;
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
        display: flex;
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
      
      .linea-captura-box {
        background: #F3F4F6;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
      }
      .linea-captura-label {
        font-size: 9px;
        color: #6B7280;
        margin-bottom: 3px;
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
      .monto-tachado {
        text-decoration: line-through;
        color: #9CA3AF;
      }
      
      .footer {
        text-align: center;
        padding: 20px;
        border-top: 1px solid #E5E7EB;
        background: #FAFAFA;
      }
      .footer-text {
        font-size: 11px;
        color: #6B7280;
        line-height: 1.8;
      }
      .footer-text p {
        margin: 0;
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
            <div class="linea-captura-value">${lineaCaptura}</div>
          </div>
        </div>
        
        <div class="right-section">
          <div class="detail-section">
            <div class="detail-title">Datos de la Multa</div>
            <div class="detail-row">
              <span class="detail-label">Folio Multa:</span>
              <span class="detail-value">${multa.folio || 'MUL-' + multa.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Placa:</span>
              <span class="detail-value placa-destacada">${placa}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Infracción:</span>
              <span class="detail-value">${multa.tipo_infraccion || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha Infracción:</span>
              <span class="detail-value">${new Date(multa.fecha_infraccion || multa.created_at).toLocaleDateString('es-MX')}</span>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="detail-title">Datos del Pago</div>
            <div class="detail-row">
              <span class="detail-label">Método:</span>
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
              <span class="detail-value descuento-tag">${descuento.porcentaje}%</span>
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
