import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config/theme';
import { styles } from './styles';

/**
 * Alerta cuando la línea de captura está vencida
 */
export const AlertaLineaVencida = ({ onRenovar }) => (
  <View style={styles.alertaVencida}>
    <Ionicons name="warning" size={24} color="#DC2626" />
    <View style={styles.alertaContent}>
      <Text style={styles.alertaTitle}>Línea de captura vencida</Text>
      <Text style={styles.alertaText}>
        Tu línea de captura ha expirado. Genera una nueva para continuar.
      </Text>
    </View>
    <TouchableOpacity style={styles.alertaBtn} onPress={onRenovar}>
      <Text style={styles.alertaBtnText}>Renovar</Text>
    </TouchableOpacity>
  </View>
);

/**
 * Card de resumen de la multa
 */
export const ResumenMultaCard = ({ multa, placa, lineaCaptura, vigenciaLinea, lineaVencida }) => (
  <View style={styles.resumenCard}>
    <Text style={styles.resumenTitle}>Resumen de la Multa</Text>

    <View style={styles.resumenRow}>
      <Text style={styles.resumenLabel}>Folio:</Text>
      <Text style={styles.resumenValue}>{multa.folio}</Text>
    </View>

    <View style={styles.resumenRow}>
      <Text style={styles.resumenLabel}>Infracción:</Text>
      <Text style={styles.resumenValue}>{multa.tipo_infraccion}</Text>
    </View>

    <View style={styles.resumenRow}>
      <Text style={styles.resumenLabel}>Placa:</Text>
      <Text style={[styles.resumenValue, styles.placaDestacada]}>{placa}</Text>
    </View>

    <View style={styles.resumenRow}>
      <Text style={styles.resumenLabel}>Fecha:</Text>
      <Text style={styles.resumenValue}>
        {new Date(multa.fecha_infraccion || multa.created_at).toLocaleDateString('es-MX')}
      </Text>
    </View>

    {lineaCaptura && !lineaVencida && (
      <View style={styles.lineaCapturaInfo}>
        <Text style={styles.lineaCapturaLabel}>Línea de Captura:</Text>
        <Text style={styles.lineaCapturaValue}>{lineaCaptura}</Text>
        <Text style={styles.lineaCapturaVigencia}>
          Vigencia: {vigenciaLinea ? new Date(vigenciaLinea).toLocaleDateString('es-MX') : 'N/A'}
        </Text>
      </View>
    )}
  </View>
);

/**
 * Card de descuento disponible
 */
export const DescuentoCard = ({ descuento }) => (
  <View style={styles.descuentoCard}>
    <View style={styles.descuentoHeader}>
      <Ionicons name="pricetag" size={24} color="#059669" />
      <Text style={styles.descuentoTitle}>¡Descuento Disponible!</Text>
    </View>
    <Text style={styles.descuentoPorcentaje}>{descuento.porcentaje}% de descuento</Text>
    <Text style={styles.descuentoDias}>
      Te quedan {descuento.diasRestantes} días para aprovecharlo
    </Text>
    <View style={styles.descuentoMontos}>
      <Text style={styles.montoOriginal}>
        Monto original: ${descuento.montoOriginal.toLocaleString('es-MX')}
      </Text>
      <Text style={styles.montoAhorro}>
        Ahorras: ${(descuento.montoOriginal - descuento.montoFinal).toLocaleString('es-MX')}
      </Text>
    </View>
  </View>
);

/**
 * Card de total a pagar
 */
export const TotalCard = ({ monto }) => (
  <View style={styles.totalCard}>
    <Text style={styles.totalLabel}>Total a Pagar</Text>
    <Text style={styles.totalMonto}>${monto.toLocaleString('es-MX')} MXN</Text>
  </View>
);

/**
 * Card de método de pago seleccionable
 */
export const MetodoPagoCard = ({ metodo, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.metodoCard, selected && styles.metodoCardSelected]}
    onPress={onSelect}
  >
    <View style={[styles.metodoIconContainer, { backgroundColor: `${metodo.color}20` }]}>
      <Ionicons name={metodo.icono} size={28} color={metodo.color} />
    </View>
    <View style={styles.metodoInfo}>
      <Text style={styles.metodoNombre}>{metodo.nombre}</Text>
      <Text style={styles.metodoDescripcion}>{metodo.descripcion}</Text>
    </View>
    <View style={styles.metodoCheck}>
      {selected ? (
        <Ionicons name="checkmark-circle" size={26} color={COLORS.primary} />
      ) : (
        <Ionicons name="ellipse-outline" size={26} color="#D1D5DB" />
      )}
    </View>
  </TouchableOpacity>
);

/**
 * Información de seguridad
 */
export const SeguridadInfo = () => (
  <View style={styles.seguridadInfo}>
    <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
    <Text style={styles.seguridadText}>Pago 100% seguro. Tus datos están protegidos.</Text>
  </View>
);
