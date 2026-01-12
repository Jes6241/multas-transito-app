import { StyleSheet } from 'react-native';
import { COLORS } from '../../config/theme';

export const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F3F4F6', padding: 15 },
  
  // Alerta vencida
  alertaVencida:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor:  '#FECACA' },
  alertaContent: { flex: 1, marginLeft: 12 },
  alertaTitle: { fontSize:  14, fontWeight: 'bold', color:  '#DC2626' },
  alertaText: { fontSize: 12, color: '#991B1B', marginTop: 2 },
  alertaBtn: { backgroundColor: '#DC2626', paddingHorizontal:  15, paddingVertical: 8, borderRadius: 8 },
  alertaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  
  // Resumen card
  resumenCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity:  0.05, shadowRadius: 8, elevation: 2 },
  resumenTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  resumenRow: { flexDirection:  'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resumenLabel: { fontSize: 14, color: '#6B7280' },
  resumenValue: { fontSize: 14, fontWeight: '600', color: '#1F2937', maxWidth: '60%', textAlign: 'right' },
  placaDestacada: { backgroundColor: '#FEF3C7', color: '#92400E', paddingHorizontal:  10, paddingVertical: 4, borderRadius: 6, fontSize: 16, fontWeight: 'bold', overflow: 'hidden' },
  
  // Línea de captura info
  lineaCapturaInfo: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  lineaCapturaLabel: { fontSize: 11, color: '#059669' },
  lineaCapturaValue: { fontSize: 18, fontWeight: 'bold', color:  '#065F46', letterSpacing: 1, marginTop: 4 },
  lineaCapturaVigencia: { fontSize: 11, color: '#059669', marginTop: 4 },
  
  // Descuento card
  descuentoCard: { backgroundColor: '#D1FAE5', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 2, borderColor: '#10B981', borderStyle: 'dashed' },
  descuentoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  descuentoTitle: { fontSize: 18, fontWeight: 'bold', color: '#065F46' },
  descuentoPorcentaje: { fontSize: 28, fontWeight: 'bold', color:  '#059669', marginBottom: 5 },
  descuentoDias: { fontSize: 14, color: '#047857', marginBottom: 15 },
  descuentoMontos: { borderTopWidth: 1, borderTopColor:  '#A7F3D0', paddingTop: 10 },
  montoOriginal: { fontSize:  14, color: '#065F46', textDecorationLine: 'line-through' },
  montoAhorro: { fontSize:  16, fontWeight: 'bold', color:  '#059669', marginTop: 5 },
  
  // Total card
  totalCard:  { backgroundColor:  COLORS.primary, borderRadius: 16, padding: 25, alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 5 },
  totalMonto: { fontSize:  36, fontWeight: 'bold', color:  '#fff' },
  
  // Métodos de pago
  sectionTitle: { fontSize: 16, fontWeight:  'bold', color: '#1F2937', marginBottom:  15 },
  metodoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  metodoCardSelected: { borderColor:  COLORS.primary, backgroundColor: '#EFF6FF' },
  metodoIconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  metodoInfo: { flex: 1, marginLeft: 15 },
  metodoNombre: { fontSize:  16, fontWeight: '600', color: '#1F2937' },
  metodoDescripcion: { fontSize:  13, color: '#6B7280', marginTop: 2 },
  metodoCheck: { marginLeft: 10 },
  
  // Botón pagar
  pagarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor:  COLORS.primary, padding: 18, borderRadius: 12, marginTop: 20, gap: 10 },
  pagarBtnDisabled: { backgroundColor: '#9CA3AF' },
  pagarBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  // Seguridad
  seguridadInfo: { flexDirection:  'row', alignItems: 'center', justifyContent: 'center', marginTop:  15, gap: 8 },
  seguridadText: { fontSize: 13, color: '#6B7280' },
  
  // Modal general
  modalOverlay: { flex:  1, backgroundColor:  'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems:  'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxHeight: '90%' },
  modalHeader: { flexDirection:  'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalIconSuccess: { alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color:  '#1F2937', textAlign: 'center' },
  modalTitleTarjeta: { fontSize:  20, fontWeight: 'bold', color:  '#1F2937' },
  modalMessage: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  
  // Modal línea captura
  lineaCapturaContainer: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  lineaCapturaModalLabel: { fontSize: 12, color: '#6B7280', marginBottom: 5 },
  lineaCapturaModalValue: { fontSize: 22, fontWeight: 'bold', color:  COLORS.primary, letterSpacing: 2 },
  
  // Modal detalles
  modalDetalles: { marginBottom: 20 },
  modalDetalleRow: { flexDirection:  'row', justifyContent: 'space-between', marginBottom: 8 },
  modalDetalleLabel:  { fontSize: 14, color: '#6B7280' },
  modalDetalleValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  
  // Modal botones
  modalBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalBtnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, marginTop: 10, gap: 8 },
  modalBtnSecondaryText: { color:  COLORS.primary, fontSize: 16, fontWeight: '600' },
  
  // Formulario tarjeta
  tarjetaForm: { marginTop: 10 },
  inputLabel: { fontSize:  14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },
  inputRow: { flexDirection:  'row', gap: 15 },
  inputHalf: { flex: 1 },
  
  // Total pago tarjeta
  totalPagoCard: { backgroundColor: '#F0FDF4', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent:  'space-between', alignItems: 'center', marginBottom: 15 },
  totalPagoLabel:  { fontSize: 14, color: '#065F46' },
  totalPagoMonto: { fontSize:  20, fontWeight: 'bold', color:  '#059669' },
  
  // Botón pagar tarjeta
  pagarTarjetaBtn: { flexDirection: 'row', alignItems:  'center', justifyContent: 'center', backgroundColor: '#10B981', padding: 16, borderRadius: 12, gap: 10 },
  pagarTarjetaBtnText: { color:  '#fff', fontSize:  18, fontWeight: 'bold' },
  
  // Tarjetas aceptadas
  tarjetasAceptadas: { flexDirection:  'row', alignItems: 'center', justifyContent:  'center', marginTop: 15, marginBottom: 20, gap: 10 },
  tarjetasLabel: { fontSize: 12, color: '#6B7280' },
  tarjetasLogos: { flexDirection: 'row', gap: 10 },
  tarjetaLogo:  { backgroundColor: '#E5E7EB', paddingHorizontal:  10, paddingVertical: 5, borderRadius: 5, fontSize: 12, fontWeight:  'bold', color: '#374151', overflow: 'hidden' },
  
  // Línea captura grande (OXXO/Transferencia)
  lineaCapturaGrande: { backgroundColor:  '#F0FDF4', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom:  20, borderWidth: 2, borderColor: '#10B981', borderStyle:  'dashed' },
  lineaCapturaGrandeLabel: { fontSize:  12, color:  '#059669', fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  lineaCapturaGrandeValue: { fontSize: 28, fontWeight: 'bold', color: '#065F46', letterSpacing: 3, textAlign: 'center' },
  lineaCapturaVigenciaBox:  { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal:  12, paddingVertical: 6, borderRadius: 20 },
  lineaCapturaVigenciaText:  { fontSize: 12, color: '#92400E', fontWeight: '600' },
  
  // Monto línea captura
  montoLineaCaptura: { flexDirection: 'row', justifyContent:  'space-between', alignItems: 'center', backgroundColor:  '#EFF6FF', padding: 15, borderRadius: 12, marginBottom:  20 },
  montoLineaCapturaLabel: { fontSize: 14, color: '#1E40AF' },
  montoLineaCapturaValue: { fontSize: 20, fontWeight: 'bold', color: '#1E40AF' },
  
  // Instrucciones
  instruccionesBox: { backgroundColor: '#F9FAFB', padding: 15, borderRadius:  12, marginBottom: 15 },
  instruccionesTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  instruccionesList: { gap: 6 },
  instruccionItem: { fontSize:  13, color:  '#4B5563', lineHeight: 20 },
  
  // Aviso
  avisoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF', padding:  12, borderRadius: 10, marginBottom: 20, gap: 10 },
  avisoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  
  // Botón subir comprobante
  subirComprobanteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', padding: 16, borderRadius:  12, gap:  10, marginBottom: 10 },
  subirComprobanteBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Cerrar modal
  cerrarModalBtn: { padding:  15, alignItems: 'center' },
  cerrarModalBtnText:  { color: '#6B7280', fontSize: 15, fontWeight: '500' },
  
  // Subir recibo
  subirReciboSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  reciboPreview: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  reciboImagen: { width:  '100%', height:  200, borderRadius: 12, resizeMode: 'cover' },
  reciboPDFPreview: { width:  '100%', height: 150, backgroundColor: '#FEE2E2', borderRadius: 12, justifyContent: 'center', alignItems:  'center' },
  reciboPDFName: { fontSize: 14, color: '#991B1B', marginTop: 10, fontWeight: '500' },
  eliminarReciboBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', padding: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  
  // Opciones subir
  opcionesSubir:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 },
  opcionSubirBtn: { alignItems: 'center', gap: 8 },
  opcionSubirIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems:  'center' },
  opcionSubirText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  
  // Info multa recibo
  infoMultaRecibo: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 20 },
  infoMultaReciboRow: { flexDirection:  'row', justifyContent: 'space-between', marginBottom: 8 },
  infoMultaReciboLabel: { fontSize: 13, color: '#6B7280' },
  infoMultaReciboValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  
  // Enviar recibo
  enviarReciboBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor:  COLORS.primary, padding: 16, borderRadius: 12, gap: 10, marginBottom: 10 },
  enviarReciboBtnDisabled: { backgroundColor:  '#9CA3AF' },
  enviarReciboBtnText: { color:  '#fff', fontSize:  16, fontWeight: 'bold' },
});