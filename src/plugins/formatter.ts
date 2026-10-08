import type { App } from 'vue'
import { fecha, moneda } from '@/utils/formato'

/*
 * Propiedades globales históricas ($formatCurrency, $formatDate) usadas por Soporte y los CRUD.
 * Desde el sistema de diseño 1.0 delegan en `src/utils/formato` (es-MX, zona de OOMSAPAS).
 */
function formatCurrency(value: number | string) {
  return moneda(Number(value) || 0)
}

function formatDate(dateString: string, format?: Intl.DateTimeFormatOptions) {
  if (format)
    return new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mazatlan', ...format }).format(new Date(dateString.replace(' ', 'T')))

  const texto = fecha(dateString, { vacio: 'Fecha inválida' })

  return texto === dateString ? 'Fecha inválida' : texto
}

export default function (app: App) {
  app.config.globalProperties.$formatCurrency = formatCurrency
  app.config.globalProperties.$formatDate = formatDate
}
