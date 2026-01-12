// Exportaciones centralizadas de utilidades del agente
export * from './pdfGenerator';
export { getPDFStyles } from './pdfStyles';

// Re-exportar funciones de línea de captura de Tesorería
export { 
  generarLineaCapturaTesoreria,
  generarLineaCapturaLocal 
} from './pdfGenerator';
