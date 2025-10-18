<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { DrillingReportApiService } from '../../../infrastructure/api/services/DrillingReportApiService'

export interface AssignWellDialogProps {
  modelValue: boolean
  projectId: string
  loading?: boolean
}

const props = withDefaults(defineProps<AssignWellDialogProps>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'assign': [wellId: string, notes?: string]
  'create': [data: any] // includes project_id for single-call creation + assignment
}>()

const assignFormRef = ref()
const createFormRef = ref()
const mode = ref<'assign' | 'create'>('assign')

const availableWells = ref<any[]>([])
const loadingWells = ref(false)

const localDialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isCreatingNew = computed(() => mode.value === 'create')

const assignData = ref({
  well_id: null as string | null,
  notes: '',
})

const createData = ref({
  well_name: '',
  well_code: '',
  location: '',
  surface_coordinates: {
    latitude: null as number | null,
    longitude: null as number | null,
  },
  planned_depth_meters: null as number | null,
  hole_diameter_inches: null as number | null,
  current_depth_meters: 0,
  status: 'planned',
  drilling_type: null as string | null,
  spud_date: '',
  expected_end_date: '',
  notes: '',
})

const statusOptions = [
  { title: 'Planificado', value: 'planned' },
  { title: 'Perforando', value: 'drilling' },
  { title: 'Completado', value: 'completed' },
  { title: 'Suspendido', value: 'suspended' },
  { title: 'Abandonado', value: 'abandoned' },
]

const drillingTypeOptions = [
  { title: 'Rotatorio', value: 'rotary' },
  { title: 'Percusión', value: 'percussion' },
  { title: 'Direccional', value: 'directional' },
  { title: 'Horizontal', value: 'horizontal' },
  { title: 'Otro', value: 'other' },
]

const rules = {
  required: (value: any) => !!value || 'Campo requerido',
  positiveNumber: (value: number) => !value || value >= 0 || 'Debe ser mayor o igual a 0',
  latitude: (value: number) => !value || (value >= -90 && value <= 90) || 'Debe estar entre -90 y 90',
  longitude: (value: number) => !value || (value >= -180 && value <= 180) || 'Debe estar entre -180 y 180',
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Máximo ${max} caracteres`,
}

const loadAvailableWells = async () => {
  loadingWells.value = true
  try {
    // Load all wells for now - can filter later if needed
    const response = await DrillingReportApiService.getWells?.() || { data: [] }

    availableWells.value = response?.data || []
  }
  catch (error) {
    console.error('Error loading available wells:', error)
    availableWells.value = []
  }
  finally {
    loadingWells.value = false
  }
}

const handleSubmit = async () => {
  if (mode.value === 'assign') {
    const { valid } = await assignFormRef.value.validate()
    if (!valid)
      return

    emit('assign', assignData.value.well_id!, assignData.value.notes)
  }
  else {
    const { valid } = await createFormRef.value.validate()
    if (!valid)
      return

    // Emit with project_id included for single-call backend
    emit('create', {
      ...createData.value,
      project_id: props.projectId,
    })
  }
}

const handleCancel = () => {
  assignFormRef.value?.reset()
  createFormRef.value?.reset()
  localDialog.value = false
}

// Load available wells when dialog opens in assign mode
watch([() => props.modelValue, mode], ([dialogOpen, currentMode]) => {
  if (dialogOpen && currentMode === 'assign')
    loadAvailableWells()
})

// Reset forms when dialog opens
watch(() => props.modelValue, newValue => {
  if (newValue) {
    mode.value = 'assign'
    assignData.value = {
      well_id: null,
      notes: '',
    }
    createData.value = {
      well_name: '',
      well_code: '',
      location: '',
      surface_coordinates: {
        latitude: null,
        longitude: null,
      },
      planned_depth_meters: null,
      hole_diameter_inches: null,
      current_depth_meters: 0,
      status: 'planned',
      drilling_type: null,
      spud_date: '',
      expected_end_date: '',
      notes: '',
    }
  }
})

onMounted(() => {
  if (props.modelValue && mode.value === 'assign')
    loadAvailableWells()
})
</script>

<template>
  <VDialog
    v-model="localDialog"
    max-width="800"
    persistent
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between sticky-header pa-4">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-droplet"
            color="primary"
            size="20"
          />
          <span class="text-h6">Asignar Pozo al Proyecto</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="handleCancel"
        />
      </VCardTitle>

      <VDivider />

      <!-- Tabs for mode selection -->
      <VTabs
        v-model="mode"
        color="primary"
        class=""
        density="compact"
      >
        <VTab value="assign">
          <VIcon
            start
            icon="tabler-link"
            size="18"
          />
          Asignar Existente
        </VTab>
        <VTab value="create">
          <VIcon
            start
            icon="tabler-plus"
            size="18"
          />
          Crear Nuevo
        </VTab>
      </VTabs>

      <VDivider />

      <VCardText
        class="pa-4"
        style="max-block-size: 60vh; overflow-y: auto;"
      >
        <!-- Assign Existing Well Form -->
        <VForm
          v-if="mode === 'assign'"
          ref="assignFormRef"
          @submit.prevent="handleSubmit"
        >
          <VRow dense>
            <VCol cols="12">
              <VAutocomplete
                v-model="assignData.well_id"
                label="Seleccionar Pozo *"
                :items="availableWells"
                :loading="loadingWells"
                item-title="name"
                item-value="id"
                prepend-inner-icon="tabler-droplet"
                :rules="[rules.required]"
                density="compact"
                clearable
                required
              >
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VAvatar
                        color="primary"
                        variant="tonal"
                      >
                        <VIcon icon="tabler-droplet" />
                      </VAvatar>
                    </template>
                    <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
                    <VListItemSubtitle>
                      {{ item.raw.location }} • {{ item.raw.status }}
                    </VListItemSubtitle>
                  </VListItem>
                </template>
              </VAutocomplete>
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="assignData.notes"
                label="Notas"
                rows="2"
                counter="500"
                :rules="[rules.maxLength(500)]"
                prepend-inner-icon="tabler-note"
                density="compact"
              />
            </VCol>
          </VRow>
        </VForm>

        <!-- Create New Well Form -->
        <VForm
          v-else
          ref="createFormRef"
          class="compact-form"
          @submit.prevent="handleSubmit"
        >
          <VRow dense>
            <!-- Well Name -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="createData.well_name"
                label="Nombre del Pozo *"
                prepend-inner-icon="tabler-droplet"
                :rules="[rules.required, rules.maxLength(200)]"
                counter="200"
                required
              />
            </VCol>

            <!-- Well Code -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="createData.well_code"
                label="Código del Pozo"
                prepend-inner-icon="tabler-hash"
                :rules="[rules.maxLength(100)]"
                counter="100"
              />
            </VCol>

            <!-- Location -->
            <VCol cols="12">
              <VTextField
                v-model="createData.location"
                label="Ubicación *"
                prepend-inner-icon="tabler-map-pin"
                :rules="[rules.required, rules.maxLength(300)]"
                counter="300"
                required
              />
            </VCol>

            <!-- Coordinates -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="createData.surface_coordinates.latitude"
                label="Latitud *"
                type="number"
                step="0.000001"
                prepend-inner-icon="tabler-compass"
                :rules="[rules.required, rules.latitude]"
                placeholder="-90 a 90"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="createData.surface_coordinates.longitude"
                label="Longitud *"
                type="number"
                step="0.000001"
                prepend-inner-icon="tabler-compass"
                :rules="[rules.required, rules.longitude]"
                placeholder="-180 a 180"
                required
              />
            </VCol>

            <!-- Planned Depth -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="createData.planned_depth_meters"
                label="Profundidad Planificada *"
                type="number"
                step="0.01"
                min="0"
                prepend-inner-icon="tabler-ruler"
                suffix="m"
                :rules="[rules.required, rules.positiveNumber]"
                required
              />
            </VCol>

            <!-- Hole Diameter -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="createData.hole_diameter_inches"
                label="Diámetro del Hoyo *"
                type="number"
                step="0.125"
                min="0"
                prepend-inner-icon="tabler-circle"
                suffix="in"
                :rules="[rules.required, rules.positiveNumber]"
                required
              />
            </VCol>

            <!-- Current Depth -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="createData.current_depth_meters"
                label="Profundidad Actual"
                type="number"
                step="0.01"
                min="0"
                prepend-inner-icon="tabler-arrow-down"
                suffix="m"
                :rules="[rules.positiveNumber]"
              />
            </VCol>

            <!-- Status -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="createData.status"
                label="Estado *"
                :items="statusOptions"
                prepend-inner-icon="tabler-status-change"
                :rules="[rules.required]"
                required
              />
            </VCol>

            <!-- Drilling Type -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="createData.drilling_type"
                label="Tipo de Perforación"
                :items="drillingTypeOptions"
                prepend-inner-icon="tabler-tool"
              />
            </VCol>

            <!-- Spud Date -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="createData.spud_date"
                label="Fecha de Inicio (Spud Date) *"
                type="date"
                prepend-inner-icon="tabler-calendar"
                :rules="[rules.required]"
                required
              />
            </VCol>

            <!-- Expected End Date -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="createData.expected_end_date"
                label="Fecha Esperada de Fin"
                type="date"
                prepend-inner-icon="tabler-calendar-check"
              />
            </VCol>

            <!-- Notes -->
            <VCol cols="12">
              <VTextarea
                v-model="createData.notes"
                label="Notas"
                rows="3"
                counter="1000"
                :rules="[rules.maxLength(1000)]"
                prepend-inner-icon="tabler-note"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="text"
          @click="handleCancel"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          <VIcon
            start
            :icon="mode === 'assign' ? 'tabler-link' : 'tabler-device-floppy'"
          />
          {{ mode === 'assign' ? 'Asignar' : 'Crear y Asignar' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.sticky-header {
  position: sticky;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
  inset-block-start: 0;
}

.compact-form {
  :deep(.v-field) {
    --v-field-padding-top: 8px;
    --v-field-padding-bottom: 8px;
  }

  :deep(.v-input) {
    font-size: 0.875rem;
  }

  :deep(.v-text-field .v-field__input) {
    min-block-size: 36px;
    padding-block: 4px;
  }
}
</style>
