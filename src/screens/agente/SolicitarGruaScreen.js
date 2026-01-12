import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SHADOWS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../config/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { generarFolioTemporal, generarLineaCapturaTesoreria, generarLineaCaptura, generarFechaVencimiento } from './utils';

const API_URL = 'https://multas-transito-api.onrender.com';

const MOTIVOS_REMISION = [
  { id: 'estacionamiento_prohibido', label: 'Estacionamiento prohibido', monto: 800, icon: 'ban' },
  { id: 'abandono', label: 'Abandono de vehículo', monto: 1500, icon: 'time' },
  { id: 'accidente', label: 'Accidente vial', monto: 2000, icon: 'warning' },
  { id: 'infraccion_grave', label: 'Infracción grave', monto: 2500, icon: 'alert-circle' },
  { id: 'sin_placas', label: 'Vehículo sin placas', monto: 1800, icon: 'close-circle' },
  { id: 'alcoholimetro', label: 'Operativo alcoholímetro', monto: 3500, icon: 'wine' },
  { id: 'otro', label: 'Otro', monto: 1000, icon: 'ellipsis-horizontal' },
];

const TIPOS_VEHICULO = [
  { id: 'automovil', label: 'Auto', icon: 'car' },
  { id: 'motocicleta', label: 'Moto', icon: 'bicycle' },
  { id: 'camioneta', label: 'Camioneta', icon: 'bus' },
  { id: 'camion', label: 'Camión', icon: 'train' },
];

export default function SolicitarGruaScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingGruas, setLoadingGruas] = useState(true);
  const [location, setLocation] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [gruasDisponibles, setGruasDisponibles] = useState([]);
  const [gruaSeleccionada, setGruaSeleccionada] = useState(null);
  const [notas, setNotas] = useState('');

  // Estado para múltiples vehículos
  const [vehiculos, setVehiculos] = useState([{
    placa: '',
    motivo: null,
    // Datos del vehículo (búsqueda o manual)
    vehiculoEncontrado: null,
    vehiculoNuevo: false,
    buscandoVehiculo: false,
    datosVehiculo: {
      marca: '',
      modelo: '',
      anio: '',
      color: '',
      numero_serie: '',
      tipo_vehiculo: 'automovil',
    },
  }]);

  useEffect(() => {
    getLocation();
  }, []);

  // ========== FUNCIONES DE UBICACIÓN ==========
  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimarTiempoLlegada = (distanciaKm) => {
    if (!distanciaKm) return 'No disponible';
    const tiempoMinutos = Math.round((distanciaKm / 30) * 60);
    if (tiempoMinutos < 1) return '< 1 min';
    if (tiempoMinutos < 60) return `${tiempoMinutos} min`;
    const horas = Math.floor(tiempoMinutos / 60);
    const mins = tiempoMinutos % 60;
    return `${horas}h ${mins}min`;
  };

  const cargarGruasDisponibles = async (userLocation) => {
    try {
      const response = await fetch(`${API_URL}/api/gruas/disponibles`);
      const data = await response.json();

      if (data.success && data.gruas) {
        let gruasConDistancia = data.gruas.map((grua) => {
          const distancia = calcularDistancia(
            userLocation?.latitude,
            userLocation?.longitude,
            parseFloat(grua.latitud),
            parseFloat(grua.longitud)
          );
          return {
            ...grua,
            distancia,
            tiempoEstimado: estimarTiempoLlegada(distancia),
          };
        });

        gruasConDistancia.sort((a, b) => {
          if (!a.distancia) return 1;
          if (!b.distancia) return -1;
          return a.distancia - b.distancia;
        });

        setGruasDisponibles(gruasConDistancia);
        if (gruasConDistancia.length > 0) {
          setGruaSeleccionada(gruasConDistancia[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando grúas:', error);
    } finally {
      setLoadingGruas(false);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        cargarGruasDisponibles(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address) {
        setDireccion(
          `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}`
        );
      }

      cargarGruasDisponibles(loc.coords);
    } catch (error) {
      console.error('Error ubicación:', error);
      cargarGruasDisponibles(null);
    }
  };

  // ========== FUNCIONES DE VEHÍCULOS ==========
  const buscarVehiculo = useCallback(async (index, placa) => {
    if (!placa || placa.length < 5) {
      actualizarVehiculo(index, {
        vehiculoEncontrado: null,
        vehiculoNuevo: false,
        buscandoVehiculo: false,
      });
      return;
    }

    actualizarVehiculo(index, { buscandoVehiculo: true });

    try {
      const response = await fetch(API.VEHICULOS(placa.toUpperCase()));
      const data = await response.json();

      if (data.success && data.vehiculo) {
        const vehiculo = data.vehiculo;
        const datosCompletos = vehiculo.marca && vehiculo.color;

        if (datosCompletos) {
          actualizarVehiculo(index, {
            vehiculoEncontrado: vehiculo,
            vehiculoNuevo: false,
            buscandoVehiculo: false,
            datosVehiculo: {
              marca: vehiculo.marca || '',
              modelo: vehiculo.modelo || '',
              anio: vehiculo.anio?.toString() || '',
              color: vehiculo.color || '',
              numero_serie: vehiculo.numero_serie || '',
              tipo_vehiculo: vehiculo.tipo_vehiculo || 'automovil',
            },
          });
        } else {
          actualizarVehiculo(index, {
            vehiculoEncontrado: null,
            vehiculoNuevo: true,
            buscandoVehiculo: false,
            datosVehiculo: {
              marca: vehiculo.marca || '',
              modelo: vehiculo.modelo || '',
              anio: vehiculo.anio?.toString() || '',
              color: vehiculo.color || '',
              numero_serie: vehiculo.numero_serie || '',
              tipo_vehiculo: vehiculo.tipo_vehiculo || 'automovil',
            },
          });
        }
      } else {
        actualizarVehiculo(index, {
          vehiculoEncontrado: null,
          vehiculoNuevo: true,
          buscandoVehiculo: false,
          datosVehiculo: {
            marca: '',
            modelo: '',
            anio: '',
            color: '',
            numero_serie: '',
            tipo_vehiculo: 'automovil',
          },
        });
      }
    } catch (error) {
      console.log('Error buscando vehículo:', error);
      actualizarVehiculo(index, {
        vehiculoEncontrado: null,
        vehiculoNuevo: true,
        buscandoVehiculo: false,
      });
    }
  }, []);

  const agregarVehiculo = () => {
    setVehiculos([...vehiculos, {
      placa: '',
      motivo: null,
      vehiculoEncontrado: null,
      vehiculoNuevo: false,
      buscandoVehiculo: false,
      datosVehiculo: {
        marca: '',
        modelo: '',
        anio: '',
        color: '',
        numero_serie: '',
        tipo_vehiculo: 'automovil',
      },
    }]);
  };

  const actualizarVehiculo = (index, updates) => {
    setVehiculos(prev => {
      const nuevos = [...prev];
      nuevos[index] = { ...nuevos[index], ...updates };
      return nuevos;
    });
  };

  const actualizarDatosVehiculo = (index, campo, valor) => {
    setVehiculos(prev => {
      const nuevos = [...prev];
      nuevos[index] = {
        ...nuevos[index],
        datosVehiculo: {
          ...nuevos[index].datosVehiculo,
          [campo]: valor,
        },
      };
      return nuevos;
    });
  };

  const eliminarVehiculo = (index) => {
    if (vehiculos.length > 1) {
      setVehiculos(vehiculos.filter((_, i) => i !== index));
    }
  };

  const handlePlacaChange = (index, text) => {
    const placa = text.toUpperCase();
    actualizarVehiculo(index, { placa });

    // Debounce para buscar vehículo
    if (placa.length >= 5) {
      setTimeout(() => buscarVehiculo(index, placa), 500);
    }
  };

  // ========== ENVIAR SOLICITUD ==========
  const validarFormulario = () => {
    for (let i = 0; i < vehiculos.length; i++) {
      const v = vehiculos[i];
      if (!v.placa.trim()) {
        Alert.alert('Error', `Ingresa la placa del vehículo ${i + 1}`);
        return false;
      }
      if (!v.motivo) {
        Alert.alert('Error', `Selecciona el motivo para el vehículo ${i + 1}`);
        return false;
      }
      // Si es vehículo nuevo, validar marca y color
      if (v.vehiculoNuevo) {
        if (!v.datosVehiculo.marca.trim()) {
          Alert.alert('Error', `Ingresa la marca del vehículo ${i + 1}`);
          return false;
        }
        if (!v.datosVehiculo.color.trim()) {
          Alert.alert('Error', `Ingresa el color del vehículo ${i + 1}`);
          return false;
        }
      }
    }
    if (!gruaSeleccionada) {
      Alert.alert('Error', 'Selecciona una grúa');
      return false;
    }
    return true;
  };

  const enviarSolicitud = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      console.log('\n🚛 ========================================');
      console.log('🚛 Iniciando proceso de solicitud de grúa');
      console.log('🚛 ========================================');

      const multasCreadas = [];
      const vehiculosConMulta = [];

      // PASO 1: Crear multa para cada vehículo
      for (const vehiculo of vehiculos) {
        const motivoData = MOTIVOS_REMISION.find(m => m.id === vehiculo.motivo);
        const monto = motivoData?.monto || 1000;

        // Generar folio con el mismo formato que LevantarMultaScreen
        const folio = generarFolioTemporal('otros', false, user?.id);
        
        // Generar línea de captura desde Tesorería
        let lineaCaptura;
        let fechaVencimiento;
        let lineaCapturaId = null;

        try {
          const resultadoLinea = await generarLineaCapturaTesoreria({
            monto: monto,
            folio: folio,
            concepto: `Remisión a corralón: ${motivoData?.label || 'Infracción'}`,
          });
          lineaCaptura = resultadoLinea.codigo;
          fechaVencimiento = resultadoLinea.fecha_vencimiento;
          lineaCapturaId = resultadoLinea.id || null;
        } catch (error) {
          console.log('Error con Tesorería, usando línea local:', error);
          lineaCaptura = generarLineaCaptura();
          fechaVencimiento = generarFechaVencimiento();
        }

        console.log(`\n📝 Creando multa para placa: ${vehiculo.placa}`);
        console.log(`   Folio: ${folio}`);
        console.log(`   Línea de captura: ${lineaCaptura}`);

        // Datos del vehículo para la multa
        const datosVehiculoMulta = vehiculo.vehiculoEncontrado || vehiculo.datosVehiculo;

        const multaData = {
          placa: vehiculo.placa.toUpperCase(),
          tipo_infraccion: motivoData?.label || 'Infracción',
          descripcion: `${motivoData?.label || 'Infracción'} - Remisión a corralón`,
          monto: monto,
          monto_final: monto,
          descuento: 0,
          direccion: direccion,
          latitud: location?.latitude || null,
          longitud: location?.longitude || null,
          agente_id: user?.id || null,
          folio: folio,
          linea_captura: lineaCaptura,
          linea_captura_id: lineaCapturaId,
          fecha_vencimiento: fechaVencimiento,
          fotos: [],
          vehiculos: {
            placa: vehiculo.placa.toUpperCase(),
            marca: datosVehiculoMulta.marca || null,
            modelo: datosVehiculoMulta.modelo || null,
            anio: datosVehiculoMulta.anio ? parseInt(datosVehiculoMulta.anio) : null,
            color: datosVehiculoMulta.color || null,
            tipo_vehiculo: datosVehiculoMulta.tipo_vehiculo || 'automovil',
          },
        };

        // Actualizar/crear vehículo si es nuevo
        if (vehiculo.vehiculoNuevo && vehiculo.datosVehiculo.marca) {
          try {
            await fetch(`${API_URL}/api/vehiculos/${vehiculo.placa.toUpperCase()}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(vehiculo.datosVehiculo),
            });
          } catch (e) {
            console.log('Error actualizando vehículo:', e);
          }
        }

        const response = await fetch(`${API_URL}/api/multas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(multaData),
        });

        const data = await response.json();

        if (data.success && data.multa) {
          console.log(`✅ Multa creada: ${data.multa.folio}`);
          multasCreadas.push({
            ...data.multa,
            folio: folio, // Usar el folio generado
            linea_captura: lineaCaptura,
          });
          vehiculosConMulta.push({
            placa: vehiculo.placa.toUpperCase(),
            marca: datosVehiculoMulta.marca,
            color: datosVehiculoMulta.color,
            motivo: motivoData?.label,
            multa_id: data.multa.id,
            folio_multa: folio,
            linea_captura: lineaCaptura,
          });
        } else {
          throw new Error(`No se pudo crear multa para ${vehiculo.placa}`);
        }
      }

      console.log(`\n✅ ${multasCreadas.length} multa(s) creada(s)`);

      // PASO 2: Crear solicitud de grúa
      console.log('\n🚛 Creando solicitud de grúa...');

      const solicitud = {
        agente_id: user?.id || null,
        grua_id: gruaSeleccionada.id,
        multa_id: multasCreadas[0]?.id || null,
        ubicacion: direccion,
        latitud: location?.latitude || null,
        longitud: location?.longitude || null,
        notas: notas,
        vehiculos: vehiculosConMulta,
      };

      const response = await fetch(`${API_URL}/api/solicitudes-grua`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitud),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Solicitud de grúa creada exitosamente');

        // Construir mensaje de confirmación
        const foliosMultas = multasCreadas.map(m => m.folio).join('\n• ');

        Alert.alert(
          '✅ Grúa Solicitada',
          `🚛 Grúa: ${gruaSeleccionada.numero}\n` +
            `👷 Operador: ${gruaSeleccionada.operador_nombre}\n` +
            `📞 Tel: ${gruaSeleccionada.operador_telefono}\n` +
            `⏱️ Tiempo: ${gruaSeleccionada.tiempoEstimado}\n\n` +
            `📋 Multas creadas (${multasCreadas.length}):\n• ${foliosMultas}`,
          [
            {
              text: 'Llamar Operador',
              onPress: () => Linking.openURL(`tel:${gruaSeleccionada.operador_telefono}`),
            },
            { text: 'OK', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        throw new Error(data.error || 'No se pudo crear la solicitud');
      }
    } catch (error) {
      console.error('❌ Error en el proceso:', error);
      Alert.alert('Error', error.message || 'No se pudo completar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const calcularMontoTotal = () => {
    return vehiculos.reduce((total, v) => {
      const motivoData = MOTIVOS_REMISION.find(m => m.id === v.motivo);
      return total + (motivoData?.monto || 0);
    }, 0);
  };

  // ========== RENDER ==========
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Ubicación */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="location" size={20} color={COLORS.primary} /> Tu Ubicación
        </Text>
        <View style={styles.ubicacionBox}>
          <Ionicons name="navigate" size={20} color="#10B981" />
          <Text style={styles.ubicacionText}>{direccion || 'Obteniendo...'}</Text>
          <TouchableOpacity onPress={getLocation}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehículos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Ionicons name="car" size={20} color={COLORS.primary} /> Vehículos a Remitir ({vehiculos.length})
          </Text>
          <TouchableOpacity onPress={agregarVehiculo} style={styles.addBtn}>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {vehiculos.map((vehiculo, index) => (
          <View key={index} style={styles.vehiculoCard}>
            {/* Header del vehículo */}
            <View style={styles.vehiculoHeader}>
              <View style={styles.vehiculoNumeroContainer}>
                <Ionicons name="car-sport" size={20} color={COLORS.primary} />
                <Text style={styles.vehiculoNumero}>Vehículo {index + 1}</Text>
              </View>
              {vehiculos.length > 1 && (
                <TouchableOpacity onPress={() => eliminarVehiculo(index)}>
                  <Ionicons name="trash" size={22} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Placa */}
            <Input
              label="Número de Placa *"
              placeholder="ABC-123"
              value={vehiculo.placa}
              onChangeText={(text) => handlePlacaChange(index, text)}
              autoCapitalize="characters"
              icon={<Ionicons name="keypad" size={18} color={COLORS.gray[400]} />}
            />

            {/* Indicador de búsqueda */}
            {vehiculo.buscandoVehiculo && (
              <View style={styles.buscandoContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.buscandoText}>Buscando vehículo...</Text>
              </View>
            )}

            {/* Vehículo encontrado */}
            {vehiculo.vehiculoEncontrado && !vehiculo.buscandoVehiculo && (
              <View style={styles.vehiculoEncontrado}>
                <View style={styles.vehiculoEncontradoHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.vehiculoEncontradoTitle}>Vehículo Registrado</Text>
                </View>
                <View style={styles.vehiculoInfoGrid}>
                  <View style={styles.vehiculoInfoItem}>
                    <Text style={styles.vehiculoInfoLabel}>Marca</Text>
                    <Text style={styles.vehiculoInfoValue}>{vehiculo.vehiculoEncontrado.marca || 'N/A'}</Text>
                  </View>
                  <View style={styles.vehiculoInfoItem}>
                    <Text style={styles.vehiculoInfoLabel}>Modelo</Text>
                    <Text style={styles.vehiculoInfoValue}>{vehiculo.vehiculoEncontrado.modelo || 'N/A'}</Text>
                  </View>
                  <View style={styles.vehiculoInfoItem}>
                    <Text style={styles.vehiculoInfoLabel}>Color</Text>
                    <Text style={styles.vehiculoInfoValue}>{vehiculo.vehiculoEncontrado.color || 'N/A'}</Text>
                  </View>
                  {vehiculo.vehiculoEncontrado.anio && (
                    <View style={styles.vehiculoInfoItem}>
                      <Text style={styles.vehiculoInfoLabel}>Año</Text>
                      <Text style={styles.vehiculoInfoValue}>{vehiculo.vehiculoEncontrado.anio}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Vehículo nuevo - Formulario */}
            {vehiculo.vehiculoNuevo && !vehiculo.buscandoVehiculo && vehiculo.placa.length >= 5 && (
              <View style={styles.vehiculoNuevo}>
                <View style={styles.vehiculoNuevoHeader}>
                  <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                  <Text style={styles.vehiculoNuevoTitle}>Vehículo No Registrado</Text>
                </View>
                <Text style={styles.vehiculoNuevoSubtitle}>Ingresa los datos del vehículo</Text>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Input
                      label="Marca *"
                      placeholder="Ej: Nissan"
                      value={vehiculo.datosVehiculo.marca}
                      onChangeText={(text) => actualizarDatosVehiculo(index, 'marca', text)}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Input
                      label="Modelo"
                      placeholder="Ej: Sentra"
                      value={vehiculo.datosVehiculo.modelo}
                      onChangeText={(text) => actualizarDatosVehiculo(index, 'modelo', text)}
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Input
                      label="Color *"
                      placeholder="Ej: Rojo"
                      value={vehiculo.datosVehiculo.color}
                      onChangeText={(text) => actualizarDatosVehiculo(index, 'color', text)}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Input
                      label="Año"
                      placeholder="2020"
                      value={vehiculo.datosVehiculo.anio}
                      onChangeText={(text) => actualizarDatosVehiculo(index, 'anio', text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                </View>

                {/* Tipo de vehículo */}
                <Text style={styles.label}>Tipo de Vehículo</Text>
                <View style={styles.tipoVehiculoRow}>
                  {TIPOS_VEHICULO.map((tipo) => (
                    <TouchableOpacity
                      key={tipo.id}
                      style={[
                        styles.tipoVehiculoBtn,
                        vehiculo.datosVehiculo.tipo_vehiculo === tipo.id && styles.tipoVehiculoBtnActivo,
                      ]}
                      onPress={() => actualizarDatosVehiculo(index, 'tipo_vehiculo', tipo.id)}
                    >
                      <Ionicons
                        name={tipo.icon}
                        size={18}
                        color={vehiculo.datosVehiculo.tipo_vehiculo === tipo.id ? '#fff' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.tipoVehiculoText,
                          vehiculo.datosVehiculo.tipo_vehiculo === tipo.id && styles.tipoVehiculoTextActivo,
                        ]}
                      >
                        {tipo.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Motivo de remisión */}
            <Text style={styles.label}>Motivo de Remisión *</Text>
            <View style={styles.motivosGrid}>
              {MOTIVOS_REMISION.map((motivo) => (
                <TouchableOpacity
                  key={motivo.id}
                  style={[
                    styles.motivoBtn,
                    vehiculo.motivo === motivo.id && styles.motivoBtnActivo,
                  ]}
                  onPress={() => actualizarVehiculo(index, { motivo: motivo.id })}
                >
                  <Ionicons
                    name={motivo.icon}
                    size={20}
                    color={vehiculo.motivo === motivo.id ? '#fff' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.motivoText,
                      vehiculo.motivo === motivo.id && styles.motivoTextActivo,
                    ]}
                  >
                    {motivo.label}
                  </Text>
                  <Text
                    style={[
                      styles.motivoMonto,
                      vehiculo.motivo === motivo.id && styles.motivoMontoActivo,
                    ]}
                  >
                    ${motivo.monto.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview de multa */}
            {vehiculo.motivo && (
              <View style={styles.multaPreview}>
                <Ionicons name="document-text" size={20} color="#059669" />
                <View style={styles.multaPreviewContent}>
                  <Text style={styles.multaPreviewTitle}>Se generará multa</Text>
                  <Text style={styles.multaPreviewText}>
                    Folio único + Línea de captura de Tesorería
                  </Text>
                </View>
                <Text style={styles.multaPreviewMonto}>
                  ${MOTIVOS_REMISION.find(m => m.id === vehiculo.motivo)?.monto.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Grúas Disponibles */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="car-sport" size={20} color={COLORS.primary} /> Grúas Disponibles
        </Text>

        {loadingGruas ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Buscando grúas cercanas...</Text>
          </View>
        ) : gruasDisponibles.length === 0 ? (
          <View style={styles.noGruas}>
            <Ionicons name="alert-circle" size={40} color="#F59E0B" />
            <Text style={styles.noGruasText}>No hay grúas disponibles</Text>
            <TouchableOpacity style={styles.recargarBtn} onPress={() => cargarGruasDisponibles(location)}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.recargarBtnText}>Recargar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cercanaInfo}>
              <Ionicons name="flash" size={16} color="#10B981" />
              <Text style={styles.cercanaText}>
                Grúa más cercana a {gruasDisponibles[0]?.distancia?.toFixed(1)} km
              </Text>
            </View>

            {gruasDisponibles.map((grua, index) => (
              <TouchableOpacity
                key={grua.id}
                style={[
                  styles.gruaCard,
                  gruaSeleccionada?.id === grua.id && styles.gruaSeleccionada,
                  index === 0 && styles.gruaMasCercana,
                ]}
                onPress={() => setGruaSeleccionada(grua)}
              >
                {index === 0 && (
                  <View style={styles.masCercanaBadge}>
                    <Ionicons name="flash" size={12} color="#fff" />
                    <Text style={styles.masCercanaText}>Más cercana</Text>
                  </View>
                )}

                <View style={styles.gruaContent}>
                  <View style={styles.gruaInfo}>
                    <Text style={styles.gruaNumero}>{grua.numero}</Text>
                    <Text style={styles.gruaOperador}>👷 {grua.operador_nombre}</Text>
                    <Text style={styles.gruaTelefono}>📞 {grua.operador_telefono}</Text>
                  </View>

                  <View style={styles.gruaDistancia}>
                    {grua.distancia && (
                      <>
                        <Text style={styles.distanciaNumero}>{grua.distancia.toFixed(1)}</Text>
                        <Text style={styles.distanciaUnidad}>km</Text>
                        <View style={styles.tiempoContainer}>
                          <Ionicons name="time" size={14} color="#6B7280" />
                          <Text style={styles.tiempoText}>{grua.tiempoEstimado}</Text>
                        </View>
                      </>
                    )}
                    {gruaSeleccionada?.id === grua.id && (
                      <Ionicons name="checkmark-circle" size={28} color="#10B981" style={{ marginTop: 5 }} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      {/* Notas */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <Ionicons name="document-text" size={20} color={COLORS.primary} /> Notas Adicionales
        </Text>
        <Input
          placeholder="Instrucciones especiales para la grúa..."
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      {/* Resumen */}
      {gruaSeleccionada && vehiculos.some(v => v.motivo) && (
        <View style={styles.resumenCard}>
          <Text style={styles.resumenTitle}>📋 Resumen de Solicitud</Text>
          
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Grúa:</Text>
            <Text style={styles.resumenValue}>{gruaSeleccionada.numero}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Operador:</Text>
            <Text style={styles.resumenValue}>{gruaSeleccionada.operador_nombre}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Tiempo estimado:</Text>
            <Text style={styles.resumenValue}>{gruaSeleccionada.tiempoEstimado}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Vehículos:</Text>
            <Text style={styles.resumenValue}>{vehiculos.length}</Text>
          </View>
          <View style={[styles.resumenRow, styles.resumenTotal]}>
            <Text style={styles.resumenLabelTotal}>Total multas:</Text>
            <Text style={styles.resumenValueTotal}>
              ${calcularMontoTotal().toLocaleString()} MXN
            </Text>
          </View>
        </View>
      )}

      {/* Botón */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Procesando...' : `Crear Multa${vehiculos.length > 1 ? 's' : ''} y Solicitar Grúa`}
          onPress={enviarSolicitud}
          loading={loading}
          disabled={!gruaSeleccionada || loadingGruas || !vehiculos.some(v => v.motivo)}
          icon={<Ionicons name="send" size={20} color="#fff" />}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 0,
    borderRadius: 16,
    padding: 15,
    ...SHADOWS.small,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  addBtn: { marginBottom: 15 },
  ubicacionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  ubicacionText: { flex: 1, color: '#166534', fontWeight: '500' },

  // Vehículo Card
  vehiculoCard: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehiculoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  vehiculoNumeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehiculoNumero: { fontWeight: 'bold', color: COLORS.primary, fontSize: 16 },

  // Buscando
  buscandoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  buscandoText: { color: '#6B7280', fontSize: 13 },

  // Vehículo encontrado
  vehiculoEncontrado: {
    backgroundColor: '#ECFDF5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vehiculoEncontradoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  vehiculoEncontradoTitle: { color: '#065F46', fontWeight: 'bold', fontSize: 15 },
  vehiculoInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vehiculoInfoItem: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '45%',
  },
  vehiculoInfoLabel: { fontSize: 11, color: '#047857' },
  vehiculoInfoValue: { fontSize: 14, fontWeight: '600', color: '#065F46' },

  // Vehículo nuevo
  vehiculoNuevo: {
    backgroundColor: '#FFFBEB',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vehiculoNuevoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  vehiculoNuevoTitle: { color: '#92400E', fontWeight: 'bold', fontSize: 15 },
  vehiculoNuevoSubtitle: { color: '#B45309', fontSize: 13, marginBottom: 15, marginLeft: 34 },

  formRow: { flexDirection: 'row', gap: 10 },
  formCol: { flex: 1 },

  // Tipo de vehículo
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 8 },
  tipoVehiculoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tipoVehiculoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipoVehiculoBtnActivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tipoVehiculoText: { fontSize: 13, color: '#6B7280' },
  tipoVehiculoTextActivo: { color: '#fff' },

  // Motivos
  motivosGrid: { gap: 8 },
  motivoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  motivoBtnActivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  motivoText: { flex: 1, fontSize: 14, color: '#4B5563' },
  motivoTextActivo: { color: '#fff', fontWeight: '600' },
  motivoMonto: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  motivoMontoActivo: { color: '#fff' },

  // Preview multa
  multaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    gap: 10,
  },
  multaPreviewContent: { flex: 1 },
  multaPreviewTitle: { color: '#065F46', fontWeight: '600', fontSize: 14 },
  multaPreviewText: { color: '#047857', fontSize: 12 },
  multaPreviewMonto: { color: '#059669', fontWeight: 'bold', fontSize: 18 },

  // Grúas
  loadingContainer: { alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 10, color: '#6B7280' },
  noGruas: { alignItems: 'center', padding: 20 },
  noGruasText: { color: '#F59E0B', marginTop: 10, marginBottom: 15 },
  recargarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  recargarBtnText: { color: '#fff', fontWeight: '600' },
  cercanaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  cercanaText: { color: '#065F46', fontSize: 13, fontWeight: '500' },
  gruaCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gruaSeleccionada: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  gruaMasCercana: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  masCercanaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 4,
  },
  masCercanaText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  gruaContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gruaInfo: { flex: 1 },
  gruaNumero: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  gruaOperador: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  gruaTelefono: { fontSize: 14, color: COLORS.primary },
  gruaDistancia: { alignItems: 'center' },
  distanciaNumero: { fontSize: 24, fontWeight: 'bold', color: '#1E40AF' },
  distanciaUnidad: { fontSize: 12, color: '#6B7280' },
  tiempoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  tiempoText: { fontSize: 12, color: '#6B7280' },

  // Resumen
  resumenCard: {
    backgroundColor: '#EEF2FF',
    margin: 15,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
  },
  resumenTitle: { fontSize: 18, fontWeight: 'bold', color: '#4F46E5', marginBottom: 15 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumenLabel: { color: '#6366F1', fontSize: 14 },
  resumenValue: { fontWeight: '600', color: '#4F46E5', fontSize: 14 },
  resumenTotal: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
  },
  resumenLabelTotal: { color: '#4F46E5', fontWeight: 'bold', fontSize: 16 },
  resumenValueTotal: { fontWeight: 'bold', color: '#059669', fontSize: 18 },

  buttonContainer: { padding: 15 },
});
