import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const ConnectivityBanner = ({ isOnline, onRefresh }) => {
  return (
    <View style={[styles.banner, { backgroundColor: isOnline ? '#D1FAE5' : '#FEF3C7' }]}>
      <Ionicons 
        name={isOnline ? 'wifi' : 'wifi-outline'} 
        size={20} 
        color={isOnline ? '#10B981' : '#F59E0B'} 
      />
      <Text style={[styles.text, { color: isOnline ? '#065F46' : '#92400E' }]}>
        {isOnline ? 'Conectado al servidor' : 'Sin conexión - Se guardará localmente'}
      </Text>
      {!isOnline && (
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#F59E0B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
