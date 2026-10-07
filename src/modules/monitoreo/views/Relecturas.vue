<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRelecturas } from '../composables/useRelecturas'
import { obtenerCatalogos } from '../services/monitoreoApi'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { RespuestaCatalogos } from '../types/monitor'
import type { EstadoRelectura, Relectura } from '../types/relecturas'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Re-lecturas (F2.5): órdenes pedidas desde el detalle de la lectura, por periodo y gerencia. Pendientes agrupadas por
 * lecturista y sector en orden de secuencia (igual que la lista imprimible); re-leídas y canceladas en lista.
 */
const { t } = useI18n()
const router = useRouter()
const alcance = useAlcanceStore()
const r = useRelecturas()
const catalogos = ref<RespuestaCatalogos | null>(null)
const vista = ref<'grupos' | 'lista'>('grupos')

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const ESTADOS: (EstadoRelectura | 'todas')[] = ['solicitada', 'releida', 'cancelada', 'todas']
const COLOR_ESTADO: Record<EstadoRelectura, string> = { solicitada: 'warning', releida: 'success', cancelada: 'secondary' }
const periodos = computed(() => (catalogos.value?.periodos ?? []).map(p => ({ value: p.id, title: p.abierto ? `${p.nombre} (abierto)` : p.nombre })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))

const headers = computed(() => [
  { title: t('monitoreo.relecturas.secuencia'), key: 'secuencia', width: 70, align: 'end' as const },
  { title: t('monitoreo.relecturas.cuenta'), key: 'cuenta', width: 110 },
  { title: t('monitoreo.relecturas.toma'), key: 'nombre', sortable: false },
  { title: t('monitoreo.relecturas.sector'), key: 'sector', width: 180 },
  { title: t('monitoreo.relecturas.motivo'), key: 'motivo_etiqueta', width: 170 },
  { title: t('monitoreo.relecturas.pedida'), key: 'pedida_en', width: 190 },
  { title: t('monitoreo.relecturas.estado'), key: 'estado', width: 220 },
  { title: '', key: 'acciones', sortable: false, width: 150, align: 'end' as const },
])

function verLectura(f: Relectura) {
  router.push({ name: 'monitoreoInicio', query: { sector: f.sector_id ? String(f.sector_id) : undefined, periodo: String(f.periodo_id), vista: 'periodo', contrato: String(f.contrato_id) } })
}

onMounted(async () => {
  await Promise.all([alcance.cargado ? Promise.resolve() : alcance.cargar(), obtenerCatalogos().then(c => {
    catalogos.value = c
  }).catch(() => null)])
  await r.cargar()
})
onBeforeUnmount(() => r.detener())
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.relecturas.titulo') }}
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('monitoreo.relecturas.descripcion') }}
        </p>
      </div>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-printer"
        class="text-none"
        :loading="r.exportando.value"
        :disabled="!r.conteos.value.solicitada"
        @click="r.exportarPdf()"
      >
        {{ t('monitoreo.relecturas.imprimir') }}
      </VBtn>
    </div>

    <EstadoError
      v-if="r.error.value && !r.datos.value"
      class="mb-4"
      :error="r.error.value"
      @reintentar="r.cargar()"
    />
    <VAlert
      v-if="r.datos.value && !r.puedeOperar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('monitoreo.relecturas.soloLectura') }}
    </VAlert>
    <VAlert
      v-if="r.errorAccion.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="r.errorAccion.value = null"
    >
      {{ r.errorAccion.value.mensaje }}
    </VAlert>

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <VChipGroup
          :model-value="r.filtros.estado"
          mandatory
          selected-class="text-primary"
          @update:model-value="(v: EstadoRelectura | 'todas') => r.aplicar({ estado: v })"
        >
          <VChip
            v-for="e in ESTADOS"
            :key="e"
            :value="e"
            label
            filter
          >
            {{ t(`monitoreo.relecturas.estado${e.charAt(0).toUpperCase()}${e.slice(1)}`) }}
            <template v-if="e !== 'todas'">
              &nbsp;· {{ r.conteos.value[e] }}
            </template>
          </VChip>
        </VChipGroup>
        <VSelect
          :model-value="r.filtros.periodo"
          :items="periodos"
          :label="t('monitoreo.relecturas.periodo')"
          density="compact"
          variant="outlined"
          hide-details
          class="relecturas__campo"
          @update:model-value="(v: number | null) => r.aplicar({ periodo: v })"
        />
        <VSelect
          v-if="alcance.gerencias.length !== 1"
          :model-value="r.filtros.gerencia"
          :items="opcionesGerencia"
          :label="t('monitoreo.relecturas.gerencia')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="relecturas__campo"
          @update:model-value="(v: number | null) => r.aplicar({ gerencia: v })"
        />
        <VSpacer />
        <VChipGroup
          v-if="r.filtros.estado === 'solicitada'"
          v-model="vista"
          mandatory
          selected-class="text-primary"
        >
          <VChip
            value="grupos"
            label
            filter
          >
            {{ t('monitoreo.relecturas.vistaGrupos') }}
          </VChip>
          <VChip
            value="lista"
            label
            filter
          >
            {{ t('monitoreo.relecturas.vistaLista') }}
          </VChip>
        </VChipGroup>
      </VCardText>
      <VDivider />
      <VProgressLinear
        v-if="r.cargando.value"
        indeterminate
      />

      <!-- Pendientes por lecturista y sector -->
      <VCardText v-if="r.filtros.estado === 'solicitada' && vista === 'grupos'">
        <div
          v-if="!r.grupos.value.length"
          class="text-body-2 text-medium-emphasis"
        >
          {{ t('monitoreo.relecturas.sinFilas') }}
        </div>
        <div
          v-for="g in r.grupos.value"
          :key="g.clave"
          class="mb-5"
        >
          <h6 class="text-subtitle-1 font-weight-medium text-primary mb-1">
            {{ t('monitoreo.relecturas.grupo', { lecturista: g.lecturista, sector: g.sector, n: g.filas.length }) }}
          </h6>
          <VTable density="compact">
            <thead>
              <tr>
                <th class="text-end">
                  {{ t('monitoreo.relecturas.secuencia') }}
                </th>
                <th>{{ t('monitoreo.relecturas.cuenta') }}</th>
                <th>{{ t('monitoreo.relecturas.toma') }}</th>
                <th>{{ t('monitoreo.relecturas.motivo') }}</th>
                <th>{{ t('monitoreo.relecturas.pedida') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="f in g.filas"
                :key="f.id"
              >
                <td class="text-end">
                  {{ f.secuencia ?? '—' }}
                </td>
                <td>{{ f.cuenta ?? f.contrato_id }}</td>
                <td>
                  <div>{{ f.nombre ?? '—' }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ f.direccion ?? '' }}
                  </div>
                </td>
                <td>
                  {{ f.motivo_etiqueta }}<span
                    v-if="f.nota"
                    class="text-caption text-medium-emphasis"
                  > · {{ f.nota }}</span>
                </td>
                <td class="text-caption">
                  {{ t('monitoreo.relecturas.pedidaPor', { quien: f.pedida_por ?? '—', hace: haceCuanto(f.pedida_en, relativo) }) }}
                </td>
                <td class="text-end text-no-wrap">
                  <VBtn
                    size="small"
                    variant="text"
                    class="text-none"
                    @click="verLectura(f)"
                  >
                    {{ t('monitoreo.relecturas.verLectura') }}
                  </VBtn>
                  <VBtn
                    v-if="r.puedeOperar.value"
                    size="small"
                    variant="text"
                    color="error"
                    class="text-none"
                    :loading="r.accionando.value === f.id"
                    @click="r.cancelar(f.id)"
                  >
                    {{ t('monitoreo.relecturas.cancelar') }}
                  </VBtn>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>

      <!-- Lista -->
      <VDataTable
        v-else
        :headers="headers"
        :items="r.filas.value"
        item-value="id"
        density="compact"
        :items-per-page="-1"
        hide-default-footer
        :no-data-text="t('monitoreo.relecturas.sinFilas')"
      >
        <template #item.secuencia="{ item }">
          {{ item.secuencia ?? '—' }}
        </template>
        <template #item.cuenta="{ item }">
          {{ item.cuenta ?? item.contrato_id }}
        </template>
        <template #item.nombre="{ item }">
          <div>{{ item.nombre ?? '—' }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ item.direccion ?? '' }}
          </div>
        </template>
        <template #item.sector="{ item }">
          <div>{{ item.sector ?? '—' }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ item.lecturista ?? '' }}
          </div>
        </template>
        <template #item.motivo_etiqueta="{ item }">
          {{ item.motivo_etiqueta }}<div
            v-if="item.nota"
            class="text-caption text-medium-emphasis"
          >
            {{ item.nota }}
          </div>
        </template>
        <template #item.pedida_en="{ item }">
          <div>{{ item.pedida_por ?? '—' }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ fechaCorta(item.pedida_en) }} {{ horaCorta(item.pedida_en) }}
          </div>
        </template>
        <template #item.estado="{ item }">
          <VChip
            size="small"
            label
            variant="tonal"
            :color="COLOR_ESTADO[item.estado]"
          >
            {{ t(`monitoreo.relecturas.estado${item.estado.charAt(0).toUpperCase()}${item.estado.slice(1)}`) }}
          </VChip>
          <div
            v-if="item.estado === 'releida' && item.resultado"
            class="text-caption text-medium-emphasis"
          >
            {{ t('monitoreo.relecturas.releidaCon', { actual: item.resultado.actual ?? '—', consumo: item.resultado.consumo ?? '—', hace: haceCuanto(item.resuelta_en, relativo) }) }}
          </div>
          <div
            v-else-if="item.estado === 'cancelada' && item.cancelacion?.nota"
            class="text-caption text-medium-emphasis"
          >
            {{ item.cancelacion.nota }}
          </div>
        </template>
        <template #item.acciones="{ item }">
          <VBtn
            size="small"
            variant="text"
            class="text-none"
            @click="verLectura(item)"
          >
            {{ t('monitoreo.relecturas.verLectura') }}
          </VBtn>
          <VBtn
            v-if="r.puedeOperar.value && item.estado === 'solicitada'"
            size="small"
            variant="text"
            color="error"
            class="text-none"
            :loading="r.accionando.value === item.id"
            @click="r.cancelar(item.id)"
          >
            {{ t('monitoreo.relecturas.cancelar') }}
          </VBtn>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<style scoped>
.relecturas__campo {
  flex: 1 1 200px;
  max-inline-size: 280px;
  min-inline-size: 170px;
}
</style>
