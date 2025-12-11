import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const Loading = ({ mensaje = 'Cargando.. .' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text style={styles.text}>{mensaje}</Text>
  </View>
);

const styles = StyleSheet. create({
  container: {
    flex: 1,
    justifyContent:  'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  text: {
    marginTop: 16,
    fontSize:  16,
    color: '#6B7280',
  },
});

export default Loading;