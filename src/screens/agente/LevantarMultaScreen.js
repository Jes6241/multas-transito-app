import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { offlineService } from '../../config/offlineService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SignaturePad from '../../components/SignaturePad';
import { API } from '../../config/api';

// Importar desde archivos separados
import { TIPOS_INFRACCION, formatearFundamento } from './constants';
import { 
  generarPDF, 
  generarFolioTemporal, 
  generarLineaCaptura, 
  generarLineaCapturaTesoreria,
  generarFechaVencimiento 
} from './utils';
import { styles } from './styles/levantarMultaStyles';

// Hooks personalizados
import { useLocation, useConnectivity, useCamera } from './hooks';

// Componentes
import { ConnectivityBanner, InfraccionModal, ResumenMulta } from './components';

const API_URL = 'https://multas-transito-api.onrender.com';

export default function LevantarMultaScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Hooks personalizados
  const { location, direccion, locationLoading, refreshLocation } = useLocation();
  const { isOnline, checkConnectivity } = useConnectivity();
  const { fotos, tomarFoto, seleccionarFoto, eliminarFoto } = useCamera();

  // Firmas
  const [firmaAgente, setFirmaAgente] = useState(null);
  const [firmaInfractor, setFirmaInfractor] = useState(null);
  const [showFirmaAgente, setShowFirmaAgente] = useState(false);
  const [showFirmaInfractor, setShowFirmaInfractor] = useState(false);

  // Modal de infracción personalizada
  const [modalVisible, setModalVisible] = useState(false);
  const [otraInfraccion, setOtraInfraccion] = useState({ 
    descripcion: '', 
    monto: '',
    fundamento: { articulo: '', fraccion: '', parrafo: '1', inciso: '0' }
  });
  const [infraccionesPersonalizadas, setInfraccionesPersonalizadas] = useState([]);

  const [form, setForm] = useState({
    placa: '',
    infraccionesSeleccionadas: [],
    descripcion: '',
  });

  // Estados para datos del vehículo
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(null);
  const [vehiculoNuevo, setVehiculoNuevo] = useState(false);
  const [buscandoVehiculo, setBuscandoVehiculo] = useState(false);
  const [datosVehiculo, setDatosVehiculo] = useState({
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    numero_serie: '',
    tipo_vehiculo: 'automovil', // automovil, motocicleta, camioneta, etc.
  });

  // Función para buscar vehículo por placa
  const buscarVehiculo = useCallback(async (placa) => {
    if (!placa || placa.length < 5) {
      setVehiculoEncontrado(null);
      setVehiculoNuevo(false);
      return;
    }

    setBuscandoVehiculo(true);
    try {
      const response = await fetch(API.VEHICULOS(placa.toUpperCase()));
      const data = await response.json();

      if (data.success && data.vehiculo) {
        const vehiculo = data.vehiculo;
        // Verificar si tiene datos completos (marca y color son obligatorios)
        const datosCompletos = vehiculo.marca && vehiculo.color;
        
        if (datosCompletos) {
          // Vehículo con datos completos - mostrar tarjeta verde
          setVehiculoEncontrado(vehiculo);
          setVehiculoNuevo(false);
        } else {
          // Vehículo existe pero sin datos completos - mostrar formulario
          setVehiculoEncontrado(null);
          setVehiculoNuevo(true);
        }
        
        // Autocompletar datos del vehículo (los que tenga)
        setDatosVehiculo({
          marca: vehiculo.marca || '',
          modelo: vehiculo.modelo || '',
          anio: vehiculo.anio?.toString() || '',
          color: vehiculo.color || '',
          numero_serie: vehiculo.numero_serie || '',
          tipo_vehiculo: vehiculo.tipo_vehiculo || 'automovil',
        });
      } else {
        setVehiculoEncontrado(null);
        setVehiculoNuevo(true);
        // Limpiar datos
        setDatosVehiculo({
          marca: '',
          modelo: '',
          anio: '',
          color: '',
          numero_serie: '',
          tipo_vehiculo: 'automovil',
        });
      }
    } catch (error) {
      console.log('Error buscando vehículo:', error);
      setVehiculoEncontrado(null);
      setVehiculoNuevo(true);
    } finally {
      setBuscandoVehiculo(false);
    }
  }, []);

  // Efecto para buscar vehículo cuando cambia la placa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (form.placa.length >= 5) {
        buscarVehiculo(form.placa);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [form.placa, buscarVehiculo]);

  const toggleInfraccion = (id) => {
    setForm((prev) => {
      const seleccionadas = prev.infraccionesSeleccionadas;
      if (seleccionadas.includes(id)) {
        return { ...prev, infraccionesSeleccionadas: seleccionadas.filter((i) => i !== id) };
      } else {
        return { ...prev, infraccionesSeleccionadas: [...seleccionadas, id] };
      }
    });
  };

  const agregarOtraInfraccion = () => {
    if (!otraInfraccion.descripcion.trim()) {
      Alert.alert('Error', 'Ingresa la descripción de la infracción');
      return;
    }
    if (!otraInfraccion.monto || isNaN(parseFloat(otraInfraccion.monto))) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!otraInfraccion.fundamento?.articulo) {
      Alert.alert('Error', 'Ingresa el artículo del fundamento legal');
      return;
    }

    const nuevaInfraccion = {
      id: `otro_${Date.now()}`,
      label: otraInfraccion.descripcion.trim(),
      monto: parseFloat(otraInfraccion.monto),
      fundamento: {
        articulo: otraInfraccion.fundamento.articulo || '0',
        fraccion: otraInfraccion.fundamento.fraccion || '0',
        parrafo: otraInfraccion.fundamento.parrafo || '1',
        inciso: otraInfraccion.fundamento.inciso || '0',
      },
      esPersonalizada: true,
    };

    setInfraccionesPersonalizadas([...infraccionesPersonalizadas, nuevaInfraccion]);
    setForm((prev) => ({
      ...prev,
      infraccionesSeleccionadas: [...prev.infraccionesSeleccionadas, nuevaInfraccion.id],
    }));

    setOtraInfraccion({ 
      descripcion: '', 
      monto: '',
      fundamento: { articulo: '', fraccion: '', parrafo: '1', inciso: '0' }
    });
    setModalVisible(false);
  };

  const eliminarInfraccionPersonalizada = (id) => {
    setInfraccionesPersonalizadas(infraccionesPersonalizadas.filter((i) => i.id !== id));
    setForm((prev) => ({
      ...prev,
      infraccionesSeleccionadas: prev.infraccionesSeleccionadas.filter((i) => i !== id),
    }));
  };

  const todasLasInfracciones = [...TIPOS_INFRACCION, ...infraccionesPersonalizadas];

  const calcularMontoTotal = () => {
    let total = 0;
    form.infraccionesSeleccionadas.forEach((id) => {
      const infraccion = todasLasInfracciones.find((t) => t.id === id);
      if (infraccion) {
        total += infraccion.monto;
      }
    });
    return total;
  };

  const getInfraccionesTexto = () => {
    return form.infraccionesSeleccionadas
      .map((id) => todasLasInfracciones.find((t) => t.id === id)?.label)
      .filter(Boolean)
      .join(', ');
  };

  const validarFormulario = () => {
    if (!form.placa.trim()) {
      Alert.alert('Error', 'Ingresa el número de placa');
      return false;
    }
    if (form.infraccionesSeleccionadas.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una infracción');
      return false;
    }
    if (!firmaAgente) {
      Alert.alert('Error', 'La firma del agente es obligatoria');
      return false;
    }
    // Validar datos del vehículo si es nuevo
    if (vehiculoNuevo) {
      if (!datosVehiculo.marca.trim()) {
        Alert.alert('Error', 'Ingresa la marca del vehículo');
        return false;
      }
      if (!datosVehiculo.color.trim()) {
        Alert.alert('Error', 'Ingresa el color del vehículo');
        return false;
      }
    }
    return true;
  };

  const guardarOffline = async (datosMulta) => {
    try {
      // OFFLINE: Folio de 14 caracteres (incluye ID del agente para garantizar unicidad)
      const primeraInfraccionId = form.infraccionesSeleccionadas[0];
      datosMulta.folio = generarFolioTemporal(primeraInfraccionId, true, user?.id);
      datosMulta.esOffline = true;
      datosMulta.pendienteSincronizar = true;
      
      await offlineService.guardarMultaOffline(datosMulta);

      Alert.alert(
        '📱 Guardado Offline',
        `Folio: ${datosMulta.folio}\n\nLa multa se guardó localmente y se sincronizará automáticamente cuando haya conexión.\n\n¿Deseas generar el PDF para el infractor?`,
        [
          { text: 'No', onPress: () => navigation.goBack() },
          {
            text: 'Generar PDF',
            onPress: async () => {
              await generarPDF(datosMulta);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (offlineError) {
      Alert.alert('Error', 'No se pudo guardar la multa');
    }
  };

  const levantarMulta = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    const montoTotal = calcularMontoTotal();
    const infraccionesTexto = getInfraccionesTexto();
    
    // Detectar tipo de infracción principal para el código del folio
    const primeraInfraccionId = form.infraccionesSeleccionadas[0];
    
    // ONLINE: Folio de 11 caracteres (incluye ID agente para unicidad)
    const folio = generarFolioTemporal(primeraInfraccionId, false, user?.id);
    
    // Obtener fundamentos legales de todas las infracciones seleccionadas
    const fundamentos = form.infraccionesSeleccionadas.map((id) => {
      const inf = todasLasInfracciones.find((t) => t.id === id);
      return inf ? formatearFundamento(inf.fundamento) : null;
    }).filter(Boolean);
    const fundamentoLegal = fundamentos.join('; ');
    
    // Generar línea de captura desde Tesorería
    let lineaCaptura;
    let fechaVencimiento;
    let lineaCapturaId = null;
    let referenciaExterna = null;
    let lineaGeneradaLocal = false;
    
    try {
      // Llamar a la API de Tesorería para generar la línea de captura
      const resultadoLinea = await generarLineaCapturaTesoreria({
        monto: montoTotal,
        folio: folio,
        concepto: `Multa de tránsito: ${infraccionesTexto}`,
      });
      
      lineaCaptura = resultadoLinea.codigo;
      fechaVencimiento = resultadoLinea.fecha_vencimiento;
      lineaCapturaId = resultadoLinea.id || null;
      referenciaExterna = resultadoLinea.referencia_externa;
      lineaGeneradaLocal = resultadoLinea.esLocal || false;
      
      if (lineaGeneradaLocal) {
        console.log('Línea de captura generada localmente (fallback)');
      } else {
        console.log('Línea de captura de Tesorería:', lineaCaptura);
      }
    } catch (error) {
      console.log('Error con Tesorería, usando línea local:', error);
      lineaCaptura = generarLineaCaptura();
      fechaVencimiento = generarFechaVencimiento();
      lineaGeneradaLocal = true;
    }

    const datosMulta = {
      placa: form.placa.toUpperCase(),
      tipo_infraccion: infraccionesTexto,
      descripcion: form.descripcion || infraccionesTexto,
      fundamento_legal: fundamentoLegal,
      monto: montoTotal,
      monto_final: montoTotal,
      direccion: direccion,
      latitud: location?.latitude,
      longitud: location?.longitude,
      agente_id: user?.id,
      fotos: fotos.map((f) => f.base64),
      firma_agente: firmaAgente,
      firma_infractor: firmaInfractor,
      folio: folio, // Folio generado en la app - el servidor DEBE usar este
      linea_captura: lineaCaptura,
      linea_captura_id: lineaCapturaId, // ID de la línea en Tesorería
      linea_captura_referencia: referenciaExterna, // Referencia única para vincular
      linea_captura_local: lineaGeneradaLocal, // Indica si fue generada localmente
      fecha_vencimiento: fechaVencimiento,
      esOffline: false,
      // Datos del vehículo para el PDF y backend
      vehiculos: {
        placa: form.placa.toUpperCase(),
        marca: vehiculoEncontrado?.marca || datosVehiculo.marca || null,
        modelo: vehiculoEncontrado?.modelo || datosVehiculo.modelo || null,
        anio: vehiculoEncontrado?.anio || (datosVehiculo.anio ? parseInt(datosVehiculo.anio) : null),
        color: vehiculoEncontrado?.color || datosVehiculo.color || null,
        numero_serie: vehiculoEncontrado?.numero_serie || datosVehiculo.numero_serie || null,
        tipo_vehiculo: vehiculoEncontrado?.tipo_vehiculo || datosVehiculo.tipo_vehiculo || 'automovil',
      },
      // Datos del vehículo (si es nuevo o para actualizar)
      vehiculo_nuevo: vehiculoNuevo,
      vehiculo_datos: vehiculoNuevo ? {
        marca: datosVehiculo.marca,
        modelo: datosVehiculo.modelo,
        anio: datosVehiculo.anio ? parseInt(datosVehiculo.anio) : null,
        color: datosVehiculo.color,
        numero_serie: datosVehiculo.numero_serie,
        tipo_vehiculo: datosVehiculo.tipo_vehiculo,
      } : null,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      // Si hay datos de vehículo para actualizar/crear, hacerlo primero
      if (vehiculoNuevo && (datosVehiculo.marca || datosVehiculo.color)) {
        try {
          await fetch(`${API_URL}/api/vehiculos/${form.placa.toUpperCase()}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVehiculo),
          });
        } catch (vehiculoError) {
          console.log('Error actualizando vehículo:', vehiculoError);
          // Continuar con la multa aunque falle el vehículo
        }
      }

      const response = await fetch(`${API_URL}/api/multas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosMulta),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        // Mantener el folio generado por la app (NUNCA cambia)
        // Solo actualizar linea_captura si el servidor genera una diferente
        datosMulta.linea_captura = data.multa?.linea_captura || datosMulta.linea_captura;
        datosMulta.esOffline = false;

        Alert.alert(
          '✅ Multa Levantada',
          `Folio: ${datosMulta.folio}\nPlaca: ${datosMulta.placa}\nMonto: $${montoTotal.toLocaleString('es-MX')}\n\n¿Deseas generar el PDF para el infractor?`,
          [
            { text: 'No', onPress: () => navigation.goBack() },
            {
              text: 'Generar PDF',
              onPress: async () => {
                await generarPDF(datosMulta);
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo crear la multa');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        Alert.alert(
          '⏱️ Tiempo Agotado',
          'El servidor tardó demasiado. ¿Deseas guardar la multa localmente?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Guardar Offline', onPress: () => guardarOffline(datosMulta) },
          ]
        );
      } else {
        Alert.alert(
          '⚠️ Sin Conexión',
          '¿Deseas guardar la multa localmente para sincronizarla después?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Guardar Offline', onPress: () => guardarOffline(datosMulta) },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Modal para agregar otra infracción */}
      <InfraccionModal
        visible={modalVisible}
        otraInfraccion={otraInfraccion}
        setOtraInfraccion={setOtraInfraccion}
        onClose={() => setModalVisible(false)}
        onAgregar={agregarOtraInfraccion}
      />

      {/* Banner de conectividad */}
      <ConnectivityBanner isOnline={isOnline} onRefresh={checkConnectivity} />

      <View style={styles.card}>
        {/* Placa */}
        <Input
          label="Número de Placa *"
          placeholder="ABC-123"
          value={form.placa}
          onChangeText={(text) => setForm({ ...form, placa: text.toUpperCase() })}
          autoCapitalize="characters"
          icon={<Ionicons name="car" size={20} color={COLORS.gray[400]} />}
        />

        {/* Indicador de búsqueda de vehículo */}
        {buscandoVehiculo && (
          <View style={styles.vehiculoBuscando}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.vehiculoBuscandoText}>Buscando vehículo...</Text>
          </View>
        )}

        {/* Vehículo encontrado */}
        {vehiculoEncontrado && !buscandoVehiculo && (
          <View style={styles.vehiculoEncontrado}>
            <View style={styles.vehiculoHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.vehiculoEncontradoTitle}>Vehículo Registrado</Text>
            </View>
            <View style={styles.vehiculoInfo}>
              <Text style={styles.vehiculoInfoText}>
                <Text style={styles.vehiculoLabel}>Marca: </Text>
                {vehiculoEncontrado.marca || 'N/A'}
              </Text>
              <Text style={styles.vehiculoInfoText}>
                <Text style={styles.vehiculoLabel}>Modelo: </Text>
                {vehiculoEncontrado.modelo || 'N/A'}
              </Text>
              <Text style={styles.vehiculoInfoText}>
                <Text style={styles.vehiculoLabel}>Color: </Text>
                {vehiculoEncontrado.color || 'N/A'}
              </Text>
              {vehiculoEncontrado.anio && (
                <Text style={styles.vehiculoInfoText}>
                  <Text style={styles.vehiculoLabel}>Año: </Text>
                  {vehiculoEncontrado.anio}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Vehículo nuevo - Formulario adicional */}
        {vehiculoNuevo && !buscandoVehiculo && form.placa.length >= 5 && (
          <View style={styles.vehiculoNuevo}>
            <View style={styles.vehiculoHeader}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <Text style={styles.vehiculoNuevoTitle}>Vehículo No Registrado</Text>
            </View>
            <Text style={styles.vehiculoNuevoSubtitle}>
              Ingresa los datos del vehículo
            </Text>

            <View style={styles.vehiculoFormRow}>
              <View style={styles.vehiculoFormCol}>
                <Input
                  label="Marca *"
                  placeholder="Ej: Nissan"
                  value={datosVehiculo.marca}
                  onChangeText={(text) => setDatosVehiculo({...datosVehiculo, marca: text})}
                  icon={<Ionicons name="car-sport" size={18} color={COLORS.gray[400]} />}
                />
              </View>
              <View style={styles.vehiculoFormCol}>
                <Input
                  label="Modelo"
                  placeholder="Ej: Sentra"
                  value={datosVehiculo.modelo}
                  onChangeText={(text) => setDatosVehiculo({...datosVehiculo, modelo: text})}
                />
              </View>
            </View>

            <View style={styles.vehiculoFormRow}>
              <View style={styles.vehiculoFormCol}>
                <Input
                  label="Color *"
                  placeholder="Ej: Rojo"
                  value={datosVehiculo.color}
                  onChangeText={(text) => setDatosVehiculo({...datosVehiculo, color: text})}
                  icon={<Ionicons name="color-palette" size={18} color={COLORS.gray[400]} />}
                />
              </View>
              <View style={styles.vehiculoFormCol}>
                <Input
                  label="Año"
                  placeholder="Ej: 2020"
                  value={datosVehiculo.anio}
                  onChangeText={(text) => setDatosVehiculo({...datosVehiculo, anio: text.replace(/[^0-9]/g, '')})}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>

            <Input
              label="Número de Serie (VIN)"
              placeholder="17 caracteres"
              value={datosVehiculo.numero_serie}
              onChangeText={(text) => setDatosVehiculo({...datosVehiculo, numero_serie: text.toUpperCase()})}
              autoCapitalize="characters"
              maxLength={17}
              icon={<Ionicons name="barcode" size={18} color={COLORS.gray[400]} />}
            />

            {/* Tipo de vehículo */}
            <Text style={styles.label}>Tipo de Vehículo</Text>
            <View style={styles.tipoVehiculoContainer}>
              {[
                { id: 'automovil', label: 'Automóvil', icon: 'car' },
                { id: 'motocicleta', label: 'Moto', icon: 'bicycle' },
                { id: 'camioneta', label: 'Camioneta', icon: 'bus' },
                { id: 'camion', label: 'Camión', icon: 'train' },
              ].map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.tipoVehiculoBtn,
                    datosVehiculo.tipo_vehiculo === tipo.id && styles.tipoVehiculoBtnActivo,
                  ]}
                  onPress={() => setDatosVehiculo({...datosVehiculo, tipo_vehiculo: tipo.id})}
                >
                  <Ionicons
                    name={tipo.icon}
                    size={20}
                    color={datosVehiculo.tipo_vehiculo === tipo.id ? '#fff' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.tipoVehiculoText,
                      datosVehiculo.tipo_vehiculo === tipo.id && styles.tipoVehiculoTextActivo,
                    ]}
                  >
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Infracciones */}
        <View style={styles.infraccionesHeader}>
          <Text style={styles.label}>Tipo de Infracción(es) *</Text>
          <View style={styles.contadorBadge}>
            <Text style={styles.contadorText}>{form.infraccionesSeleccionadas.length} seleccionada(s)</Text>
          </View>
        </View>

        <Text style={styles.hint}>Puedes seleccionar múltiples infracciones</Text>

        <View style={styles.tiposGrid}>
          {TIPOS_INFRACCION.map((tipo) => {
            const isSelected = form.infraccionesSeleccionadas.includes(tipo.id);
            return (
              <TouchableOpacity
                key={tipo.id}
                style={[styles.tipoBtn, isSelected && styles.tipoBtnActivo]}
                onPress={() => toggleInfraccion(tipo.id)}
              >
                <View style={styles.tipoBtnContent}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                  <View style={styles.tipoInfo}>
                    <Text style={[styles.tipoText, isSelected && styles.tipoTextActivo]}>{tipo.label}</Text>
                    <Text style={[styles.tipoFundamento, isSelected && styles.tipoFundamentoActivo]}>
                      {formatearFundamento(tipo.fundamento)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tipoMonto, isSelected && styles.tipoMontoActivo]}>${tipo.monto}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Infracciones personalizadas */}
          {infraccionesPersonalizadas.map((tipo) => {
            const isSelected = form.infraccionesSeleccionadas.includes(tipo.id);
            return (
              <View
                key={tipo.id}
                style={[styles.tipoBtn, styles.tipoBtnPersonalizado, isSelected && styles.tipoBtnActivo]}
              >
                <TouchableOpacity style={styles.tipoBtnContent} onPress={() => toggleInfraccion(tipo.id)}>
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                  <View style={styles.tipoInfo}>
                    <Text style={[styles.tipoText, isSelected && styles.tipoTextActivo]}>{tipo.label}</Text>
                    <Text style={[styles.tipoFundamento, isSelected && styles.tipoFundamentoActivo]}>
                      {formatearFundamento(tipo.fundamento)}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.personalizadaActions}>
                  <Text style={[styles.tipoMonto, isSelected && styles.tipoMontoActivo]}>${tipo.monto}</Text>
                  <TouchableOpacity onPress={() => eliminarInfraccionPersonalizada(tipo.id)}>
                    <Ionicons name="trash-outline" size={18} color={isSelected ? '#fff' : '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.agregarOtraBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
            <Text style={styles.agregarOtraText}>Agregar otra infracción</Text>
          </TouchableOpacity>
        </View>

        {/* Descripción */}
        <Input
          label="Descripción adicional"
          placeholder="Detalles adicionales..."
          value={form.descripcion}
          onChangeText={(text) => setForm({ ...form, descripcion: text })}
          icon={<Ionicons name="document-text" size={20} color={COLORS.gray[400]} />}
        />

        {/* Ubicación */}
        <View style={styles.ubicacionContainer}>
          <Text style={styles.label}>Ubicación</Text>
          <View style={styles.ubicacionInfo}>
            {locationLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.ubicacionText}>Obteniendo ubicación...</Text>
              </>
            ) : (
              <>
                <Ionicons name="location" size={20} color={COLORS.primary} />
                <Text style={styles.ubicacionText}>{direccion || 'Ubicación no disponible'}</Text>
                <TouchableOpacity onPress={refreshLocation}>
                  <Ionicons name="refresh" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
          {location && (
            <Text style={styles.coordenadas}>
              Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Evidencias */}
        <View style={styles.evidenciasHeader}>
          <Text style={styles.label}>Evidencias Fotográficas</Text>
          <View style={styles.fotosContador}>
            <Ionicons name="camera" size={16} color="#6B7280" />
            <Text style={styles.fotosContadorText}>{fotos.length} foto(s)</Text>
          </View>
        </View>

        <View style={styles.fotosContainer}>
          {fotos.map((foto, index) => (
            <View key={index} style={styles.fotoWrapper}>
              <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />
              <TouchableOpacity style={styles.eliminarFoto} onPress={() => eliminarFoto(index)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.agregarFoto} onPress={tomarFoto}>
            <Ionicons name="camera" size={30} color={COLORS.primary} />
            <Text style={styles.agregarFotoText}>Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.agregarFoto} onPress={seleccionarFoto}>
            <Ionicons name="images" size={30} color={COLORS.primary} />
            <Text style={styles.agregarFotoText}>Galería</Text>
          </TouchableOpacity>
        </View>

        {/* FIRMAS */}
        <Text style={styles.label}>Firmas *</Text>
        <View style={styles.firmasContainer}>
          {/* Firma Agente */}
          <TouchableOpacity
            style={[styles.firmaBox, firmaAgente && styles.firmaBoxCompletada]}
            onPress={() => setShowFirmaAgente(true)}
          >
            {firmaAgente ? (
              <>
                <Image source={{ uri: firmaAgente }} style={styles.firmaPreview} />
                <Text style={styles.firmaCompletadaText}>✓ Agente</Text>
              </>
            ) : (
              <>
                <Ionicons name="pencil-outline" size={30} color="#6B7280" />
                <Text style={styles.firmaPlaceholder}>Firma Agente *</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Firma Infractor */}
          <TouchableOpacity
            style={[styles.firmaBox, firmaInfractor && styles.firmaBoxCompletadaInfractor]}
            onPress={() => setShowFirmaInfractor(true)}
          >
            {firmaInfractor ? (
              <>
                <Image source={{ uri: firmaInfractor }} style={styles.firmaPreview} />
                <Text style={styles.firmaCompletadaTextInfractor}>✓ Infractor</Text>
              </>
            ) : (
              <>
                <Ionicons name="person-outline" size={30} color="#6B7280" />
                <Text style={styles.firmaPlaceholder}>Firma Infractor</Text>
                <Text style={styles.firmaOpcional}>(opcional)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {!firmaAgente && (
          <View style={styles.alertaFirma}>
            <Ionicons name="information-circle" size={18} color="#1E40AF" />
            <Text style={styles.alertaFirmaText}>La firma del agente es obligatoria</Text>
          </View>
        )}

        {/* Resumen */}
        <ResumenMulta
          placa={form.placa}
          infracciones={form.infraccionesSeleccionadas}
          todasLasInfracciones={todasLasInfracciones}
          fotosCount={fotos.length}
          firmaAgente={firmaAgente}
          montoTotal={calcularMontoTotal()}
        />

        <Button
          title={`Levantar Multa ${
            form.infraccionesSeleccionadas.length > 0 ? `($${calcularMontoTotal().toLocaleString('es-MX')})` : ''
          }`}
          onPress={levantarMulta}
          loading={loading}
          icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          style={{ marginTop: 20 }}
        />
      </View>

      <View style={{ height: 30 }} />

      {/* Modales de Firma */}
      <SignaturePad
        visible={showFirmaAgente}
        titulo="Firma del Agente"
        onOK={(signature) => {
          setFirmaAgente(signature);
          setShowFirmaAgente(false);
        }}
        onCancel={() => setShowFirmaAgente(false)}
      />

      <SignaturePad
        visible={showFirmaInfractor}
        titulo="Firma del Infractor"
        onOK={(signature) => {
          setFirmaInfractor(signature);
          setShowFirmaInfractor(false);
        }}
        onCancel={() => setShowFirmaInfractor(false)}
      />
    </ScrollView>
  );
}
