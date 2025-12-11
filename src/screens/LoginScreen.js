import { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS } from '../config/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'El email es requerido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    setErrors(newErrors);
    return Object. keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (! result.success) {
      setErrors({ general: result.error });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles. header}>
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Multas Tránsito</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        {/* Form */}
        <View style={styles. form}>
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              <Text style={styles. errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <Input
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />}
            error={errors.email}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />}
            error={errors.password}
          />

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <Button
            title="Crear una cuenta"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  {
    flex:  1,
    backgroundColor: COLORS. background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height:  100,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    justifyContent:  'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation:  5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color:  COLORS.black,
  },
  subtitle:  {
    fontSize:  16,
    color:  COLORS.gray[500],
    marginTop: 8,
  },
  form: {
    gap: 8,
  },
  errorBanner:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: COLORS. danger,
    flex: 1,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});