<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCoordenadas } from '../composables/useCoordenadas'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { ConfianzaPropuesta, EstadoPropuesta, PropuestaCoordenada, TipoPropuesta } from '../types/coordenadas'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Tomas sin coordenada válida y coordenadas desactualizadas (respuesta D2): propuestas calculadas desde las últimas
 * lecturas con GPS, decisión (aceptar / descartar / reabrir, con `operate monitoring`) y CSV para sistemas. Nada se
 * escribe en Aquasoft Comercial: lo aceptado queda como coordenada corregida en Atención.
 */
const { t, n } = useI18n()
const router = useRouter()
const alcance = useAlcanceStore()
const c = useCoordenadas()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const opcionesTipo = computed(() => [{ value: 'sin_coordenada', title: t('monitoreo.coordenadas.tipoSinCoordenada') }, { value: 'desactualizada', title: t('monitoreo.coordenadas.tipoDesactualizada') }])
const opcionesEstado = computed(() => (['propuesta', 'aceptada', 'descartada', 'aplicada'] as EstadoPropuesta[]).map(e => ({ value: e, title: t(`monitoreo.coordenadas.estado${e.charAt(0).toUpperCase()}${e.slice(1)}`) })))
const opcionesConfianza = computed(() => (['alta', 'media', 'baja'] as ConfianzaPropuesta[]).map(v => ({ value: v, title: t(`monitoreo.coordenadas.confianza${v.charAt(0).toUpperCase()}${v.slice(1)}`) })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))

const COLOR_ESTADO: Record<EstadoPropuesta, string> = { propuesta: 'warning', aceptada: 'success', descartada: 'secondary', aplicada: 'primary' }
const COLOR_CONFIANZA: Record<ConfianzaPropuesta, string> = { alta: 'success', media: 'warning', baja: 'error' }

const headers = computed(() => [
  { title: t('monitoreo.coordenadas.cuenta'), key: 'cuenta', width: 110 },
  { title: t('monitoreo.coordenadas.toma'), key: 'nombre', sortable: false },
  { title: t('monitoreo.coordenadas.tipo'), key: 'tipo', width: 130 },
  { title: t('monitoreo.coordenadas.actual'), key: 'actual', sortable: false, width: 170 },
  { title: t('monitoreo.coordenadas.propuesta'), key: 'propuesta', sortable: false, width: 200 },
  { title: t('monitoreo.coordenadas.base'), key: 'lecturas_base', width: 80, align: 'end' as const },
  { title: t('monitoreo.coordenadas.dispersion'), key: 'dispersion_m', width: 90, align: 'end' as const },
  { title: t('monitoreo.coordenadas.confianza'), key: 'confianza', width: 100 },
  { title: t('monitoreo.coordenadas.estado'), key: 'estado', width: 120 },
  { title: t('monitoreo.coordenadas.decision'), key: 'acciones', sortable: false, width: 230 },
])

function coord(lat: number | null, lng: number | null): string {
  return lat === null || lng === null ? '—' : `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

function etiquetaTipo(tipo: TipoPropuesta): string {
  return tipo === 'sin_coordenada' ? t('monitoreo.coordenadas.tipoSinCoordenada') : t('monitoreo.coordenadas.tipoDesactualizada')
}

function etiquetaEstado(estado: EstadoPropuesta): string {
  return t(`monitoreo.coordenadas.estado${estado.charAt(0).toUpperCase()}${estado.slice(1)}`)
}

function verEnMapa(fila: PropuestaCoordenada) {
  router.push({ name: 'monitoreoInicio', query: { sector: fila.sector_id ? String(fila.sector_id) : undefined } })
}

let busquedaTimer: ReturnType<typeof setTimeout> | null = null
watch(() => c.filtros.q, () => {
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
  busquedaTimer = setTimeout(() => c.aplicar({}), 350)
})

onMounted(async () => {
  if (!alcance.cargado)
    await alcance.cargar()
  await c.cargar()
})
onBeforeUnmount(() => {
  c.cancelar()
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.coordenadas.titulo') }}
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('monitoreo.coordenadas.descripcion') }}
        </p>
      </div>
      <div class="d-flex align-center gap-2">
        <VBtn
          variant="tonal"
          prepend-icon="tabler-file-type-csv"
          class="text-none"
          :loading="c.exportando.value"
          :disabled="!c.total.value"
          @click="c.exportar()"
        >
          {{ t('monitoreo.coordenadas.exportar') }}
        </VBtn>
      </div>
    </div>

    <EstadoError
      v-if="c.error.value && !c.datos.value"
      class="mb-4"
      :error="c.error.value"
      @reintentar="c.cargar()"
    />

    <VRow
      v-if="c.resumen.value"
      dense
      class="mb-2"
    >
      <VCol cols="12">
        <div class="d-flex flex-wrap align-center gap-2">
          <VChip
            label
            variant="tonal"
            prepend-icon="tabler-map-pin-off"
          >
            {{ t('monitoreo.coordenadas.tomasSinCoordenada', { n: n(c.resumen.value.tomas_sin_coordenada) }) }} · {{ t('monitoreo.coordenadas.activas', { n: n(c.resumen.value.tomas_sin_coordenada_activas) }) }}
          </VChip>
          <VChip
            label
            variant="tonal"
            color="warning"
          >
            {{ t('monitoreo.coordenadas.conPropuesta', { n: n(c.resumen.value.sin_coordenada.propuesta) }) }}
          </VChip>
          <VChip
            label
            variant="tonal"
            color="error"
          >
            {{ t('monitoreo.coordenadas.desactualizadas', { n: n(c.resumen.value.desactualizada.propuesta) }) }}
          </VChip>
          <VChip
            label
            variant="tonal"
            color="success"
          >
            {{ t('monitoreo.coordenadas.aceptadas', { n: n(c.resumen.value.sin_coordenada.aceptada + c.resumen.value.desactualizada.aceptada) }) }}
          </VChip>
          <VChip
            label
            variant="tonal"
          >
            {{ t('monitoreo.coordenadas.descartadas', { n: n(c.resumen.value.sin_coordenada.descartada + c.resumen.value.desactualizada.descartada) }) }}
          </VChip>
          <span class="text-caption text-medium-emphasis ms-2">
            {{ c.resumen.value.calculado ? t('monitoreo.coordenadas.calculado', { hace: haceCuanto(c.resumen.value.calculado, relativo) }) : t('monitoreo.coordenadas.sinCalcular') }}
          </span>
        </div>
      </VCol>
    </VRow>

    <VAlert
      v-if="c.datos.value && !c.puedeDecidir.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('monitoreo.coordenadas.soloLectura') }}
    </VAlert>
    <VAlert
      v-if="c.errorDecision.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="c.errorDecision.value = null"
    >
      {{ c.errorDecision.value.mensaje || t('monitoreo.coordenadas.errorDecision') }}
    </VAlert>

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <VSelect
          :model-value="c.filtros.tipo"
          :items="opcionesTipo"
          :label="t('monitoreo.coordenadas.tipo')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="coordenadas__campo"
          @update:model-value="(v: TipoPropuesta | null) => c.aplicar({ tipo: v ?? null })"
        />
        <VSelect
          :model-value="c.filtros.estado"
          :items="opcionesEstado"
          :label="t('monitoreo.coordenadas.estado')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="coordenadas__campo"
          @update:model-value="(v: EstadoPropuesta | null) => c.aplicar({ estado: v ?? null })"
        />
        <VSelect
          v-if="alcance.gerencias.length !== 1"
          :model-value="c.filtros.gerencia"
          :items="opcionesGerencia"
          :label="t('monitoreo.coordenadas.gerencia')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="coordenadas__campo"
          @update:model-value="(v: number | null) => c.aplicar({ gerencia: v ?? null })"
        />
        <VSelect
          :model-value="c.filtros.confianza"
          :items="opcionesConfianza"
          :label="t('monitoreo.coordenadas.confianza')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="coordenadas__campo coordenadas__campo--corto"
          @update:model-value="(v: ConfianzaPropuesta | null) => c.aplicar({ confianza: v ?? null })"
        />
        <VTextField
          v-model="c.filtros.q"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="tabler-search"
          :placeholder="t('monitoreo.coordenadas.buscar')"
          class="coordenadas__campo coordenadas__campo--largo"
        />
      </VCardText>
      <VDivider />
      <VDataTable
        :headers="headers"
        :items="c.filas.value"
        item-value="id"
        density="compact"
        :items-per-page="-1"
        hide-default-footer
        :loading="c.cargando.value"
        :no-data-text="t('monitoreo.coordenadas.sinFilas')"
        class="coordenadas__tabla"
      >
        <template #item="{ item }">
          <tr>
            <td class="font-weight-medium">
              {{ item.cuenta ?? '—' }}
              <div
                v-if="!item.activo"
                class="text-caption text-warning"
              >
                {{ t('monitoreo.coordenadas.inactivo') }}
              </div>
            </td>
            <td>
              <div class="text-truncate coordenadas__nombre">
                {{ item.nombre ?? '—' }}
              </div>
              <div class="text-caption text-medium-emphasis text-truncate coordenadas__nombre">
                {{ item.sector ?? '' }}<span v-if="item.gerencia"> · {{ item.gerencia }}</span>
              </div>
            </td>
            <td>
              <VChip
                size="x-small"
                label
                :color="item.tipo === 'desactualizada' ? 'error' : 'warning'"
                variant="tonal"
              >
                {{ etiquetaTipo(item.tipo) }}
              </VChip>
            </td>
            <td class="text-caption">
              {{ coord(item.actual.lat, item.actual.lng) }}
              <div
                v-if="item.distancia_actual_m !== null"
                class="text-caption text-error"
              >
                {{ t('monitoreo.coordenadas.distancia', { n: n(item.distancia_actual_m) }) }}
              </div>
            </td>
            <td class="text-caption font-weight-medium">
              {{ coord(item.propuesta.lat, item.propuesta.lng) }}
            </td>
            <td class="text-end">
              {{ item.lecturas_base }}
            </td>
            <td class="text-end">
              {{ n(item.dispersion_m) }} m
            </td>
            <td>
              <VChip
                size="x-small"
                label
                :color="COLOR_CONFIANZA[item.confianza]"
                variant="tonal"
              >
                {{ t(`monitoreo.coordenadas.confianza${item.confianza.charAt(0).toUpperCase()}${item.confianza.slice(1)}`) }}
              </VChip>
            </td>
            <td>
              <VChip
                size="x-small"
                label
                :color="COLOR_ESTADO[item.estado]"
                variant="tonal"
              >
                {{ etiquetaEstado(item.estado) }}
              </VChip>
              <div
                v-if="item.decidido_por"
                class="text-caption text-medium-emphasis"
              >
                {{ t('monitoreo.coordenadas.decididoPor', { quien: item.decidido_por, cuando: item.decidido_en ? `${fechaCorta(item.decidido_en)} ${horaCorta(item.decidido_en)}` : '' }) }}
              </div>
            </td>
            <td>
              <div class="d-flex align-center gap-1">
                <template v-if="item.estado === 'propuesta'">
                  <VBtn
                    size="x-small"
                    color="success"
                    variant="tonal"
                    class="text-none"
                    :disabled="!c.puedeDecidir.value"
                    :loading="c.decidiendo.value === item.contrato_id"
                    @click="c.decidir(item, 'aceptar')"
                  >
                    {{ t('monitoreo.coordenadas.aceptar') }}
                  </VBtn>
                  <VBtn
                    size="x-small"
                    variant="text"
                    class="text-none"
                    :disabled="!c.puedeDecidir.value"
                    :loading="c.decidiendo.value === item.contrato_id"
                    @click="c.decidir(item, 'descartar')"
                  >
                    {{ t('monitoreo.coordenadas.descartar') }}
                  </VBtn>
                </template>
                <VBtn
                  v-else-if="item.estado !== 'aplicada'"
                  size="x-small"
                  variant="text"
                  class="text-none"
                  :disabled="!c.puedeDecidir.value"
                  :loading="c.decidiendo.value === item.contrato_id"
                  @click="c.decidir(item, 'reabrir')"
                >
                  {{ t('monitoreo.coordenadas.reabrir') }}
                </VBtn>
                <VBtn
                  v-if="item.sector_id"
                  size="x-small"
                  variant="text"
                  icon="tabler-map-pin"
                  :title="t('monitoreo.coordenadas.verMapa')"
                  @click="verEnMapa(item)"
                />
              </div>
            </td>
          </tr>
        </template>
      </VDataTable>
      <VDivider />
      <VCardText class="d-flex flex-wrap align-center justify-space-between gap-2 py-2">
        <span class="text-caption text-medium-emphasis">{{ t('monitoreo.coordenadas.paginaDe', { p: c.filtros.pagina, n: c.paginas.value, total: n(c.total.value) }) }}</span>
        <VPagination
          :model-value="c.filtros.pagina"
          :length="c.paginas.value"
          :total-visible="7"
          density="compact"
          @update:model-value="(p: number) => c.aplicar({ pagina: p })"
        />
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.coordenadas__campo {
  flex: 1 1 170px;
  max-inline-size: 240px;
  min-inline-size: 150px;
}

.coordenadas__campo--corto {
  flex-basis: 140px;
  max-inline-size: 170px;
}

.coordenadas__campo--largo {
  flex-basis: 260px;
  max-inline-size: 360px;
}

.coordenadas__nombre {
  max-inline-size: 240px;
}

.coordenadas__tabla :deep(th) {
  white-space: nowrap;
}
</style>
