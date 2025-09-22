<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TransportModuleConfig } from '../../../../config/config'
import { generateCodeFromPattern } from '../../../../shared/utils'

// Props
interface Props {
  modelValue: {
    number: string
    modality: string
    status?: string
  }
  validValues: {
    modalities: Record<string, string>
    statuses?: Record<string, string>
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: { number: string; modality: string; status?: string }]
  validate: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()

// State
const defaultAutoMode = TransportModuleConfig.numbering?.concession?.defaultMode === 'auto'
const allowManual = TransportModuleConfig.numbering?.concession?.allowManual !== false
const autoNumber = ref<boolean>(defaultAutoMode)

const localData = ref({
  number: props.modelValue.number,
  modality: props.modelValue.modality,
  status: 'PENDING', // Always PENDING for new concessions
})

// Computed
const modalityOptions = computed(() => {
  return Object.entries(props.validValues.modalities || {}).map(([value, label]) => ({
    title: label,
    value,
  }))
})

// Status is always PENDING, no options needed

const isValid = computed(() => {
  return !!(localData.value.number?.trim() && localData.value.modality)
})

// Methods
const generateConcessionNumber = () => {
  const pattern = TransportModuleConfig.numbering?.concession?.pattern || 'CON-{YYYY}{MM}{DD}-{TS6}'

  localData.value.number = generateCodeFromPattern(pattern)
}

// Watchers
watch(localData, newValue => {
  emit('update:modelValue', newValue)
}, { deep: true })

watch(isValid, newValue => {
  emit('validate', newValue)
}, { immediate: true })

// Initialize with generated number if empty and auto mode
if (autoNumber.value && !localData.value.number)
  generateConcessionNumber()

// Toggle behavior: when switching to auto, (re)generate a number
watch(autoNumber, isAuto => {
  if (isAuto)
    generateConcessionNumber()
})
</script>

<template>
  <div class="concession-basic-info-step">
    <!-- Header -->
    <div class="mb-4">
      <h2 class="text-h6 mb-1 d-flex align-center">
        <VIcon
          icon="tabler-info-circle"
          size="18"
          class="me-2"
          color="primary"
        />
        Información Básica
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Datos generales de identificación
      </p>
    </div>

    <!-- Form -->
    <VRow>
      <!-- Concession Number -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          variant="outlined"
          class="mb-3"
        >
          <VCardTitle class="text-subtitle-1 pa-3 pb-1">
            <VIcon
              icon="tabler-certificate"
              size="16"
              class="me-2"
            />
            Número de Concesión
          </VCardTitle>
          <VCardText class="pt-1 pb-3">
            <div
              v-if="allowManual"
              class="d-flex align-center justify-space-between mb-2"
            >
              <div class="text-body-2 text-medium-emphasis">
                Modo de número
              </div>
              <VSwitch
                v-model="autoNumber"
                inset
                color="primary"
                :label="autoNumber ? 'Automático' : 'Manual'"
                hide-details
                density="compact"
              />
            </div>
            <VTextField
              v-model="localData.number"
              label="Número de Concesión *"
              :rules="[v => !!v || 'El número es requerido']"
              required
              :readonly="autoNumber || !allowManual"
              prepend-inner-icon="tabler-certificate"
              variant="outlined"
              color="primary"
              :hint="(autoNumber || !allowManual) ? 'Número único generado automáticamente' : 'Puedes capturar el número manualmente'"
              persistent-hint
            >
              <template #append-inner>
                <template v-if="autoNumber || !allowManual">
                  <VTooltip text="Regenerar número">
                    <template #activator="{ props: tooltipProps }">
                      <VBtn
                        v-bind="tooltipProps"
                        icon="tabler-refresh"
                        variant="text"
                        size="small"
                        @click="generateConcessionNumber"
                      />
                    </template>
                  </VTooltip>
                </template>
              </template>
            </VTextField>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Modality -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          variant="outlined"
          class="mb-3"
        >
          <VCardTitle class="text-subtitle-1 pa-3 pb-1">
            <VIcon
              icon="tabler-car"
              size="16"
              class="me-2"
            />
            Modalidad de Transporte
          </VCardTitle>
          <VCardText class="pt-1 pb-3">
            <VSelect
              v-model="localData.modality"
              label="Modalidad *"
              :items="modalityOptions"
              :rules="[v => !!v || 'La modalidad es requerida']"
              required
              prepend-inner-icon="tabler-car"
              variant="outlined"
              hint="Tipo de servicio de transporte"
              persistent-hint
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Status - Auto-set to PENDING -->
      <VCol cols="12">
        <VAlert
          type="info"
          variant="tonal"
          class="mb-3"
          density="compact"
        >
          <VAlertTitle>
            <VIcon
              icon="tabler-clock"
              size="20"
              class="me-2"
            />
            Estado Inicial
          </VAlertTitle>
          La concesión se creará en estado <strong>PENDIENTE</strong> y será activada después de la verificación correspondiente.
        </VAlert>
      </VCol>
    </VRow>

    <!-- Preview Section -->
    <VCard
      v-if="isValid"
      variant="outlined"
      color="success"
      class="mb-4"
    >
      <VCardTitle class="text-subtitle-1 pa-3 pb-1 text-success">
        <VIcon
          icon="tabler-check-circle"
          size="16"
          class="me-2"
        />
        Vista Previa
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-medium-emphasis">
              Número
            </div>
            <div class="text-h6">
              {{ localData.number }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-medium-emphasis">
              Modalidad
            </div>
            <div class="text-h6">
              {{ modalityOptions.find(m => m.value === localData.modality)?.title || localData.modality }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-medium-emphasis">
              Estado
            </div>
            <VChip
              color="warning"
              size="small"
            >
              Pendiente
            </VChip>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Validation Status -->
    <VAlert
      v-if="!isValid"
      type="warning"
      variant="tonal"
      class="mb-3"
      density="compact"
    >
      <VAlertTitle>Información Incompleta</VAlertTitle>
      Completa todos los campos requeridos para continuar.
    </VAlert>

    <VAlert
      v-else
      type="success"
      variant="tonal"
      class="mb-3"
      density="compact"
    >
      <VAlertTitle>¡Información Completa!</VAlertTitle>
      Los datos básicos están correctos. Puedes continuar al siguiente paso.
    </VAlert>
  </div>
</template>

<style scoped>
.concession-basic-info-step {
  max-inline-size: 1000px;
}
</style>
