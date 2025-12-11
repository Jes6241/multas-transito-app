import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../config/theme';

export default function Button({ 
  title, 
  onPress, 
  loading = false, 
  variant = 'primary', // 'primary', 'secondary', 'outline'
  icon,
  style,
}) {
  const buttonStyles = {
    primary: {
      backgroundColor:  COLORS.primary,
      borderWidth: 0,
    },
    secondary:  {
      backgroundColor:  COLORS.secondary,
      borderWidth:  0,
    },
    outline:  {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: COLORS.primary,
    },
  };

  const textStyles = {
    primary: { color: COLORS. white },
    secondary: { color:  COLORS.white },
    outline: { color:  COLORS.primary },
  };

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyles[variant], SHADOWS.small, style]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS. primary : COLORS. white} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});