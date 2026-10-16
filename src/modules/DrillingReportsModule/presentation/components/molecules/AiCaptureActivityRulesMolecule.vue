<script setup lang="ts">
/**
 * Reglas para clasificar las actividades escritas a mano: si la descripción contiene alguna palabra clave,
 * la actividad es de ese tipo. Se revisan de arriba hacia abajo y gana la primera que coincide.
 */
import { computed } from 'vue'
import type { ActivityRule } from '../../../infrastructure/api/services/AiCaptureSettingsApiService'
import { normalizeKeyword } from '../../composables/useAiCaptureSettings'

const props = defineProps<{ activityTypes: Record<string, string>; disabled?: boolean }>()
const rules = defineModel<ActivityRule[]>({ required: true })

const typeItems = computed(() =>
  Object.entries(props.activityTypes)
    .filter(([code]) => code !== 'other')
    .map(([value, title]) => ({ value, title })))

function setKeywords(index: number, values: string[]) {
  rules.value[index].keywords = [...new Set(values.map(normalizeKeyword).filter(keyword => keyword.length >= 2))]
}

function move(index: number, offset: -1 | 1) {
  const target = index + offset
  if (target < 0 || target >= rules.value.length)
    return
  const [rule] = rules.value.splice(index, 1)

  rules.value.splice(target, 0, rule)
}

function addRule() {
  rules.value.push({ activity_type: '', keywords: [] })
}
</script>

<template>
  <div class="d-flex flex-column gap-3">
    <p class="text-body-2 text-medium-emphasis mb-0">
      Se revisan de arriba hacia abajo: gana la primera regla cuya palabra clave aparezca en la descripción.
      Usa partes de palabra para cubrir variantes: "traslad" cubre "traslado" y "trasladando".
      Si ninguna aplica, se usa el tipo que sugiera la IA al leer la hoja, y si no, "Otros"; en ambos casos queda marcado para revisión.
    </p>

    <div
      v-for="(rule, index) in rules"
      :key="index"
      class="d-flex align-start gap-2"
    >
      <div class="d-flex flex-column">
        <VBtn
          icon="tabler-chevron-up"
          size="x-small"
          variant="text"
          :disabled="props.disabled || index === 0"
          aria-label="Subir prioridad"
          @click="move(index, -1)"
        />
        <VBtn
          icon="tabler-chevron-down"
          size="x-small"
          variant="text"
          :disabled="props.disabled || index === rules.length - 1"
          aria-label="Bajar prioridad"
          @click="move(index, 1)"
        />
      </div>
      <VAutocomplete
        v-model="rule.activity_type"
        :items="typeItems"
        label="Tipo de actividad"
        density="compact"
        style="max-inline-size: 260px; min-inline-size: 200px;"
        :disabled="props.disabled"
        :error="!rule.activity_type"
      />
      <VCombobox
        :model-value="rule.keywords"
        label="Palabras clave"
        density="compact"
        multiple
        chips
        closable-chips
        :disabled="props.disabled"
        :error="!rule.keywords.length"
        @update:model-value="setKeywords(index, $event)"
      />
      <VBtn
        icon="tabler-trash"
        size="small"
        variant="text"
        color="error"
        :disabled="props.disabled"
        aria-label="Quitar regla"
        @click="rules.splice(index, 1)"
      />
    </div>

    <div>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-plus"
        :disabled="props.disabled"
        @click="addRule"
      >
        Agregar regla
      </VBtn>
    </div>
  </div>
</template>
