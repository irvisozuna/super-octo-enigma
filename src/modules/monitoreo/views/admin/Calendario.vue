<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalendario } from '../../composables/useCalendario'
import { obtenerCatalogos } from '../../services/monitoreoApi'
import { useAlcanceStore } from '../../stores/alcanceStore'
import type { FilaCalendario } from '../../types/calendario'
import type { RespuestaCatalogos } from '../../types/monitor'
import { COLORES_SECTOR } from '../../utils/geojson'
import { fechaCorta, hoyLocal } from '../../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Calendario de lectura por periodo y sector (F2.1): lista editable (programada, límite, lecturista planeado, nota),
 * vista mensual, copia del periodo anterior conservando el día hábil, plantilla e importación desde Excel. Editar
 * requiere administrar el módulo; consultar, solo leer. Dolibarr no se toca.
 */
const { t, n } = useI18n()
const alcance = useAlcanceStore()
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
const mensaje = ref<string | null>(null)

const hoy = computed(() => hoyLocal())
const periodos = computed(() => catalogos.value?.periodos ?? [])
const lecturistas = computed(() => (catalogos.value?.lecturistas ?? []).filter(l => gerencia.value === null || l.gerencia_id === gerencia.value || l.gerencia_id === null))
const opcionesLecturista = computed(() => [{ value: null, title: t('monitoreo.calendario.sinLecturista') }, ...lecturistas.value.map(l => ({ value: l.id, title: l.nombre }))])
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))

const filas = computed(() => {
  let lista = cal.filas.value
  if (soloSinFecha.value)
    lista = lista.filter(f => !f.programada && !f.limite)
  const q = busqueda.value.trim().toLowerCase()
  if (q)
    lista = lista.filter(f => f.sector.toLowerCase().includes(q) || (f.sistema ?? '').toLowerCase().includes(q))

  return lista
})

const headers = computed(() => [
  { title: t('monitoreo.calendario.sector'), key: 'sector', sortable: true },
  { title: t('monitoreo.calendario.programada'), key: 'programada', sortable: true, width: 170 },
  { title: t('monitoreo.calendario.limite'), key: 'limite', sortable: true, width: 170 },
  { title: t('monitoreo.calendario.lecturista'), key: 'lecturista_id', sortable: false, width: 220 },
  { title: t('monitoreo.calendario.nota'), key: 'nota', sortable: false, width: 200 },
  { title: t('monitoreo.calendario.avance'), key: 'pct_campo', sortable: true, width: 150 },
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

function colorEstado(f: FilaCalendario): string {
  return f.estado ? COLORES_SECTOR[f.estado] ?? '#bdbdbd' : '#bdbdbd'
}

function vencido(f: FilaCalendario): boolean {
  return !!f.limite && f.limite < hoy.value && f.estado !== 'terminado' && f.estado !== 'sin_esperadas'
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

async function guardar() {
  const r = await cal.guardar()
  if (r) {
    mensaje.value = t('monitoreo.calendario.guardado', { g: r.guardadas, b: r.borradas }) + (r.rechazadas.length ? ` · ${t('monitoreo.calendario.rechazadas', { n: r.rechazadas.length })}` : '')
    if (r.rechazadas.length)
      dialogoResultado.value = true
  }
}

async function copiar() {
  const anterior = cal.datos.value?.anterior
  if (!anterior)
    return
  const r = await cal.copiar(anterior.id, sobrescribir.value)

  dialogoCopia.value = false
  if (r) {
    mensaje.value = t('monitoreo.calendario.copiado', { c: r.copiadas, o: r.omitidas })
    if (r.rechazadas.length)
      dialogoResultado.value = true
  }
}

async function importar() {
  const f = Array.isArray(archivo.value) ? archivo.value[0] : archivo.value
  if (!f)
    return
  const r = await cal.importar(f)

  archivo.value = null
  if (r) {
    mensaje.value = t('monitoreo.calendario.importado', { l: r.leidas, g: r.guardadas, b: r.borradas }) + (r.rechazadas.length ? ` · ${t('monitoreo.calendario.rechazadas', { n: r.rechazadas.length })}` : '')
    if (r.rechazadas.length)
      dialogoResultado.value = true
  }
}

const rechazadas = computed(() => {
  const r = cal.ultimoResultado.value as { rechazadas?: { fila?: number; sector_id: number | null; motivo: string }[] } | null

  return r?.rechazadas ?? []
})

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
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.calendario.titulo') }}
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('monitoreo.calendario.descripcion') }}
        </p>
      </div>
      <div
        v-if="cal.puedeEditar.value"
        class="d-flex flex-wrap align-center gap-2"
      >
        <VBtn
          variant="tonal"
          prepend-icon="tabler-copy"
          class="text-none"
          :disabled="!cal.datos.value?.anterior?.con_calendario"
          @click="dialogoCopia = true"
        >
          {{ t('monitoreo.calendario.copiar') }}
        </VBtn>
        <VBtn
          variant="tonal"
          prepend-icon="tabler-file-spreadsheet"
          class="text-none"
          @click="cal.plantilla()"
        >
          {{ t('monitoreo.calendario.plantilla') }}
        </VBtn>
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
      </div>
    </div>

    <EstadoError
      v-if="cal.error.value && !cal.datos.value"
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
    <VAlert
      v-if="mensaje"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="mensaje = null"
    >
      {{ mensaje }}
    </VAlert>

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <VSelect
          v-model="periodo"
          :items="periodos.map(p => ({ value: p.id, title: p.abierto ? `${p.nombre} (abierto)` : p.nombre }))"
          :label="t('monitoreo.calendario.periodo')"
          density="compact"
          variant="outlined"
          hide-details
          class="calendario__campo"
        />
        <VSelect
          v-if="alcance.gerencias.length !== 1"
          v-model="gerencia"
          :items="opcionesGerencia"
          :label="t('monitoreo.calendario.gerencia')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="calendario__campo"
        />
        <VChipGroup
          v-model="vista"
          mandatory
          selected-class="text-primary"
        >
          <VChip
            value="lista"
            label
            filter
            prepend-icon="tabler-list"
          >
            {{ t('monitoreo.calendario.vistaLista') }}
          </VChip>
          <VChip
            value="mes"
            label
            filter
            prepend-icon="tabler-calendar-month"
          >
            {{ t('monitoreo.calendario.vistaMes') }}
          </VChip>
        </VChipGroup>
        <VTextField
          v-if="vista === 'lista'"
          v-model="busqueda"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="tabler-search"
          :placeholder="t('monitoreo.calendario.buscar')"
          class="calendario__campo"
        />
        <VCheckbox
          v-if="vista === 'lista'"
          v-model="soloSinFecha"
          density="compact"
          hide-details
          :label="t('monitoreo.calendario.sinFecha')"
        />
        <VSpacer />
        <span
          v-if="cal.datos.value"
          class="text-caption text-medium-emphasis"
        >
          {{ t('monitoreo.calendario.conFecha', { n: cal.datos.value.con_fecha, total: cal.datos.value.sectores.length }) }} · {{ t('monitoreo.calendario.diasHabiles', { dias: cal.datos.value.dias_habiles.map(d => diasSemana[d - 1]).join(' ') }) }}
        </span>
      </VCardText>
      <VDivider />

      <!-- Barra de cambios pendientes -->
      <VSlideYTransition>
        <div
          v-if="cal.hayCambios.value"
          class="calendario__cambios d-flex flex-wrap align-center justify-space-between gap-2 px-4 py-2"
        >
          <span class="text-body-2">
            <VIcon
              icon="tabler-alert-circle"
              size="18"
              class="me-1"
            />{{ t('monitoreo.calendario.cambiosPendientes') }}
          </span>
          <div class="d-flex gap-2">
            <VBtn
              size="small"
              variant="text"
              class="text-none"
              :disabled="cal.guardando.value"
              @click="cal.descartarCambios()"
            >
              {{ t('monitoreo.calendario.descartar') }}
            </VBtn>
            <VBtn
              size="small"
              color="primary"
              class="text-none"
              :loading="cal.guardando.value"
              @click="guardar"
            >
              {{ t('monitoreo.calendario.guardar', { n: cal.cambios.value.length }) }}
            </VBtn>
          </div>
        </div>
      </VSlideYTransition>

      <VProgressLinear
        v-if="cal.cargando.value"
        indeterminate
      />

      <!-- Lista editable -->
      <VDataTable
        v-if="vista === 'lista'"
        :headers="headers"
        :items="filas"
        item-value="sector_id"
        density="compact"
        :items-per-page="-1"
        hide-default-footer
        :no-data-text="t('monitoreo.calendario.sinSectores')"
        class="calendario__tabla"
      >
        <template #item="{ item }">
          <tr :class="{ 'calendario__fila--vencida': vencido(item) }">
            <td>
              <div class="d-flex align-center gap-2">
                <span
                  class="calendario__punto"
                  :style="{ backgroundColor: colorEstado(item) }"
                />
                <div>
                  <div class="font-weight-medium">
                    {{ item.sector }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.sistema ?? '' }}<span v-if="item.gerencia"> · {{ item.gerencia }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <VTextField
                v-model="item.programada"
                type="date"
                density="compact"
                variant="outlined"
                hide-details
                :disabled="!cal.puedeEditar.value"
                :min="cal.datos.value?.periodo?.inicio ?? undefined"
              />
            </td>
            <td>
              <VTextField
                v-model="item.limite"
                type="date"
                density="compact"
                variant="outlined"
                hide-details
                :disabled="!cal.puedeEditar.value"
                :min="item.programada || cal.datos.value?.periodo?.inicio || undefined"
                :error="!!item.programada && !!item.limite && item.limite < item.programada"
              />
              <div
                v-if="vencido(item)"
                class="text-caption text-error"
              >
                {{ t('monitoreo.calendario.vencido') }}
              </div>
            </td>
            <td>
              <VSelect
                v-model="item.lecturista_id"
                :items="opcionesLecturista"
                density="compact"
                variant="outlined"
                hide-details
                :disabled="!cal.puedeEditar.value"
              />
              <div
                v-if="item.lecturistas_reales.length"
                class="text-caption text-medium-emphasis text-truncate calendario__reales"
                :title="item.lecturistas_reales.join(', ')"
              >
                <VIcon
                  icon="tabler-user-check"
                  size="12"
                />
                {{ item.lecturistas_reales.join(', ') }}
              </div>
            </td>
            <td>
              <VTextField
                v-model="item.nota"
                density="compact"
                variant="outlined"
                hide-details
                maxlength="300"
                :disabled="!cal.puedeEditar.value"
              />
            </td>
            <td>
              <div
                v-if="item.estado"
                class="d-flex align-center gap-2"
              >
                <VProgressLinear
                  :model-value="item.pct_campo ?? 0"
                  :color="(item.pct_campo ?? 0) >= 98 ? 'success' : (item.pct_campo ?? 0) >= 90 ? 'warning' : 'primary'"
                  height="6"
                  rounded
                  class="flex-grow-1"
                />
                <span class="text-caption text-no-wrap">{{ item.pct_campo === null ? '—' : `${n(item.pct_campo)} %` }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.estado ? t(`monitoreo.estadoSector.${item.estado}`) : '' }}<span v-if="item.ultima_lectura"> · {{ fechaCorta(item.ultima_lectura) }}</span>
              </div>
            </td>
          </tr>
        </template>
      </VDataTable>

      <!-- Vista mensual -->
      <VCardText v-else>
        <div class="calendario__mes">
          <div
            v-for="d in diasSemana"
            :key="d"
            class="calendario__dia-nombre text-caption text-medium-emphasis text-center"
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
            >
              <div class="text-caption font-weight-medium">
                {{ Number(dia.fecha.slice(8, 10)) }}
              </div>
              <template v-if="cal.porDia.value[dia.fecha]">
                <div
                  v-for="f in cal.porDia.value[dia.fecha].programados.slice(0, 6)"
                  :key="`p${f.sector_id}`"
                  class="calendario__evento"
                  :style="{ borderInlineStartColor: colorEstado(f) }"
                  :title="`${f.sector} · ${t('monitoreo.calendario.programada')}`"
                >
                  {{ f.sector }}
                </div>
                <div
                  v-if="cal.porDia.value[dia.fecha].programados.length > 6"
                  class="text-caption text-medium-emphasis"
                >
                  +{{ cal.porDia.value[dia.fecha].programados.length - 6 }}
                </div>
                <div
                  v-if="cal.porDia.value[dia.fecha].limites.length"
                  class="text-caption text-error"
                  :title="cal.porDia.value[dia.fecha].limites.map(f => f.sector).join(', ')"
                >
                  {{ t('monitoreo.calendario.limitesDia', { n: cal.porDia.value[dia.fecha].limites.length }) }}
                </div>
              </template>
            </div>
          </template>
        </div>
      </VCardText>
    </VCard>

    <!-- Copiar del periodo anterior -->
    <VDialog
      v-model="dialogoCopia"
      max-width="520"
    >
      <VCard v-if="cal.datos.value?.anterior">
        <VCardItem>
          <VCardTitle>{{ t('monitoreo.calendario.copiarTitulo', { desde: cal.datos.value.anterior.nombre }) }}</VCardTitle>
        </VCardItem>
        <VCardText>
          <p class="mb-3">
            {{ t('monitoreo.calendario.copiarDetalle', { n: cal.datos.value.anterior.con_calendario }) }}
          </p>
          <VCheckbox
            v-model="sobrescribir"
            density="compact"
            hide-details
            :label="t('monitoreo.calendario.sobrescribir')"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            class="text-none"
            @click="dialogoCopia = false"
          >
            {{ t('monitoreo.calendario.cancelar') }}
          </VBtn>
          <VBtn
            color="primary"
            class="text-none"
            :loading="cal.guardando.value"
            @click="copiar"
          >
            {{ t('monitoreo.calendario.confirmarCopia') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Filas rechazadas -->
    <VDialog
      v-model="dialogoResultado"
      max-width="640"
    >
      <VCard>
        <VCardItem>
          <VCardTitle>{{ t('monitoreo.calendario.rechazadas', { n: rechazadas.length }) }}</VCardTitle>
        </VCardItem>
        <VCardText>
          <VTable density="compact">
            <thead>
              <tr>
                <th>{{ t('monitoreo.calendario.fila') }}</th>
                <th>{{ t('monitoreo.calendario.sector') }}</th>
                <th>{{ t('monitoreo.calendario.motivo') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in rechazadas"
                :key="i"
              >
                <td>{{ r.fila ?? '—' }}</td>
                <td>{{ r.sector_id ?? '—' }}</td>
                <td>{{ r.motivo }}</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            class="text-none"
            @click="dialogoResultado = false"
          >
            {{ t('monitoreo.calendario.cerrar') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.calendario__campo {
  flex: 1 1 200px;
  max-inline-size: 280px;
  min-inline-size: 170px;
}

.calendario__archivo {
  inline-size: 220px;
}

.calendario__cambios {
  background: rgba(var(--v-theme-warning), 0.12);
}

.calendario__punto {
  display: inline-block;
  flex: 0 0 auto;
  border-radius: 50%;
  block-size: 10px;
  inline-size: 10px;
}

.calendario__fila--vencida td {
  background: rgba(198, 40, 40, 0.05);
}

.calendario__reales {
  max-inline-size: 200px;
}

.calendario__tabla :deep(td) {
  padding-block: 6px !important;
  vertical-align: top;
}

.calendario__mes {
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendario__dia {
  min-block-size: 92px;
  padding: 4px 6px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
}

.calendario__dia--fuera {
  opacity: 0.35;
}

.calendario__dia--inhabil {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.calendario__dia--hoy {
  border-color: rgb(var(--v-theme-primary));
}

.calendario__evento {
  overflow: hidden;
  border-inline-start: 3px solid #bdbdbd;
  font-size: 11px;
  line-height: 1.3;
  padding-inline-start: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
