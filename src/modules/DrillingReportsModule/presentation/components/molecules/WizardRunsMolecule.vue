<script setup lang="ts">
/**
 * Corridas del reporte: los renglones de la tabla PERFORACIÓN de la hoja (desde, hasta, metros, recuperación, roca).
 * Son opcionales; la captura con IA las llena sola a partir de la foto.
 */
import { computed } from 'vue'
import type { ReportRun } from '../../stores/reportWizardStore'
import { useReportWizardStore } from '../../stores/reportWizardStore'

const wizardStore = useReportWizardStore()
const runs = computed(() => wizardStore.formData.runs ?? [])

const toNumber = (value: string | number | null) => (value === '' || value === null ? null : Number(value))

const totals = computed(() => ({
  drilled: runs.value.reduce((sum, run) => sum + (run.meters_drilled ?? 0), 0),
  recovered: runs.value.reduce((sum, run) => sum + (run.meters_recovered ?? 0), 0),
}))

const recovery = (run: ReportRun) =>
  run.meters_drilled && run.meters_recovered !== null ? Math.round(run.meters_recovered / run.meters_drilled * 1000) / 10 : null

const isInvalid = (run: ReportRun) => run.depth_from === null || run.depth_to === null || run.depth_to < run.depth_from

/** Al capturar "hasta", se propone metros = hasta − desde si aún no se escribieron. */
function updateDepthTo(index: number, value: string | number | null) {
  const run = runs.value[index]
  const depthTo = toNumber(value)
  const changes: Partial<ReportRun> = { depth_to: depthTo }
  if (run.meters_drilled === null && depthTo !== null && run.depth_from !== null && depthTo >= run.depth_from)
    changes.meters_drilled = Math.round((depthTo - run.depth_from) * 100) / 100
  wizardStore.updateRun(index, changes)
}
</script>

<template>
  <div class="pa-6 pt-0">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 mb-2">
          Corridas (tabla Perforación)
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Tramos perforados con su recuperación de núcleo. Opcional.
        </p>
      </div>
      <VBtn
        color="info"
        prepend-icon="tabler-plus"
        @click="wizardStore.addRun()"
      >
        Agregar corrida
      </VBtn>
    </div>

    <VTable
      v-if="runs.length"
      density="compact"
      class="border rounded"
    >
      <thead>
        <tr>
          <th>Desde (m)</th>
          <th>Hasta (m)</th>
          <th>Metros</th>
          <th>Recuperación (m)</th>
          <th>%</th>
          <th>Tipo de roca</th>
          <th>Dureza</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(run, index) in runs"
          :key="index"
        >
          <td>
            <VTextField
              :model-value="run.depth_from"
              type="number"
              density="compact"
              hide-details
              :error="isInvalid(run)"
              aria-label="Desde"
              @update:model-value="wizardStore.updateRun(index, { depth_from: toNumber($event) })"
            />
          </td>
          <td>
            <VTextField
              :model-value="run.depth_to"
              type="number"
              density="compact"
              hide-details
              :error="isInvalid(run)"
              aria-label="Hasta"
              @update:model-value="updateDepthTo(index, $event)"
            />
          </td>
          <td>
            <VTextField
              :model-value="run.meters_drilled"
              type="number"
              density="compact"
              hide-details
              aria-label="Metros perforados"
              @update:model-value="wizardStore.updateRun(index, { meters_drilled: toNumber($event) })"
            />
          </td>
          <td>
            <VTextField
              :model-value="run.meters_recovered"
              type="number"
              density="compact"
              hide-details
              aria-label="Metros recuperados"
              @update:model-value="wizardStore.updateRun(index, { meters_recovered: toNumber($event) })"
            />
          </td>
          <td class="text-no-wrap">
            {{ recovery(run) ?? '—' }}
          </td>
          <td>
            <VTextField
              :model-value="run.rock_type"
              density="compact"
              hide-details
              aria-label="Tipo de roca"
              @update:model-value="wizardStore.updateRun(index, { rock_type: $event || null })"
            />
          </td>
          <td>
            <VTextField
              :model-value="run.hardness"
              density="compact"
              hide-details
              aria-label="Dureza"
              @update:model-value="wizardStore.updateRun(index, { hardness: $event || null })"
            />
          </td>
          <td>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              aria-label="Quitar corrida"
              @click="wizardStore.removeRun(index)"
            />
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td
            colspan="2"
            class="text-medium-emphasis"
          >
            Total
          </td>
          <td>{{ totals.drilled.toFixed(2) }}</td>
          <td>{{ totals.recovered.toFixed(2) }}</td>
          <td colspan="4" />
        </tr>
      </tfoot>
    </VTable>
    <p
      v-else
      class="text-body-2 text-medium-emphasis"
    >
      Sin corridas registradas.
    </p>
  </div>
</template>
