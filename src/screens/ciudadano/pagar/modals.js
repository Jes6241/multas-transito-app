import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config/theme';
import { styles } from './styles';

/**
 * Modal para pago con tarjeta de crédito/débito
 */
export const ModalTarjeta = ({
  visible,
  onClose,
  tarjeta,
  setTarjeta,
  formatearTarjeta,
  formatearExpiracion,
  descuento,
  onPagar,
  loading,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitleTarjeta}>💳 Pago con Tarjeta</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tarjetaForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Número de tarjeta</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#9CA3AF"
              value={tarjeta.numero}
              onChangeText={(t) => setTarjeta({ ...tarjeta, numero: formatearTarjeta(t) })}
              keyboardType="numeric"
              maxLength={19}
            />

            <Text style={styles.inputLabel}>Nombre del titular</Text>
            <TextInput
              style={styles.input}
              placeholder="JUAN PÉREZ"
              placeholderTextColor="#9CA3AF"
              value={tarjeta.nombre}
              onChangeText={(t) => setTarjeta({ ...tarjeta, nombre: t.toUpperCase() })}
              autoCapitalize="characters"
            />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Expiración</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#9CA3AF"
                  value={tarjeta.expiracion}
                  onChangeText={(t) =>
                    setTarjeta({ ...tarjeta, expiracion: formatearExpiracion(t) })
                  }
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#9CA3AF"
                  value={tarjeta.cvv}
                  onChangeText={(t) =>
                    setTarjeta({ ...tarjeta, cvv: t.replace(/\D/g, '').substring(0, 4) })
                  }
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.totalPagoCard}>
              <Text style={styles.totalPagoLabel}>Total a pagar:</Text>
              <Text style={styles.totalPagoMonto}>
                ${descuento.montoFinal.toLocaleString('es-MX')} MXN
              </Text>
            </View>

            <TouchableOpacity
              style={styles.pagarTarjetaBtn}
              onPress={onPagar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={20} color="#fff" />
                  <Text style={styles.pagarTarjetaBtnText}>
                    Pagar ${descuento.montoFinal.toLocaleString('es-MX')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.tarjetasAceptadas}>
              <Text style={styles.tarjetasLabel}>Aceptamos:</Text>
              <View style={styles.tarjetasLogos}>
                <Text style={styles.tarjetaLogo}>VISA</Text>
                <Text style={styles.tarjetaLogo}>MC</Text>
                <Text style={styles.tarjetaLogo}>AMEX</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal para línea de captura (pago en banco o en línea)
 */
export const ModalLineaCaptura = ({
  visible,
  onClose,
  metodoPago,
  lineaCaptura,
  vigenciaLinea,
  descuento,
  multa,
  onSubirComprobante,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitleTarjeta}>
              📄 Línea de Captura
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Línea de Captura Grande */}
          <View style={styles.lineaCapturaGrande}>
            <Text style={styles.lineaCapturaGrandeLabel}>LÍNEA DE CAPTURA</Text>
            <Text style={styles.lineaCapturaGrandeValue}>{lineaCaptura}</Text>
            <View style={styles.lineaCapturaVigenciaBox}>
              <Ionicons name="time-outline" size={16} color="#F59E0B" />
              <Text style={styles.lineaCapturaVigenciaText}>
                Vigencia: {vigenciaLinea ? new Date(vigenciaLinea).toLocaleDateString('es-MX') : '48 horas'}
              </Text>
            </View>
          </View>

          {/* Monto a pagar */}
          <View style={styles.montoLineaCaptura}>
            <Text style={styles.montoLineaCapturaLabel}>Monto a pagar:</Text>
            <Text style={styles.montoLineaCapturaValue}>
              ${descuento.montoFinal.toLocaleString('es-MX')} MXN
            </Text>
          </View>

          {/* Instrucciones */}
          <View style={styles.instruccionesBox}>
            <Text style={styles.instruccionesTitle}>📋 ¿Cómo pagar?</Text>
            <View style={styles.instruccionesList}>
              <Text style={styles.instruccionItem}>• En ventanilla de cualquier banco</Text>
              <Text style={styles.instruccionItem}>• En banca en línea o app de tu banco</Text>
              <Text style={styles.instruccionItem}>• Proporciona la línea de captura</Text>
              <Text style={styles.instruccionItem}>• Conserva tu comprobante de pago</Text>
            </View>
          </View>

          {/* Aviso importante */}
          <View style={styles.avisoBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.avisoText}>
              Una vez realizado el pago, sube tu comprobante para validar tu transacción más rápido.
            </Text>
          </View>

          {/* Botón Subir Comprobante */}
          <TouchableOpacity style={styles.subirComprobanteBtn} onPress={onSubirComprobante}>
            <Ionicons name="cloud-upload" size={22} color="#fff" />
            <Text style={styles.subirComprobanteBtnText}>Ya pagué, subir comprobante</Text>
          </TouchableOpacity>

          {/* Botón Cerrar */}
          <TouchableOpacity style={styles.cerrarModalBtn} onPress={onClose}>
            <Text style={styles.cerrarModalBtnText}>Pagar después</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal de pago exitoso
 */
export const ModalPagoExitoso = ({
  visible,
  onClose,
  lineaCaptura,
  descuento,
  multa,
  placa,
  onDescargarPDF,
  navigation,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconSuccess}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.modalTitle}>¡Pago Exitoso!</Text>
          <Text style={styles.modalMessage}>Tu pago ha sido procesado correctamente.</Text>

          <View style={styles.lineaCapturaContainer}>
            <Text style={styles.lineaCapturaModalLabel}>Línea de Captura:</Text>
            <Text style={styles.lineaCapturaModalValue}>{lineaCaptura}</Text>
          </View>

          <View style={styles.modalDetalles}>
            <View style={styles.modalDetalleRow}>
              <Text style={styles.modalDetalleLabel}>Monto:</Text>
              <Text style={styles.modalDetalleValue}>
                ${descuento.montoFinal.toLocaleString('es-MX')} MXN
              </Text>
            </View>
            <View style={styles.modalDetalleRow}>
              <Text style={styles.modalDetalleLabel}>Folio:</Text>
              <Text style={styles.modalDetalleValue}>{multa.folio}</Text>
            </View>
            <View style={styles.modalDetalleRow}>
              <Text style={styles.modalDetalleLabel}>Placa:</Text>
              <Text style={styles.modalDetalleValue}>{placa}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.modalBtn}
            onPress={() => {
              onClose();
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.modalBtnText}>Volver al Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalBtnSecondary} onPress={onDescargarPDF}>
            <Ionicons name="download" size={20} color={COLORS.primary} />
            <Text style={styles.modalBtnSecondaryText}>Descargar Comprobante PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Modal para subir recibo/comprobante
 */
export const ModalSubirRecibo = ({
  visible,
  onClose,
  reciboSubido,
  setReciboSubido,
  tomarFoto,
  seleccionarImagen,
  seleccionarPDF,
  multa,
  lineaCaptura,
  descuento,
  onEnviar,
  subiendoRecibo,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitleTarjeta}>📤 Subir Comprobante</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subirReciboSubtitle}>
            Sube una foto o PDF del recibo que te dieron al momento de pagar
          </Text>

          {/* Preview del archivo subido */}
          {reciboSubido && (
            <View style={styles.reciboPreview}>
              {reciboSubido.type === 'image' ? (
                <Image source={{ uri: reciboSubido.uri }} style={styles.reciboImagen} />
              ) : (
                <View style={styles.reciboPDFPreview}>
                  <Ionicons name="document" size={50} color="#EF4444" />
                  <Text style={styles.reciboPDFName}>{reciboSubido.name}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.eliminarReciboBtn}
                onPress={() => setReciboSubido(null)}
              >
                <Ionicons name="trash" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          )}

          {/* Opciones para subir */}
          {!reciboSubido && (
            <View style={styles.opcionesSubir}>
              <TouchableOpacity style={styles.opcionSubirBtn} onPress={tomarFoto}>
                <View style={[styles.opcionSubirIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="camera" size={32} color="#3B82F6" />
                </View>
                <Text style={styles.opcionSubirText}>Tomar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.opcionSubirBtn} onPress={seleccionarImagen}>
                <View style={[styles.opcionSubirIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="images" size={32} color="#10B981" />
                </View>
                <Text style={styles.opcionSubirText}>Galería</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.opcionSubirBtn} onPress={seleccionarPDF}>
                <View style={[styles.opcionSubirIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="document" size={32} color="#EF4444" />
                </View>
                <Text style={styles.opcionSubirText}>PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info de la multa */}
          <View style={styles.infoMultaRecibo}>
            <View style={styles.infoMultaReciboRow}>
              <Text style={styles.infoMultaReciboLabel}>Folio:</Text>
              <Text style={styles.infoMultaReciboValue}>{multa.folio}</Text>
            </View>
            <View style={styles.infoMultaReciboRow}>
              <Text style={styles.infoMultaReciboLabel}>Línea de Captura:</Text>
              <Text style={styles.infoMultaReciboValue}>{lineaCaptura}</Text>
            </View>
            <View style={styles.infoMultaReciboRow}>
              <Text style={styles.infoMultaReciboLabel}>Monto:</Text>
              <Text style={styles.infoMultaReciboValue}>
                ${descuento.montoFinal.toLocaleString('es-MX')} MXN
              </Text>
            </View>
          </View>

          {/* Botón Enviar */}
          <TouchableOpacity
            style={[styles.enviarReciboBtn, !reciboSubido && styles.enviarReciboBtnDisabled]}
            onPress={onEnviar}
            disabled={!reciboSubido || subiendoRecibo}
          >
            {subiendoRecibo ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.enviarReciboBtnText}>Enviar Comprobante</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cerrarModalBtn} onPress={onClose}>
            <Text style={styles.cerrarModalBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
