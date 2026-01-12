import { StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../../../config/theme';

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  
  // ==================== HEADER ====================
  headerCard: {
    margin: 15,
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  headerEstatus: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 10 
  },
  headerFolio: { 
    fontSize: 14, 
    marginTop: 5, 
    opacity: 0.8 
  },
  firmadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    gap: 5,
  },
  firmadoText: { 
    color: '#059669', 
    fontWeight: '600', 
    fontSize: 12 
  },
  
  // ==================== CARDS ====================
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.small,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    marginBottom: 15 
  },
  guardadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  guardadoText: { 
    color: '#059669', 
    fontSize: 11, 
    fontWeight: '600' 
  },

  // ==================== PLACA ====================
  placaContainer: {
    backgroundColor: '#1a365d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  placaLabel: { 
    color: '#93C5FD', 
    fontSize: 12 
  },
  placaValor: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: 'bold', 
    letterSpacing: 3 
  },

  // ==================== INFO GRID ====================
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  infoLabel: { 
    fontSize: 11, 
    color: '#6B7280' 
  },
  infoValue: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#1F2937', 
    marginTop: 4 
  },

  // ==================== INFO ROWS ====================
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  infoLabel2: { 
    color: '#6B7280', 
    fontSize: 13, 
    width: 80 
  },
  infoValue2: { 
    flex: 1, 
    fontSize: 13, 
    color: '#1F2937', 
    fontWeight: '500' 
  },

  // ==================== MONTO ====================
  montoCard: {
    backgroundColor: '#276749',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  montoLabel: { 
    color: '#9AE6B4', 
    fontSize: 14 
  },
  montoValor: { 
    color: '#fff', 
    fontSize: 36, 
    fontWeight: 'bold', 
    marginTop: 5 
  },

  // ==================== LÍNEA DE CAPTURA ====================
  lineaCapturaCard: {
    backgroundColor: '#FFFBEB',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D69E2E',
  },
  lineaCapturaLabel: { 
    color: '#975A16', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  lineaCapturaValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#744210',
    marginTop: 8,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  lineaCapturaVence: { 
    color: '#975A16', 
    fontSize: 12, 
    marginTop: 8 
  },

  // ==================== EVIDENCIAS ====================
  evidenciasContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  evidenciaImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },

  // ==================== FIRMAS ====================
  firmasContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  firmaBox: {
    flex: 1,
    height: 120,
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
  firmaBoxBloqueada: {
    opacity: 0.8,
  },
  firmaPreview: {
    width: '90%',
    height: 70,
    resizeMode: 'contain',
  },
  firmaPlaceholder: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  firmaOpcional: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  firmaCompletadaText: {
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 5,
  },
  firmaCompletadaTextInfractor: {
    color: '#1E40AF',
    fontWeight: 'bold',
    marginTop: 5,
  },
  alertaFirma: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  alertaFirmaText: { 
    color: '#1E40AF', 
    fontSize: 12, 
    flex: 1 
  },
  alertaGuardado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  alertaGuardadoText: { 
    color: '#059669', 
    fontSize: 12, 
    flex: 1 
  },

  // ==================== BOTONES ====================
  botonesContainer: { 
    padding: 15, 
    gap: 10 
  },
  guardarFirmasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  guardarFirmasBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  imprimirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a365d',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  imprimirBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  imprimirBtnText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});

export default styles;
