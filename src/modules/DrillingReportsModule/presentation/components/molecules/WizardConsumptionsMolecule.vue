<script setup lang="ts">
import { computed } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import {
  CONSUMABLE_TYPES,
  REPORT_VALIDATION_RULES,
  UNIT_OPTIONS,
} from '../../../shared/constants'

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// Computed
const formData = computed(() => wizardStore.formData)

const availableShiftOptions = computed(() => {
  return wizardStore.availableShiftOptions
})

// Options
const consumableTypeOptions = CONSUMABLE_TYPES
const unitOptions = UNIT_OPTIONS

// Handlers
const addConsumption = () => wizardStore.addConsumption()

const addConsumptionQuick = (type: string, unit: string) => {
  wizardStore.addConsumption({
    consumable_type: type,
    unit,
  })
}

const removeConsumption = (index: number) => wizardStore.removeConsumption(index)

const updateConsumption = (index: number, field: string, value: any) => {
  wizardStore.updateConsumption(index, { [field]: value })
}
</script>

<template>
  <div class="pa-6">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 mb-2">
          Consumos de Materiales
        </h3>
        <p class="text-body-2 text-medium-emphasis">
          Registra los materiales consumidos durante el turno
        </p>
      </div>
      <VBtn
        color="info"
        prepend-icon="tabler-plus"
        @click="addConsumption"
      >
        Agregar
      </VBtn>
    </div>

    <!-- Quick Add Common Consumables -->
    <div class="mb-4">
      <p class="text-caption text-medium-emphasis mb-2">
        Materiales Comunes:
      </p>
      <div class="d-flex flex-wrap gap-2">
        <VBtn
          size="small"
          variant="outlined"
          @click="addConsumptionQuick('bentonite', 'bags')"
        >
          <VIcon
            icon="tabler-droplet"
            start
            size="16"
          />
          Bentonita (sacos)
        </VBtn>
        <VBtn
          size="small"
          variant="outlined"
          @click="addConsumptionQuick('water', 'liters')"
        >
          <VIcon
            icon="tabler-droplet-filled"
            start
            size="16"
          />
          Agua (litros)
        </VBtn>
        <VBtn
          size="small"
          variant="outlined"
          @click="addConsumptionQuick('cement', 'bags')"
        >
          <VIcon
            icon="tabler-building"
            start
            size="16"
          />
          Cemento (sacos)
        </VBtn>
      </div>
    </div>

    <!-- Consumptions List -->
    <VRow>
      <VCol
        v-for="(consumption, index) in formData.consumptions"
        :key="index"
        cols="12"
        md="6"
      >
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between bg-info-lighten-5">
            <span class="text-body-1">Material {{ index + 1 }}</span>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click="removeConsumption(index)"
            />
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="12">
                <VSelect
                  :model-value="consumption.consumable_type"
                  label="Material *"
                  :items="consumableTypeOptions"
                  :rules="[rules.required]"
                  prepend-inner-icon="tabler-droplet"
                  @update:model-value="(v) => updateConsumption(index, 'consumable_type', v)"
                />
              </VCol>

              <VCol cols="6">
                <VTextField
                  :model-value="consumption.quantity"
                  label="Cantidad *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  :rules="[rules.required, rules.positiveNumber]"
                  prepend-inner-icon="tabler-123"
                  @update:model-value="(v) => updateConsumption(index, 'quantity', Number(v))"
                />
              </VCol>

              <VCol cols="6">
                <VSelect
                  :model-value="consumption.unit"
                  label="Unidad *"
                  :items="unitOptions"
                  :rules="[rules.required]"
                  prepend-inner-icon="tabler-ruler"
                  @update:model-value="(v) => updateConsumption(index, 'unit', v)"
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  :model-value="consumption.shift"
                  label="Turno *"
                  :items="availableShiftOptions"
                  :rules="[rules.required]"
                  prepend-inner-icon="tabler-clock"
                  @update:model-value="(v) => updateConsumption(index, 'shift', v)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Empty State -->
      <VCol
        v-if="formData.consumptions.length === 0"
        cols="12"
      >
        <VCard
          variant="outlined"
          class="text-center pa-8"
        >
          <VIcon
            icon="tabler-droplet-off"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <p class="text-body-2 text-medium-emphasis mb-4">
            No hay consumos registrados. Puedes omitir este paso si no hubo consumos.
          </p>
          <VBtn
            color="info"
            prepend-icon="tabler-plus"
            @click="addConsumption"
          >
            Agregar Consumo
          </VBtn>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
