/*
 * Fuentes de mapa compartidas por los mapas de la plataforma (MapLibre, sin llave de pago):
 * calles de OpenFreeMap y satélite de Esri; el centro por defecto es Los Cabos.
 */
export const ESTILO_CALLES = 'https://tiles.openfreemap.org/styles/liberty'
export const SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const ATRIBUCION_SATELITE = 'Imágenes: Esri, Maxar, Earthstar Geographics'
export const CENTRO_LOS_CABOS: [number, number] = [-109.82, 23.0]

/** Una coordenada sirve si es numérica, está dentro del rango y no es el (0, 0) con que llegan las tomas sin dato. */
export function coordenadaValida(lat: unknown, lng: unknown): lat is number {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
}
