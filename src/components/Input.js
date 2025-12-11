import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../config/theme';

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  error,
}) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError, SHADOWS.small]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet. create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection:  'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:  COLORS.gray[200],
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  icon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: COLORS.black,
  },
  errorText: {
    color: COLORS.danger,
    fontSize:  12,
    marginTop: 4,
  },
});