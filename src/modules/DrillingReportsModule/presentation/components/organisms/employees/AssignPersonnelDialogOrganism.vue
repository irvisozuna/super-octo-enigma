<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DrillingReportApiService } from '../../../../infrastructure/api/services/DrillingReportApiService'

const props = defineProps<AssignPersonnelDialogProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'assign': [data: any]
  'success': []
}>()

const { t } = useI18n()

export interface AssignPersonnelDialogProps {
  modelValue: boolean
  projectId: string
  loading?: boolean
  error?: string | null
}

const form = ref()
const loadingEmployees = ref(false)
const availableEmployees = ref<any[]>([])
const errorMessage = ref('')
const errorTitle = ref('Error al asignar personal')

const localDialog = computed({
  get: () => props.modelValue,
  set: value => {
    if (!value)
      errorMessage.value = '' // Clear error when closing

    emit('update:modelValue', value)
  },
})

const formData = ref({
  employee_id: null as string | null,
  role: 'drilling_engineer',
  assignment_date: new Date().toISOString().split('T')[0],
  hourly_rate: null as number | null,
  expected_hours: null as number | null,
  notes: '',
})

const roleOptions = [
  { label: 'Ingeniero de Perforación', value: 'drilling_engineer' },
  { label: 'Geólogo', value: 'geologist' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Técnico', value: 'technician' },
  { label: 'Operador', value: 'operator' },
  { label: 'Oficial de Seguridad', value: 'safety_officer' },
]

const selectedEmployee = computed(() =>
  availableEmployees.value.find(e => e.id === formData.value.employee_id),
)

const estimatedCost = computed(() => {
  if (!formData.value.hourly_rate || !formData.value.expected_hours)
    return 0

  return formData.value.hourly_rate * formData.value.expected_hours
})

const getEmployeeLabel = (employee: any) => {
  return `${employee.full_name} - ${employee.position}`
}

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()

  return name.substring(0, 2).toUpperCase()
}

const getAvatarColor = (employeeNumber: string | undefined) => {
  if (!employeeNumber)
    return 'primary'
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  const hash = employeeNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  return colors[hash % colors.length]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

const loadEmployees = async () => {
  loadingEmployees.value = true
  try {
    // TODO: Implement getEmployees endpoint or use existing one
    const response = await DrillingReportApiService.getEmployees?.() || { data: [] }

    availableEmployees.value = response.data || response || []
  }
  catch (error) {
    console.error('Error loading employees:', error)
    availableEmployees.value = []
  }
  finally {
    loadingEmployees.value = false
  }
}

const handleSubmit = async () => {
  console.log('🔵 AssignPersonnelDialog.handleSubmit called')
  const { valid } = await form.value.validate()
  if (!valid) {
    console.log('❌ Form validation failed')
    return
  }

  console.log('✅ Form validation passed')
  errorMessage.value = '' // Clear previous errors

  const data = {
    employee_id: formData.value.employee_id!,
    role: formData.value.role,
    assignment_date: formData.value.assignment_date,
    hourly_rate: formData.value.hourly_rate,
    notes: formData.value.notes,
  }

  console.log('🔵 Emitting assign event with data:', data)
  emit('assign', data)

  // Don't reset form here - let parent component handle success/error
}

// Method to be called from parent on success
const onSuccess = () => {
  resetForm()
  localDialog.value = false
}

// Expose method for parent to call
defineExpose({
  onSuccess,
})

const resetForm = () => {
  formData.value = {
    employee_id: null,
    role: 'drilling_engineer',
    assignment_date: new Date().toISOString().split('T')[0],
    hourly_rate: null,
    expected_hours: null,
    notes: '',
  }
  form.value?.reset()
}

watch(() => props.modelValue, newValue => {
  if (newValue) {
    loadEmployees()
    errorMessage.value = '' // Clear error when opening
  }
})

// Watch for errors from parent
watch(() => props.error, newError => {
  if (!newError)
    return

  console.log('🔴 Received error from parent:', newError)

  try {
    // Parse error message
    const errorObj = typeof newError === 'string' ? JSON.parse(newError) : newError

    console.log('🔍 Parsed error object:', errorObj)

    if (errorObj.error) {
      const errorCode = errorObj.error.code

      console.log('🏷️ Error code:', errorCode)

      // Try to get translation from i18n
      const translationKey = `errors.${errorCode}`
      const translatedMessage = t(translationKey, '', { missingWarn: false, fallbackWarn: false })

      console.log('🌐 Translation key:', translationKey)
      console.log('🌐 Translated message:', translatedMessage)

      // Check if translation exists (not empty and not the same as key)
      if (translatedMessage && translatedMessage !== '' && translatedMessage !== translationKey) {
        // Translation found - use it
        errorTitle.value = t('common.error')
        errorMessage.value = translatedMessage
        console.log('✅ Using translated message:', translatedMessage)
      }
      else {
        // No translation - use backend message
        errorTitle.value = errorCode || t('common.error')
        errorMessage.value = errorObj.error.message || newError
        console.log('⚠️ No translation found, using backend message')
      }

      // Log context if available
      if (errorObj.error.context)
        console.log('📋 Error context:', errorObj.error.context)
    }
    else {
      // No error.error structure
      errorTitle.value = t('common.error')
      errorMessage.value = typeof errorObj === 'string' ? errorObj : JSON.stringify(errorObj)
      console.log('⚠️ Unexpected error structure')
    }
  }
  catch (e) {
    console.error('💥 Error parsing error message:', e)
    errorTitle.value = t('common.error')
    errorMessage.value = typeof newError === 'string' ? newError : 'Error desconocido'
  }
})

onMounted(() => {
  if (props.modelValue)
    loadEmployees()
})
</script>

<template>
  <VDialog
    v-model="localDialog"
    max-width="700"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-user-plus"
            color="primary"
          />
          <span>Asignar Personal al Proyecto</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="localDialog = false"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <!-- Error Alert -->
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          prominent
          @click:close="errorMessage = ''"
        >
          <template #prepend>
            <VIcon
              icon="tabler-alert-circle"
              size="32"
            />
          </template>
          <VAlertTitle class="text-h6 mb-2">
            {{ $t(`DrillingReportsModule.errors.${errorTitle}`) }}
          </VAlertTitle>
        </VAlert>

        <VForm
          ref="form"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <!-- Employee Selection -->
            <VCol cols="12">
              <VAutocomplete
                v-model="formData.employee_id"
                label="Empleado *"
                :items="availableEmployees"
                :item-title="getEmployeeLabel"
                item-value="id"
                :loading="loadingEmployees"
                :rules="[v => !!v || 'El empleado es requerido']"
                prepend-inner-icon="tabler-user"
                placeholder="Buscar empleado..."
                clearable
                required
              >
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VAvatar
                        :color="getAvatarColor(item.raw.employee_code || item.raw.id)"
                        size="40"
                      >
                        <span class="text-sm font-weight-medium">
                          {{ getInitials(item.raw.full_name) }}
                        </span>
                      </VAvatar>
                    </template>
                    <VListItemTitle>{{ item.raw.full_name }}</VListItemTitle>
                    <VListItemSubtitle>
                      {{ item.raw.position }} • {{ item.raw.employee_code }}
                    </VListItemSubtitle>
                  </VListItem>
                </template>
              </VAutocomplete>
            </VCol>

            <!-- Role Selection -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.role"
                label="Rol en el Proyecto *"
                :items="roleOptions"
                item-title="label"
                item-value="value"
                :rules="[v => !!v || 'El rol es requerido']"
                prepend-inner-icon="tabler-briefcase"
                required
              />
            </VCol>

            <!-- Assignment Date -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.assignment_date"
                label="Fecha de Asignación *"
                type="date"
                :rules="[v => !!v || 'La fecha es requerida']"
                prepend-inner-icon="tabler-calendar"
                required
              />
            </VCol>

            <!-- Hourly Rate -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.hourly_rate"
                label="Tarifa por Hora"
                type="number"
                step="0.01"
                prefix="$"
                prepend-inner-icon="tabler-currency-dollar"
                placeholder="0.00"
              />
            </VCol>

            <!-- Expected Hours (optional) -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.expected_hours"
                label="Horas Estimadas"
                type="number"
                prepend-inner-icon="tabler-clock"
                placeholder="0"
              />
            </VCol>

            <!-- Notes -->
            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                label="Notas"
                rows="3"
                prepend-inner-icon="tabler-notes"
                placeholder="Notas adicionales sobre la asignación..."
              />
            </VCol>

            <!-- Summary Card -->
            <VCol
              v-if="selectedEmployee && formData.hourly_rate && formData.expected_hours"
              cols="12"
            >
              <VCard
                variant="tonal"
                color="primary"
              >
                <VCardText>
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <p class="text-caption mb-1">
                        Costo Estimado
                      </p>
                      <h4 class="text-h4">
                        {{ formatCurrency(estimatedCost) }}
                      </h4>
                    </div>
                    <VIcon
                      icon="tabler-calculator"
                      size="48"
                    />
                  </div>
                  <p class="text-caption text-medium-emphasis mt-2 mb-0">
                    {{ formData.hourly_rate }} x {{ formData.expected_hours }} horas
                  </p>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="text"
          @click="localDialog = false"
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
            icon="tabler-check"
          />
          Asignar Personal
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
