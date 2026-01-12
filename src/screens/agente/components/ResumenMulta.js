import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatearFundamento } from '../constants';

export const ResumenMulta = ({ 
  placa, 
  infracciones, 
  todasLasInfracciones, 
  fotosCount, 
  firmaAgente, 
  montoTotal 
}) => {
  if (infracciones.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Resumen de la Multa</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Placa:</Text>
        <Text style={styles.value}>{placa || '-'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Infracciones:</Text>
        <Text style={styles.value}>{infracciones.length}</Text>
      </View>

      <View style={styles.lista}>
        {infracciones.map((id) => {
          const inf = todasLasInfracciones.find((t) => t.id === id);
          return (
            <View key={id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemText}>• {inf?.label}</Text>
                <Text style={styles.itemFundamento}>{formatearFundamento(inf?.fundamento)}</Text>
              </View>
              <Text style={styles.itemMonto}>${inf?.monto?.toLocaleString('es-MX')}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Evidencias:</Text>
        <Text style={styles.value}>{fotosCount} foto(s)</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Firma Agente:</Text>
        <Text style={[styles.value, { color: firmaAgente ? '#10B981' : '#EF4444' }]}>
          {firmaAgente ? '✓ Firmado' : '✗ Pendiente'}
        </Text>
      </View>

      <View style={styles.montoContainer}>
        <Text style={styles.montoLabel}>MONTO TOTAL:</Text>
        <Text style={styles.montoValue}>${montoTotal.toLocaleString('es-MX')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },
  label: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  lista: {
    marginVertical: 8,
    paddingLeft: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 13,
    color: '#374151',
  },
  itemFundamento: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  itemMonto: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 8,
  },
  montoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#0EA5E9',
  },
  montoLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369A1',
  },
  montoValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0369A1',
  },
});
