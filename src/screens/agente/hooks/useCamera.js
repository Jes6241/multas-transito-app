import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const useCamera = () => {
  const [fotos, setFotos] = useState([]);

  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setFotos(prev => [...prev, { uri: result.assets[0].uri, base64: result.assets[0].base64 }]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const nuevasFotos = result.assets
          .filter((asset) => asset.base64)
          .map((asset) => ({ uri: asset.uri, base64: asset.base64 }));
        setFotos(prev => [...prev, ...nuevasFotos]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const eliminarFoto = (index) => {
    setFotos(prev => {
      const nuevasFotos = [...prev];
      nuevasFotos.splice(index, 1);
      return nuevasFotos;
    });
  };

  const limpiarFotos = () => {
    setFotos([]);
  };

  return {
    fotos,
    tomarFoto,
    seleccionarFoto,
    eliminarFoto,
    limpiarFotos,
  };
};
