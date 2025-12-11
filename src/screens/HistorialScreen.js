import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import Loading from '../components/Loading';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function HistorialScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [multas, setMultas] = useState([]);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    cargarMultas();
  }, []);

  const cargarMultas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/multas`);
      const data = await response. json();
      if (data.success) {
        setMultas(data.multas || []);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const multasFiltradas = multas.filter((m) => {
    if (filtro === 'pendientes') return m.estatus === 'pendiente';
    if (filtro === 'pagadas') return m.estatus === 'pagada';
    return true;
  });

  const generarPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family:  Arial; padding: 20px; }
            h1 { color:  #3B82F6; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border:  1px solid #ddd; padding:  10px; text-align: left; }
            th { background-color: #3B82F6; color: white; }
            . pendiente { color: #F59E0B; font-weight: bold; }
            .pagada { color: #10B981; font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>🚗 Historial de Multas</h1>
          <p>Fecha de generación: ${new Date().toLocaleDateString('es-MX')}</p>
          <p>Filtro: ${filtro. charAt(0).toUpperCase() + filtro.slice(1)}</p>
          <table>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Infracción</th>
              <th>Monto</th>
              <th>Estatus</th>
            </tr>
            ${multasFiltradas.map(m => `
              <tr>
                <td>${m. folio}</td>
                <td>${new Date(m. created_at).toLocaleDateString('es-MX')}</td>
                <td>${m.tipo_infraccion || 'N/A'}</td>
                <td>$${parseFloat(m.monto_final).toLocaleString('es-MX')}</td>
                <td class="${m.estatus}">${m.estatus. toUpperCase()}</td>
              </tr>
            `).join('')}
          </table>
          <p class="total">
            Total:  $${multasFiltradas. reduce((sum, m) => sum + parseFloat(m.monto_final || 0), 0).toLocaleString('es-MX')}
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print. printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  };

  const renderMulta = ({ item }) => (
    <TouchableOpacity
      style={styles.multaCard}
      onPress={() => navigation.navigate('DetalleMulta', { multa:  item })}
    >
      <View style={styles.multaHeader}>
        <Text style={styles.folio}>{item.folio}</Text>
        <View style={[
          styles.estatusBadge,
          { backgroundColor: item.estatus === 'pendiente' ?  '#FEF3C7' : '#D1FAE5' }
        ]}>
          <Text style={[
            styles.estatusText,
            { color: item. estatus === 'pendiente' ? '#F59E0B' : '#10B981' }
          ]}>
            {item.estatus}
          </Text>
        </View>
      </View>
      <Text style={styles.tipo}>{item.tipo_infraccion || 'Infracción de tránsito'}</Text>
      <View style={styles.multaFooter}>
        <Text style={styles. fecha}>
          <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />{' '}
          {new Date(item. created_at).toLocaleDateString('es-MX')}
        </Text>
        <Text style={styles.monto}>
          ${parseFloat(item.monto_final).toLocaleString('es-MX')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <Loading />;

  return (
    <View style={styles. container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Multas</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {['todas', 'pendientes', 'pagadas'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBtn, filtro === f && styles.filtroActivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextoActivo]}>
              {f. charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resumen */}
      <View style={styles.resumenBar}>
        <Text style={styles.resumenText}>
          {multasFiltradas.length} multa(s) • Total: ${multasFiltradas.reduce((sum, m) => sum + parseFloat(m.monto_final || 0), 0).toLocaleString('es-MX')}
        </Text>
      </View>

      {/* Botón Descargar PDF */}
      <TouchableOpacity style={styles.pdfBtn} onPress={generarPDF}>
        <Ionicons name="download-outline" size={20} color="#fff" />
        <Text style={styles.pdfBtnText}>Descargar PDF</Text>
      </TouchableOpacity>

      {/* Lista */}
      <FlatList
        data={multasFiltradas}
        renderItem={renderMulta}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles. lista}
        refreshing={loading}
        onRefresh={cargarMultas}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={60} color="#D1D5DB" />
            <Text style={styles. emptyText}>No hay multas {filtro !== 'todas' ?  filtro : ''}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor:  COLORS.primary,
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtros: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filtroBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor:  '#fff',
    alignItems: 'center',
    ... SHADOWS.small,
  },
  filtroActivo: {
    backgroundColor:  COLORS.primary,
  },
  filtroText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  filtroTextoActivo: {
    color: '#fff',
  },
  resumenBar:  {
    backgroundColor: '#E5E7EB',
    marginHorizontal: 15,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumenText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  pdfBtn: {
    flexDirection: 'row',
    backgroundColor:  COLORS.secondary,
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pdfBtnText:  {
    color:  '#fff',
    fontWeight: 'bold',
  },
  lista:  {
    padding: 15,
  },
  multaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ... SHADOWS.small,
  },
  multaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  estatusBadge:  {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tipo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop:  5,
  },
  multaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  fecha: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  monto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  empty: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText:  {
    color:  '#9CA3AF',
    marginTop: 10,
  },
});