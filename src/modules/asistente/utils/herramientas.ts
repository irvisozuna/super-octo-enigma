/* Texto del avance mientras el asistente consulta (el servidor solo manda el nombre de la herramienta). */
const ETIQUETAS: Record<string, string> = {
  catalogo: 'Buscando el reporte indicado',
  describir_reporte: 'Revisando las columnas del reporte',
  opciones_filtro: 'Revisando los filtros',
  consultar_reporte: 'Consultando el reporte',
  consultar_tablero: 'Consultando el tablero',
  monitoreo_resumen: 'Consultando el monitoreo de lecturas',
  explicar_regla: 'Revisando las definiciones',
  ficha_cuenta: 'Consultando la cuenta',
  calcular: 'Calculando',
  generar_documento: 'Armando el documento',
}

export function etiquetaHerramienta(nombre: string): string {
  return ETIQUETAS[nombre] ?? 'Consultando'
}

/** Resumen corto de lo que consultó una respuesta, sin repetir: «Consultó: reporte, tablero». */
const NOMBRES_CORTOS: Record<string, string> = {
  consultar_reporte: 'reportes',
  consultar_tablero: 'tableros',
  monitoreo_resumen: 'monitoreo de lecturas',
  explicar_regla: 'definiciones',
  ficha_cuenta: 'ficha de cuenta',
}

export function fuentesConsultadas(herramientas: string[]): string[] {
  return [...new Set(herramientas.map(h => NOMBRES_CORTOS[h]).filter((n): n is string => Boolean(n)))]
}
