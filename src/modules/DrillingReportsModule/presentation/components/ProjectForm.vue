<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projectsStore'
import { simpleClientService } from '../../shared/services/SimpleClientService'
import { useAppManager } from '@/composables/useAppManager'

// Props
interface Props {
  project?: any
  isEditing?: boolean
  showCloseButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  project: null,
  isEditing: false,
  showCloseButton: true,
})

// Emits
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

// Composables
const { t } = useI18n()
const { closeDialog } = useAppManager()
const projectsStore = useProjectsStore()

// Debug: Verificar que el store esté disponible
console.log('🔍 ProjectsStore disponible:', !!projectsStore)
console.log('🔍 Métodos del store:', Object.keys(projectsStore))

// Form ref
const formRef = ref()

// Loading states
const loading = ref(false)
const loadingClients = ref(false)

// Form data
const formData = reactive({
  project_name: '',
  client_id: '',
  general_location: '',
  total_budget: '',
  budget_currency: 'MXN',
  start_date: '',
  estimated_end_date: '',
  general_coordinates: {
    latitude: '',
    longitude: '',
  },
  description: '',
})

// Client options
const clientOptions = ref([])
const clientSearch = ref('')
const clientSearchTimeout = ref(null)

// Currency options
const currencyOptions = computed(() => [
  { title: 'USD - Dólar Americano', value: 'USD' },
  { title: 'MXN - Peso Mexicano', value: 'MXN' },
])

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Campo requerido',
  maxLength: (max: number) => (value: string) => !value || value.length <= max || `Máximo ${max} caracteres`,
  minValue: (min: number) => (value: number) => !value || value >= min || `Mínimo ${min}`,
  latitude: (value: number) => !value || (value >= -90 && value <= 90) || 'Latitud debe estar entre -90 y 90',
  longitude: (value: number) => !value || (value >= -180 && value <= 180) || 'Longitud debe estar entre -180 y 180',
}

// Watch for project changes
watch(() => props.project, newProject => {
  if (newProject)
    Object.assign(formData, newProject)
}, { immediate: true })

// Watch for name changes to generate code
watch(() => formData.project_name, newName => {
  if (newName && !props.isEditing)
    generateProjectCode(newName)
})

// Load clients using service layer
const loadClients = async (searchTerm = '') => {
  loadingClients.value = true
  try {
    console.log('🔍 Cargando clientes con búsqueda:', searchTerm)

    if (searchTerm && searchTerm.length >= 2) {
      // Búsqueda con término
      clientOptions.value = await simpleClientService.searchClients(searchTerm)
    }
    else {
      // Cargar clientes iniciales (solo los primeros 20)
      clientOptions.value = await simpleClientService.getInitialClients()
    }
  }
  catch (error) {
    console.error('Error loading clients:', error)
    clientOptions.value = []
  }
  finally {
    loadingClients.value = false
  }
}

// Handle client search with debounce
const handleClientSearch = (searchTerm: string) => {
  clientSearch.value = searchTerm

  // Clear previous timeout
  if (clientSearchTimeout.value)
    clearTimeout(clientSearchTimeout.value)

  // Set new timeout for debounced search
  clientSearchTimeout.value = setTimeout(() => {
    if (searchTerm.length >= 2 || searchTerm.length === 0)
      loadClients(searchTerm)
  }, 300) // 300ms debounce
}

// Generate project code automatically
const generateProjectCode = (projectName: string) => {
  if (!projectName)
    return

  // Generar código basado en el nombre del proyecto
  const cleanName = projectName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6)

  const timestamp = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  // El código se genera automáticamente en el backend
  // Solo mostramos un preview aquí
  console.log('Código generado:', `${cleanName}-${timestamp}-${random}`)
}

// Methods
const handleSubmit = async () => {
  console.log('🚀 handleSubmit llamado')

  const { valid } = await formRef.value.validate()

  console.log('✅ Validación del formulario:', valid)

  if (!valid) {
    console.log('❌ Formulario no válido, no se puede guardar')

    return
  }

  loading.value = true
  console.log('⏳ Iniciando guardado...')

  try {
    // Preparar datos para envío
    const projectData = {
      project_name: formData.project_name,
      client_id: formData.client_id,
      general_location: formData.general_location,
      total_budget: Number.parseFloat(formData.total_budget),
      budget_currency: formData.budget_currency,
      start_date: formData.start_date,
      estimated_end_date: formData.estimated_end_date || null,
      general_coordinates: formData.general_coordinates.latitude && formData.general_coordinates.longitude
        ? {
            latitude: Number.parseFloat(formData.general_coordinates.latitude),
            longitude: Number.parseFloat(formData.general_coordinates.longitude),
          }
        : null,
      description: formData.description || null,
    }

    console.log('💾 Guardando proyecto:', projectData)

    if (props.isEditing) {
      console.log('📝 Editando proyecto existente:', props.project.id)

      const result = await projectsStore.updateProject(props.project.id, projectData)

      console.log('📝 Resultado de actualización:', result)
    }
    else {
      console.log('➕ Creando nuevo proyecto')

      const result = await projectsStore.createProject(projectData)

      console.log('➕ Resultado de creación:', result)
    }

    console.log('✅ Proyecto guardado exitosamente')
    emit('submit', formData)
    console.log('📤 Evento submit emitido')

    if (props.showCloseButton) {
      console.log('🚪 Cerrando diálogo...')
      closeDialog()
      console.log('🚪 closeDialog llamado')
    }
  }
  catch (error) {
    console.error('❌ Error saving project:', error)

    // Mostrar error al usuario
    const errorMessage = error?.response?.data?.message || error?.message || 'Error al guardar el proyecto'

    console.error('Error details:', errorMessage)

    // Aquí podrías agregar una notificación de error
    // Por ejemplo: showNotification('error', errorMessage)
  }
  finally {
    loading.value = false
    console.log('🏁 Loading terminado')
  }
}

const handleCancel = () => {
  emit('cancel')
  if (props.showCloseButton)
    closeDialog()
}

// Lifecycle
onMounted(() => {
  loadClients()
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <span>{{ isEditing ? $t('DrillingReportsModule.projects.editProject') : $t('DrillingReportsModule.projects.newProject') }}</span>
      <DialogCloseBtn
        v-if="showCloseButton"
        @click="closeDialog"
      />
    </VCardTitle>

    <VCardText>
      <VForm
        ref="formRef"
        @submit.prevent="handleSubmit"
      >
        <VRow>
          <!-- Nombre del Proyecto -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.project_name"
              :label="$t('DrillingReportsModule.projects.projectName')"
              :rules="[rules.required, rules.maxLength(255)]"
              required
            />
          </VCol>

          <!-- Cliente -->
          <VCol
            cols="12"
            md="6"
          >
            <VAutocomplete
              v-model="formData.client_id"
              :items="clientOptions"
              :label="$t('DrillingReportsModule.projects.client')"
              :rules="[rules.required]"
              :loading="loadingClients"
              :search="clientSearch"
              clearable
              :no-data-text="$t('DrillingReportsModule.projects.noClientsAvailable')"
              :placeholder="$t('DrillingReportsModule.projects.clientSearch')"
              required
              @update:search="handleClientSearch"
            >
              <template #prepend-inner>
                <VIcon icon="tabler-search" />
              </template>
              <template #append-inner>
                <VIcon
                  v-if="loadingClients"
                  icon="tabler-loader-2"
                  class="animate-spin"
                />
              </template>
            </VAutocomplete>
          </VCol>

          <!-- Ubicación General -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.general_location"
              :label="$t('DrillingReportsModule.projects.generalLocation')"
              :rules="[rules.required, rules.maxLength(500)]"
              required
            />
          </VCol>

          <!-- Presupuesto Total -->
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="formData.total_budget"
              :label="$t('DrillingReportsModule.projects.totalBudget')"
              type="number"
              step="0.01"
              min="0.01"
              :rules="[rules.required, rules.minValue(0.01)]"
              required
            />
          </VCol>

          <!-- Moneda -->
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="formData.budget_currency"
              :items="currencyOptions"
              :label="$t('DrillingReportsModule.projects.budgetCurrency')"
              :rules="[rules.required]"
              required
            />
          </VCol>

          <!-- Fecha de Inicio -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.start_date"
              :label="$t('DrillingReportsModule.projects.startDate')"
              type="date"
              :rules="[rules.required]"
              required
            />
          </VCol>

          <!-- Fecha Estimada de Fin -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.estimated_end_date"
              :label="$t('DrillingReportsModule.projects.estimatedEndDate')"
              type="date"
              :min="formData.start_date"
            />
          </VCol>

          <!-- Coordenadas -->
          <VCol cols="12">
            <VCardTitle class="text-h6 mb-2">
              {{ $t('DrillingReportsModule.projects.coordinates') }}
            </VCardTitle>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.general_coordinates.latitude"
              :label="$t('DrillingReportsModule.projects.latitude')"
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              :rules="[rules.latitude]"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.general_coordinates.longitude"
              :label="$t('DrillingReportsModule.projects.longitude')"
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              :rules="[rules.longitude]"
            />
          </VCol>

          <!-- Descripción -->
          <VCol cols="12">
            <VTextarea
              v-model="formData.description"
              :label="$t('DrillingReportsModule.projects.description')"
              rows="3"
              :rules="[rules.maxLength(1000)]"
            />
          </VCol>
        </VRow>
      </VForm>
    </VCardText>

    <VCardActions>
      <VSpacer />
      <VBtn
        color="grey"
        variant="text"
        @click="handleCancel"
      >
        {{ $t('DrillingReportsModule.common.cancel') }}
      </VBtn>
      <VBtn
        color="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ $t('DrillingReportsModule.common.save') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
