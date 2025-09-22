// Configuración de Mapbox
export const MAPBOX_CONFIG = {
  // Token de acceso de Mapbox
  ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_KEY || '',

  // Estilos de mapa disponibles
  STYLES: {
    STREETS: 'mapbox://styles/mapbox/streets-v12',
    OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
    LIGHT: 'mapbox://styles/mapbox/light-v11',
    DARK: 'mapbox://styles/mapbox/dark-v11',
    SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
    SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
  },

  // Configuración por defecto
  DEFAULT: {
    ZOOM: 13,
    HEIGHT: '400px',
    STYLE: 'mapbox://styles/mapbox/streets-v12',
  },

  // Configuración para diferentes tipos de mapas
  FINE_LOCATION: {
    ZOOM: 15,
    HEIGHT: '400px',
    STYLE: 'mapbox://styles/mapbox/streets-v12',
  },

  VEHICLE_TRACKING: {
    ZOOM: 12,
    HEIGHT: '500px',
    STYLE: 'mapbox://styles/mapbox/outdoors-v12',
  },

  CONCESSION_OVERVIEW: {
    ZOOM: 10,
    HEIGHT: '300px',
    STYLE: 'mapbox://styles/mapbox/light-v11',
  },
}

// Función para verificar si Mapbox está configurado
export function isMapboxConfigured(): boolean {
  return !!MAPBOX_CONFIG.ACCESS_TOKEN
}

// Función para obtener el token de acceso
export function getMapboxToken(): string {
  if (!isMapboxConfigured())
    console.warn('⚠️ Mapbox token not configured. Set VITE_MAPBOX_KEY in your .env file')

  return MAPBOX_CONFIG.ACCESS_TOKEN
}

// Función para obtener la configuración de un tipo específico
export function getMapConfig(type: keyof typeof MAPBOX_CONFIG): any {
  if (type === 'ACCESS_TOKEN' || type === 'STYLES' || type === 'DEFAULT')
    return MAPBOX_CONFIG[type]

  return {
    ...MAPBOX_CONFIG.DEFAULT,
    ...MAPBOX_CONFIG[type],
  }
}
