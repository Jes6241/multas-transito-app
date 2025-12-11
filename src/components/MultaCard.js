import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';

export default function MultaCard({ multa, onPress }) {
  const isPendiente = multa.estado === 'pendiente';

  return (
    <TouchableOpacity style={[styles.card, SHADOWS.medium]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles. header}>
        <View style={styles.folioContainer}>
          <Ionicons name="document-text" size={20} color={COLORS.primary} />
          <Text style={styles. folio}>{multa. folio}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isPendiente ? COLORS.danger : COLORS.secondary }]}>
          <Text style={styles.badgeText}>
            {isPendiente ? 'PENDIENTE' : 'PAGADA'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.infoRow}>
          <Ionicons name="car-sport" size={18} color={COLORS.gray[500]} />
          <Text style={styles. infoText}>{multa.placa}</Text>
        </View>
        <View style={styles. infoRow}>
          <Ionicons name="calendar" size={18} color={COLORS.gray[500]} />
          <Text style={styles. infoText}>{multa.fecha}</Text>
        </View>
        {multa.descripcion && (
          <View style={styles.infoRow}>
            <Ionicons name="alert-circle" size={18} color={COLORS. gray[500]} />
            <Text style={styles.infoText} numberOfLines={1}>{multa. descripcion}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.montoLabel}>Monto: </Text>
        <Text style={styles. monto}>${multa.monto}</Text>
        <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:  {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding:  16,
    marginBottom: 16,
  },
  header:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  folioContainer:  {
    flexDirection: 'row',
    alignItems:  'center',
    gap: 8,
  },
  folio: {
    fontSize: 16,
    fontWeight:  'bold',
    color: COLORS. black,
  },
  badge: {
    paddingHorizontal:  10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.white,
    fontSize:  11,
    fontWeight: 'bold',
  },
  body: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS. gray[200],
    paddingVertical: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:  10,
  },
  infoText:  {
    color: COLORS.gray[600],
    fontSize: 14,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  montoLabel: {
    color: COLORS.gray[500],
    fontSize:  14,
  },
  monto: {
    fontSize: 22,
    fontWeight: 'bold',
    color:  COLORS.primary,
    flex: 1,
    marginLeft: 8,
  },
});