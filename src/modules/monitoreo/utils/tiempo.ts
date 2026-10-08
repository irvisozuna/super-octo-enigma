/*
 * Fechas del monitoreo. Desde el sistema de diseño 1.0 el formato vive en `src/utils/formato` (una sola convención
 * es-MX en la zona de OOMSAPAS). Aquí se conservan los nombres históricos del módulo para no tocar sus 19 importadores.
 */
export {
  aFecha,
  DESFASE_LOCAL,
  fechaCorta,
  haceCuanto,
  hoyLocal,
  minutosDesde,
  segundosDesde,
} from '@/utils/formato'
export type { TraductorRelativo } from '@/utils/formato'
export { hora as horaCorta } from '@/utils/formato'
