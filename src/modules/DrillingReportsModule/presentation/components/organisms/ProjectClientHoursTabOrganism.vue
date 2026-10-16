<script setup lang="ts">
/**
 * Horas a cargo del cliente del proyecto (prefactura de stand-by): por periodo, con la evidencia de cada
 * renglón (reporte y folio de la hoja), totales por tipo y por pozo, y descarga en Excel.
 */
import { computed, onMounted, ref } from 'vue'
import type { ClientHours } from '../../../infrastructure/api/services/ClientHoursApiService'
import { ClientHoursApiService } from '../../../infrastructure/api/services/ClientHoursApiService'
import { formatDate } from '../../../shared/utils/dateUtils'

const props = defineProps<{ projectId: string; projectName?: string }>()
const emit = defineEmits<{ review: [report: { id: string; well_id: string }] }>()

const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const from = ref(iso(new Date(today.getFullYear(), today.getMonth(), 1)))
const to = ref(iso(today))
const includePending = ref(false)
const data = ref<ClientHours | null>(null)
const loading = ref(false)
const exporting = ref(false)
const error = ref<string | null>(null)

const SHIFTS = { day: 'Día', night: 'Noche', mixed: 'Mixto' }
const STATUSES = { approved: { label: 'Aprobado', color: 'success' }, pending_approval: { label: 'Pendiente', color: 'info' }, draft: { label: 'Borrador', color: 'secondary' } }
const filters = computed(() => ({ projectId: props.projectId, from: from.value, to: to.value, includePending: includePending.value }))

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await ClientHoursApiService.get(filters.value)
  }
  catch (err: any) {
    error.value = err?.status === 403 ? 'Solo un administrador puede ver las horas a cobrar.' : (err?.message || 'No se pudo cargar')
  }
  finally {
    loading.value = false
  }
}

async function download() {
  exporting.value = true
  try {
    await ClientHoursApiService.export(filters.value, `horas-cliente_${props.projectName ?? 'proyecto'}_${from.value}_${to.value}.xlsx`)
  }
  catch (err: any) {
    error.value = err?.message || 'No se pudo descargar'
  }
  finally {
    exporting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h6 class="text-h6 mb-1">
          Horas a cargo del cliente
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Lo anotado en la columna CLIENTE de las hojas: base para cobrar stand-by y esperas, con su evidencia.
        </p>
      </div>
      <VBtn
        prepend-icon="tabler-file-spreadsheet"
        :loading="exporting"
        :disabled="!data?.rows.length"
        @click="download"
      >
        Descargar Excel
      </VBtn>
    </div>

    <div class="d-flex flex-wrap align-center gap-4 mb-4">
      <VTextField
        v-model="from"
        type="date"
        label="Desde"
        hide-details
        style="max-inline-size: 180px;"
        @update:model-value="load"
      />
      <VTextField
        v-model="to"
        type="date"
        label="Hasta"
        hide-details
        style="max-inline-size: 180px;"
        @update:model-value="load"
      />
      <VSwitch
        v-model="includePending"
        label="Incluir reportes sin aprobar"
        hide-details
        @update:model-value="load"
      />
    </div>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <template v-if="data">
      <VRow class="mb-2">
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="tonal"
            color="primary"
            class="pa-4"
          >
            <p class="text-caption mb-1">
              Horas a cobrar
            </p>
            <p class="text-h4 mb-0">
              {{ data.totals.hours }} h
            </p>
            <p
              v-if="!includePending && data.totals.pending_hours"
              class="text-caption mb-0"
            >
              + {{ data.totals.pending_hours }} h en reportes sin aprobar
            </p>
          </VCard>
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="outlined"
            class="pa-4"
          >
            <p class="text-caption mb-2">
              Por tipo
            </p>
            <div
              v-for="group in data.totals.by_type"
              :key="group.key"
              class="d-flex justify-space-between text-body-2"
            >
              <span>{{ group.label }}</span><strong>{{ group.hours }} h</strong>
            </div>
            <p
              v-if="!data.totals.by_type.length"
              class="text-body-2 text-medium-emphasis mb-0"
            >
              —
            </p>
          </VCard>
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            variant="outlined"
            class="pa-4"
          >
            <p class="text-caption mb-2">
              Por pozo
            </p>
            <div
              v-for="group in data.totals.by_well"
              :key="group.key"
              class="d-flex justify-space-between text-body-2"
            >
              <span>{{ group.label }}</span><strong>{{ group.hours }} h</strong>
            </div>
            <p
              v-if="!data.totals.by_well.length"
              class="text-body-2 text-medium-emphasis mb-0"
            >
              —
            </p>
          </VCard>
        </VCol>
      </VRow>

      <VTable
        v-if="data.rows.length"
        density="compact"
      >
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Pozo</th>
            <th>Actividad</th>
            <th>Horario</th>
            <th class="text-end">
              Horas
            </th>
            <th>Evidencia</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in data.rows"
            :key="index"
          >
            <td class="text-no-wrap">
              {{ formatDate(row.report_date) }} · {{ SHIFTS[row.shift] }}
            </td>
            <td>{{ row.well_number ?? '—' }}</td>
            <td>
              <strong>{{ row.activity_label }}</strong>
              <div
                v-if="row.description"
                class="text-caption text-medium-emphasis"
              >
                {{ row.description }}
              </div>
            </td>
            <td class="text-no-wrap">
              {{ row.start_time ?? '' }}{{ row.end_time ? ` – ${row.end_time}` : '' }}
            </td>
            <td class="text-end">
              {{ row.hours_client }}
            </td>
            <td class="text-no-wrap">
              <a
                href="#"
                @click.prevent="emit('review', { id: row.report_id, well_id: row.well_id })"
              >{{ row.report_number }}</a>
              <span
                v-if="row.folio"
                class="text-caption text-medium-emphasis"
              > · folio {{ row.folio }}</span>
              <VIcon
                v-if="row.ai_import_id"
                icon="tabler-camera"
                size="14"
                class="ms-1"
              />
              <VChip
                v-if="row.status !== 'approved'"
                size="x-small"
                :color="STATUSES[row.status].color"
                class="ms-1"
              >
                {{ STATUSES[row.status].label }}
              </VChip>
            </td>
          </tr>
        </tbody>
      </VTable>
      <p
        v-else-if="!loading"
        class="text-body-2 text-medium-emphasis"
      >
        No hay horas a cargo del cliente en este periodo.
      </p>
    </template>
  </div>
</template>
