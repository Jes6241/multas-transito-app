import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../config/theme';

export default function DescuentosInfoScreen({ navigation }) {
  const descuentos = [
    {
      id: 1,
      titulo: 'Pronto Pago (50%)',
      descripcion: 'Paga dentro de los primeros 10 días hábiles después de la infracción',
      porcentaje: '50%',
      icono: 'flash',
      color: '#10B981',
      bgColor: '#D1FAE5',
      condiciones: [
        'Aplica únicamente a infracciones de tránsito',
        'No aplica si ya venció el plazo',
        'No acumulable con otros descuentos',
        'Válido solo para primera infracción del vehículo en el año',
      ],
    },
    {
      id: 2,
      titulo: 'Descuento por Pago Anticipado (25%)',
      descripcion: 'Paga entre el día 11 y 20 después de la infracción',
      porcentaje: '25%',
      icono: 'time',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      condiciones: [
        'Aplica después de vencer el pronto pago',
        'Válido por 10 días hábiles adicionales',
        'No acumulable con otros descuentos',
      ],
    },
    {
      id: 3,
      titulo: 'Adultos Mayores (20%)',
      descripcion: 'Descuento para ciudadanos mayores de 60 años',
      porcentaje: '20%',
      icono: 'people',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      condiciones: [
        'Presentar identificación oficial con edad',
        'El vehículo debe estar a nombre del beneficiario',
        'Aplica sobre el monto ya descontado por pronto pago',
      ],
    },
  ];

  const consecuencias = [
    {
      id: 1,
      titulo: 'Recargos por Mora',
      descripcion: 'Después del día 30, se aplican recargos del 3% mensual sobre el monto original',
      icono: 'trending-up',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      id: 2,
      titulo: 'Remisión a Corralón',
      descripcion: 'Si acumulas 3+ multas sin pagar, tu vehículo puede ser remitido al corralón',
      icono: 'car',
      color: '#EF4444',
      bgColor: '#FEE2E2',
    },
    {
      id: 3,
      titulo: 'Restricción de Trámites',
      descripcion: 'No podrás realizar renovación de placas, tarjeta de circulación o verificación vehicular',
      icono: 'ban',
      color: '#DC2626',
      bgColor: '#FEE2E2',
    },
    {
      id: 4,
      titulo: 'Envío a Buró de Crédito',
      descripcion: 'Adeudos mayores a 90 días pueden ser reportados a sociedades de información crediticia',
      icono: 'alert-circle',
      color: '#7C3AED',
      bgColor: '#EDE9FE',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="pricetags" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Descuentos y Consecuencias</Text>
        <Text style={styles.subtitle}>
          Conoce los beneficios por pronto pago y las consecuencias de no pagar a tiempo
        </Text>
      </View>

      {/* Sección Descuentos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="gift" size={24} color="#10B981" />
          <Text style={styles.sectionTitle}>Descuentos Disponibles</Text>
        </View>

        {descuentos.map((descuento) => (
          <View key={descuento.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: descuento.bgColor }]}>
                <Ionicons name={descuento.icono} size={28} color={descuento.color} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{descuento.titulo}</Text>
                <Text style={styles.cardDesc}>{descuento.descripcion}</Text>
              </View>
              <View style={[styles.porcentajeBadge, { backgroundColor: descuento.bgColor }]}>
                <Text style={[styles.porcentajeText, { color: descuento.color }]}>
                  {descuento.porcentaje}
                </Text>
              </View>
            </View>

            <View style={styles.condicionesContainer}>
              <Text style={styles.condicionesTitle}>Condiciones:</Text>
              {descuento.condiciones.map((condicion, index) => (
                <View key={index} style={styles.condicionRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.condicionText}>{condicion}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Sección Consecuencias */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning" size={24} color="#EF4444" />
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
            Consecuencias por Falta de Pago
          </Text>
        </View>

        {consecuencias.map((consecuencia) => (
          <View key={consecuencia.id} style={styles.consecuenciaCard}>
            <View style={[styles.consecuenciaIcon, { backgroundColor: consecuencia.bgColor }]}>
              <Ionicons name={consecuencia.icono} size={24} color={consecuencia.color} />
            </View>
            <View style={styles.consecuenciaContent}>
              <Text style={styles.consecuenciaTitle}>{consecuencia.titulo}</Text>
              <Text style={styles.consecuenciaDesc}>{consecuencia.descripcion}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Tabla de tiempos */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>📅 Línea de Tiempo</Text>
        
        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDay}>Días 1-10</Text>
            <Text style={styles.timelineText}>Pronto pago: 50% de descuento</Text>
          </View>
        </View>

        <View style={styles.timelineLine} />

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: '#3B82F6' }]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDay}>Días 11-20</Text>
            <Text style={styles.timelineText}>Pago anticipado: 25% de descuento</Text>
          </View>
        </View>

        <View style={styles.timelineLine} />

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDay}>Días 21-30</Text>
            <Text style={styles.timelineText}>Pago sin descuento (monto completo)</Text>
          </View>
        </View>

        <View style={styles.timelineLine} />

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: '#EF4444' }]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineDay}>Día 31+</Text>
            <Text style={styles.timelineText}>Recargos del 3% mensual</Text>
          </View>
        </View>
      </View>

      {/* Call to action */}
      <View style={styles.ctaCard}>
        <Ionicons name="rocket" size={32} color={COLORS.primary} />
        <Text style={styles.ctaTitle}>¡Paga a tiempo y ahorra!</Text>
        <Text style={styles.ctaText}>
          Aprovecha los descuentos disponibles y evita recargos innecesarios
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('BuscarFolio')}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Buscar mi multa</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  section: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  porcentajeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  porcentajeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  condicionesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  condicionesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  condicionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  condicionText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },
  consecuenciaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  consecuenciaIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consecuenciaContent: {
    flex: 1,
    marginLeft: 12,
  },
  consecuenciaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  consecuenciaDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  timelineCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLine: {
    width: 2,
    height: 25,
    backgroundColor: '#E5E7EB',
    marginLeft: 6,
    marginVertical: 3,
  },
  timelineContent: {
    marginLeft: 15,
  },
  timelineDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineText: {
    fontSize: 13,
    color: '#6B7280',
  },
  ctaCard: {
    backgroundColor: '#EEF2FF',
    margin: 15,
    marginTop: 0,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 10,
  },
  ctaText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 15,
    gap: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
