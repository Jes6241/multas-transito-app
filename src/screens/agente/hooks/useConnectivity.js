import { useState, useEffect } from 'react';

const API_URL = 'https://multas-transito-api.onrender.com';

export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(true);

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_URL}/`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsOnline(response.ok);
      return response.ok;
    } catch {
      setIsOnline(false);
      return false;
    }
  };

  const despertarServidor = async () => {
    try {
      await fetch(`${API_URL}/`);
      console.log('Servidor despierto');
    } catch {
      console.log('Servidor no disponible');
    }
  };

  useEffect(() => {
    checkConnectivity();
    despertarServidor();
  }, []);

  return {
    isOnline,
    checkConnectivity,
    despertarServidor,
  };
};
