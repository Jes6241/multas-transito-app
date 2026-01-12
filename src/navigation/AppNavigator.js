import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Screens Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Screens Ciudadano
import HomeScreen from '../screens/ciudadano/HomeScreen';
import BuscarMultaScreen from '../screens/ciudadano/BuscarMultaScreen';
import BuscarFolioScreen from '../screens/ciudadano/BuscarFolioScreen';
import DetalleMultaScreen from '../screens/ciudadano/DetalleMultaScreen';
import PagarMultaScreen from '../screens/ciudadano/PagarMultaScreen';
import ImpugnacionScreen from '../screens/ciudadano/ImpugnacionScreen';
import MisVehiculosScreen from '../screens/ciudadano/MisVehiculosScreen';
import MisMultasScreen from '../screens/ciudadano/MisMultasScreen';
import MisPagosScreen from '../screens/ciudadano/MisPagosScreen';
import MisImpugnacionesScreen from '../screens/ciudadano/MisImpugnacionesScreen';
import DescuentosInfoScreen from '../screens/ciudadano/DescuentosInfoScreen';
import ConsultaCorralónScreen from '../screens/ciudadano/ConsultaCorralónScreen';
import ReportarErrorScreen from '../screens/ciudadano/ReportarErrorScreen';

// Screens Agente
import AgenteHomeScreen from '../screens/agente/AgenteHomeScreen';
import LevantarMultaScreen from '../screens/agente/LevantarMultaScreen';
import SolicitarGruaScreen from '../screens/agente/SolicitarGruaScreen';
import GruasSolicitadasScreen from '../screens/agente/GruasSolicitadasScreen';
import MultasOfflineScreen from '../screens/agente/MultasOfflineScreen';
import DetalleMultaAgenteScreen from '../screens/agente/DetalleMultaAgenteScreen';
import VerificarParquimetroScreen from '../screens/agente/VerificarParquimetroScreen';
import ScanPlacaScreen from '../screens/agente/ScanPlacaScreen';
import MiHistorialScreen from '../screens/agente/MiHistorialScreen';
import EmergenciaScreen from '../screens/agente/EmergenciaScreen';
import MultasHoyScreen from '../screens/agente/MultasHoyScreen';

// Screens Corralón
import CorralónHomeScreen from '../screens/corralon/CorralónHomeScreen';
import RecibirVehiculoScreen from '../screens/corralon/RecibirVehiculoScreen';
import VehiculosCorralónScreen from '../screens/corralon/VehiculosCorralónScreen';
import DetalleVehiculoCorralónScreen from '../screens/corralon/DetalleVehiculoCorralónScreen';
import CorralanScreen from '../screens/corralon/CorralanScreen';

// Screens Admin
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import HistorialScreen from '../screens/admin/HistorialScreen';

const Stack = createNativeStackNavigator();

// Navegador para ciudadano (público)
function CiudadanoNavigator() {
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
      <Stack. Screen
        name="PagarMulta"
        component={PagarMultaScreen}
        options={{ title: 'Pagar Multa' }}
      />
      <Stack.Screen
        name="Impugnacion"
        component={ImpugnacionScreen}
        options={{ title:  'Impugnar Multa' }}
      />
      <Stack.Screen
        name="MisVehiculos"
        component={MisVehiculosScreen}
        options={{ title: 'Mis Vehículos' }}
      />
      <Stack.Screen
        name="MisMultas"
        component={MisMultasScreen}
        options={{ title: 'Mis Multas' }}
      />
      <Stack.Screen
        name="MisPagos"
        component={MisPagosScreen}
        options={{ title: 'Mis Pagos' }}
      />
      <Stack.Screen
        name="MisImpugnaciones"
        component={MisImpugnacionesScreen}
        options={{ title: 'Mis Impugnaciones' }}
      />
      <Stack.Screen
        name="DescuentosInfo"
        component={DescuentosInfoScreen}
        options={{ title: 'Descuentos y Consecuencias' }}
      />
      <Stack.Screen
        name="ConsultaCorralon"
        component={ConsultaCorralónScreen}
        options={{ title: 'Consultar Corralón' }}
      />
      <Stack.Screen
        name="ReportarError"
        component={ReportarErrorScreen}
        options={{ title: 'Reportar Error' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar Sesión' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Registrarse' }}
      />
    </Stack.Navigator>
  );
}

// Navegador para agente
function AgenteNavigator() {
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
      <Stack.Screen
        name="GruasSolicitadas"
        component={GruasSolicitadasScreen}
        options={{ title: 'Grúas Solicitadas' }}
      />
      <Stack.Screen
        name="MultasOffline"
        component={MultasOfflineScreen}
        options={{ title: 'Multas Offline' }}
      />
      <Stack. Screen
        name="DetalleMultaAgente"
        component={DetalleMultaAgenteScreen}
        options={{ title: 'Detalle de Multa' }}
      />
      <Stack.Screen
        name="VerificarParquimetro"
        component={VerificarParquimetroScreen}
        options={{ title:  'Verificar Parquímetro' }}
      />
      <Stack.Screen
        name="ScanPlaca"
        component={ScanPlacaScreen}
        options={{ title: 'Consultar Vehículo' }}
      />
      <Stack.Screen
        name="MiHistorial"
        component={MiHistorialScreen}
        options={{ title:  'Mi Historial' }}
      />
      <Stack.Screen
        name="MultasHoy"
        component={MultasHoyScreen}
        options={{ title:  'Multas de Hoy' }}
      />
      <Stack.Screen
        name="Emergencia"
        component={EmergenciaScreen}
        options={{
          title: 'Emergencia',
          headerStyle: { backgroundColor:  '#DC2626' },
          headerTintColor:  '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

// Navegador para corralón
function CorralónNavigator() {
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
        options={{ title: 'Vehículos en Corralón' }}
      />
      <Stack.Screen
        name="DetalleVehiculoCorralon"
        component={DetalleVehiculoCorralónScreen}
        options={{ title: 'Detalle del Vehículo' }}
      />
      <Stack. Screen
        name="Corralan"
        component={CorralanScreen}
        options={{ title: 'Corralón' }}
      />
    </Stack.Navigator>
  );
}

// Navegador para admin
function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
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
}

export default function AppNavigator() {
  const { user, isAuthenticated } = useAuth();

  // Si está autenticado, mostrar según su rol
  if (isAuthenticated && user) {
    switch (user. rol) {
      case 'admin':
        return <AdminNavigator />;
      case 'agente': 
        return <AgenteNavigator />;
      case 'agente_corralon':
        return <CorralónNavigator />;
      default:
        return <CiudadanoNavigator />;
    }
  }

  // Si NO está autenticado, mostrar pantalla de ciudadano (pública)
  return <CiudadanoNavigator />;
}