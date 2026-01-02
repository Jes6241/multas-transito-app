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
import MultasOfflineScreen from '../screens/MultasOfflineScreen';
import DetalleMultaAgenteScreen from '../screens/DetalleMultaAgenteScreen';
import VerificarParquimetroScreen from '../screens/VerificarParquimetroScreen';
import ScanPlacaScreen from '../screens/ScanPlacaScreen';
import MiHistorialScreen from '../screens/MiHistorialScreen';
import EmergenciaScreen from '../screens/EmergenciaScreen';

// Screens Corralón
import CorralónHomeScreen from '../screens/CorralónHomeScreen';
import RecibirVehiculoScreen from '../screens/RecibirVehiculoScreen';
import VehiculosCorralónScreen from '../screens/VehiculosCorralónScreen';
import DetalleVehiculoCorralónScreen from '../screens/DetalleVehiculoCorralónScreen';

// Screens Admin
import AdminHomeScreen from '../screens/AdminHomeScreen';
import HistorialScreen from '../screens/HistorialScreen';
import DetalleMultaScreen from '../screens/DetalleMultaScreen';

// Screens Ciudadano
import HomeScreen from '../screens/HomeScreen';
import BuscarMultaScreen from '../screens/BuscarMultaScreen';
import BuscarFolioScreen from '../screens/BuscarFolioScreen';
import PagarMultaScreen from '../screens/PagarMultaScreen';
import ImpugnacionScreen from '../screens/ImpugnacionScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Stack. Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  switch (user?.rol) {
    case 'admin': 
      return (
        <Stack.Navigator>
          <Stack. Screen
            name="AdminHome"
            component={AdminHomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Historial"
            component={HistorialScreen}
            options={{ title: 'Historial de Multas' }}
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
            name="DetalleVehiculoCorralon"
            component={DetalleVehiculoCorralónScreen}
            options={{ title: 'Detalle del Vehículo' }}
          />
          <Stack. Screen
            name="DetalleMulta"
            component={DetalleMultaScreen}
            options={{ title: 'Detalle de Multa' }}
          />
        </Stack.Navigator>
      );

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
          <Stack.Screen
            name="DetalleVehiculoCorralon"
            component={DetalleVehiculoCorralónScreen}
            options={{ title:  'Detalle del Vehículo' }}
          />
        </Stack.Navigator>
      );

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
          <Stack.Screen
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
            name="MultasOffline"
            component={MultasOfflineScreen}
            options={{ title:  'Multas Offline' }}
          />
          <Stack.Screen
            name="DetalleMulta"
            component={DetalleMultaAgenteScreen}
            options={{ title:  'Detalle de Multa' }}
          />
          <Stack.Screen
            name="VerificarParquimetro"
            component={VerificarParquimetroScreen}
            options={{ title: 'Verificar Parquímetro' }}
          />
          <Stack.Screen
            name="ScanPlaca"
            component={ScanPlacaScreen}
            options={{ title: 'Escanear Placa' }}
          />
          <Stack. Screen
            name="MiHistorial"
            component={MiHistorialScreen}
            options={{ title: 'Mi Historial' }}
          />
          <Stack.Screen
            name="Emergencia"
            component={EmergenciaScreen}
            options={{
              title: 'Emergencia',
              headerStyle: { backgroundColor: '#DC2626' },
              headerTintColor:  '#fff',
            }}
          />
        </Stack.Navigator>
      );

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