import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      setLocation(loc.coords);

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (address) {
          const partes = [];
          if (address.street) partes.push(address.street);
          if (address.streetNumber) partes.push(address.streetNumber);
          if (address.district) partes.push(address.district);
          if (address.city) partes.push(address.city);

          const dir = partes.join(', ') || `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`;
          setDireccion(dir);
        }
      } catch (geocodeError) {
        console.log('Geocoding no disponible, usando coordenadas');
        const dir = `Lat: ${loc.coords.latitude.toFixed(6)}, Lng: ${loc.coords.longitude.toFixed(6)}`;
        setDireccion(dir);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setDireccion('Ubicación no disponible');
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    direccion,
    locationLoading,
    refreshLocation: getLocation,
  };
};
