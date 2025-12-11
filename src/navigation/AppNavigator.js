import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Screens comunes
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Screens Agente
import AgenteHomeScreen from '../screens/AgenteHomeScreen';
import LevantarMultaScreen from '../screens/LevantarMultaScreen';
import SolicitarGruaScreen from '../screens/SolicitarGruaScreen';
import GruasSolicitadasScreen from '../screens/GruasSolicitadasScreen';
import HistorialScreen from '../screens/HistorialScreen';
import MultasOfflineScreen from '../screens/MultasOfflineScreen';
import DetalleMultaScreen from '../screens/DetalleMultaScreen';

// Screens Corralón
import CorralónHomeScreen from '../screens/CorralónHomeScreen';
import RecibirVehiculoScreen from '../screens/RecibirVehiculoScreen';
import VehiculosCorralónScreen from '../screens/VehiculosCorralónScreen';

// Screens Admin
import AdminHomeScreen from '../screens/AdminHomeScreen';

// Screens Ciudadano (usa HomeScreen que ya tienes)
import HomeScreen from '../screens/HomeScreen';
import BuscarMultaScreen from '../screens/BuscarMultaScreen';
import BuscarFolioScreen from '../screens/BuscarFolioScreen';
import PagarMultaScreen from '../screens/PagarMultaScreen';
import ImpugnacionScreen from '../screens/ImpugnacionScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isAuthenticated } = useAuth();

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack. Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  // Navegación según rol
  switch (user?.rol) {
    // =============================================
    // ADMIN
    // =============================================
    case 'admin':
      return (
        <Stack.Navigator>
          <Stack. Screen
            name="AdminHome"
            component={AdminHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GruasSolicitadas"
            component={GruasSolicitadasScreen}
            options={{ title: 'Grúas Solicitadas' }}
          />
          <Stack.Screen
            name="VehiculosCorralón"
            component={VehiculosCorralónScreen}
            options={{ title: 'Vehículos en Corralón' }}
          />
          <Stack.Screen
            name="Historial"
            component={HistorialScreen}
            options={{ title: 'Historial de Multas' }}
          />
          <Stack.Screen
            name="DetalleMulta"
            component={DetalleMultaScreen}
            options={{ title: 'Detalle de Multa' }}
          />
        </Stack.Navigator>
      );

    // =============================================
    // AGENTE CORRALÓN
    // =============================================
    case 'agente_corralon':
      return (
        <Stack.Navigator>
          <Stack.Screen
            name="CorralónHome"
            component={CorralónHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RecibirVehiculo"
            component={RecibirVehiculoScreen}
            options={{ title: 'Recibir Vehículo' }}
          />
          <Stack.Screen
            name="VehiculosCorralón"
            component={VehiculosCorralónScreen}
            options={{ title:  'Vehículos en Corralón' }}
          />
        </Stack.Navigator>
      );

    // =============================================
    // AGENTE
    // =============================================
    case 'agente':
      return (
        <Stack.Navigator>
          <Stack.Screen
            name="AgenteHome"
            component={AgenteHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LevantarMulta"
            component={LevantarMultaScreen}
            options={{ title: 'Levantar Multa' }}
          />
          <Stack. Screen
            name="SolicitarGrua"
            component={SolicitarGruaScreen}
            options={{ title: 'Solicitar Grúa' }}
          />
          <Stack. Screen
            name="GruasSolicitadas"
            component={GruasSolicitadasScreen}
            options={{ title: 'Grúas Solicitadas' }}
          />
          <Stack.Screen
            name="Historial"
            component={HistorialScreen}
            options={{ title: 'Historial' }}
          />
          <Stack.Screen
            name="MultasOffline"
            component={MultasOfflineScreen}
            options={{ title:  'Multas Offline' }}
          />
          <Stack.Screen
            name="DetalleMulta"
            component={DetalleMultaScreen}
            options={{ title: 'Detalle de Multa' }}
          />
        </Stack. Navigator>
      );

    // =============================================
    // CIUDADANO (default)
    // =============================================
    case 'ciudadano':
    default:
      return (
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BuscarMulta"
            component={BuscarMultaScreen}
            options={{ title: 'Buscar por Placa' }}
          />
          <Stack.Screen
            name="BuscarFolio"
            component={BuscarFolioScreen}
            options={{ title: 'Buscar por Folio' }}
          />
          <Stack.Screen
            name="DetalleMulta"
            component={DetalleMultaScreen}
            options={{ title: 'Detalle de Multa' }}
          />
          <Stack.Screen
            name="PagarMulta"
            component={PagarMultaScreen}
            options={{ title: 'Pagar Multa' }}
          />
          <Stack.Screen
            name="Impugnacion"
            component={ImpugnacionScreen}
            options={{ title: 'Impugnar Multa' }}
          />
        </Stack.Navigator>
      );
  }
}