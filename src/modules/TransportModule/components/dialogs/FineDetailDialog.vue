<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFineStore } from '../../stores/fineStore'
import type { Fine } from '../../types/fine'
import MapComponent from '@/components/MapComponent.vue'

interface Props {
  visible: boolean
  fineId?: string
  fine?: Fine
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const fineStore = useFineStore()

// State
const loading = ref(false)
const activeTab = ref(0)

// Computed
const fine = computed(() => props.fine || fineStore.currentItem)

const hasLocation = computed(() => {
  const hasCoords = fine.value?.latitude && fine.value?.longitude
  console.log('🗺️ Fine location check:', {
    fine: fine.value?.id,
    latitude: fine.value?.latitude,
    longitude: fine.value?.longitude,
    hasLocation: hasCoords
  })
  return hasCoords
})

const mapCenter = computed(() => {
  const center = {
    lat: fine.value?.latitude || 19.4326,
    lng: fine.value?.longitude || -99.1332
  }
  console.log('🗺️ Map center:', center)
  return center
})

const mapboxToken = computed(() => {
  const token = import.meta.env.VITE_MAPBOX_KEY || ''
  console.log('🗺️ Mapbox token:', token ? 'Configured' : 'Not configured')
  return token
})

// Methods
const close = () => {
  emit('close')
}

const loadFineDetail = async () => {
  if (!props.fineId || props.fine) return

  loading.value = true
  try {
    await fineStore.fetchById(props.fineId)
  } catch (error) {
    console.error('Error loading fine detail:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusColor = (status: string) => {
  const colors = {
    DRAFT: 'grey',
    ISSUED: 'warning',
    PAID: 'success',
    CANCELLED: 'secondary',
    OVERDUE: 'error',
    APPEALED: 'info',
  }
  return colors[status as keyof typeof colors] || 'grey'
}

const getSubjectTypeColor = (subjectType: string) => {
  const colors = {
    concession: 'primary',
    concession_holder: 'success',
    driver: 'info',
  }
  return colors[subjectType as keyof typeof colors] || 'secondary'
}

const getSubjectTypeLabel = (subjectType: string) => {
  const labels = {
    concession: 'Concesión',
    concession_holder: 'Concesionario',
    driver: 'Conductor',
  }
  return labels[subjectType as keyof typeof labels] || subjectType
}

const getSeverityColor = (severity: string) => {
  const colors = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'error',
    CRITICAL: 'error',
  }
  return colors[severity as keyof typeof colors] || 'grey'
}

// Lifecycle
onMounted(() => {
  if (props.fineId) {
    loadFineDetail()
  }
})

watch(() => props.fineId, (newId) => {
  if (newId && props.visible) {
    loadFineDetail()
  }
})
</script>

<template>
  <VDialog
    :model-value="visible"
    max-width="1200"
    persistent
    scrollable
  >
    <VCard>
      <!-- Header -->
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <VIcon
            icon="tabler-file-dollar"
            class="me-3"
            size="24"
          />
          <div>
            <h3 class="text-h5">
              Detalle de Multa
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-0">
              {{ fine?.violation_type?.name || 'Cargando...' }}
            </p>
          </div>
        </div>
        
        <VBtn
          icon
          variant="text"
          @click="close"
        >
          <VIcon>tabler-x</VIcon>
        </VBtn>
      </VCardTitle>

      <VDivider />

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="64"
        />
        <p class="mt-4 text-h6 text-medium-emphasis">
          Cargando detalles de la multa...
        </p>
      </div>

      <!-- Content -->
      <template v-else-if="fine">
        <VTabs v-model="activeTab">
          <VTab>
            <VIcon
              icon="tabler-info-circle"
              class="me-2"
            />
            Información
          </VTab>
          <VTab>
            <VIcon
              icon="tabler-map-pin"
              class="me-2"
            />
            Ubicación
          </VTab>
          <VTab v-if="fine.photos && fine.photos.length > 0">
            <VIcon
              icon="tabler-camera"
              class="me-2"
            />
            Evidencias
          </VTab>
          <VTab v-if="fine.payments && fine.payments.length > 0">
            <VIcon
              icon="tabler-credit-card"
              class="me-2"
            />
            Pagos
          </VTab>
        </VTabs>

        <VWindow v-model="activeTab">
          <!-- Información Tab -->
          <VWindowItem>
            <VCardText class="pa-6">
              <VRow>
                <!-- Información Principal -->
                <VCol cols="12" md="8">
                  <VCard variant="outlined">
                    <VCardTitle class="text-h6">
                      Información de la Multa
                    </VCardTitle>
                    <VCardText>
                      <VRow>
                        <VCol cols="6">
                          <div class="text-caption text-medium-emphasis">
                            Número de Multa
                          </div>
                          <div class="text-h6 font-weight-bold">
                            {{ fine.id }}
                          </div>
                        </VCol>
                        <VCol cols="6">
                          <div class="text-caption text-medium-emphasis">
                            Estado
                          </div>
                          <VChip
                            :color="getStatusColor(fine.status)"
                            size="small"
                            variant="tonal"
                          >
                            {{ fine.status_label }}
                          </VChip>
                        </VCol>
                        <VCol cols="6">
                          <div class="text-caption text-medium-emphasis">
                            Monto Base
                          </div>
                          <div class="text-h6 font-weight-bold text-error">
                            {{ formatCurrency(fine.base_amount) }}
                          </div>
                        </VCol>
                        <VCol cols="6">
                          <div class="text-caption text-medium-emphasis">
                            Monto Total
                          </div>
                          <div class="text-h6 font-weight-bold text-error">
                            {{ fine.formatted_amount }}
                          </div>
                        </VCol>
                        <VCol cols="6">
                          <div class="text-caption text-medium-emphasis">
                            Fecha de Emisión
                          </div>
                          <div class="font-weight-medium">
                            {{ formatDate(fine.issued_at) }}
                          </div>
                        </VCol>
                        <VCol cols="6">
                          <div class="text-caption text-medium-emphasis">
                            Fecha Límite
                          </div>
                          <div 
                            :class="{ 
                              'text-error font-weight-bold': fine.is_overdue,
                              'font-weight-medium': !fine.is_overdue 
                            }"
                          >
                            {{ formatDate(fine.due_date) }}
                          </div>
                        </VCol>
                        <VCol cols="12" v-if="fine.place">
                          <div class="text-caption text-medium-emphasis">
                            Lugar
                          </div>
                          <div class="font-weight-medium">
                            {{ fine.place }}
                          </div>
                        </VCol>
                        <VCol cols="12" v-if="fine.notes">
                          <div class="text-caption text-medium-emphasis">
                            Notas
                          </div>
                          <div class="font-weight-medium">
                            {{ fine.notes }}
                          </div>
                        </VCol>
                      </VRow>
                    </VCardText>
                  </VCard>
                </VCol>

                <!-- Información del Sujeto -->
                <VCol cols="12" md="4">
                  <VCard variant="outlined">
                    <VCardTitle class="text-h6">
                      Sujeto de la Multa
                    </VCardTitle>
                    <VCardText>
                      <div class="text-center mb-4">
                        <VAvatar
                          :color="getSubjectTypeColor(fine.subject_type)"
                          size="64"
                          variant="tonal"
                        >
                          <VIcon size="32">
                            {{ fine.subject_type === 'concession' ? 'tabler-certificate' : 
                               fine.subject_type === 'concession_holder' ? 'tabler-user' : 'tabler-user-check' }}
                          </VIcon>
                        </VAvatar>
                        <div class="mt-2">
                          <VChip
                            :color="getSubjectTypeColor(fine.subject_type)"
                            size="small"
                            variant="tonal"
                          >
                            {{ getSubjectTypeLabel(fine.subject_type) }}
                          </VChip>
                        </div>
                      </div>

                      <!-- Información específica según el tipo de sujeto -->
                      <div v-if="fine.subject_type === 'concession' && fine.concession">
                        <div class="text-caption text-medium-emphasis">
                          Número de Concesión
                        </div>
                        <div class="font-weight-bold">
                          {{ fine.concession.concession_number }}
                        </div>
                      </div>

                      <div v-else-if="fine.subject_type === 'concession_holder' && fine.concession_holder">
                        <div class="text-caption text-medium-emphasis">
                          Nombre
                        </div>
                        <div class="font-weight-bold">
                          {{ fine.concession_holder.name }}
                        </div>
                        <div class="text-caption text-medium-emphasis mt-2">
                          Documento
                        </div>
                        <div class="font-weight-medium">
                          {{ fine.concession_holder.document_number }}
                        </div>
                      </div>

                      <div v-else-if="fine.subject_type === 'driver' && fine.vehicle">
                        <div class="text-caption text-medium-emphasis">
                          Vehículo
                        </div>
                        <div class="font-weight-bold">
                          {{ fine.vehicle.plate_number }}
                        </div>
                        <div class="text-caption text-medium-emphasis mt-2">
                          Marca/Modelo
                        </div>
                        <div class="font-weight-medium">
                          {{ fine.vehicle.brand }} {{ fine.vehicle.model }}
                        </div>
                      </div>
                    </VCardText>
                  </VCard>

                  <!-- Tipo de Violación -->
                  <VCard 
                    v-if="fine.violation_type"
                    variant="outlined"
                    class="mt-4"
                  >
                    <VCardTitle class="text-h6">
                      Tipo de Violación
                    </VCardTitle>
                    <VCardText>
                      <div class="text-center">
                        <VChip
                          :color="getSeverityColor(fine.violation_type.severity)"
                          size="small"
                          variant="tonal"
                          class="mb-2"
                        >
                          {{ fine.violation_type.severity }}
                        </VChip>
                        <div class="font-weight-bold">
                          {{ fine.violation_type.name }}
                        </div>
                        <div 
                          v-if="fine.violation_type.description"
                          class="text-caption text-medium-emphasis mt-2"
                        >
                          {{ fine.violation_type.description }}
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </VCardText>
          </VWindowItem>

          <!-- Ubicación Tab -->
          <VWindowItem>
            <VCardText class="pa-6">
              <VRow>
                <VCol cols="12">
                  <VCard variant="outlined">
                    <VCardTitle class="text-h6">
                      <VIcon
                        icon="tabler-map-pin"
                        class="me-2"
                      />
                      Ubicación de la Multa
                    </VCardTitle>
                    <VCardText class="pa-0">
                      <!-- Mapa con ubicación -->
                      <div v-if="hasLocation">
                        <MapComponent
                          :latitude="mapCenter.lat"
                          :longitude="mapCenter.lng"
                          :access-token="mapboxToken"
                          map-type="fine_location"
                        />
                      </div>
                      
                      <!-- Sin ubicación -->
                      <div v-else class="text-center py-12">
                        <VIcon
                          size="64"
                          color="warning"
                          class="mb-4"
                        >
                          tabler-map-pin-off
                        </VIcon>
                        <h6 class="text-h6 mb-2">
                          Sin Ubicación Registrada
                        </h6>
                        <p class="text-body-2 text-medium-emphasis">
                          Esta multa no tiene coordenadas de ubicación registradas.
                        </p>
                        <VAlert
                          type="info"
                          variant="tonal"
                          class="mt-4"
                        >
                          <template #prepend>
                            <VIcon>tabler-info-circle</VIcon>
                          </template>
                          <div>
                            <strong>Coordenadas disponibles:</strong><br>
                            Latitud: {{ fine?.latitude || 'No disponible' }}<br>
                            Longitud: {{ fine?.longitude || 'No disponible' }}
                          </div>
                        </VAlert>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </VCardText>
          </VWindowItem>

          <!-- Evidencias Tab -->
          <VWindowItem v-if="fine.photos && fine.photos.length > 0">
            <VCardText class="pa-6">
              <VRow>
                <VCol cols="12">
                  <VCard variant="outlined">
                    <VCardTitle class="text-h6">
                      <VIcon
                        icon="tabler-camera"
                        class="me-2"
                      />
                      Evidencias Fotográficas
                    </VCardTitle>
                    <VCardText>
                      <VRow>
                        <VCol
                          v-for="photo in fine.photos"
                          :key="photo.id"
                          cols="12"
                          sm="6"
                          md="4"
                        >
                          <VCard
                            variant="outlined"
                            class="photo-card"
                          >
                            <VImg
                              :src="photo.url"
                              :alt="photo.description"
                              height="200"
                              cover
                              class="cursor-pointer"
                              @click="() => {}"
                            />
                            <VCardText v-if="photo.description">
                              <p class="text-caption text-medium-emphasis mb-0">
                                {{ photo.description }}
                              </p>
                            </VCardText>
                          </VCard>
                        </VCol>
                      </VRow>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </VCardText>
          </VWindowItem>

          <!-- Pagos Tab -->
          <VWindowItem v-if="fine.payments && fine.payments.length > 0">
            <VCardText class="pa-6">
              <VRow>
                <VCol cols="12">
                  <VCard variant="outlined">
                    <VCardTitle class="text-h6">
                      <VIcon
                        icon="tabler-credit-card"
                        class="me-2"
                      />
                      Historial de Pagos
                    </VCardTitle>
                    <VCardText>
                      <VList>
                        <VListItem
                          v-for="payment in fine.payments"
                          :key="payment.id"
                        >
                          <template #prepend>
                            <VAvatar
                              :color="payment.status === 'COMPLETED' ? 'success' : 'warning'"
                              variant="tonal"
                            >
                              <VIcon>
                                {{ payment.method === 'CASH' ? 'tabler-cash' : 
                                   payment.method === 'CARD' ? 'tabler-credit-card' : 'tabler-building-bank' }}
                              </VIcon>
                            </VAvatar>
                          </template>
                          <VListItemTitle>
                            {{ formatCurrency(payment.amount) }}
                          </VListItemTitle>
                          <VListItemSubtitle>
                            {{ payment.method }} - {{ formatDate(payment.paid_at) }}
                          </VListItemSubtitle>
                          <template #append>
                            <VChip
                              :color="payment.status === 'COMPLETED' ? 'success' : 'warning'"
                              size="small"
                              variant="tonal"
                            >
                              {{ payment.status }}
                            </VChip>
                          </template>
                        </VListItem>
                      </VList>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </VCardText>
          </VWindowItem>
        </VWindow>
      </template>

      <!-- Error State -->
      <VAlert
        v-else-if="!loading"
        type="error"
        variant="tonal"
        class="ma-6"
      >
        No se pudo cargar la información de la multa
      </VAlert>

      <!-- Actions -->
      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="outlined"
          @click="close"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.photo-card {
  transition: all 0.3s ease;
}

.photo-card:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
  transform: translateY(-2px);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
