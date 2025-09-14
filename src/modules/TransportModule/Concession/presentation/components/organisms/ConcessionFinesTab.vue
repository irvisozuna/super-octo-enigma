<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  concession: any
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// Computed
const fines = computed(() => {
  // Get fines from different entities related to this concession
  const concessionFines = props.concession?.fines || []
  const holderFines = props.concession?.holder?.fines || []
  const vehicleFines = props.concession?.vehicle?.fines || []
  const driverFines = props.concession?.drivers?.flatMap(driver => driver.fines || []) || []

  // Combine all fines and add entity information
  const allFines = [
    ...concessionFines.map(fine => ({ ...fine, entityType: 'CONCESSION', entityName: 'Concesión' })),
    ...holderFines.map(fine => ({ ...fine, entityType: 'HOLDER', entityName: 'Concesionario' })),
    ...vehicleFines.map(fine => ({ ...fine, entityType: 'VEHICLE', entityName: 'Vehículo' })),
    ...driverFines.map(fine => ({ ...fine, entityType: 'DRIVER', entityName: 'Conductor' })),
  ]

  // Sort by issue date (newest first)
  return allFines.sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date))
})

const unpaidFines = computed(() => fines.value.filter(fine => fine.status === 'unpaid' || fine.status === 'overdue'))

const totalUnpaidAmount = computed(() =>
  unpaidFines.value.reduce((sum, fine) => sum + (fine.amount || 0), 0),
)

const finesByEntity = computed(() => {
  return fines.value.reduce((acc, fine) => {
    if (!acc[fine.entityType])
      acc[fine.entityType] = []

    acc[fine.entityType].push(fine)

    return acc
  }, {})
})

// Methods
const formatCurrency = (amount: number) => {
  if (!amount)
    return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatDate = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

const getStatusColor = (status: string) => {
  const colors = {
    paid: 'success',
    unpaid: 'warning',
    overdue: 'error',
    cancelled: 'secondary',
    contested: 'info',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

const getViolationColor = (type: string) => {
  const colors = {
    speeding: 'error',
    parking: 'warning',
    no_license: 'error',
    reckless_driving: 'error',
    traffic_light: 'warning',
    expired_documents: 'info',
    unauthorized_route: 'error',
    overcapacity: 'warning',
    safety_violation: 'error',
    environmental: 'info',
    administrative: 'secondary',
    other: 'grey',
  }

  return colors[type?.toLowerCase()] || 'grey'
}

const getEntityColor = (entityType: string) => {
  const colors = {
    CONCESSION: 'primary',
    HOLDER: 'success',
    VEHICLE: 'warning',
    DRIVER: 'info',
  }

  return colors[entityType] || 'secondary'
}

const getEntityIcon = (entityType: string) => {
  const icons = {
    CONCESSION: 'tabler-certificate',
    HOLDER: 'tabler-user',
    VEHICLE: 'tabler-car',
    DRIVER: 'tabler-user-check',
  }

  return icons[entityType] || 'tabler-file'
}

const isOverdue = (dueDate: string, status: string) => {
  if (status === 'paid')
    return false
  if (!dueDate)
    return false

  const due = new Date(dueDate)
  const today = new Date()

  return due < today
}

const openFineDetail = (fine: any) => {
  console.log('Opening fine detail:', fine.id)

  // TODO: Navigate to fine detail when routes are available
  // router.push(`/fines/${fine.id}`)
}

const openPaymentDialog = (fine: any) => {
  console.log('Open payment for fine:', fine.id)

  // TODO: Implement payment dialog
}

const openContestDialog = (fine: any) => {
  console.log('Open contest for fine:', fine.id)

  // TODO: Implement contest dialog
}

const openPhotoViewer = (photos: any) => {
  console.log('Open photo viewer:', photos)

  // TODO: Implement photo viewer
}
</script>

<template>
  <VCard>
    <VCardText class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <h4 class="text-h6 d-flex align-center">
          <VIcon class="me-2">
            tabler-file-dollar
          </VIcon>
          {{ t('TransportModule.concession.tabs.fines') }}
          <VChip
            v-if="unpaidFines.length > 0"
            color="error"
            size="small"
            class="ms-3"
          >
            {{ unpaidFines.length }} {{ t('TransportModule.fine.unpaid') }}
          </VChip>
        </h4>

        <!-- Summary Stats -->
        <div class="d-flex align-center gap-4">
          <div class="text-center">
            <div class="text-h6 font-weight-bold">
              {{ fines.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Total de Multas
            </div>
          </div>

          <VDivider vertical />

          <div class="text-center">
            <div class="text-h6 font-weight-bold text-warning">
              {{ unpaidFines.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Pendientes
            </div>
          </div>

          <VDivider vertical />

          <div class="text-center">
            <div class="text-h6 font-weight-bold text-error">
              {{ formatCurrency(totalUnpaidAmount) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Monto Pendiente
            </div>
          </div>
        </div>
      </div>

      <!-- No Fines -->
      <div
        v-if="fines.length === 0"
        class="text-center py-12"
      >
        <VIcon
          size="64"
          color="success"
          class="mb-4"
        >
          tabler-shield-check
        </VIcon>
        <h6 class="text-h6 mb-2">
          Sin Multas Registradas
        </h6>
        <p class="text-body-2">
          Esta concesión y sus entidades relacionadas (concesionario, vehículo, conductores) no tienen multas registradas.
        </p>
      </div>

      <!-- Fines List -->
      <VRow v-else>
        <VCol
          v-for="fine in fines"
          :key="fine.id"
          cols="12"
          lg="6"
        >
          <VCard
            variant="elevated"
            :color="isOverdue(fine.due_date, fine.status) ? 'error' : undefined"
            class="fine-card h-100"
          >
            <VCardText class="pa-4">
              <!-- Header -->
              <div class="d-flex justify-space-between align-start mb-4">
                <div class="d-flex align-center">
                  <VAvatar
                    size="40"
                    :color="getViolationColor(fine.violation_type)"
                    variant="tonal"
                    class="me-3"
                  >
                    <VIcon>tabler-alert-triangle</VIcon>
                  </VAvatar>

                  <div>
                    <div class="d-flex align-center gap-2 mb-1">
                      <h6 class="text-h6 font-weight-bold">
                        {{ fine.fine_number || fine.number }}
                      </h6>
                      <VChip
                        :color="getEntityColor(fine.entityType)"
                        size="x-small"
                        variant="outlined"
                        class="text-caption"
                      >
                        <VIcon
                          start
                          size="10"
                        >
                          {{ getEntityIcon(fine.entityType) }}
                        </VIcon>
                        {{ fine.entityName }}
                      </VChip>
                    </div>
                    <VChip
                      :color="getViolationColor(fine.violation_type)"
                      size="small"
                      variant="tonal"
                    >
                      {{ fine.violation_type_label || fine.violation_type }}
                    </VChip>
                  </div>
                </div>

                <div class="d-flex flex-column align-end gap-1">
                  <VChip
                    :color="getStatusColor(fine.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ fine.status_label || fine.status }}
                  </VChip>
                  <VChip
                    v-if="isOverdue(fine.due_date, fine.status)"
                    color="error"
                    size="x-small"
                    variant="outlined"
                  >
                    <VIcon
                      start
                      size="10"
                    >
                      tabler-clock-exclamation
                    </VIcon>
                    VENCIDA
                  </VChip>
                </div>
              </div>

              <!-- Fine Details -->
              <div class="mb-4">
                <VRow dense>
                  <VCol cols="6">
                    <div class="text-caption text-medium-emphasis">
                      Monto
                    </div>
                    <div class="font-weight-bold text-h6 text-error">
                      {{ formatCurrency(fine.amount) }}
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="text-caption text-medium-emphasis">
                      Fecha de Emisión
                    </div>
                    <div class="font-weight-medium">
                      {{ formatDate(fine.issue_date) }}
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="text-caption text-medium-emphasis">
                      Fecha Límite
                    </div>
                    <div :class="{ 'text-error font-weight-bold': isOverdue(fine.due_date, fine.status) }">
                      {{ formatDate(fine.due_date) }}
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="text-caption text-medium-emphasis">
                      Ubicación
                    </div>
                    <div class="font-weight-medium">
                      {{ fine.location || 'No especificada' }}
                    </div>
                  </VCol>
                  <VCol
                    v-if="fine.officer_name"
                    cols="12"
                  >
                    <div class="text-caption text-medium-emphasis">
                      Oficial
                    </div>
                    <div class="font-weight-medium">
                      {{ fine.officer_name }}
                    </div>
                  </VCol>
                </VRow>
              </div>

              <!-- Photos Section -->
              <div
                v-if="fine.photos && fine.photos.length > 0"
                class="mb-4"
              >
                <div class="text-subtitle-2 font-weight-medium mb-2 d-flex align-center">
                  <VIcon
                    class="me-2"
                    size="18"
                  >
                    tabler-camera
                  </VIcon>
                  {{ t('TransportModule.fine.evidence_photos') }}
                </div>

                <div class="d-flex gap-2 flex-wrap">
                  <VCard
                    v-for="photo in fine.photos.slice(0, 3)"
                    :key="photo.id"
                    variant="tonal"
                    class="photo-thumbnail"
                    width="64"
                    height="64"
                  >
                    <VImg
                      :src="photo.thumbnail_url"
                      :alt="photo.description"
                      cover
                      class="rounded cursor-pointer"
                      @click="openPhotoViewer(photo)"
                    />
                  </VCard>

                  <VCard
                    v-if="fine.photos.length > 3"
                    variant="tonal"
                    color="grey"
                    width="64"
                    height="64"
                    class="d-flex align-center justify-center cursor-pointer"
                    @click="openPhotoViewer(fine.photos)"
                  >
                    <span class="text-caption font-weight-bold">+{{ fine.photos.length - 3 }}</span>
                  </VCard>
                </div>
              </div>

              <!-- Description -->
              <div
                v-if="fine.description || fine.notes"
                class="mb-4"
              >
                <div class="text-subtitle-2 font-weight-medium mb-1">
                  Descripción
                </div>
                <p class="text-body-2 mb-0">
                  {{ fine.description || fine.notes }}
                </p>
              </div>

              <!-- Entity Details -->
              <div class="mb-4">
                <VAlert
                  :color="getEntityColor(fine.entityType)"
                  variant="tonal"
                  density="compact"
                  class="text-caption"
                >
                  <template #prepend>
                    <VIcon size="16">
                      {{ getEntityIcon(fine.entityType) }}
                    </VIcon>
                  </template>
                  <span class="font-weight-medium">{{ fine.entityName }}:</span>
                  <span v-if="fine.entityType === 'CONCESSION'">{{ props.concession?.concessionNumber }}</span>
                  <span v-else-if="fine.entityType === 'HOLDER'">{{ props.concession?.holder?.fullName }}</span>
                  <span v-else-if="fine.entityType === 'VEHICLE'">{{ fine.vehicle_plate || 'Vehículo asociado' }}</span>
                  <span v-else-if="fine.entityType === 'DRIVER'">{{ fine.driver_name || 'Conductor asociado' }}</span>
                </VAlert>
              </div>

              <!-- Actions -->
              <div class="d-flex gap-2">
                <VBtn
                  variant="outlined"
                  size="small"
                  @click="openFineDetail(fine)"
                >
                  <VIcon start>
                    tabler-eye
                  </VIcon>
                  Ver Detalle
                </VBtn>

                <VBtn
                  v-if="fine.status === 'unpaid' || fine.status === 'overdue'"
                  color="success"
                  size="small"
                  @click="openPaymentDialog(fine)"
                >
                  <VIcon start>
                    tabler-credit-card
                  </VIcon>
                  Pagar
                </VBtn>

                <VBtn
                  v-if="fine.status === 'unpaid' && fine.can_contest"
                  color="info"
                  variant="outlined"
                  size="small"
                  @click="openContestDialog(fine)"
                >
                  <VIcon start>
                    tabler-gavel
                  </VIcon>
                  Impugnar
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.fine-card {
  transition: all 0.3s ease;
}

.fine-card:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
  transform: translateY(-2px);
}

.photo-thumbnail {
  transition: all 0.2s ease;
}

.photo-thumbnail:hover {
  transform: scale(1.05);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
