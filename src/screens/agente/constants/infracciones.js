// Tipos de infracciones disponibles para levantar multas
// Fundamentos basados en:
// - Reglamento de Tránsito de la Ciudad de México (RT-CDMX)
// - Ley de Movilidad de la Ciudad de México (LM-CDMX)
// - Ley Ambiental de Protección a la Tierra en el Distrito Federal (LAPTDF)

export const TIPOS_INFRACCION = [
  { 
    id: 'estacionamiento', 
    codigo: '01', 
    label: 'Estacionamiento prohibido', 
    monto: 868,
    fundamento: { 
      articulo: '38', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'exceso_velocidad', 
    codigo: '02', 
    label: 'Exceso de velocidad', 
    monto: 2171,
    fundamento: { 
      articulo: '9', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'semaforo', 
    codigo: '03', 
    label: 'Pasarse el semáforo en rojo', 
    monto: 2171,
    fundamento: { 
      articulo: '10', 
      fraccion: 'VI', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'carril_confinado', 
    codigo: '04', 
    label: 'Circular en carril confinado (Metrobús)', 
    monto: 2893,
    fundamento: { 
      articulo: '11', 
      fraccion: 'III', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'sin_licencia', 
    codigo: '05', 
    label: 'No portar licencia de conducir', 
    monto: 868,
    fundamento: { 
      articulo: '42', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'verificacion', 
    codigo: '06', 
    label: 'Verificación vehicular vencida', 
    monto: 2171,
    fundamento: { 
      articulo: '50', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'doble_fila', 
    codigo: '07', 
    label: 'Estacionarse en doble fila', 
    monto: 1447,
    fundamento: { 
      articulo: '38', 
      fraccion: 'VIII', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'obstruccion', 
    codigo: '08', 
    label: 'Obstrucción de vía pública', 
    monto: 1447,
    fundamento: { 
      articulo: '38', 
      fraccion: 'X', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'cinturon', 
    codigo: '10', 
    label: 'No usar cinturón de seguridad', 
    monto: 868,
    fundamento: { 
      articulo: '39', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'celular', 
    codigo: '11', 
    label: 'Uso de celular al conducir', 
    monto: 1447,
    fundamento: { 
      articulo: '39', 
      fraccion: 'VII', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'alcoholemia', 
    codigo: '12', 
    label: 'Conducir en estado de ebriedad', 
    monto: 14468,
    fundamento: { 
      articulo: '50', 
      fraccion: 'III', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'luces', 
    codigo: '13', 
    label: 'Circular sin luces encendidas', 
    monto: 579,
    fundamento: { 
      articulo: '30', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'casco', 
    codigo: '14', 
    label: 'No usar casco (motocicleta)', 
    monto: 1447,
    fundamento: { 
      articulo: '33', 
      fraccion: 'II', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'documentos', 
    codigo: '15', 
    label: 'Sin documentos del vehículo', 
    monto: 868,
    fundamento: { 
      articulo: '42', 
      fraccion: 'II', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'vuelta_prohibida', 
    codigo: '16', 
    label: 'Vuelta prohibida', 
    monto: 1447,
    fundamento: { 
      articulo: '13', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'paso_peatonal', 
    codigo: '17', 
    label: 'No respetar paso peatonal', 
    monto: 1447,
    fundamento: { 
      articulo: '8', 
      fraccion: 'I', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'hoy_no_circula', 
    codigo: '18', 
    label: 'Violación Hoy No Circula', 
    monto: 2171,
    fundamento: { 
      articulo: '7', 
      fraccion: '0', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'PPCAMC'
    }
  },
  { 
    id: 'invasion_ciclovia', 
    codigo: '19', 
    label: 'Invadir ciclovía', 
    monto: 2171,
    fundamento: { 
      articulo: '11', 
      fraccion: 'V', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
  { 
    id: 'bloqueo_crucero', 
    codigo: '20', 
    label: 'Bloquear crucero', 
    monto: 1447,
    fundamento: { 
      articulo: '10', 
      fraccion: 'VIII', 
      parrafo: '0', 
      inciso: '0',
      ordenamiento: 'RT-CDMX'
    }
  },
];

// Nombres completos de ordenamientos
const ORDENAMIENTOS = {
  'RT-CDMX': 'Reglamento de Tránsito de la Ciudad de México',
  'LM-CDMX': 'Ley de Movilidad de la Ciudad de México',
  'LAPTDF': 'Ley Ambiental de Protección a la Tierra en el Distrito Federal',
  'PPCAMC': 'Programa para Contingencias Ambientales de la ZMVM',
};

// Función auxiliar para formatear el fundamento
export const formatearFundamento = (fundamento) => {
  if (!fundamento) return 'N/A';
  const { articulo, fraccion, parrafo, inciso, ordenamiento } = fundamento;
  
  let texto = `Art. ${articulo}`;
  if (fraccion && fraccion !== '0') texto += `, Fracc. ${fraccion}`;
  if (parrafo && parrafo !== '0') texto += `, Párr. ${parrafo}`;
  if (inciso && inciso !== '0') texto += `, Inc. ${inciso}`;
  
  // Agregar abreviatura del ordenamiento
  if (ordenamiento) {
    texto += ` (${ordenamiento})`;
  }
  
  return texto;
};

// Función para obtener nombre completo del ordenamiento
export const obtenerOrdenamiento = (abreviatura) => {
  return ORDENAMIENTOS[abreviatura] || abreviatura;
};

// Función para obtener info de estatus
export const getEstatusInfo = (estatus) => {
  switch (estatus) {
    case 'pendiente':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Pendiente', icon: 'time' };
    case 'pagada':
      return { bg: '#D1FAE5', text: '#065F46', label: 'Pagada', icon: 'checkmark-circle' };
    case 'vencida':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Vencida', icon: 'alert-circle' };
    case 'impugnada':
      return { bg: '#DBEAFE', text: '#1E40AF', label: 'Impugnada', icon: 'document-text' };
    default:
      return { bg: '#E5E7EB', text: '#374151', label: estatus || 'N/A', icon: 'help' };
  }
};
