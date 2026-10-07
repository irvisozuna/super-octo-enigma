<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { destinoSujeto, useAlertas } from '../composables/useAlertas'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { Alerta, EstadoAlerta, EstadoFiltroAlertas, SeveridadAlerta, SujetoAlerta } from '../types/alertas'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Bandeja de alertas (F2.2): lo que el motor abrió con las 13 reglas, acotado al alcance por gerencia del usuario.
 * Quien opera atiende, silencia N horas, reabre o cierra; todos pueden ver el detalle, el historial y saltar al monitor.
 */
const { t, n } = useI18n()
const router = useRouter()
const alcance = useAlcanceStore()
const a = useAlertas()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const ESTADOS: EstadoFiltroAlertas[] = ['activas', 'abierta', 'atendida', 'silenciada', 'cerrada', 'todas']
const COLOR_SEVERIDAD: Record<SeveridadAlerta, string> = { alta: 'error', media: 'warning', aviso: 'info' }
const COLOR_ESTADO: Record<EstadoAlerta, string> = { abierta: 'primary', atendida: 'success', silenciada: 'secondary', cerrada: 'default' }
const HORAS = [1, 4, 8, 24]

const opcionesRegla = computed(() => a.reglas.value.map(r => ({ value: r.codigo, title: `${r.codigo} · ${r.titulo}` })))
const opcionesTipo = computed(() => (['sector', 'lecturista', 'lectura', 'dispositivo', 'gerencia'] as SujetoAlerta[]).map(s => ({ value: s, title: t(`monitoreo.alertas.sujeto.${s}`) })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))
const nombreGerencia = (id: number | null) => (id === null ? '—' : alcance.gerencias.find(g => g.id === id)?.label ?? `#${id}`)

const headers = computed(() => [
  { title: t('monitoreo.alertas.colAlerta'), key: 'titulo', sortable: false },
  { title: t('monitoreo.alertas.colSujeto'), key: 'sujeto_tipo', sortable: false, width: 120 },
  { title: t('monitoreo.alertas.colGerencia'), key: 'gerencia_id', sortable: false, width: 150 },
  { title: t('monitoreo.alertas.colDesde'), key: 'abierta', sortable: false, width: 170 },
  { title: t('monitoreo.alertas.colEstado'), key: 'estado', sortable: false, width: 200 },
  { title: t('monitoreo.alertas.colAcciones'), key: 'acciones', sortable: false, width: 230, align: 'end' as const },
])

const seleccionada = ref<Alerta | null>(null)
const nota = ref('')
const ultimoCiclo = computed(() => a.resumen.value?.ultimo_ciclo ? t('monitoreo.alertas.ultimoCiclo', { hace: haceCuanto(a.resumen.value.ultimo_ciclo, relativo) }) : t('monitoreo.alertas.sinCiclo'))

const entradasDetalle = computed(() => {
  const d = seleccionada.value?.detalle ?? {}

  return Object.entries(d).filter(([, v]) => v !== null && typeof v !== 'object').map(([k, v]) => ({ clave: k.replaceAll('_', ' '), valor: String(v) }))
})

function irAlMonitor(fila: Alerta) {
  const destino = destinoSujeto(fila)
  if (destino)
    router.push(destino)
}

async function abrirDetalle(fila: Alerta) {
  seleccionada.value = fila
  nota.value = ''
  await a.verEventos(fila.id)
}

async function accionar(fila: Alerta, accion: 'atender' | 'silenciar' | 'reabrir' | 'cerrar', horas?: number) {
  const r = await a.accionar(fila.id, accion, { nota: nota.value.trim() || null, horas })
  if (r && seleccionada.value?.id === fila.id) {
    seleccionada.value = r
    nota.value = ''
    await a.verEventos(fila.id)
  }
}

let busquedaTimer: ReturnType<typeof setTimeout> | null = null
watch(() => a.filtros.q, () => {
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
  busquedaTimer = setTimeout(() => a.aplicar({}), 350)
})

onMounted(async () => {
  if (!alcance.cargado)
    await alcance.cargar()
  await a.cargar()
})
onBeforeUnmount(() => {
  a.cancelar()
  a.pausarRefresco()
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.alertas.titulo') }}
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('monitoreo.alertas.descripcion') }}
        </p>
      </div>
      <div
        v-if="a.resumen.value"
        class="d-flex flex-wrap align-center gap-2"
      >
        <VChip
          v-for="s in (['alta', 'media', 'aviso'] as SeveridadAlerta[])"
          :key="s"
          label
          variant="tonal"
          :color="COLOR_SEVERIDAD[s]"
          class="text-none"
          @click="a.aplicar({ severidad: a.filtros.severidad === s ? null : s })"
        >
          {{ n(a.resumen.value.por_severidad[s]) }} {{ t(`monitoreo.alertas.${s}`) }}
        </VChip>
        <span class="text-caption text-medium-emphasis">{{ ultimoCiclo }}</span>
      </div>
    </div>

    <EstadoError
      v-if="a.error.value && !a.datos.value"
      class="mb-4"
      :error="a.error.value"
      @reintentar="a.cargar()"
    />
    <VAlert
      v-if="a.datos.value && !a.puedeOperar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('monitoreo.alertas.soloLectura') }}
    </VAlert>
    <VAlert
      v-if="a.errorAccion.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="a.errorAccion.value = null"
    >
      {{ a.errorAccion.value.mensaje }}
    </VAlert>

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <VChipGroup
          :model-value="a.filtros.estado"
          mandatory
          selected-class="text-primary"
          @update:model-value="(v: EstadoFiltroAlertas) => a.aplicar({ estado: v })"
        >
          <VChip
            v-for="e in ESTADOS"
            :key="e"
            :value="e"
            label
            filter
          >
            {{ t(`monitoreo.alertas.estado${e.charAt(0).toUpperCase()}${e.slice(1)}`) }}
            <template v-if="a.resumen.value && e !== 'todas' && e !== 'cerrada'">
              &nbsp;· {{ e === 'activas' ? a.resumen.value.activas : a.resumen.value.por_estado[e] }}
            </template>
          </VChip>
        </VChipGroup>
        <VSelect
          :model-value="a.filtros.regla"
          :items="opcionesRegla"
          :label="t('monitoreo.alertas.regla')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="alertas__campo"
          @update:model-value="(v: string | null) => a.aplicar({ regla: v })"
        />
        <VSelect
          :model-value="a.filtros.tipo"
          :items="opcionesTipo"
          :label="t('monitoreo.alertas.tipo')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="alertas__campo alertas__campo--corto"
          @update:model-value="(v: SujetoAlerta | null) => a.aplicar({ tipo: v })"
        />
        <VSelect
          v-if="alcance.gerencias.length !== 1"
          :model-value="a.filtros.gerencia"
          :items="opcionesGerencia"
          :label="t('monitoreo.alertas.gerencia')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="alertas__campo alertas__campo--corto"
          @update:model-value="(v: number | null) => a.aplicar({ gerencia: v })"
        />
        <VTextField
          v-model="a.filtros.q"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="tabler-search"
          :placeholder="t('monitoreo.alertas.buscar')"
          class="alertas__campo"
        />
      </VCardText>
      <VDivider />
      <VProgressLinear
        v-if="a.cargando.value"
        indeterminate
      />

      <VDataTable
        :headers="headers"
        :items="a.filas.value"
        item-value="id"
        density="compact"
        :items-per-page="-1"
        hide-default-footer
        :no-data-text="t('monitoreo.alertas.sinAlertas')"
        class="alertas__tabla"
      >
        <template #item="{ item }">
          <tr
            class="alertas__fila"
            :class="`alertas__fila--${item.severidad}`"
            @click="abrirDetalle(item)"
          >
            <td>
              <div class="d-flex align-start gap-2">
                <VChip
                  size="x-small"
                  label
                  :color="COLOR_SEVERIDAD[item.severidad]"
                  variant="flat"
                  class="mt-1 flex-shrink-0"
                >
                  {{ item.regla }}
                </VChip>
                <div>
                  <div class="font-weight-medium">
                    {{ item.titulo }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.regla_titulo }}<span v-if="item.veces > 1"> · {{ t('monitoreo.alertas.veces', { n: item.veces }) }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>{{ t(`monitoreo.alertas.sujeto.${item.sujeto_tipo}`) }}</td>
            <td>{{ nombreGerencia(item.gerencia_id) }}</td>
            <td>
              <div :title="item.abierta">
                {{ t('monitoreo.alertas.abiertaHace', { hace: haceCuanto(item.abierta, relativo) }) }}
              </div>
              <div
                class="text-caption text-medium-emphasis"
                :title="item.ultima_vez"
              >
                {{ t('monitoreo.alertas.vistaHace', { hace: haceCuanto(item.ultima_vez, relativo) }) }}
              </div>
            </td>
            <td>
              <VChip
                size="small"
                label
                variant="tonal"
                :color="COLOR_ESTADO[item.estado]"
              >
                {{ t(`monitoreo.alertas.estado.${item.estado}`) }}
              </VChip>
              <div
                v-if="item.estado === 'atendida' && item.atendida_por"
                class="text-caption text-medium-emphasis"
              >
                {{ t('monitoreo.alertas.atendidaPor', { quien: item.atendida_por, hace: haceCuanto(item.atendida_en, relativo) }) }}
              </div>
              <div
                v-else-if="item.estado === 'silenciada' && item.silenciada_hasta"
                class="text-caption text-medium-emphasis"
              >
                {{ t('monitoreo.alertas.silenciadaHasta', { hasta: `${fechaCorta(item.silenciada_hasta)} ${horaCorta(item.silenciada_hasta)}`, quien: item.silenciada_por ?? '—' }) }}
              </div>
              <div
                v-else-if="item.estado === 'cerrada' && item.motivo_cierre"
                class="text-caption text-medium-emphasis"
              >
                {{ t(`monitoreo.alertas.cerradaMotivo.${item.motivo_cierre}`) }}
              </div>
            </td>
            <td
              class="text-end text-no-wrap"
              @click.stop
            >
              <VBtn
                icon="tabler-map-pin"
                size="small"
                variant="text"
                :title="t('monitoreo.alertas.verMonitor')"
                :disabled="!destinoSujeto(item)"
                @click="irAlMonitor(item)"
              />
              <template v-if="a.puedeOperar.value">
                <VBtn
                  v-if="item.estado === 'abierta' || item.estado === 'silenciada'"
                  size="small"
                  variant="tonal"
                  color="success"
                  class="text-none ms-1"
                  :loading="a.accionando.value === item.id"
                  @click="accionar(item, 'atender')"
                >
                  {{ item.es_evento ? t('monitoreo.alertas.atenderEvento') : t('monitoreo.alertas.atender') }}
                </VBtn>
                <VMenu v-if="item.estado !== 'cerrada' && item.estado !== 'silenciada'">
                  <template #activator="{ props }">
                    <VBtn
                      v-bind="props"
                      size="small"
                      variant="text"
                      class="text-none ms-1"
                      :disabled="a.accionando.value === item.id"
                    >
                      {{ t('monitoreo.alertas.silenciar') }}
                    </VBtn>
                  </template>
                  <VList density="compact">
                    <VListItem
                      v-for="h in HORAS"
                      :key="h"
                      :title="t('monitoreo.alertas.silenciarHoras', { n: h })"
                      @click="accionar(item, 'silenciar', h)"
                    />
                  </VList>
                </VMenu>
                <VBtn
                  v-if="item.estado === 'cerrada' || item.estado === 'silenciada'"
                  size="small"
                  variant="text"
                  class="text-none ms-1"
                  :loading="a.accionando.value === item.id"
                  @click="accionar(item, 'reabrir')"
                >
                  {{ t('monitoreo.alertas.reabrir') }}
                </VBtn>
              </template>
            </td>
          </tr>
        </template>
      </VDataTable>

      <VDivider />
      <div class="d-flex flex-wrap align-center justify-space-between gap-2 px-4 py-2">
        <span class="text-caption text-medium-emphasis">{{ n(a.total.value) }} · {{ a.filtros.pagina }} / {{ a.paginas.value }}</span>
        <VPagination
          :model-value="a.filtros.pagina"
          :length="a.paginas.value"
          density="compact"
          :total-visible="7"
          @update:model-value="(p: number) => a.aplicar({ pagina: p })"
        />
      </div>
    </VCard>

    <!-- Detalle e historial -->
    <VDialog
      :model-value="!!seleccionada"
      max-width="640"
      @update:model-value="(v: boolean) => { if (!v) seleccionada = null }"
    >
      <VCard v-if="seleccionada">
        <VCardItem>
          <template #prepend>
            <VChip
              size="small"
              label
              variant="flat"
              :color="COLOR_SEVERIDAD[seleccionada.severidad]"
            >
              {{ seleccionada.regla }}
            </VChip>
          </template>
          <VCardTitle class="text-wrap">
            {{ seleccionada.titulo }}
          </VCardTitle>
          <VCardSubtitle>{{ seleccionada.regla_titulo }} · {{ t(`monitoreo.alertas.estado.${seleccionada.estado}`) }}</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <h6 class="text-subtitle-2 mb-1">
            {{ t('monitoreo.alertas.detalle') }}
          </h6>
          <VTable
            density="compact"
            class="mb-4"
          >
            <tbody>
              <tr
                v-for="e in entradasDetalle"
                :key="e.clave"
              >
                <td class="text-medium-emphasis text-capitalize">
                  {{ e.clave }}
                </td>
                <td>{{ e.valor }}</td>
              </tr>
            </tbody>
          </VTable>
          <h6 class="text-subtitle-2 mb-1">
            {{ t('monitoreo.alertas.historial') }}
          </h6>
          <VProgressLinear
            v-if="a.cargandoEventos.value"
            indeterminate
          />
          <VTimeline
            v-else
            density="compact"
            side="end"
            align="start"
            truncate-line="both"
          >
            <VTimelineItem
              v-for="(ev, i) in a.eventos.value"
              :key="i"
              size="x-small"
              dot-color="primary"
            >
              <div class="text-body-2">
                {{ t(`monitoreo.alertas.accion.${ev.accion}`) }}
                <span v-if="ev.hasta"> · {{ t('monitoreo.alertas.hasta', { hasta: `${fechaCorta(ev.hasta)} ${horaCorta(ev.hasta)}` }) }}</span>
                <span v-if="ev.nota"> · {{ ev.nota }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ fechaCorta(ev.fecha) }} {{ horaCorta(ev.fecha) }} · {{ ev.usuario ?? t('monitoreo.alertas.motor') }}
              </div>
            </VTimelineItem>
          </VTimeline>
          <VTextField
            v-if="a.puedeOperar.value && seleccionada.estado !== 'cerrada'"
            v-model="nota"
            density="compact"
            variant="outlined"
            hide-details
            maxlength="500"
            :label="t('monitoreo.alertas.nota')"
            class="mt-3"
          />
        </VCardText>
        <VCardActions>
          <VBtn
            variant="text"
            class="text-none"
            prepend-icon="tabler-map-pin"
            :disabled="!destinoSujeto(seleccionada)"
            @click="irAlMonitor(seleccionada)"
          >
            {{ t('monitoreo.alertas.verMonitor') }}
          </VBtn>
          <VSpacer />
          <template v-if="a.puedeOperar.value">
            <VBtn
              v-if="seleccionada.estado !== 'cerrada'"
              variant="text"
              class="text-none"
              :loading="a.accionando.value === seleccionada.id"
              @click="accionar(seleccionada, 'cerrar')"
            >
              {{ t('monitoreo.alertas.cerrar') }}
            </VBtn>
            <VBtn
              v-if="seleccionada.estado === 'cerrada' || seleccionada.estado === 'silenciada'"
              variant="text"
              class="text-none"
              :loading="a.accionando.value === seleccionada.id"
              @click="accionar(seleccionada, 'reabrir')"
            >
              {{ t('monitoreo.alertas.reabrir') }}
            </VBtn>
            <VBtn
              v-if="seleccionada.estado === 'abierta' || seleccionada.estado === 'silenciada'"
              color="success"
              variant="tonal"
              class="text-none"
              :loading="a.accionando.value === seleccionada.id"
              @click="accionar(seleccionada, 'atender')"
            >
              {{ seleccionada.es_evento ? t('monitoreo.alertas.atenderEvento') : t('monitoreo.alertas.atender') }}
            </VBtn>
          </template>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.alertas__campo {
  flex: 1 1 220px;
  max-inline-size: 320px;
  min-inline-size: 180px;
}

.alertas__campo--corto {
  flex-basis: 160px;
  max-inline-size: 200px;
  min-inline-size: 150px;
}

.alertas__fila {
  cursor: pointer;
}

.alertas__fila--alta td:first-child {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-error));
}

.alertas__fila--media td:first-child {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-warning));
}

.alertas__tabla :deep(td) {
  padding-block: 6px !important;
  vertical-align: top;
}
</style>
