<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalendario } from '../../composables/useCalendario'
import { obtenerCatalogos } from '../../services/monitoreoApi'
import { useAlcanceStore } from '../../stores/alcanceStore'
import type { FilaCalendario } from '../../types/calendario'
import type { RespuestaCatalogos } from '../../types/monitor'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { TOKEN_SECTOR, tokenAvance } from '@/utils/estados'
import { fechaCorta, hoyLocal, porcentaje } from '@/utils/formato'

/*
 * Calendario de lectura por periodo y sector (F2.1): lista editable (programada, límite, lecturista planeado, nota),
 * vista mensual, copia del periodo anterior conservando el día hábil, plantilla e importación desde Excel. Editar
 * requiere administrar el módulo; consultar, solo leer. Aquasoft Comercial no se toca.
 * Sobre los componentes del sistema de diseño: encabezado, barra de filtros, tabla editable, diálogos y avisos.
 */
const { t } = useI18n()
const alcance = useAlcanceStore()
const notificar = useNotificacion()
const cal = useCalendario()

const catalogos = ref<RespuestaCatalogos | null>(null)
const periodo = ref<number | null>(null)
const gerencia = ref<number | null>(null)
const vista = ref<'lista' | 'mes'>('lista')
const busqueda = ref('')
const soloSinFecha = ref(false)
const dialogoCopia = ref(false)
const sobrescribir = ref(false)
const dialogoResultado = ref(false)
const archivo = ref<File[] | File | null>(null)

const hoy = computed(() => hoyLocal())
const periodos = computed(() => (catalogos.value?.periodos ?? []).map(p => ({ value: p.id, title: p.abierto ? `${p.nombre} (abierto)` : p.nombre })))
const lecturistas = computed(() => (catalogos.value?.lecturistas ?? []).filter(l => gerencia.value === null || l.gerencia_id === gerencia.value || l.gerencia_id === null))
const opcionesLecturista = computed(() => [{ value: null, title: t('monitoreo.calendario.sinLecturista') }, ...lecturistas.value.map(l => ({ value: l.id, title: l.nombre }))])
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))
const filtrosActivos = computed(() => (gerencia.value !== null ? 1 : 0) + (busqueda.value.trim() ? 1 : 0) + (soloSinFecha.value ? 1 : 0))

const filas = computed(() => {
  let lista = cal.filas.value
  if (soloSinFecha.value)
    lista = lista.filter(f => !f.programada && !f.limite)
  const q = busqueda.value.trim().toLowerCase()
  if (q)
    lista = lista.filter(f => f.sector.toLowerCase().includes(q) || (f.sistema ?? '').toLowerCase().includes(q))

  return lista
})

const columnas = computed<ColumnaTabla<FilaCalendario>[]>(() => [
  { clave: 'sector', titulo: t('monitoreo.calendario.sector'), formato: 'personalizado', anchoMin: 220 },
  { clave: 'programada', titulo: t('monitoreo.calendario.programada'), formato: 'personalizado', ancho: 180 },
  { clave: 'limite', titulo: t('monitoreo.calendario.limite'), formato: 'personalizado', ancho: 180 },
  { clave: 'lecturista_id', titulo: t('monitoreo.calendario.lecturista'), formato: 'personalizado', ordenable: false, ancho: 230 },
  { clave: 'nota', titulo: t('monitoreo.calendario.nota'), formato: 'personalizado', ordenable: false, ancho: 220 },
  { clave: 'pct_campo', titulo: t('monitoreo.calendario.avance'), formato: 'personalizado', alineacion: 'end', ancho: 170 },
])

const columnasRechazadas = computed<ColumnaTabla[]>(() => [
  { clave: 'fila', titulo: t('monitoreo.calendario.fila'), formato: 'entero', ancho: 80 },
  { clave: 'sector_id', titulo: t('monitoreo.calendario.sector'), formato: 'entero', ancho: 110 },
  { clave: 'motivo', titulo: t('monitoreo.calendario.motivo'), formato: 'texto' },
])

/** Días del mes del periodo para la vista de calendario (semanas de lunes a domingo). */
const semanas = computed(() => {
  const p = cal.datos.value?.periodo
  if (!p?.inicio)
    return [] as { fecha: string; enMes: boolean }[][]
  const inicio = new Date(`${p.inicio}T12:00:00-07:00`)
  const fin = new Date(`${p.fin ?? p.inicio}T12:00:00-07:00`)
  const primero = new Date(inicio)

  primero.setDate(primero.getDate() - ((primero.getDay() + 6) % 7))

  const dias: { fecha: string; enMes: boolean }[] = []
  const finMs = fin.getTime()
  let ms = primero.getTime()
  let guardia = 0
  while (guardia < 42 && (ms <= finMs || dias.length % 7 !== 0)) {
    const f = new Date(ms).toISOString().slice(0, 10)

    dias.push({ fecha: f, enMes: f >= p.inicio && f <= (p.fin ?? p.inicio) })
    ms += 86_400_000
    guardia++
  }

  const out: { fecha: string; enMes: boolean }[][] = []
  for (let i = 0; i < dias.length; i += 7)
    out.push(dias.slice(i, i + 7))

  return out
})

const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Token de color del estado del sector (leyenda del monitor); sin estado, el gris de "sin esperadas". */
function tokenEstado(f: FilaCalendario): string {
  return f.estado ? TOKEN_SECTOR[f.estado] : 'sector-sin-esperadas'
}

function vencido(f: FilaCalendario): boolean {
  return !!f.limite && f.limite < hoy.value && f.estado !== 'terminado' && f.estado !== 'sin_esperadas'
}

function claseFila(fila: Record<string, unknown>) {
  return vencido(fila as FilaCalendario) ? 'calendario__fila--vencida' : ''
}

function esHabil(fecha: string): boolean {
  const d = new Date(`${fecha}T12:00:00-07:00`).getDay()
  const iso = d === 0 ? 7 : d

  return (cal.datos.value?.dias_habiles ?? [1, 2, 3, 4, 5]).includes(iso)
}

async function recargar() {
  await cal.cargar(periodo.value, gerencia.value)
  if (cal.datos.value?.periodo && periodo.value === null)
    periodo.value = cal.datos.value.periodo.id
}

function avisarResultado(texto: string, rechazadas: number) {
  notificar.exito(rechazadas ? `${texto} · ${t('monitoreo.calendario.rechazadas', { n: rechazadas })}` : texto)
  if (rechazadas)
    dialogoResultado.value = true
}

async function guardar() {
  const r = await cal.guardar()
  if (r)
    avisarResultado(t('monitoreo.calendario.guardado', { g: r.guardadas, b: r.borradas }), r.rechazadas.length)
}

async function copiar() {
  const anterior = cal.datos.value?.anterior
  if (!anterior)
    return
  const r = await cal.copiar(anterior.id, sobrescribir.value)

  dialogoCopia.value = false
  if (r)
    avisarResultado(t('monitoreo.calendario.copiado', { c: r.copiadas, o: r.omitidas }), r.rechazadas.length)
}

async function importar() {
  const f = Array.isArray(archivo.value) ? archivo.value[0] : archivo.value
  if (!f)
    return
  const r = await cal.importar(f)

  archivo.value = null
  if (r)
    avisarResultado(t('monitoreo.calendario.importado', { l: r.leidas, g: r.guardadas, b: r.borradas }), r.rechazadas.length)
}

const rechazadas = computed(() => {
  const r = cal.ultimoResultado.value as { rechazadas?: { fila?: number; sector_id: number | null; motivo: string }[] } | null

  return (r?.rechazadas ?? []).map((x, i) => ({ id: i, ...x }))
})

function limpiarFiltros() {
  gerencia.value = null
  busqueda.value = ''
  soloSinFecha.value = false
}

watch([periodo, gerencia], recargar)

function avisarSalida(e: BeforeUnloadEvent) {
  if (cal.hayCambios.value)
    e.preventDefault()
}

onMounted(async () => {
  window.addEventListener('beforeunload', avisarSalida)
  await Promise.all([alcance.cargado ? Promise.resolve() : alcance.cargar(), obtenerCatalogos().then(c => {
    catalogos.value = c
  }).catch(() => null)])
  await recargar()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', avisarSalida))
</script>

<template>
  <div class="calendario">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.calendario.titulo')"
      :descripcion="t('monitoreo.calendario.descripcion')"
    >
      <template
        v-if="cal.puedeEditar.value"
        #acciones
      >
        <AsBtnSecundario
          prepend-icon="tabler-copy"
          :disabled="!cal.datos.value?.anterior?.con_calendario"
          @click="dialogoCopia = true"
        >
          {{ t('monitoreo.calendario.copiar') }}
        </AsBtnSecundario>
        <AsBtnSecundario
          prepend-icon="tabler-file-spreadsheet"
          @click="cal.plantilla()"
        >
          {{ t('monitoreo.calendario.plantilla') }}
        </AsBtnSecundario>
        <VFileInput
          v-model="archivo"
          accept=".xlsx"
          density="compact"
          variant="outlined"
          hide-details
          prepend-icon=""
          prepend-inner-icon="tabler-upload"
          :label="t('monitoreo.calendario.importar')"
          class="calendario__archivo"
          @update:model-value="importar"
        />
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="cal.error.value && !cal.datos.value"
      tipo="error"
      class="mb-4"
      :error="cal.error.value"
      @reintentar="recargar"
    />
    <VAlert
      v-else-if="cal.error.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="cal.error.value = null"
    >
      {{ cal.error.value.mensaje }}
    </VAlert>
    <VAlert
      v-if="cal.datos.value && !cal.puedeEditar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('monitoreo.calendario.soloLectura') }}
    </VAlert>

    <AsBarraFiltros
      class="mb-3"
      :activos="filtrosActivos"
      @limpiar="limpiarFiltros"
    >
      <VSelect
        v-model="periodo"
        :items="periodos"
        :label="t('monitoreo.calendario.periodo')"
        class="as-filtro--md"
      />
      <VSelect
        v-if="alcance.gerencias.length !== 1"
        v-model="gerencia"
        :items="opcionesGerencia"
        :label="t('monitoreo.calendario.gerencia')"
        clearable
        class="as-filtro--sm"
      />
      <VChipGroup
        v-model="vista"
        mandatory
        :aria-label="t('monitoreo.calendario.vistaLista')"
      >
        <VChip
          value="lista"
          filter
          prepend-icon="tabler-list"
        >
          {{ t('monitoreo.calendario.vistaLista') }}
        </VChip>
        <VChip
          value="mes"
          filter
          prepend-icon="tabler-calendar-month"
        >
          {{ t('monitoreo.calendario.vistaMes') }}
        </VChip>
      </VChipGroup>
      <VTextField
        v-if="vista === 'lista'"
        v-model="busqueda"
        clearable
        prepend-inner-icon="tabler-search"
        :placeholder="t('monitoreo.calendario.buscar')"
        :aria-label="t('monitoreo.calendario.buscar')"
        class="as-filtro--md"
      />
      <VCheckbox
        v-if="vista === 'lista'"
        v-model="soloSinFecha"
        :label="t('monitoreo.calendario.sinFecha')"
      />
      <template
        v-if="cal.datos.value"
        #fin
      >
        <span class="as-secundario as-num">
          {{ t('monitoreo.calendario.conFecha', { n: cal.datos.value.con_fecha, total: cal.datos.value.sectores.length }) }} · {{ t('monitoreo.calendario.diasHabiles', { dias: cal.datos.value.dias_habiles.map(d => diasSemana[d - 1]).join(' ') }) }}
        </span>
      </template>
    </AsBarraFiltros>

    <VCard
      variant="flat"
      class="as-tarjeta calendario__tarjeta"
    >
      <!-- Barra de cambios pendientes -->
      <VSlideYTransition>
        <div
          v-if="cal.hayCambios.value"
          class="calendario__cambios d-flex flex-wrap align-center justify-space-between gap-2"
          role="status"
        >
          <span class="text-body-2 d-inline-flex align-center gap-1">
            <VIcon
              icon="tabler-alert-circle"
              size="18"
            />{{ t('monitoreo.calendario.cambiosPendientes') }}
          </span>
          <div class="d-flex gap-2">
            <VBtn
              size="small"
              variant="text"
              :disabled="cal.guardando.value"
              @click="cal.descartarCambios()"
            >
              {{ t('monitoreo.calendario.descartar') }}
            </VBtn>
            <AsBtnPrimario
              size="small"
              :loading="cal.guardando.value"
              @click="guardar"
            >
              {{ t('monitoreo.calendario.guardar', { n: cal.cambios.value.length }) }}
            </AsBtnPrimario>
          </div>
        </div>
      </VSlideYTransition>

      <!-- Lista editable -->
      <AsTablaDatos
        v-if="vista === 'lista'"
        sin-tarjeta
        :columnas="columnas"
        :filas="filas"
        clave-fila="sector_id"
        densidad="media"
        :cargando="cal.cargando.value && !cal.filas.value.length"
        :por-pagina="-1"
        :clase-fila="claseFila"
        :vacio-titulo="t('monitoreo.calendario.sinSectores')"
        vacio-detalle=""
        vacio-icono="tabler-calendar-off"
        class="calendario__tabla"
      >
        <template #celda-sector="{ fila }">
          <div class="d-flex align-center gap-2">
            <span
              class="as-punto"
              :class="`bg-${tokenEstado(fila as FilaCalendario)}`"
              :title="fila.estado ? t(`monitoreo.estadoSector.${fila.estado}`) : ''"
            />
            <div>
              <div class="font-weight-medium">
                {{ fila.sector }}
              </div>
              <div class="as-secundario">
                {{ fila.sistema ?? '' }}<span v-if="fila.gerencia"> · {{ fila.gerencia }}</span>
              </div>
            </div>
          </div>
        </template>
        <template #celda-programada="{ fila }">
          <VTextField
            v-model="fila.programada"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
            :aria-label="`${t('monitoreo.calendario.programada')} · ${fila.sector}`"
            :disabled="!cal.puedeEditar.value"
            :min="cal.datos.value?.periodo?.inicio ?? undefined"
          />
        </template>
        <template #celda-limite="{ fila }">
          <VTextField
            v-model="fila.limite"
            type="date"
            density="compact"
            variant="outlined"
            hide-details
            :aria-label="`${t('monitoreo.calendario.limite')} · ${fila.sector}`"
            :disabled="!cal.puedeEditar.value"
            :min="fila.programada || cal.datos.value?.periodo?.inicio || undefined"
            :error="!!fila.programada && !!fila.limite && fila.limite < fila.programada"
          />
          <div
            v-if="vencido(fila as FilaCalendario)"
            class="as-secundario text-error"
          >
            {{ t('monitoreo.calendario.vencido') }}
          </div>
        </template>
        <template #celda-lecturista_id="{ fila }">
          <VSelect
            v-model="fila.lecturista_id"
            :items="opcionesLecturista"
            density="compact"
            variant="outlined"
            hide-details
            :aria-label="`${t('monitoreo.calendario.lecturista')} · ${fila.sector}`"
            :disabled="!cal.puedeEditar.value"
          />
          <div
            v-if="fila.lecturistas_reales.length"
            class="as-secundario text-truncate calendario__reales d-flex align-center gap-1"
            :title="fila.lecturistas_reales.join(', ')"
          >
            <VIcon
              icon="tabler-user-check"
              size="12"
            />
            <span class="text-truncate">{{ fila.lecturistas_reales.join(', ') }}</span>
          </div>
        </template>
        <template #celda-nota="{ fila }">
          <VTextField
            v-model="fila.nota"
            density="compact"
            variant="outlined"
            hide-details
            maxlength="300"
            :aria-label="`${t('monitoreo.calendario.nota')} · ${fila.sector}`"
            :disabled="!cal.puedeEditar.value"
          />
        </template>
        <template #celda-pct_campo="{ fila }">
          <div
            v-if="fila.estado"
            class="d-flex align-center gap-2"
          >
            <VProgressLinear
              :model-value="fila.pct_campo ?? 0"
              :color="tokenAvance(fila.pct_campo)"
              height="6"
              rounded
              class="flex-grow-1"
              :aria-label="t('monitoreo.calendario.avance')"
            />
            <span class="as-num text-no-wrap">{{ porcentaje(fila.pct_campo, 0) }}</span>
          </div>
          <div class="as-secundario">
            {{ fila.estado ? t(`monitoreo.estadoSector.${fila.estado}`) : '' }}<span v-if="fila.ultima_lectura"> · {{ fechaCorta(fila.ultima_lectura) }}</span>
          </div>
        </template>
      </AsTablaDatos>

      <!-- Vista mensual -->
      <div
        v-else
        class="calendario__mes-envoltura"
      >
        <AsEstado
          v-if="cal.cargando.value && !cal.filas.value.length"
          tipo="cargando"
          esqueleto="tarjeta"
          :filas="4"
        />
        <div
          v-else
          class="calendario__mes"
          role="grid"
          :aria-label="t('monitoreo.calendario.vistaMes')"
        >
          <div
            v-for="d in diasSemana"
            :key="d"
            class="as-sobrelinea text-center"
            role="columnheader"
          >
            {{ d }}
          </div>
          <template
            v-for="(semana, i) in semanas"
            :key="i"
          >
            <div
              v-for="dia in semana"
              :key="dia.fecha"
              class="calendario__dia"
              :class="{ 'calendario__dia--fuera': !dia.enMes, 'calendario__dia--inhabil': !esHabil(dia.fecha), 'calendario__dia--hoy': dia.fecha === hoy }"
              role="gridcell"
            >
              <div class="as-secundario font-weight-medium as-num">
                {{ Number(dia.fecha.slice(8, 10)) }}
              </div>
              <template v-if="cal.porDia.value[dia.fecha]">
                <div
                  v-for="f in cal.porDia.value[dia.fecha].programados.slice(0, 6)"
                  :key="`p${f.sector_id}`"
                  class="calendario__evento"
                  :style="{ '--as-evento': `rgb(var(--v-theme-${tokenEstado(f)}))` }"
                  :title="`${f.sector} · ${t('monitoreo.calendario.programada')}`"
                >
                  {{ f.sector }}
                </div>
                <div
                  v-if="cal.porDia.value[dia.fecha].programados.length > 6"
                  class="as-secundario as-num"
                >
                  +{{ cal.porDia.value[dia.fecha].programados.length - 6 }}
                </div>
                <div
                  v-if="cal.porDia.value[dia.fecha].limites.length"
                  class="as-secundario text-error"
                  :title="cal.porDia.value[dia.fecha].limites.map(f => f.sector).join(', ')"
                >
                  {{ t('monitoreo.calendario.limitesDia', { n: cal.porDia.value[dia.fecha].limites.length }) }}
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </VCard>

    <!-- Copiar del periodo anterior -->
    <AsDialogo
      :abierto="dialogoCopia && !!cal.datos.value?.anterior"
      :titulo="t('monitoreo.calendario.copiarTitulo', { desde: cal.datos.value?.anterior?.nombre ?? '' })"
      tamano="sm"
      variante="confirmar"
      :cargando="cal.guardando.value"
      :texto-confirmar="t('monitoreo.calendario.confirmarCopia')"
      :texto-cancelar="t('monitoreo.calendario.cancelar')"
      @update:abierto="(v: boolean) => { dialogoCopia = v }"
      @confirmar="copiar"
    >
      <p class="mb-3">
        {{ t('monitoreo.calendario.copiarDetalle', { n: cal.datos.value?.anterior?.con_calendario ?? 0 }) }}
      </p>
      <VCheckbox
        v-model="sobrescribir"
        density="compact"
        hide-details
        :label="t('monitoreo.calendario.sobrescribir')"
      />
    </AsDialogo>

    <!-- Filas rechazadas -->
    <AsDialogo
      :abierto="dialogoResultado"
      :titulo="t('monitoreo.calendario.rechazadas', { n: rechazadas.length })"
      tamano="md"
      variante="informativo"
      :texto-cancelar="t('monitoreo.calendario.cerrar')"
      @update:abierto="(v: boolean) => { dialogoResultado = v }"
    >
      <AsTablaDatos
        sin-tarjeta
        ocultar-pie
        densidad="densa"
        :columnas="columnasRechazadas"
        :filas="rechazadas"
        clave-fila="id"
        :por-pagina="-1"
      />
    </AsDialogo>
  </div>
</template>

<style scoped>
.calendario__archivo {
  inline-size: var(--as-ancho-filtro-md);
}

.calendario__cambios {
  background: rgba(var(--v-theme-warning), 0.12);
  border-block-end: var(--as-borde);
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-4);
}

.calendario__tabla :deep(.calendario__fila--vencida td) {
  background: rgba(var(--v-theme-error), 0.05);
}

.calendario__tabla :deep(td) {
  padding-block: var(--as-sp-2);
  vertical-align: top;
}

.calendario__reales {
  max-inline-size: var(--as-ancho-filtro-md);
}

.calendario__mes-envoltura {
  padding: var(--as-sp-4);
}

.calendario__mes {
  display: grid;
  gap: var(--as-sp-1);
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendario__dia {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  min-block-size: 92px;
  padding-block: var(--as-sp-1);
  padding-inline: var(--as-sp-2);
}

.calendario__dia--fuera {
  opacity: 0.35;
}

.calendario__dia--inhabil {
  background: rgb(var(--v-theme-surface-variant));
}

.calendario__dia--hoy {
  border-color: rgb(var(--v-theme-primary));
}

.calendario__evento {
  overflow: hidden;
  border-inline-start: 3px solid var(--as-evento, rgb(var(--v-theme-sector-sin-esperadas)));
  font-size: var(--as-fs-xs);
  line-height: 1.3;
  padding-inline-start: var(--as-sp-1);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
