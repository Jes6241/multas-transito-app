import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

const API_URL = 'https://multas-transito-api.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Usuario cargado:', userData. email, '- Rol:', userData.rol);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Intentando login:', email);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response. json();

      console.log('📦 Respuesta login:', JSON.stringify(data, null, 2));

      if (data.success && data.user) {
        // Guardar usuario con el rol
        const userData = {
          id: data.user. id,
          nombre: data.user. nombre,
          email: data.user. email,
          rol: data.user. rol,
        };

        console.log('👤 Usuario a guardar:', JSON.stringify(userData, null, 2));

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', data. token || '');

        setUser(userData);
        setIsAuthenticated(true);

        console.log('✅ Login exitoso - Rol:', userData.rol);
        console.log('✅ isAuthenticated:', true);

        return { success: true, user: userData };
      } else {
        console.log('❌ Login fallido:', data.message);
        return { success: false, error:  data.message || 'Credenciales incorrectas' };
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const register = async (nombre, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error:  data.message || 'Error al registrar' };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      console.log('👋 Sesión cerrada');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Mostrar nada mientras carga (evita flash de login)
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext. Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;