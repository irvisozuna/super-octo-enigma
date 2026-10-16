<script setup lang="ts">
/**
 * Configuración de la captura con IA de la empresa (sin projectId) o de un proyecto: turnos y reglas de actividades.
 * Incluye "Probar" para ver cómo se interpretaría una hoja antes de guardar, y las correcciones hechas en la revisión.
 */
import { computed, onMounted, ref } from 'vue'
import { useAiCaptureSettings } from '../../../composables/useAiCaptureSettings'
import AiCaptureShiftSettingsMolecule from '../../molecules/AiCaptureShiftSettingsMolecule.vue'
import AiCaptureActivityRulesMolecule from '../../molecules/AiCaptureActivityRulesMolecule.vue'

const props = defineProps<{ projectId?: string | null }>()
const emit = defineEmits<{ saved: [] }>()

const settings = useAiCaptureSettings(() => props.projectId)
const tab = ref<'shifts' | 'activities' | 'test'>('shifts')
const testDescription = ref('')
const testShift = ref('')
const testTimes = ref('')

const SHIFT_SOURCE = { hours: 'por las horas de 24 h', label: 'por la etiqueta', default: 'no reconocido: se pondría Día y se avisa' }
const scopeLabel = computed(() => (settings.isProject.value ? 'la empresa' : 'fábrica'))
const rulesInvalid = computed(() => settings.rules.value.some(rule => !rule.activity_type || !rule.keywords.length))
const canSave = computed(() => settings.canConfigure.value && settings.dirty.value && !rulesInvalid.value)

onMounted(settings.load)

async function handleSave() {
  await settings.save()
  if (!settings.error.value)
    emit('saved')
}

function handleTest() {
  settings.test({
    description: testDescription.value,
    writtenShift: testShift.value,
    times: testTimes.value.split(/[\s,]+/).filter(Boolean),
  })
}
</script>

<template>
  <VCard
    :loading="settings.loading.value"
    flat
  >
    <VAlert
      v-if="settings.response.value && !settings.canConfigure.value"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Solo un administrador puede cambiar esta configuración. Puedes consultarla y usar "Probar".
    </VAlert>
    <VAlert
      v-if="settings.error.value"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
    >
      {{ settings.error.value }}
    </VAlert>

    <VTabs
      v-model="tab"
      class="mb-4"
    >
      <VTab
        value="shifts"
        prepend-icon="tabler-sun-moon"
      >
        Turnos
      </VTab>
      <VTab
        value="activities"
        prepend-icon="tabler-list-check"
      >
        Actividades
      </VTab>
      <VTab
        value="test"
        prepend-icon="tabler-flask"
      >
        Probar
      </VTab>
    </VTabs>

    <VWindow
      v-if="settings.shifts.value"
      v-model="tab"
    >
      <VWindowItem value="shifts">
        <VSwitch
          v-if="settings.isProject.value"
          :model-value="settings.customShifts.value"
          label="Personalizar para este proyecto"
          :hint="settings.customShifts.value ? '' : 'Usa la configuración de la empresa'"
          persistent-hint
          class="mb-4"
          :disabled="!settings.canConfigure.value"
          @update:model-value="settings.setCustom('shifts', !!$event)"
        />
        <AiCaptureShiftSettingsMolecule
          v-model="settings.shifts.value"
          :disabled="!settings.canConfigure.value || !settings.customShifts.value"
        />
      </VWindowItem>

      <VWindowItem value="activities">
        <VSwitch
          v-if="settings.isProject.value"
          :model-value="settings.customRules.value"
          label="Personalizar para este proyecto"
          :hint="settings.customRules.value ? '' : 'Usa la configuración de la empresa'"
          persistent-hint
          class="mb-4"
          :disabled="!settings.canConfigure.value"
          @update:model-value="settings.setCustom('rules', !!$event)"
        />
        <AiCaptureActivityRulesMolecule
          v-model="settings.rules.value"
          :activity-types="settings.activityTypes.value"
          :disabled="!settings.canConfigure.value || !settings.customRules.value"
        />

        <VCard
          v-if="settings.suggestions.value.length"
          variant="tonal"
          color="info"
          class="mt-6 pa-4"
        >
          <h6 class="text-h6 mb-1">
            Correcciones hechas en la revisión
          </h6>
          <p class="text-body-2 mb-3">
            Actividades a las que alguien les cambió el tipo después de la captura. Agregar la regla evita corregirlas de nuevo.
          </p>
          <div
            v-for="item in settings.suggestions.value.slice(0, 15)"
            :key="`${item.chosen_type}-${item.description}`"
            class="d-flex align-center gap-2 py-1"
          >
            <span class="text-body-2 flex-grow-1">
              "{{ item.description }}" → <strong>{{ item.chosen_label }}</strong>
              <span class="text-medium-emphasis">(antes {{ settings.activityTypes.value[item.mapped_type] ?? item.mapped_type }}, {{ item.count }} {{ item.count === 1 ? 'vez' : 'veces' }})</span>
            </span>
            <VBtn
              size="small"
              variant="text"
              prepend-icon="tabler-plus"
              :disabled="!settings.canConfigure.value"
              @click="settings.addKeyword(item.chosen_type, item.description)"
            >
              Agregar regla
            </VBtn>
          </div>
        </VCard>
      </VWindowItem>

      <VWindowItem value="test">
        <p class="text-body-2 text-medium-emphasis">
          Prueba la configuración tal como está en pantalla, aunque aún no la guardes.
        </p>
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="testDescription"
              label="Descripción de una actividad"
              placeholder="Se checa máquina y generador"
            />
          </VCol>
          <VCol
            cols="12"
            sm="4"
          >
            <VTextField
              v-model="testShift"
              label="Turno escrito"
              placeholder="A, 1, Noche…"
            />
          </VCol>
          <VCol
            cols="12"
            sm="8"
          >
            <VTextField
              v-model="testTimes"
              label="Horas escritas (opcional)"
              placeholder="7:00, 9:30, 19:00"
            />
          </VCol>
        </VRow>
        <VBtn
          prepend-icon="tabler-player-play"
          :loading="settings.loading.value"
          @click="handleTest"
        >
          Probar
        </VBtn>

        <VList
          v-if="settings.preview.value"
          class="mt-4"
          density="compact"
        >
          <VListItem prepend-icon="tabler-sun-moon">
            Turno: <strong>{{ settings.preview.value.shift.shift === 'night' ? 'Noche' : 'Día' }}</strong>
            ({{ SHIFT_SOURCE[settings.preview.value.shift.source] }})
          </VListItem>
          <VListItem
            v-if="settings.preview.value.activity"
            prepend-icon="tabler-list-check"
          >
            <template v-if="settings.preview.value.activity.source === 'rule'">
              Actividad: <strong>{{ settings.preview.value.activity.label }}</strong> (por la palabra "{{ settings.preview.value.activity.keyword }}")
            </template>
            <template v-else>
              Ninguna regla aplica: se usará el tipo que sugiera la IA al leer la hoja, o "Otros".
            </template>
          </VListItem>
        </VList>
      </VWindowItem>
    </VWindow>

    <VCardActions
      v-if="tab !== 'test'"
      class="px-0 pt-6"
    >
      <VBtn
        variant="text"
        color="secondary"
        prepend-icon="tabler-restore"
        :disabled="!settings.canConfigure.value || !settings.response.value?.stored"
        :loading="settings.saving.value"
        @click="settings.reset"
      >
        Volver a lo de {{ scopeLabel }}
      </VBtn>
      <VSpacer />
      <VBtn
        color="primary"
        variant="elevated"
        prepend-icon="tabler-device-floppy"
        :disabled="!canSave"
        :loading="settings.saving.value"
        @click="handleSave"
      >
        Guardar
      </VBtn>
    </VCardActions>
  </VCard>
</template>
