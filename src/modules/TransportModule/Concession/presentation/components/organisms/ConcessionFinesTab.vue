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
const fines = computed(() => props.concession?.fines || [])
const unpaidFines = computed(() => fines.value.filter(fine => fine.status === 'unpaid'))

const totalUnpaidAmount = computed(() =>
  unpaidFines.value.reduce((sum, fine) => sum + (fine.amount || 0), 0),
)

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
    speeding: 'red',
    parking: 'orange',
    no_license: 'error',
    reckless_driving: 'error',
    traffic_light: 'warning',
    other: 'grey',
  }

  return colors[type?.toLowerCase()] || 'grey'
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
  navigateTo(`/fines/${fine.id}`)
}

const openPaymentDialog = (fine: any) => {
  // Open payment processing dialog
  console.log('Open payment for fine:', fine.id)
}
</script>

<template>
  <VCardText class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <h4 class="text-h6 d-flex align-center">
        <VIcon class="me-2">
          tabler-file-dollar
        </VIcon>
        {{ t('concession.tabs.fines') }}
        <VChip
          v-if="unpaidFines.length > 0"
          color="error"
          size="small"
          class="ms-3"
        >
          {{ unpaidFines.length }} {{ t('fine.unpaid') }}
        </VChip>
      </h4>

      <!-- Summary Stats -->
      <div class="d-flex align-center gap-4">
        <div class="text-center">
          <div class="text-h6 font-weight-bold">
            {{ fines.length }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('fine.total_fines') }}
          </div>
        </div>

        <VDivider vertical />

        <div class="text-center">
          <div class="text-h6 font-weight-bold text-error">
            {{ formatCurrency(totalUnpaidAmount) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('fine.unpaid_amount') }}
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
        {{ t('concession.fines.no_fines') }}
      </h6>
      <p class="text-body-2">
        {{ t('concession.fines.no_fines_description') }}
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
          variant="outlined"
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
                  <h6 class="text-h6 font-weight-bold">
                    {{ fine.fine_number }}
                  </h6>
                  <VChip
                    :color="getViolationColor(fine.violation_type)"
                    size="small"
                    variant="tonal"
                  >
                    {{ fine.violation_type }}
                  </VChip>
                </div>
              </div>

              <VChip
                :color="getStatusColor(fine.status)"
                size="small"
                variant="tonal"
              >
                {{ fine.status }}
              </VChip>
            </div>

            <!-- Fine Details -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2 text-medium-emphasis">{{ t('fine.fields.amount') }}:</span>
                <span class="font-weight-bold text-h6">{{ formatCurrency(fine.amount) }}</span>
              </div>

              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2 text-medium-emphasis">{{ t('fine.fields.issue_date') }}:</span>
                <span>{{ formatDate(fine.issue_date) }}</span>
              </div>

              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2 text-medium-emphasis">{{ t('fine.fields.due_date') }}:</span>
                <span :class="{ 'text-error font-weight-medium': isOverdue(fine.due_date, fine.status) }">
                  {{ formatDate(fine.due_date) }}
                  <VIcon
                    v-if="isOverdue(fine.due_date, fine.status)"
                    color="error"
                    size="16"
                    class="ms-1"
                  >
                    tabler-clock-exclamation
                  </VIcon>
                </span>
              </div>

              <div
                v-if="fine.location"
                class="d-flex justify-space-between mb-2"
              >
                <span class="text-body-2 text-medium-emphasis">{{ t('fine.fields.location') }}:</span>
                <span>{{ fine.location }}</span>
              </div>
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
                {{ t('fine.evidence_photos') }}
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
              v-if="fine.description"
              class="mb-4"
            >
              <div class="text-subtitle-2 font-weight-medium mb-1">
                {{ t('fine.fields.description') }}
              </div>
              <p class="text-body-2 mb-0">
                {{ fine.description }}
              </p>
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
                {{ t('common.view') }}
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
                {{ t('fine.actions.pay') }}
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VCardText>
</template>

<style scoped>
.fine-card {
  transition: all 0.3s ease;
}

.fine-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
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
