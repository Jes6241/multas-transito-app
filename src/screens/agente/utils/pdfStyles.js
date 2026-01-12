/**
 * Estilos CSS para el PDF de boletas de infracción
 * Optimizado para caber en una sola página A4
 */
export const getPDFStyles = () => `
  @page { 
    margin: 0; 
    size: A4; 
  }
  
  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
  }
  
  html, body { 
    height: 100%;
    width: 100%;
  }
  
  body { 
    font-family: 'Segoe UI', Arial, sans-serif; 
    color: #2d3748; 
    font-size: 9px;
    line-height: 1.2;
  }
  
  .page { 
    width: 210mm;
    height: 297mm;
    padding: 8mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  /* ==================== HEADER ==================== */
  .header {
    background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
    color: white;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 5px 5px 0 0;
  }
  
  .header-left {}
  
  .header-title { 
    font-size: 12px; 
    font-weight: 700; 
    letter-spacing: 0.3px; 
  }
  
  .header-subtitle { 
    font-size: 9px; 
    opacity: 0.85; 
    margin-top: 1px; 
  }
  
  .folio-box {
    background: rgba(255,255,255,0.2);
    padding: 5px 10px;
    border-radius: 4px;
    text-align: right;
  }
  
  .folio-label { 
    font-size: 7px; 
    opacity: 0.8; 
    letter-spacing: 0.5px; 
  }
  
  .folio-value { 
    font-size: 12px; 
    font-weight: 700; 
    letter-spacing: 0.5px; 
  }
  
  /* ==================== PLACA ==================== */
  .placa-section {
    background: linear-gradient(135deg, #2c5282 0%, #3182ce 100%);
    color: white;
    text-align: center;
    padding: 10px;
  }
  
  .placa-label { 
    font-size: 8px; 
    opacity: 0.9; 
    letter-spacing: 1px; 
    text-transform: uppercase; 
  }
  
  .placa-value { 
    font-size: 26px; 
    font-weight: 800; 
    letter-spacing: 4px; 
    margin-top: 2px; 
  }
  
  /* ==================== GRID PRINCIPAL ==================== */
  .main-grid {
    display: flex;
    border: 1px solid #e2e8f0;
    border-top: none;
  }
  
  .col-left {
    flex: 1.3;
    padding: 10px;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
  }
  
  .col-right {
    flex: 0.7;
    padding: 10px;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
  }
  
  /* ==================== SECCIONES ==================== */
  .section { 
    margin-bottom: 8px; 
  }
  
  .section:last-child { 
    margin-bottom: 0; 
  }
  
  .section-title {
    font-size: 10px;
    font-weight: 700;
    color: #1a365d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-bottom: 5px;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .section-number {
    background: #1a365d;
    color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
  }
  
  /* ==================== FILAS DE INFO ==================== */
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid #edf2f7;
  }
  
  .info-row:last-child { 
    border-bottom: none; 
  }
  
  .info-label { 
    color: #718096; 
    font-size: 8px; 
  }
  
  .info-value { 
    font-weight: 600; 
    color: #2d3748; 
    font-size: 8px; 
    text-align: right; 
    max-width: 60%; 
  }
  
  /* ==================== MONTO ==================== */
  .monto-section {
    background: linear-gradient(135deg, #276749 0%, #38a169 100%);
    color: white;
    text-align: center;
    padding: 10px;
    border-radius: 6px;
    margin-top: 8px;
  }
  
  .monto-label { 
    font-size: 7px; 
    opacity: 0.9; 
    letter-spacing: 0.5px; 
    text-transform: uppercase; 
  }
  
  .monto-value { 
    font-size: 24px; 
    font-weight: 800; 
    margin: 3px 0; 
  }
  
  .monto-currency { 
    font-size: 7px; 
    opacity: 0.85; 
  }
  
  /* ==================== LÍNEA DE CAPTURA ==================== */
  .linea-section {
    background: #fffbeb;
    border: 1px solid #d69e2e;
    border-radius: 6px;
    padding: 10px;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .linea-label { 
    font-size: 7px; 
    color: #975a16; 
    font-weight: 700; 
    letter-spacing: 0.5px; 
    text-transform: uppercase; 
  }
  
  .linea-value { 
    font-size: 12px; 
    font-weight: 700; 
    color: #744210; 
    font-family: 'Courier New', monospace; 
    letter-spacing: 1px; 
    margin: 4px 0; 
  }
  
  .linea-vence { 
    font-size: 7px; 
    color: #975a16; 
  }
  
  /* ==================== QR ==================== */
  .qr-section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  
  .qr-title { 
    font-size: 7px; 
    color: #1a365d; 
    font-weight: 700; 
    margin-bottom: 4px; 
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  
  .qr-image { 
    width: 60px; 
    height: 60px; 
  }
  
  .qr-instruction { 
    font-size: 6px; 
    color: #718096; 
    margin-top: 4px; 
    line-height: 1.2; 
  }
  
  /* ==================== OPCIONES DE PAGO ==================== */
  .pago-grid {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    gap: 3px;
  }
  
  .pago-item {
    flex: 1;
    text-align: center;
    padding: 6px 3px;
    background: #edf2f7;
    border-radius: 4px;
  }
  
  .pago-icon { 
    font-size: 12px; 
    color: #1a365d; 
    font-weight: bold; 
    margin-bottom: 2px; 
  }
  
  .pago-text { 
    font-size: 6px; 
    color: #4a5568; 
    font-weight: 600; 
  }
  
  /* ==================== AVISO ==================== */
  .aviso-section {
    background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
    border-left: 3px solid #c53030;
    padding: 6px 10px;
    margin: 6px 0;
    border-radius: 0 4px 4px 0;
  }
  
  .aviso-title { 
    font-weight: 700; 
    color: #c53030; 
    font-size: 8px; 
    margin-bottom: 2px; 
  }
  
  .aviso-text { 
    color: #742a2a; 
    font-size: 7px; 
    line-height: 1.2; 
  }
  
  /* ==================== FIRMAS ==================== */
  .firmas-section {
    display: flex;
    gap: 30px;
    padding: 8px 0;
    border-top: 1px solid #e2e8f0;
  }
  
  .firma-box { 
    flex: 1; 
    text-align: center; 
  }
  
  .firma-title { 
    font-size: 7px; 
    color: #718096; 
    text-transform: uppercase; 
    letter-spacing: 0.5px;
    margin-bottom: 4px; 
  }
  
  .firma-area {
    height: 30px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 3px;
  }
  
  .firma-area img { 
    max-height: 28px; 
    max-width: 85%; 
  }
  
  .firma-line {
    border-top: 1px solid #2d3748;
    margin-top: 2px;
    padding-top: 4px;
  }
  
  .firma-name { 
    font-size: 8px; 
    color: #2d3748; 
    font-weight: 600; 
  }
  
  .firma-negado { 
    color: #c53030; 
    font-style: italic; 
  }
  
  /* ==================== FOOTER ==================== */
  .footer {
    text-align: center;
    padding: 5px;
    color: #a0aec0;
    font-size: 7px;
    border-top: 1px solid #e2e8f0;
    margin-top: 6px;
  }
  
  /* ==================== OFFLINE NOTICE ==================== */
  .offline-notice { 
    background: #FEF3C7; 
    border: 1px solid #F59E0B; 
    border-radius: 6px; 
    padding: 6px; 
    text-align: center; 
    margin-bottom: 6px; 
  }
  
  .offline-notice-text { 
    color: #92400E; 
    font-size: 8px; 
    font-weight: 600; 
  }
`;

export default { getPDFStyles }; 
