import { StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../../../config/theme';

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  
  // ==================== CONECTIVIDAD ====================
  connectivityBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    gap: 10 
  },
  connectivityText: { 
    flex: 1, 
    fontSize: 13 
  },
  
  // ==================== CARD ====================
  card: { 
    backgroundColor: '#fff', 
    margin: 15, 
    borderRadius: 16, 
    padding: 20, 
    ...SHADOWS.medium 
  },
  
  // ==================== LABELS ====================
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.gray[700], 
    marginBottom: 10, 
    marginTop: 15 
  },
  hint: { 
    fontSize: 12, 
    color: '#9CA3AF', 
    marginBottom: 10 
  },
  
  // ==================== INFRACCIONES ====================
  infraccionesHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 15 
  },
  contadorBadge: { 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  contadorText: { 
    color: '#4F46E5', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  tiposGrid: { 
    gap: 8 
  },
  tipoBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipoBtnActivo: { 
    backgroundColor: '#4F46E5', 
    borderColor: '#4F46E5' 
  },
  tipoBtnPersonalizado: { 
    borderColor: '#A5B4FC', 
    backgroundColor: '#EEF2FF' 
  },
  tipoBtnContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    gap: 10 
  },
  tipoText: { 
    fontSize: 14, 
    color: '#4B5563' 
  },
  tipoTextActivo: { 
    color: '#fff', 
    fontWeight: '600' 
  },
  tipoInfo: {
    flex: 1,
  },
  tipoFundamento: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tipoFundamentoActivo: {
    color: 'rgba(255,255,255,0.8)',
  },
  tipoMonto: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#6B7280' 
  },
  tipoMontoActivo: { 
    color: '#fff' 
  },
  personalizadaActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  agregarOtraBtn: {
    flexDirection: 'row',
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
  agregarOtraText: { 
    color: '#4F46E5', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  
  // ==================== UBICACIÓN ====================
  ubicacionContainer: { 
    marginTop: 15 
  },
  ubicacionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  ubicacionText: { 
    flex: 1, 
    fontSize: 14, 
    color: '#4B5563' 
  },
  coordenadas: { 
    fontSize: 11, 
    color: '#9CA3AF', 
    marginTop: 5, 
    textAlign: 'center' 
  },
  
  // ==================== EVIDENCIAS ====================
  evidenciasHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 15 
  },
  fotosContador: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5 
  },
  fotosContadorText: { 
    fontSize: 12, 
    color: '#6B7280' 
  },
  fotosContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginTop: 10 
  },
  fotoWrapper: { 
    position: 'relative' 
  },
  fotoPreview: { 
    width: 80, 
    height: 80, 
    borderRadius: 8 
  },
  eliminarFoto: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: '#fff', 
    borderRadius: 12 
  },
  agregarFoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agregarFotoText: { 
    fontSize: 10, 
    color: COLORS.primary, 
    marginTop: 5 
  },

  // ==================== FIRMAS ====================
  firmasContainer: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 5 
  },
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
    borderStyle: 'solid',
    backgroundColor: '#DBEAFE',
  },
  firmaPreview: { 
    width: '90%', 
    height: 60, 
    resizeMode: 'contain' 
  },
  firmaPlaceholder: { 
    color: '#6B7280', 
    marginTop: 5, 
    fontSize: 12, 
    fontWeight: '600' 
  },
  firmaOpcional: { 
    color: '#9CA3AF', 
    fontSize: 10 
  },
  firmaCompletadaText: { 
    color: '#059669', 
    fontWeight: 'bold', 
    marginTop: 5, 
    fontSize: 12 
  },
  firmaCompletadaTextInfractor: { 
    color: '#1E40AF', 
    fontWeight: 'bold', 
    marginTop: 5, 
    fontSize: 12 
  },
  alertaFirma: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  alertaFirmaText: { 
    color: '#1E40AF', 
    fontSize: 12, 
    flex: 1 
  },

  // ==================== RESUMEN ====================
  resumen: { 
    backgroundColor: '#F0F9FF', 
    padding: 15, 
    borderRadius: 12, 
    marginTop: 20 
  },
  resumenTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0369A1', 
    marginBottom: 10 
  },
  resumenRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  resumenLabel: { 
    color: '#0369A1' 
  },
  resumenValue: { 
    fontWeight: '600', 
    color: '#0369A1' 
  },
  infraccionesLista: { 
    backgroundColor: '#E0F2FE', 
    padding: 10, 
    borderRadius: 8, 
    marginVertical: 10 
  },
  infraccionItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  infraccionItemText: { 
    fontSize: 13, 
    color: '#0369A1', 
    flex: 1 
  },
  infraccionItemMonto: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#0369A1' 
  },
  montoTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
    paddingTop: 10,
    marginTop: 10,
  },
  montoTotalLabel: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0369A1' 
  },
  montoTotalValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#0369A1' 
  },
  
  // ==================== MODAL ====================
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
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937' 
  },
  modalLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#4B5563', 
    marginBottom: 8, 
    marginTop: 10 
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  montoInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  montoPrefix: { 
    paddingLeft: 12, 
    fontSize: 18, 
    color: '#6B7280', 
    fontWeight: 'bold' 
  },
  montoInput: { 
    flex: 1, 
    padding: 12, 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  modalButtons: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 25 
  },
  modalCancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: { 
    color: '#6B7280', 
    fontWeight: '600' 
  },
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
  modalAddText: { 
    color: '#fff', 
    fontWeight: '600' 
  },
  
  // ==================== VEHÍCULO ====================
  vehiculoBuscando: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
  },
  vehiculoBuscandoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  vehiculoEncontrado: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vehiculoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  vehiculoEncontradoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
  },
  vehiculoInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  vehiculoInfoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  vehiculoLabel: {
    fontWeight: '600',
    color: '#6B7280',
  },
  vehiculoNuevo: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vehiculoNuevoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  vehiculoNuevoSubtitle: {
    fontSize: 13,
    color: '#B45309',
    marginBottom: 15,
  },
  vehiculoFormRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: -10,
  },
  vehiculoFormCol: {
    flex: 1,
  },
  tipoVehiculoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  tipoVehiculoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  tipoVehiculoBtnActivo: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  tipoVehiculoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  tipoVehiculoTextActivo: {
    color: '#fff',
  },
});

export default styles;
