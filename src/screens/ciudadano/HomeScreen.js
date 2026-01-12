import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../config/theme';

export default function HomeScreen({ navigation }) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style:  'cancel' },
        { 
          text: 'Sí, salir', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  // Función para verificar si requiere login
  const requireLogin = (screenName, screenTitle) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Iniciar Sesión',
        `Para acceder a "${screenTitle}" necesitas iniciar sesión.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Iniciar Sesión', 
            onPress: () => navigation.navigate('Login') 
          },
        ]
      );
    } else {
      navigation.navigate(screenName);
    }
  };

  return (
    <ScrollView style={styles. container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles. header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles. headerTitle}>🚗 Multas Tránsito</Text>
            <Text style={styles.headerSubtitle}>
              {isAuthenticated 
                ? `¡Hola, ${user?. nombre?. split(' ')[0]}!` 
                : 'Consulta y paga tus multas'}
            </Text>
          </View>
          
          {/* Botón Login/Usuario */}
          {isAuthenticated ?  (
            <TouchableOpacity style={styles.userBtn} onPress={handleLogout}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.userBtnText}>Salir</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-in-outline" size={22} color="#fff" />
              <Text style={styles.loginBtnText}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Banner de bienvenida para usuarios logueados */}
      {isAuthenticated && (
        <View style={styles. welcomeBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Sesión activa</Text>
            <Text style={styles.welcomeEmail}>{user?.email}</Text>
          </View>
        </View>
      )}

      {/* ===== SECCIÓN PÚBLICA (TODOS) ===== */}
      <Text style={styles.sectionTitle}>🔓 Consultas Públicas</Text>
      <Text style={styles.sectionSubtitle}>Disponible para todos</Text>
      
      <View style={styles. menuGrid}>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('BuscarMulta')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="car" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.menuTitle}>Buscar por Placa</Text>
          <Text style={styles.menuDesc}>Consulta multas con tu placa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('BuscarFolio')}
        >
          <View style={[styles.menuIcon, { backgroundColor:  '#E0E7FF' }]}>
            <Ionicons name="document-text" size={32} color="#6366F1" />
          </View>
          <Text style={styles.menuTitle}>Buscar por Folio</Text>
          <Text style={styles.menuDesc}>Busca una multa específica</Text>
        </TouchableOpacity>
      </View>

      {/* ===== SECCIÓN EXCLUSIVA (SOLO LOGUEADOS) ===== */}
      <Text style={styles.sectionTitle}>🔐 Mis Servicios</Text>
      <Text style={styles. sectionSubtitle}>
        {isAuthenticated ?  'Acceso completo' : 'Requiere iniciar sesión'}
      </Text>

      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={[styles.menuCard, ! isAuthenticated && styles.menuCardLocked]}
          onPress={() => requireLogin('MisVehiculos', 'Mis Vehículos')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="car-sport" size={32} color="#D97706" />
          </View>
          {! isAuthenticated && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
            </View>
          )}
          <Text style={styles.menuTitle}>Mis Vehículos</Text>
          <Text style={styles.menuDesc}>Registra tus placas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, !isAuthenticated && styles.menuCardLocked]}
          onPress={() => requireLogin('MisMultas', 'Mis Multas')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="warning" size={32} color="#DC2626" />
          </View>
          {!isAuthenticated && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
            </View>
          )}
          <Text style={styles.menuTitle}>Mis Multas</Text>
          <Text style={styles.menuDesc}>Historial completo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, !isAuthenticated && styles.menuCardLocked]}
          onPress={() => requireLogin('MisPagos', 'Mis Pagos')}
        >
          <View style={[styles. menuIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="receipt" size={32} color="#059669" />
          </View>
          {!isAuthenticated && (
            <View style={styles. lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
            </View>
          )}
          <Text style={styles.menuTitle}>Mis Pagos</Text>
          <Text style={styles.menuDesc}>Comprobantes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, !isAuthenticated && styles.menuCardLocked]}
          onPress={() => requireLogin('MisImpugnaciones', 'Mis Impugnaciones')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="scale" size={32} color="#7C3AED" />
          </View>
          {! isAuthenticated && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
            </View>
          )}
          <Text style={styles. menuTitle}>Impugnaciones</Text>
          <Text style={styles.menuDesc}>Estado de solicitudes</Text>
        </TouchableOpacity>
      </View>

      {/* Información de ayuda */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={28} color="#3B82F6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>¿Cómo funciona? </Text>
          <Text style={styles.infoText}>
            1. Busca tu multa por placa o folio{'\n'}
            2. Revisa los detalles de la infracción{'\n'}
            3. Paga en línea o impugna si no estás de acuerdo
          </Text>
        </View>
      </View>

      {/* Banner de registro (solo si no está logueado) */}
      {! isAuthenticated && (
        <View style={styles.registerCard}>
          <View style={styles.registerHeader}>
            <Ionicons name="gift" size={28} color="#059669" />
            <Text style={styles.registerTitle}>¡Crea tu cuenta gratis!</Text>
          </View>
          <Text style={styles.registerText}>
            ✓ Guarda tus vehículos{'\n'}
            ✓ Recibe notificaciones de multas{'\n'}
            ✓ Historial de pagos{'\n'}
            ✓ Seguimiento de impugnaciones
          </Text>
          <TouchableOpacity
            style={styles. registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.registerBtnText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contacto */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>¿Necesitas ayuda?</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn}>
            <View style={[styles. contactIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="call" size={22} color="#059669" />
            </View>
            <Text style={styles. contactBtnText}>Llamar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}>
            <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="mail" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.contactBtnText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}>
            <View style={[styles.contactIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="location" size={22} color="#DC2626" />
            </View>
            <Text style={styles. contactBtnText}>Oficinas</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:  '#F3F4F6',
  },
  // Header
  header:  {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal:  20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius:  30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft:  {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Botón Login
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // Botón Usuario
  userBtn:  {
    alignItems: 'center',
  },
  avatarContainer:  {
    width:  45,
    height:  45,
    borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent:  'center',
    alignItems: 'center',
  },
  userBtnText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  // Welcome Banner
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:  '#D1FAE5',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    gap: 12,
  },
  welcomeContent:  {
    flex:  1,
  },
  welcomeTitle: {
    color: '#065F46',
    fontWeight: 'bold',
    fontSize:  15,
  },
  welcomeEmail: {
    color: '#047857',
    fontSize: 13,
    marginTop: 2,
  },
  // Secciones
  sectionTitle: {
    fontSize: 18,
    fontWeight:  'bold',
    color: '#1F2937',
    marginHorizontal: 15,
    marginTop: 25,
  },
  sectionSubtitle: {
    fontSize: 13,
    color:  '#6B7280',
    marginHorizontal: 15,
    marginBottom: 15,
    marginTop: 4,
  },
  // Menu Grid
  menuGrid: {
    flexDirection:  'row',
    flexWrap: 'wrap',
    paddingHorizontal:  10,
    gap: 10,
  },
  menuCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding:  18,
    alignItems: 'center',
    marginHorizontal: '1. 5%',
    shadowColor: '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation:  3,
    position: 'relative',
  },
  menuCardLocked: {
    opacity: 0.7,
  },
  lockBadge: {
    position: 'absolute',
    top: 10,
    right:  10,
    backgroundColor: '#9CA3AF',
    borderRadius: 10,
    padding:  4,
  },
  menuIcon: {
    width: 60,
    height:  60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  menuDesc: {
    fontSize: 11,
    color:  '#6B7280',
    textAlign: 'center',
    marginTop:  4,
  },
  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 15,
    marginTop: 25,
    padding:  18,
    borderRadius: 16,
    gap: 15,
  },
  infoContent:  {
    flex:  1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText:  {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  // Register Card
  registerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    padding:  20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  registerHeader:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  registerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
  },
  registerText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 24,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    gap:  10,
    marginTop: 15,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Contact Card
  contactCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  contactRow:  {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactBtn: {
    alignItems: 'center',
  },
  contactIcon: {
    width: 50,
    height:  50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactBtnText: {
    fontSize: 12,
    color:  '#6B7280',
    fontWeight: '500',
  },
});