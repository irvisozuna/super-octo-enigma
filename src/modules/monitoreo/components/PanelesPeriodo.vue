<script setup lang="ts">
import { computed, onBeforeUnmount, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePanelesPeriodo } from '../composables/usePanelesPeriodo'
import type { EstadoTarifaFija } from '../types/paneles'
import { fechaCorta, horaCorta } from '../utils/tiempo'

/*
 * Paneles de la vista periodo (F2.8): refacturaciones (quién, cuántas, por qué; fuente llx_log_rebill de Aquasoft
 * Comercial, solo lectura) e indicador de facturación automática de tarifa fija por gerencia, con Excel.
 */
const props = defineProps<{
  periodo: number | null
  gerencia: number | null
  activo: boolean
}>()

const emit = defineEmits<{
  lectura: [contrato: number]
}>()

const { t, n } = useI18n()
const router = useRouter()
const p = usePanelesPeriodo(toRef(props, 'periodo'), toRef(props, 'gerencia'), toRef(props, 'activo'))

const COLOR_ESTADO: Record<EstadoTarifaFija, string> = { completa: 'success', generada: 'info', pendiente: 'secondary', faltante: 'error' }
const maxQuien = computed(() => Math.max(1, ...(p.refacturaciones.value?.por_quien.map(q => q.n) ?? [1])))

function verReporte() {
  router.push({ path: `/reportes/${p.refacturaciones.value?.reporte ?? 'refacturacion_por_lectura'}` })
}

onBeforeUnmount(() => p.detener())
</script>

<template>
  <VRow
    v-if="activo"
    class="mb-1"
  >
    <!-- Refacturaciones -->
    <VCol
      cols="12"
      lg="7"
    >
      <VCard class="h-100">
        <VCardItem>
          <template #prepend>
            <VIcon
              icon="tabler-receipt-refund"
              color="warning"
            />
          </template>
          <VCardTitle>{{ t('monitoreo.paneles.refacturaciones') }}</VCardTitle>
          <VCardSubtitle v-if="p.refacturaciones.value">
            {{ t('monitoreo.paneles.refacturacionesDetalle', { n: n(p.refacturaciones.value.total), l: n(p.refacturaciones.value.por_lectura) }) }}
          </VCardSubtitle>
          <template #append>
            <VBtn
              size="small"
              variant="text"
              class="text-none"
              prepend-icon="tabler-file-spreadsheet"
              :loading="p.exportando.value === 'refacturaciones'"
              :disabled="!p.refacturaciones.value?.total"
              @click="p.exportar('refacturaciones')"
            >
              Excel
            </VBtn>
            <VBtn
              size="small"
              variant="text"
              class="text-none"
              prepend-icon="tabler-report"
              @click="verReporte"
            >
              {{ t('monitoreo.paneles.reporte') }}
            </VBtn>
          </template>
        </VCardItem>
        <VProgressLinear
          v-if="p.cargando.value"
          indeterminate
        />
        <VCardText v-if="p.error.value && !p.datos.value">
          <VAlert
            type="error"
            variant="tonal"
            density="compact"
          >
            {{ p.error.value.mensaje }}
          </VAlert>
        </VCardText>
        <VCardText v-else-if="p.refacturaciones.value">
          <div
            v-if="!p.refacturaciones.value.total"
            class="text-body-2 text-medium-emphasis"
          >
            {{ p.refacturaciones.value.fuente.startsWith('Sin acceso') ? p.refacturaciones.value.fuente : t('monitoreo.paneles.sinRefacturaciones') }}
          </div>
          <VRow
            v-else
            dense
          >
            <VCol
              cols="12"
              md="5"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                {{ t('monitoreo.paneles.porQuien') }}
              </div>
              <div
                v-for="q in p.refacturaciones.value.por_quien.slice(0, 6)"
                :key="q.usuario"
                class="mb-1"
              >
                <div class="d-flex justify-space-between text-body-2">
                  <span class="text-truncate">{{ q.usuario }}</span>
                  <span class="text-no-wrap ms-2">{{ q.n }} · {{ q.pct }} %</span>
                </div>
                <VProgressLinear
                  :model-value="100 * q.n / maxQuien"
                  height="4"
                  rounded
                  color="warning"
                />
              </div>
              <div class="text-caption text-medium-emphasis mt-3 mb-1">
                {{ t('monitoreo.paneles.porMotivo') }}
              </div>
              <div class="d-flex flex-wrap gap-1">
                <VChip
                  v-for="m in p.refacturaciones.value.por_motivo.slice(0, 8)"
                  :key="m.motivo"
                  size="x-small"
                  label
                  variant="tonal"
                >
                  {{ m.motivo }} · {{ m.n }}
                </VChip>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="7"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                {{ t('monitoreo.paneles.ultimas') }}
              </div>
              <VTable density="compact">
                <tbody>
                  <tr
                    v-for="r in p.refacturaciones.value.ultimas.slice(0, 8)"
                    :key="r.id"
                  >
                    <td class="text-caption text-no-wrap">
                      {{ fechaCorta(r.fecha) }} {{ horaCorta(r.fecha) }}
                    </td>
                    <td>
                      <a
                        href="#"
                        class="text-primary text-decoration-none"
                        @click.prevent="emit('lectura', r.contrato_id)"
                      >{{ r.cuenta ?? r.contrato_id }}</a>
                      <div class="text-caption text-medium-emphasis text-truncate paneles__motivo">
                        {{ r.motivo }} · {{ r.quien }}
                      </div>
                    </td>
                    <td class="text-caption text-no-wrap text-end">
                      {{ r.lectura_previa ?? '—' }} → {{ r.lectura_nueva ?? '—' }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCol>
          </VRow>
          <div class="text-caption text-medium-emphasis mt-2">
            {{ t('monitoreo.paneles.definicionRefacturacion') }}
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Tarifa fija -->
    <VCol
      cols="12"
      lg="5"
    >
      <VCard class="h-100">
        <VCardItem>
          <template #prepend>
            <VIcon
              icon="tabler-droplet-dollar"
              color="info"
            />
          </template>
          <VCardTitle>{{ t('monitoreo.paneles.tarifaFija') }}</VCardTitle>
          <VCardSubtitle v-if="p.tarifaFija.value">
            {{ t('monitoreo.paneles.tarifaFijaDetalle', { pct: p.tarifaFija.value.totales.pct ?? '—', f: n(p.tarifaFija.value.totales.tarifa_fija), dia: p.tarifaFija.value.dia_limite }) }}
          </VCardSubtitle>
          <template #append>
            <VBtn
              size="small"
              variant="text"
              class="text-none"
              prepend-icon="tabler-file-spreadsheet"
              :loading="p.exportando.value === 'tarifa-fija'"
              :disabled="!p.tarifaFija.value?.gerencias.length"
              @click="p.exportar('tarifa-fija')"
            >
              Excel
            </VBtn>
          </template>
        </VCardItem>
        <VCardText v-if="p.tarifaFija.value">
          <VTable density="compact">
            <thead>
              <tr>
                <th>{{ t('monitoreo.paneles.gerencia') }}</th>
                <th class="text-end">
                  {{ t('monitoreo.paneles.fija') }}
                </th>
                <th class="text-end">
                  {{ t('monitoreo.paneles.generadas') }}
                </th>
                <th class="text-end">
                  {{ t('monitoreo.paneles.campo') }}
                </th>
                <th class="text-end">
                  {{ t('monitoreo.paneles.faltan') }}
                </th>
                <th>{{ t('monitoreo.paneles.estado') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="g in p.tarifaFija.value.gerencias"
                :key="g.gerencia_id"
              >
                <td>
                  <div>{{ g.gerencia }}</div>
                  <div
                    v-if="g.generadas_desde"
                    class="text-caption text-medium-emphasis"
                  >
                    {{ t('monitoreo.paneles.generadasEl', { fecha: fechaCorta(g.generadas_desde), hora: horaCorta(g.generadas_desde) }) }}
                  </div>
                </td>
                <td class="text-end">
                  {{ n(g.tarifa_fija) }}
                </td>
                <td class="text-end">
                  {{ n(g.generadas) }}
                </td>
                <td class="text-end">
                  {{ n(g.leidas_campo) }}
                </td>
                <td
                  class="text-end"
                  :class="{ 'text-error font-weight-medium': g.faltan > 0 && g.estado === 'faltante' }"
                >
                  {{ n(g.faltan) }}
                </td>
                <td>
                  <VChip
                    size="x-small"
                    label
                    variant="tonal"
                    :color="COLOR_ESTADO[g.estado]"
                  >
                    {{ t(`monitoreo.paneles.estados.${g.estado}`) }}
                  </VChip>
                  <VIcon
                    v-if="g.alerta_r12"
                    icon="tabler-alert-triangle"
                    color="error"
                    size="16"
                    class="ms-1"
                    :title="t('monitoreo.paneles.alertaR12')"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
          <div class="text-caption text-medium-emphasis mt-2">
            {{ p.tarifaFija.value.definicion }}
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.paneles__motivo {
  max-inline-size: 260px;
}
</style>
