<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EquipmentApiService } from '../../../infrastructure/api/services/EquipmentApiService'

interface Props {
  visible: boolean
  projectId: string
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: { equipment_id: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

// Form data
const formData = ref({
  equipment_id: '',
  notes: '',
})

// Equipment options
const equipmentOptions = ref<any[]>([])
const loadingEquipment = ref(false)
const equipmentSearch = ref('')
const currentPage = ref(1)
const hasMorePages = ref(true)
const totalEquipment = ref(0)

// Form ref
const formRef = ref()

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Campo requerido',
  maxLength: (value: string) => !value || value.length <= 500 || 'Máximo 500 caracteres',
}

// Load available equipment
const loadEquipment = async (searchTerm = '', page = 1, append = false) => {
  loadingEquipment.value = true
  try {
    console.log('🔍 Loading equipment:', { searchTerm, page, append })
    
    const response = await EquipmentApiService.getEquipment({
      search: searchTerm,
      status: 'active',
      page: page,
      per_page: 50,
    })

    console.log('📦 Equipment response:', response)

    // Handle different response structures
    let equipmentData = []
    let meta = {}
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        // Direct array response
        equipmentData = response.data
      } else if (response.data.data) {
        // Paginated response
        equipmentData = response.data.data
        meta = response.data.meta || {}
      } else {
        // Single object response
        equipmentData = [response.data]
      }
    } else if (Array.isArray(response)) {
      // Direct array response
      equipmentData = response
    }
    
    // Filter out equipment already assigned to projects
    const availableEquipment = equipmentData.filter((equipment: any) => !equipment.current_project_id)
    
    const mappedEquipment = availableEquipment.map((equipment: any) => ({
      id: equipment.id,
      title: `${equipment.equipment_name} (${equipment.equipment_code})`,
      subtitle: `${equipment.equipment_type} - ${equipment.manufacturer || 'Sin fabricante'}`,
      value: equipment.id,
      equipment: equipment,
    }))

    if (append) {
      equipmentOptions.value = [...equipmentOptions.value, ...mappedEquipment]
    } else {
      equipmentOptions.value = mappedEquipment
    }

    // Update pagination info
    currentPage.value = meta.current_page || page
    hasMorePages.value = meta.current_page < meta.last_page
    totalEquipment.value = meta.total || 0

    console.log('✅ Equipment loaded:', {
      count: equipmentOptions.value.length,
      currentPage: currentPage.value,
      hasMorePages: hasMorePages.value,
      total: totalEquipment.value
    })
  }
  catch (error) {
    console.error('❌ Error loading equipment:', error)
    if (!append) {
      equipmentOptions.value = []
    }
  }
  finally {
    loadingEquipment.value = false
  }
}

// Handle equipment search with debounce
const searchTimeout = ref<NodeJS.Timeout | null>(null)

const handleEquipmentSearch = (searchTerm: string) => {
  equipmentSearch.value = searchTerm
  
  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // Set new timeout for debounced search
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1
    hasMorePages.value = true
    loadEquipment(searchTerm, 1, false)
  }, 300) // 300ms debounce
}

// Load more equipment for infinite scroll
const loadMoreEquipment = () => {
  if (!loadingEquipment.value && hasMorePages.value) {
    const nextPage = currentPage.value + 1
    loadEquipment(equipmentSearch.value, nextPage, true)
  }
}

// Handle form submission
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  // Get selected equipment name for success message
  const selectedEquipment = equipmentOptions.value.find(option => option.value === formData.value.equipment_id)
  const equipmentName = selectedEquipment?.title || 'equipo'

  emit('submit', {
    equipment_id: formData.value.equipment_id,
    equipment_name: equipmentName,
    notes: formData.value.notes,
  })
}

// Handle dialog close
const handleClose = () => {
  emit('update:visible', false)
}

// Reset form when dialog opens
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    formData.value = {
      equipment_id: '',
      notes: '',
    }
    equipmentSearch.value = ''
    currentPage.value = 1
    hasMorePages.value = true
    totalEquipment.value = 0
    equipmentOptions.value = []
    
    // Force load equipment when dialog opens
    await loadEquipment('', 1, false)
  }
})

// Expose success method for parent
const onSuccess = () => {
  // Reset form data
  formData.value = {
    equipment_id: '',
    notes: '',
  }
  
  // Reset search and pagination
  equipmentSearch.value = ''
  currentPage.value = 1
  hasMorePages.value = true
  totalEquipment.value = 0
  equipmentOptions.value = []
  
  // Clear any search timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
    searchTimeout.value = null
  }
  
  // Close dialog
  emit('update:visible', false)
}

defineExpose({
  onSuccess,
})

// Load equipment on mount if dialog is already visible
onMounted(() => {
  if (props.visible) {
    loadEquipment('', 1, false)
  }
})

// Computed for selected equipment details
const selectedEquipment = computed(() => {
  if (!formData.value.equipment_id) return null
  
  const selected = equipmentOptions.value.find(option => option.value === formData.value.equipment_id)
  return selected?.equipment || null
})
</script>

<template>
  <VDialog
    :model-value="visible"
    max-width="600"
    @update:model-value="handleClose"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-tools"
          color="primary"
        />
        Asignar Equipo al Proyecto
      </VCardTitle>

      <VCardText>
        <!-- Error Alert -->
        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = null"
        >
          <template #prepend>
            <VIcon
              icon="tabler-alert-circle"
              size="24"
            />
          </template>
          <VAlertTitle class="text-h6 mb-2">
            Error al Asignar Equipo
          </VAlertTitle>
          <p class="mb-0">
            {{ error }}
          </p>
        </VAlert>

        <VForm
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <VCol cols="12">
              <VAutocomplete
                v-model="formData.equipment_id"
                :items="equipmentOptions"
                :label="$t('DrillingReportsModule.equipment.title')"
                :loading="loadingEquipment"
                :search="equipmentSearch"
                :rules="[rules.required]"
                required
                clearable
                :no-data-text="loadingEquipment ? 'Cargando equipos...' : $t('DrillingReportsModule.equipment.noEquipmentAvailable')"
                :placeholder="$t('DrillingReportsModule.equipment.searchEquipment')"
                @update:search="handleEquipmentSearch"
                @scroll:bottom="loadMoreEquipment"
              >
                <template #prepend-inner>
                  <VIcon icon="tabler-search" />
                </template>
                <template #append-inner>
                  <VIcon
                    v-if="loadingEquipment"
                    icon="tabler-loader-2"
                    class="animate-spin"
                  />
                </template>
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VIcon
                        icon="tabler-tools"
                        color="primary"
                      />
                    </template>
                    <VListItemTitle>{{ item.title }}</VListItemTitle>
                    <VListItemSubtitle>{{ item.subtitle }}</VListItemSubtitle>
                  </VListItem>
                </template>
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <VIcon
                      icon="tabler-tools"
                      class="me-2"
                      color="primary"
                    />
                    <span>{{ item.title }}</span>
                  </div>
                </template>
                <template #append-item>
                  <VListItem
                    v-if="hasMorePages && !loadingEquipment"
                    class="text-center"
                    @click="loadMoreEquipment"
                  >
                    <VListItemTitle class="text-primary">
                      <VIcon
                        icon="tabler-chevron-down"
                        class="me-2"
                      />
                      Cargar más equipos
                    </VListItemTitle>
                  </VListItem>
                  <VListItem
                    v-else-if="loadingEquipment && equipmentOptions.length > 0"
                    class="text-center"
                  >
                    <VListItemTitle class="text-medium-emphasis">
                      <VIcon
                        icon="tabler-loader-2"
                        class="me-2 animate-spin"
                      />
                      Cargando más equipos...
                    </VListItemTitle>
                  </VListItem>
                </template>
              </VAutocomplete>
              
              <!-- Equipment count info -->
              <div
                v-if="equipmentOptions.length > 0"
                class="text-caption text-medium-emphasis mt-2"
              >
                Mostrando {{ equipmentOptions.length }} de {{ totalEquipment }} equipos disponibles
              </div>
            </VCol>

            <!-- Notes Field -->
            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                :label="$t('DrillingReportsModule.equipment.assignNotes')"
                :placeholder="$t('DrillingReportsModule.equipment.assignNotesPlaceholder')"
                :rules="[rules.maxLength]"
                rows="3"
                counter="500"
                clearable
              />
            </VCol>

            <!-- Selected Equipment Details -->
            <VCol
              v-if="selectedEquipment"
              cols="12"
            >
              <VCard
                variant="outlined"
                class="mt-4"
              >
                <VCardTitle class="d-flex align-center gap-2">
                  <VIcon
                    icon="tabler-info-circle"
                    color="primary"
                  />
                  Información del Equipo Seleccionado
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <div class="mb-3">
                        <strong>Nombre:</strong> {{ selectedEquipment.equipment_name }}
                      </div>
                      <div class="mb-3">
                        <strong>Código:</strong> {{ selectedEquipment.equipment_code }}
                      </div>
                      <div class="mb-3">
                        <strong>Tipo:</strong> {{ selectedEquipment.equipment_type }}
                      </div>
                      <div class="mb-3">
                        <strong>Fabricante:</strong> {{ selectedEquipment.manufacturer }}
                      </div>
                      <div class="mb-3">
                        <strong>Modelo:</strong> {{ selectedEquipment.model }}
                      </div>
                      <div class="mb-3">
                        <strong>Número de Serie:</strong> {{ selectedEquipment.serial_number }}
                      </div>
                    </VCol>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <div class="mb-3">
                        <strong>Año de Fabricación:</strong> {{ selectedEquipment.year_manufactured }}
                      </div>
                      <div class="mb-3">
                        <strong>Fecha de Compra:</strong> {{ selectedEquipment.purchase_date }}
                      </div>
                      <div class="mb-3">
                        <strong>Horas de Operación:</strong> {{ selectedEquipment.operating_hours }}h
                      </div>
                      <div class="mb-3">
                        <strong>Estado:</strong> 
                        <VChip
                          :color="selectedEquipment.status === 'active' ? 'success' : 'warning'"
                          size="small"
                          class="ml-2"
                        >
                          {{ selectedEquipment.status }}
                        </VChip>
                      </div>
                      <div class="mb-3">
                        <strong>Último Servicio:</strong> {{ selectedEquipment.last_service_date || 'N/A' }}
                      </div>
                      <div class="mb-3">
                        <strong>Próximo Servicio:</strong> {{ selectedEquipment.next_service_date || 'N/A' }}
                      </div>
                    </VCol>
                  </VRow>

                  <!-- Specifications -->
                  <VRow
                    v-if="selectedEquipment.specifications"
                    class="mt-4"
                  >
                    <VCol cols="12">
                      <h6 class="text-h6 mb-3">
                        Especificaciones Técnicas
                      </h6>
                      <VRow>
                        <VCol
                          v-for="(value, key) in selectedEquipment.specifications"
                          :key="key"
                          cols="12"
                          sm="6"
                          md="4"
                        >
                          <div class="mb-2">
                            <strong>{{ key }}:</strong> {{ value }}
                          </div>
                        </VCol>
                      </VRow>
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          @click="handleClose"
        >
          {{ $t('DrillingReportsModule.common.cancel') }}
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          Asignar Equipo
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
