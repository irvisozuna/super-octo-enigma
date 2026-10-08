<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'
import tokens from '@/styles/tokens/colores.json'
import { TOKEN_LECTURISTA, TOKEN_SECTOR, TOKEN_SEVERIDAD, TOKEN_TOMA } from '@/utils/estados'

/*
 * Guía viva del Aquasoft Design System 1.0 (/_ds, solo administradores): tokens de color con su contraste, escala
 * tipográfica, botones, chips de estado y los componentes compartidos con sus estados, todo con datos de ejemplo.
 * Sirve para revisar el sistema en claro y oscuro sin tocar las pantallas reales.
 */
const { isAdmin } = useCurrentUser()

// En desarrollo la guía se puede ver con cualquier usuario; en producción solo administradores
const puedeVer = computed(() => isAdmin.value || import.meta.env.DEV)
const tema = useTheme()
const dialogo = useDialogo()
const notificar = useNotificacion()

const esOscuro = computed(() => tema.global.current.value.dark)
const colores = computed(() => (esOscuro.value ? tokens.dark.colors : tokens.light.colors) as Record<string, string>)

const SEMANTICOS = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
const SUPERFICIES = ['background', 'surface', 'surface-variant', 'surface-elevada', 'surface-tabla-cabecera', 'surface-resaltada', 'outline', 'outline-variant']
const OPERATIVOS = [...Object.values(TOKEN_TOMA), 'toma-lejos', ...new Set(Object.values(TOKEN_SECTOR)), ...Object.values(TOKEN_SEVERIDAD), ...new Set(Object.values(TOKEN_LECTURISTA))]

const ESCALA = [
  { clase: 'text-h1', nombre: 'h1 · 32 px · 600' },
  { clase: 'text-h2', nombre: 'h2 · 28 px · 600' },
  { clase: 'text-h3', nombre: 'h3 · 24 px · 600 (cifras de indicador)' },
  { clase: 'text-h4', nombre: 'h4 · 20 px · 600 (título de página)' },
  { clase: 'text-h5', nombre: 'h5 · 18 px · 600' },
  { clase: 'text-h6', nombre: 'h6 · 16 px · 600 (título de tarjeta y panel)' },
  { clase: 'text-body-1', nombre: 'body-1 · 14 px (texto base, celdas, botones)' },
  { clase: 'text-body-2', nombre: 'body-2 · 13 px (secundario)' },
  { clase: 'text-caption', nombre: 'caption · 12 px (mínimo legible)' },
  { clase: 'text-overline', nombre: 'overline · 12 px mayúsculas' },
]

function luminancia(hex: string): number {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => Number.parseInt(n.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): string {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)

  return ((l1 + 0.05) / (l2 + 0.05)).toFixed(1)
}

// Datos de ejemplo para la tabla
const columnas: ColumnaTabla[] = [
  { clave: 'sector', titulo: 'Sector', truncar: true },
  { clave: 'estado', titulo: 'Estado', formato: 'estado', colorEstado: v => TOKEN_SECTOR[v as keyof typeof TOKEN_SECTOR], textoEstado: v => String(v), ancho: 110 },
  { clave: 'esperadas', titulo: 'Esperadas', formato: 'entero', ancho: 96 },
  { clave: 'avance', titulo: 'Avance', formato: 'porcentaje', ancho: 90, descripcion: 'Atendidas en campo entre esperadas' },
  { clave: 'importe', titulo: 'Importe', formato: 'moneda', ancho: 120 },
  { clave: 'ultima', titulo: 'Última lectura', formato: 'fechaHora', ancho: 150 },
]

const filas = [
  { id: 1, sector: 'SECTOR 9 · SL - SISTEMA 12 · CABO SAN LUCAS', estado: 'terminado', esperadas: 165, avance: 100, importe: 12345.5, ultima: '2026-09-14 10:49:00' },
  { id: 2, sector: 'SAN BERNABE - 7', estado: 'iniciado', esperadas: 273, avance: 99.6, importe: 980, ultima: '2026-09-15 07:41:00' },
  { id: 3, sector: 'MONTE REAL - 4', estado: 'rezagado', esperadas: 412, avance: 61.2, importe: 0, ultima: '2026-09-10 12:03:00' },
  { id: 4, sector: 'SISTEMA 2 - NO SECT.', estado: 'pendiente', esperadas: 11, avance: 0, importe: null, ultima: null },
  { id: 5, sector: 'Refactura', estado: 'sin_esperadas', esperadas: 0, avance: null, importe: 1234.5, ultima: null },
]

const densidad = ref<'estandar' | 'media' | 'densa'>('estandar')
const panelAbierto = ref(false)
const dialogoAbierto = ref(false)
const estadoDemo = ref<'cargando' | 'vacio' | 'error' | 'sin-permiso'>('vacio')

async function confirmarDemo() {
  const ok = await dialogo.confirmar({ titulo: '¿Cerrar la alerta?', mensaje: 'Quedará registrada en el historial con tu usuario.', color: 'error', textoConfirmar: 'Cerrar alerta', icono: 'tabler-bell-off' })

  notificar[ok ? 'exito' : 'info'](ok ? 'Alerta cerrada (demo)' : 'Cancelado (demo)')
}
</script>

<template>
  <div class="guia">
    <AsEncabezadoPagina
      titulo="Aquasoft Design System 1.0"
      descripcion="Guía viva: tokens, tipografía, variantes y componentes compartidos con datos de ejemplo. Enterprise Clean UI: superficies blancas, bordes sutiles, Inter 14 px, una sola acción primaria por contexto."
      icono="tabler-palette"
    >
      <template #contexto>
        <VChip
          size="small"
          label
          variant="tonal"
          color="primary"
        >
          {{ esOscuro ? 'tema oscuro' : 'tema claro' }}
        </VChip>
      </template>
      <template #acciones>
        <VBtn
          variant="tonal"
          color="primary"
          size="small"
          :prepend-icon="esOscuro ? 'tabler-sun' : 'tabler-moon'"
          @click="tema.global.name.value = esOscuro ? 'light' : 'dark'"
        >
          {{ esOscuro ? 'Ver en claro' : 'Ver en oscuro' }}
        </VBtn>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="!puedeVer"
      tipo="sin-permiso"
      detalle="La guía del sistema de diseño es solo para administradores."
    />

    <template v-else>
      <!-- Tokens de color -->
      <section class="as-tarjeta pa-4 mb-4">
        <h2 class="as-seccion">
          <span>Color · semánticos</span>
        </h2>
        <p class="as-secundario">
          Cada color trae su <code>on-*</code> (texto sobre el color sólido) y su <code>-darken-1</code> (texto del mismo color sobre superficie). El número es el contraste del texto sobre el color: AA pide 4.5.
        </p>
        <div class="guia__muestras">
          <div
            v-for="c in SEMANTICOS"
            :key="c"
            class="guia__muestra"
          >
            <div
              class="guia__color"
              :class="`bg-${c}`"
            >
              <span>{{ contraste(colores[`on-${c}`], colores[c]) }} : 1</span>
            </div>
            <div class="guia__nombre">
              {{ c }}
            </div>
            <div class="as-secundario as-num">
              {{ colores[c] }} · texto {{ colores[`${c}-darken-1`] }} ({{ contraste(colores[`${c}-darken-1`], colores.surface) }} : 1)
            </div>
          </div>
        </div>

        <h2 class="as-seccion">
          <span>Color · superficies y bordes</span>
        </h2>
        <div class="guia__muestras">
          <div
            v-for="c in SUPERFICIES"
            :key="c"
            class="guia__muestra"
          >
            <div
              class="guia__color guia__color--borde"
              :class="`bg-${c}`"
            />
            <div class="guia__nombre">
              {{ c }}
            </div>
            <div class="as-secundario as-num">
              {{ colores[c] }}
            </div>
          </div>
        </div>

        <h2 class="as-seccion">
          <span>Color · estados del negocio</span>
        </h2>
        <p class="as-secundario">
          Nombrados como en la leyenda (toma, sector, alerta, señal). Se usan igual en chips (<code>color="toma-leida"</code>), clases (<code>bg-sector-rezagado</code>) y en el mapa (<code>useTokensTema().hex('senal-tarde')</code>).
        </p>
        <div class="d-flex flex-wrap gap-2">
          <div
            v-for="c in OPERATIVOS"
            :key="c"
            class="d-flex flex-column align-center gap-1"
          >
            <VChip
              label
              size="small"
              variant="tonal"
              :color="c"
            >
              {{ c }}
            </VChip>
            <span
              class="as-punto"
              :class="`bg-${c}`"
            />
          </div>
        </div>
      </section>

      <!-- Tipografía -->
      <section class="as-tarjeta pa-4 mb-4">
        <h2 class="as-seccion">
          <span>Tipografía · Inter</span>
        </h2>
        <div
          v-for="e in ESCALA"
          :key="e.clase"
          class="d-flex align-baseline flex-wrap gap-4 py-1 guia__fila-tipo"
        >
          <span
            :class="e.clase"
            class="mb-0"
          >Monitoreo de lecturas 12,345</span>
          <span class="as-secundario">{{ e.nombre }}</span>
        </div>
        <div class="mt-3 d-flex flex-wrap gap-6">
          <div>
            <div class="as-etiqueta">
              Cifras tabulares (<code>.as-num</code>)
            </div>
            <div class="as-num text-h5">
              1,111,111 · 9,999,999
            </div>
          </div>
          <div>
            <div class="as-etiqueta">
              Sobrelínea (<code>.as-sobrelinea</code>)
            </div>
            <div class="as-sobrelinea">
              Detalle del sector
            </div>
          </div>
          <div>
            <div class="as-etiqueta">
              Par etiqueta / valor (<code>.as-etiqueta</code> + <code>.as-valor</code>)
            </div>
            <div class="as-valor as-num">
              07/10/2026 09:33
            </div>
          </div>
        </div>
      </section>

      <!-- Botones y chips -->
      <section class="as-tarjeta pa-4 mb-4">
        <h2 class="as-seccion">
          <span>Botones · una sola acción primaria por contexto</span>
        </h2>
        <div class="d-flex flex-wrap align-center gap-2 mb-3">
          <AsBtnPrimario prepend-icon="tabler-refresh">
            Pedir re-lectura
          </AsBtnPrimario>
          <AsBtnSecundario prepend-icon="tabler-file-spreadsheet">
            Excel
          </AsBtnSecundario>
          <AsBtnTerciario prepend-icon="tabler-map-pin">
            Ver en el mapa
          </AsBtnTerciario>
          <VBtn
            variant="outlined"
            color="primary"
          >
            Marcar coordenada
          </VBtn>
          <VBtn
            variant="flat"
            color="error"
          >
            Eliminar
          </VBtn>
          <AsBtnIcono
            icon="tabler-x"
            aria-label="Cerrar"
          />
          <VBtn
            variant="flat"
            color="primary"
            disabled
          >
            Deshabilitado
          </VBtn>
          <VBtn
            variant="flat"
            color="primary"
            loading
          >
            Cargando
          </VBtn>
        </div>
        <p class="as-secundario mb-3">
          Primario (flat) para la acción del contexto; secundario (tonal) para exportar y acciones frecuentes; terciario (texto) para navegación y acciones menores; outlined para acciones alternativas; rojo solo para destruir. Formato oración siempre.
        </p>

        <h2 class="as-seccion">
          <span>Chips de estado (<code>AsChipEstado</code>)</span>
        </h2>
        <div class="d-flex flex-wrap gap-2">
          <AsChipEstado color="sector-terminado">
            Terminado
          </AsChipEstado>
          <AsChipEstado color="sector-iniciado">
            Iniciado
          </AsChipEstado>
          <AsChipEstado color="sector-rezagado">
            Rezagado
          </AsChipEstado>
          <AsChipEstado color="alerta-alta">
            Alta
          </AsChipEstado>
          <AsChipEstado color="senal-tarde">
            Señal &lt; 90 min
          </AsChipEstado>
          <AsChipEstado color="secondary">
            Cerrada
          </AsChipEstado>
        </div>
      </section>

      <!-- Indicadores -->
      <section class="mb-4">
        <h2 class="as-seccion">
          <span>Indicadores (<code>AsIndicador</code>)</span>
        </h2>
        <VRow dense>
          <VCol
            cols="12"
            sm="6"
            lg="3"
          >
            <AsIndicador
              etiqueta="Avance de campo"
              valor="98.4 %"
              apoyo="93,380 de 94,946 tomas atendidas · 1,566 pendientes"
              icono="tabler-gauge"
              :progreso="98.4"
              color-progreso="success"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
            lg="3"
          >
            <AsIndicador
              etiqueta="Lecturas por hora"
              :valor="118.5"
              formato="decimal"
              :delta="12.3"
              delta-sufijo=" vs. promedio"
              icono="tabler-trending-up"
              apoyo="Promedio propio: 106.2"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
            lg="3"
          >
            <AsIndicador
              etiqueta="Tiempo muerto"
              valor="1 h 57 min"
              :delta="-12"
              delta-invertido
              delta-sufijo=" min"
              icono="tabler-clock-pause"
              estado="advertencia"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
            lg="3"
          >
            <AsIndicador
              etiqueta="Avisos abiertos"
              :valor="14"
              icono="tabler-bell-ringing"
              color="error"
              estado="alerta"
              interactivo
              @click="notificar.info('Abriría la bandeja de alertas')"
            >
              <div class="d-flex flex-wrap gap-1 mt-2">
                <AsChipEstado
                  color="error"
                  size="x-small"
                >
                  10 lecturas atoradas
                </AsChipEstado>
                <AsChipEstado
                  color="warning"
                  size="x-small"
                >
                  3 lejos de la toma
                </AsChipEstado>
              </div>
            </AsIndicador>
          </VCol>
          <VCol
            cols="12"
            sm="6"
            lg="3"
          >
            <AsIndicador
              etiqueta="Cargando…"
              :valor="0"
              cargando
            />
          </VCol>
        </VRow>
      </section>

      <!-- Filtros y tabla -->
      <section class="mb-4">
        <h2 class="as-seccion">
          <span>Barra de filtros (<code>AsBarraFiltros</code>) y tabla de datos (<code>AsTablaDatos</code>)</span>
        </h2>
        <AsBarraFiltros
          class="mb-3"
          :activos="2"
          @limpiar="notificar.info('Filtros limpios (demo)')"
        >
          <template #inicio>
            <VBtnToggle
              v-model="densidad"
              mandatory
            >
              <VBtn value="estandar">
                44 px
              </VBtn>
              <VBtn value="media">
                40 px
              </VBtn>
              <VBtn value="densa">
                36 px
              </VBtn>
            </VBtnToggle>
          </template>
          <VSelect
            label="Periodo"
            :items="['OCTUBRE 2026 (abierto)', 'SEPTIEMBRE 2026']"
            model-value="OCTUBRE 2026 (abierto)"
            class="as-filtro--md"
          />
          <VSelect
            label="Gerencia"
            :items="['CABO SAN LUCAS', 'SAN JOSÉ DEL CABO']"
            clearable
            class="as-filtro--md"
          />
          <VSelect
            label="Estado"
            :items="['Pendiente', 'Iniciado']"
            clearable
            class="as-filtro--sm"
          />
          <template #fin>
            <VTextField
              placeholder="Buscar…"
              prepend-inner-icon="tabler-search"
              class="as-filtro--md"
            />
          </template>
        </AsBarraFiltros>

        <AsTablaDatos
          titulo="Sectores"
          subtitulo="Columnas tipadas: entero, porcentaje, moneda y fechaHora se alinean solas a la derecha con dígitos tabulares."
          :columnas="columnas"
          :filas="filas"
          :densidad="densidad"
          :por-pagina="-1"
          :seleccionada="2"
          clic-fila
          :totales="{ esperadas: 861, importe: 14560 }"
          @fila="(f) => notificar.info(`Fila: ${f.sector}`)"
        />
      </section>

      <!-- Estados -->
      <section class="as-tarjeta pa-4 mb-4">
        <h2 class="as-seccion">
          <span>Estados (<code>AsEstado</code>)</span>
          <VBtnToggle
            v-model="estadoDemo"
            mandatory
            density="compact"
            variant="tonal"
            color="primary"
          >
            <VBtn value="cargando">
              Cargando
            </VBtn>
            <VBtn value="vacio">
              Vacío
            </VBtn>
            <VBtn value="error">
              Error
            </VBtn>
            <VBtn value="sin-permiso">
              Sin permiso
            </VBtn>
          </VBtnToggle>
        </h2>
        <AsEstado
          :tipo="estadoDemo"
          :error="{ codigo: 'SIN_CONEXION', mensaje: '', reintentable: true }"
          @reintentar="notificar.aviso('Reintentando (demo)')"
        />
      </section>

      <!-- Panel y diálogo -->
      <section class="as-tarjeta pa-4 mb-4">
        <h2 class="as-seccion">
          <span>Panel lateral (<code>AsPanelLateral</code>), diálogo (<code>AsDialogo</code>) y confirmación (<code>useDialogo</code>)</span>
        </h2>
        <div class="d-flex flex-wrap gap-2">
          <AsBtnSecundario @click="panelAbierto = true">
            Abrir panel lateral
          </AsBtnSecundario>
          <AsBtnSecundario @click="dialogoAbierto = true">
            Abrir diálogo de formulario
          </AsBtnSecundario>
          <VBtn
            variant="outlined"
            color="error"
            @click="confirmarDemo"
          >
            Confirmar acción destructiva
          </VBtn>
          <AsBtnTerciario @click="notificar.exito('Guardado (demo)')">
            Notificación de éxito
          </AsBtnTerciario>
          <AsBtnTerciario @click="notificar.error('No se pudo conectar con la fuente de datos (demo)')">
            Notificación de error
          </AsBtnTerciario>
        </div>
      </section>

      <AsPanelLateral
        v-model:abierto="panelAbierto"
        sobrelinea="Detalle del sector"
        titulo="SECTOR 9"
        subtitulo="SL - SISTEMA 12 · CABO SAN LUCAS"
        tamano="lg"
      >
        <template #acciones>
          <AsBtnTerciario
            size="small"
            prepend-icon="tabler-current-location"
          >
            Ver en el mapa
          </AsBtnTerciario>
        </template>
        <template #subencabezado>
          <AsChipEstado color="sector-terminado">
            Terminado
          </AsChipEstado>
        </template>
        <h3 class="as-seccion">
          Avance de SEPTIEMBRE 2026
        </h3>
        <dl class="as-datos">
          <div class="as-dato">
            <dt class="as-etiqueta">
              Primera lectura
            </dt>
            <dd class="as-valor as-num mb-0">
              14 sep 09:28
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              Última lectura
            </dt>
            <dd class="as-valor as-num mb-0">
              14 sep 10:49
            </dd>
          </div>
          <div class="as-dato">
            <dt class="as-etiqueta">
              Días activo
            </dt>
            <dd class="as-valor as-num mb-0">
              1
            </dd>
          </div>
        </dl>
        <h3 class="as-seccion">
          Pendientes por secuencia
        </h3>
        <AsTablaDatos
          sin-tarjeta
          densidad="densa"
          :columnas="columnas.slice(0, 4)"
          :filas="filas"
          :por-pagina="-1"
          ocultar-pie
        />
        <template #pie>
          <AsBtnTerciario>Exportar pendientes</AsBtnTerciario>
          <AsBtnPrimario>Guardar</AsBtnPrimario>
        </template>
      </AsPanelLateral>

      <AsDialogo
        v-model:abierto="dialogoAbierto"
        titulo="Nuevo destinatario de alertas"
        subtitulo="Recibe el correo de alertas altas y el resumen diario"
        tamano="sm"
        texto-confirmar="Guardar"
        @confirmar="dialogoAbierto = false; notificar.exito('Destinatario guardado (demo)')"
      >
        <VTextField
          label="Nombre"
          model-value="Jefe de lecturas SJC"
          class="mb-3"
        />
        <VTextField
          label="Correo"
          model-value="jefe.lecturas.sjc@example.test"
          class="mb-3"
        />
        <VSelect
          label="Gerencia"
          :items="['Todas', 'CABO SAN LUCAS', 'SAN JOSÉ DEL CABO']"
          model-value="SAN JOSÉ DEL CABO"
        />
      </AsDialogo>
    </template>
  </div>
</template>

<style scoped>
.guia__muestras {
  display: grid;
  gap: var(--as-sp-3);
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  margin-block-end: var(--as-sp-2);
}

.guia__color {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  border-radius: var(--as-radio-md);
  block-size: 56px;
  font-size: var(--as-fs-xs);
  font-variant-numeric: tabular-nums;
  padding-block: var(--as-sp-1);
  padding-inline: var(--as-sp-2);
}

.guia__color--borde {
  border: var(--as-borde);
}

.guia__nombre {
  font-size: var(--as-fs-sm);
  font-weight: var(--as-peso-medio);
  margin-block-start: var(--as-sp-1);
}

.guia__fila-tipo + .guia__fila-tipo {
  border-block-start: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
}

code {
  border-radius: var(--as-radio-sm);
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.9em;
  padding-block: 0;
  padding-inline: var(--as-sp-1);
}
</style>
