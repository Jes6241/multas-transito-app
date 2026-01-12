import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { COLORS } from '../../config/theme';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!nombre) newErrors.nombre = 'El nombre es requerido';
    if (!email) newErrors.email = 'El email es requerido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    if (password. length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    const result = await register(nombre, email, password);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada.  Ahora puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      setErrors({ general: result.error });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles. header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Regístrate para acceder a la app</Text>
        </View>

        <View style={styles. form}>
          {errors.general && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          )}

          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            value={nombre}
            onChangeText={setNombre}
            icon={<Ionicons name="person-outline" size={20} color={COLORS. gray[400]} />}
            error={errors.nombre}
          />

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

          <Input
            label="Confirmar contraseña"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />}
            error={errors.confirmPassword}
          />

          <Button
            title="Registrarme"
            onPress={handleRegister}
            loading={loading}
            variant="secondary"
            style={styles.registerButton}
          />

          <Button
            title="Ya tengo cuenta"
            onPress={() => navigation.goBack()}
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
  scrollContent:  {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color:  COLORS.black,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop:  8,
  },
  form:  {
    gap:  8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:  '#FEE2E2',
    padding: 12,
    borderRadius:  10,
    marginBottom: 16,
    gap:  8,
  },
  errorBannerText: {
    color:  COLORS.danger,
    flex: 1,
  },
  registerButton: {
    marginTop:  8,
    marginBottom: 16,
  },
});
