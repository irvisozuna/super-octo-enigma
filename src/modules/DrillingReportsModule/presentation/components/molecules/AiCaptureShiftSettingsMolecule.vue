<script setup lang="ts">
/**
 * Turnos de la captura con IA: a qué hora empieza el turno de día y qué escriben en la casilla "Turno"
 * para cada uno (A, 1, D, Noche…). El turno de noche empieza 12 horas después del de día.
 */
import { computed } from 'vue'
import type { ShiftSettings } from '../../../infrastructure/api/services/AiCaptureSettingsApiService'
import { normalizeKeyword } from '../../composables/useAiCaptureSettings'

const props = defineProps<{ disabled?: boolean }>()
const shifts = defineModel<ShiftSettings>({ required: true })

const nightStart = computed(() => {
  const [hours, minutes] = (shifts.value.day_start || '07:00').split(':').map(Number)

  return `${String((hours + 12) % 24).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`
})

const overlap = computed(() => shifts.value.labels.day.filter(label => shifts.value.labels.night.includes(label)))

function setLabels(shift: 'day' | 'night', values: string[]) {
  shifts.value.labels[shift] = [...new Set(values.map(normalizeKeyword).filter(Boolean))]
}
</script>

<template>
  <div class="d-flex flex-column gap-4">
    <VRow>
      <VCol
        cols="12"
        sm="5"
      >
        <VTextField
          v-model="shifts.day_start"
          type="time"
          label="Inicio del turno de día"
          :disabled="props.disabled"
        />
      </VCol>
      <VCol
        cols="12"
        sm="7"
        class="d-flex align-center text-body-2 text-medium-emphasis"
      >
        Día: {{ shifts.day_start }} a {{ nightStart }} · Noche: {{ nightStart }} a {{ shifts.day_start }}
      </VCol>
    </VRow>

    <VCombobox
      :model-value="shifts.labels.day"
      label="En la hoja significa Día"
      hint="Lo que escriben en la casilla Turno. Escribe y presiona Enter: A, 1, D, Día…"
      persistent-hint
      multiple
      chips
      closable-chips
      :disabled="props.disabled"
      @update:model-value="setLabels('day', $event)"
    />
    <VCombobox
      :model-value="shifts.labels.night"
      label="En la hoja significa Noche"
      hint="Por ejemplo B, 2, N, Noche…"
      persistent-hint
      multiple
      chips
      closable-chips
      :disabled="props.disabled"
      @update:model-value="setLabels('night', $event)"
    />

    <VAlert
      v-if="overlap.length"
      type="error"
      variant="tonal"
      density="compact"
    >
      "{{ overlap.join('", "') }}" no puede significar día y noche a la vez.
    </VAlert>
    <VAlert
      type="info"
      variant="tonal"
      density="compact"
    >
      Si la hoja trae horas en formato de 24 h (por ejemplo 19:00), el turno se deduce de esas horas aunque la casilla diga otra cosa, y se marca para revisión.
      Si la casilla trae algo que no está en estas listas, se pone Día y se avisa.
    </VAlert>
  </div>
</template>
