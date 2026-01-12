import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const InfraccionModal = ({ 
  visible, 
  otraInfraccion, 
  setOtraInfraccion, 
  onClose, 
  onAgregar 
}) => {
  const updateFundamento = (campo, valor) => {
    setOtraInfraccion({
      ...otraInfraccion,
      fundamento: {
        ...otraInfraccion.fundamento,
        [campo]: valor
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Agregar Otra Infracción</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Descripción de la infracción *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Obstrucción de vía pública"
              value={otraInfraccion.descripcion}
              onChangeText={(text) => setOtraInfraccion({ ...otraInfraccion, descripcion: text })}
            />

            <Text style={styles.label}>Monto de la multa *</Text>
            <View style={styles.montoContainer}>
              <Text style={styles.montoPrefix}>$</Text>
              <TextInput
                style={styles.montoInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={otraInfraccion.monto}
                onChangeText={(text) =>
                  setOtraInfraccion({ ...otraInfraccion, monto: text.replace(/[^0-9.]/g, '') })
                }
              />
            </View>

            {/* Fundamento Legal */}
            <Text style={styles.sectionTitle}>Fundamento Legal</Text>
            <View style={styles.fundamentoContainer}>
              <View style={styles.fundamentoRow}>
                <View style={styles.fundamentoField}>
                  <Text style={styles.fundamentoLabel}>Artículo *</Text>
                  <TextInput
                    style={styles.fundamentoInput}
                    placeholder="9"
                    keyboardType="numeric"
                    value={otraInfraccion.fundamento?.articulo || ''}
                    onChangeText={(text) => updateFundamento('articulo', text)}
                  />
                </View>
                <View style={styles.fundamentoField}>
                  <Text style={styles.fundamentoLabel}>Fracción</Text>
                  <TextInput
                    style={styles.fundamentoInput}
                    placeholder="II"
                    autoCapitalize="characters"
                    value={otraInfraccion.fundamento?.fraccion || ''}
                    onChangeText={(text) => updateFundamento('fraccion', text.toUpperCase())}
                  />
                </View>
              </View>
              <View style={styles.fundamentoRow}>
                <View style={styles.fundamentoField}>
                  <Text style={styles.fundamentoLabel}>Párrafo</Text>
                  <TextInput
                    style={styles.fundamentoInput}
                    placeholder="1"
                    keyboardType="numeric"
                    value={otraInfraccion.fundamento?.parrafo || ''}
                    onChangeText={(text) => updateFundamento('parrafo', text)}
                  />
                </View>
                <View style={styles.fundamentoField}>
                  <Text style={styles.fundamentoLabel}>Inciso</Text>
                  <TextInput
                    style={styles.fundamentoInput}
                    placeholder="0"
                    value={otraInfraccion.fundamento?.inciso || ''}
                    onChangeText={(text) => updateFundamento('inciso', text)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={onAgregar}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  montoPrefix: {
    paddingLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  montoInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  fundamentoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fundamentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fundamentoField: {
    flex: 1,
  },
  fundamentoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  fundamentoInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
