<script setup lang="ts">
import { computed } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import { REPORT_VALIDATION_RULES, SHIFT_OPTIONS } from '../../../shared/constants'

interface Props {
  projectName: string
  wellName: string
  equipmentOptions: any[]
  loadingEquipment: boolean
  /** Pozos a los que puede ir el reporte; sin lista, el pozo solo se muestra */
  wellOptions?: Array<{ title: string; value: string }>
  wellId?: string
  /** Un reporte ya enviado o aprobado no cambia de pozo */
  wellLocked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  wellOptions: () => [],
  wellId: '',
  wellLocked: false,
})

const emit = defineEmits<{
  'update:wellId': [value: string]
}>()

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES
const shiftOptions = SHIFT_OPTIONS

// Local computed for form data
const formData = computed(() => wizardStore.formData)

// Handlers
const handleDateChange = (value: string) => {
  wizardStore.updateFormData({ report_date: value })
}

const handleShiftChange = (value: string) => {
  wizardStore.updateFormData({ shift: value })
  wizardStore.handleShiftChange()
}

const handleEquipmentChange = (value: string | null) => {
  wizardStore.updateFormData({ equipment_id: value })
}
</script>

<template>
  <div class="pa-6">
    <div class="mb-4">
      <h3 class="text-h6 mb-2">
        Información Básica del Reporte
      </h3>
      <p class="text-body-2 text-medium-emphasis">
        Configura los datos principales del reporte de perforación
      </p>
    </div>

    <VForm>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="projectName"
            label="Proyecto"
            prepend-inner-icon="tabler-folder"
            readonly
            variant="filled"
          />
        </VCol>

        <VCol
          cols="12"
          md="6"
        >
          <VSelect
            v-if="wellOptions.length"
            :model-value="wellId"
            :items="wellOptions"
            label="Pozo *"
            prepend-inner-icon="tabler-droplet"
            :rules="[(v: string) => !!v || 'Elige el pozo del reporte']"
            :disabled="wellLocked"
            :hint="wellLocked ? 'Solo un borrador puede cambiar de pozo' : 'El pozo que dice la hoja'"
            persistent-hint
            @update:model-value="(v: string) => emit('update:wellId', v)"
          />
          <VTextField
            v-else
            :model-value="wellName"
            label="Pozo"
            prepend-inner-icon="tabler-droplet"
            readonly
            variant="filled"
          />
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VTextField
            :model-value="formData.report_date"
            label="Fecha del Reporte *"
            type="date"
            prepend-inner-icon="tabler-calendar"
            :rules="[rules.required, rules.dateNotFuture]"
            required
            @update:model-value="handleDateChange"
          />
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VSelect
            :model-value="formData.shift"
            label="Turno *"
            :items="shiftOptions"
            prepend-inner-icon="tabler-clock"
            :rules="[rules.required]"
            required
            @update:model-value="handleShiftChange"
          />
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VSelect
            :model-value="formData.equipment_id"
            label="Equipo"
            :items="equipmentOptions"
            :loading="loadingEquipment"
            prepend-inner-icon="tabler-tool"
            clearable
            @update:model-value="handleEquipmentChange"
          />
        </VCol>

        <VCol cols="12">
          <VAlert
            type="info"
            variant="tonal"
            density="compact"
          >
            <template #prepend>
              <VIcon icon="tabler-bulb" />
            </template>
            El turno seleccionado se aplicará automáticamente a todas las actividades, consumos y herramientas.
          </VAlert>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>
