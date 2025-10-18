<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ACTIVITY_TYPES, SHIFTS } from '../../shared/constants/DrillingConstants'

// Props
interface Props {
  modelValue: boolean
  activity?: any
  reportId: string
}

const props = withDefaults(defineProps<Props>(), {
  activity: null,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// State
const formRef = ref()
const formValid = ref(false)
const saving = ref(false)

const formData = ref({
  activity_type: '',
  shift: 'day',
  hours: null,
  start_time: '',
  end_time: '',
  description: '',
})

const errors = ref({})

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.activity)

const activityTypes = computed(() => ACTIVITY_TYPES)
const shifts = computed(() => SHIFTS)

const canChangeShift = computed(() => {
  // TODO: Implement logic based on report shift
  return true
})

const hoursHint = computed(() => {
  if (formData.value.hours) {
    const hours = Number.parseFloat(formData.value.hours)
    if (hours > 20)
      return '⚠️ Muchas horas para un turno'
    else if (hours < 1)
      return 'ℹ️ Horas mínimas recomendadas'
  }

  return ''
})

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  hours: (value: any) => {
    if (!value)
      return 'Las horas son requeridas'
    const hours = Number.parseFloat(value)
    if (hours < 0.1)
      return 'Mínimo 0.1 horas'
    if (hours > 24)
      return 'Máximo 24 horas'

    return true
  },
  endTime: (value: any) => {
    if (!value || !formData.value.start_time)
      return true

    return value > formData.value.start_time || 'La hora de fin debe ser después de la hora de inicio'
  },
  description: (value: any) => {
    if (!value)
      return true

    return value.length <= 500 || 'La descripción no puede exceder 500 caracteres'
  },
}

// Methods
const closeModal = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    activity_type: '',
    shift: 'day',
    hours: null,
    start_time: '',
    end_time: '',
    description: '',
  }
  errors.value = {}
}

const loadActivityData = () => {
  if (props.activity) {
    formData.value = {
      activity_type: props.activity.activity_type || '',
      shift: props.activity.shift || 'day',
      hours: props.activity.hours || null,
      start_time: props.activity.start_time || '',
      end_time: props.activity.end_time || '',
      description: props.activity.description || '',
    }
  }
}

const saveActivity = async () => {
  if (!formValid.value)
    return

  saving.value = true
  try {
    // TODO: Implement save activity
    console.log('Saving activity:', {
      reportId: props.reportId,
      activity: formData.value,
      isEditing: isEditing.value,
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Show success message
    // TODO: Show success notification

    emit('saved')
    closeModal()
  }
  catch (error) {
    console.error('Error saving activity:', error)

    // TODO: Show error notification
  }
  finally {
    saving.value = false
  }
}

// Watchers
watch(() => props.modelValue, newValue => {
  if (newValue)
    loadActivityData()
})

watch(() => props.activity, newActivity => {
  if (newActivity)
    loadActivityData()
})

watch(() => formData.value.start_time, newValue => {
  if (newValue && formData.value.end_time && newValue >= formData.value.end_time)
    formData.value.end_time = ''
})

watch(() => formData.value.hours, newValue => {
  if (newValue) {
    const hours = Number.parseFloat(newValue)
    if (hours > 24)
      formData.value.hours = 24
    else if (hours < 0.1)
      formData.value.hours = 0.1
  }
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="600px"
    persistent
  >
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-cog"
          class="me-2"
        />
        {{ isEditing ? 'Editar Actividad' : 'Agregar Actividad' }}
      </VCardTitle>

      <VCardText>
        <VForm
          ref="formRef"
          v-model="formValid"
          @submit.prevent="saveActivity"
        >
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.activity_type"
                :items="activityTypes"
                item-title="label"
                item-value="value"
                label="Tipo de Actividad *"
                :rules="[rules.required]"
                :error-messages="errors.activity_type"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.shift"
                :items="shifts"
                item-title="label"
                item-value="value"
                label="Turno *"
                :rules="[rules.required]"
                :error-messages="errors.shift"
                :disabled="!canChangeShift"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.hours"
                type="number"
                step="0.1"
                min="0.1"
                max="24"
                label="Horas Trabajadas *"
                :rules="[rules.required, rules.hours]"
                :error-messages="errors.hours"
                :hint="hoursHint"
                persistent-hint
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.start_time"
                type="time"
                label="Hora de Inicio"
                :error-messages="errors.start_time"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.end_time"
                type="time"
                label="Hora de Fin"
                :error-messages="errors.end_time"
                :rules="[rules.endTime]"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="formData.description"
                label="Descripción"
                rows="3"
                :error-messages="errors.description"
                :counter="500"
                :rules="[rules.description]"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="grey"
          variant="outlined"
          @click="closeModal"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :loading="saving"
          :disabled="!formValid"
          @click="saveActivity"
        >
          <VIcon
            icon="mdi-content-save"
            class="me-2"
          />
          {{ isEditing ? 'Actualizar' : 'Agregar' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-dialog {
  max-inline-size: 600px;
}

.v-card-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.v-card-actions {
  border-block-start: 1px solid #e0e0e0;
  padding-block: 16px;
  padding-inline: 24px;
}

.v-form {
  padding: 0;
}

.v-row {
  margin: 0;
}

.v-col {
  padding-block: 8px;
  padding-inline: 12px;
}

@media (max-width: 768px) {
  .v-dialog {
    margin: 16px;
    max-inline-size: 100%;
  }

  .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
