import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';

export default function SignaturePad({ visible, onOK, onCancel, titulo }) {
  const signatureRef = useRef(null);

  const handleOK = (signature) => {
    // signature es un base64 de la imagen
    onOK(signature);
  };

  const handleClear = () => {
    signatureRef.current?. clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?. readSignature();
  };

  const style = `.m-signature-pad--footer { display: none; margin:  0px; }
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    canvas { background-color: #fff; }`;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Ionicons name="close" size={28} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles. titulo}>{titulo || 'Firma'}</Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.instrucciones}>
          <Ionicons name="finger-print" size={20} color="#6B7280" />
          <Text style={styles.instruccionesText}>
            Firma con tu dedo en el área blanca
          </Text>
        </View>

        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleOK}
            webStyle={style}
            backgroundColor="#FFFFFF"
            penColor="#1E40AF"
            dotSize={2}
            minWidth={2}
            maxWidth={4}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelarBtn} onPress={onCancel}>
            <Text style={styles.cancelarBtnText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles. confirmarBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={styles.confirmarBtnText}>Confirmar Firma</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  {
    flex:  1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelBtn: {
    padding: 5,
  },
  titulo:  {
    fontSize:  18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clearBtn: {
    padding: 5,
  },
  instrucciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 8,
  },
  instruccionesText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signatureContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor:  '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  cancelarBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelarBtnText:  {
    color:  '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmarBtn: {
    flex: 2,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    backgroundColor:  COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmarBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});