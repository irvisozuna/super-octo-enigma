<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFineStore } from '../../../../stores/fineStore'
import FineDetailDialog from '../../../../components/dialogs/FineDetailDialog.vue'
import type { Fine } from '../../../../types/fine'

interface Props {
  concession: any
  concessionId?: string
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// Store
const fineStore = useFineStore()

// State
const selectedFine = ref<Fine | null>(null)
const showFineDetail = ref(false)
const activeFilter = ref<'all' | 'unpaid' | 'paid' | 'overdue'>('all')
const searchQuery = ref('')

// Computed
const fines = computed(() => {
  let filteredFines = fineStore.list

  // Apply status filter
  if (activeFilter.value === 'unpaid')
    filteredFines = filteredFines.filter(fine => fine.status === 'ISSUED' || fine.status === 'OVERDUE')
  else if (activeFilter.value === 'paid')
    filteredFines = filteredFines.filter(fine => fine.status === 'PAID')
  else if (activeFilter.value === 'overdue')
    filteredFines = filteredFines.filter(fine => fine.status === 'OVERDUE')

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()

    filteredFines = filteredFines.filter(fine =>
      fine.id.toLowerCase().includes(query)
      || fine.violation_type?.name.toLowerCase().includes(query)
      || fine.place?.toLowerCase().includes(query)
      || fine.concession_holder?.name.toLowerCase().includes(query)
      || fine.vehicle?.plate_number.toLowerCase().includes(query),
    )
  }

  return filteredFines
})

const stats = computed(() => fineStore.stats)

const filteredStats = computed(() => {
  const filtered = fines.value

  return {
    total: filtered.length,
    unpaid: filtered.filter(f => f.status === 'ISSUED' || f.status === 'OVERDUE').length,
    paid: filtered.filter(f => f.status === 'PAID').length,
    overdue: filtered.filter(f => f.status === 'OVERDUE').length,
    total_amount: filtered.reduce((sum, f) => sum + Number.parseFloat(f.total_amount), 0),
    unpaid_amount: filtered
      .filter(f => f.status === 'ISSUED' || f.status === 'OVERDUE')
      .reduce((sum, f) => sum + Number.parseFloat(f.total_amount), 0),
  }
})

// Methods
const loadFines = async () => {
  const concessionId = props.concessionId || props.concession?.id
  if (!concessionId)
    return

  try {
    await fineStore.fetchList(concessionId, {
      include_computed: ['subject_type', 'formatted_amount', 'status_label', 'formatted_location'],
      include_relations: ['vehicle', 'concession_holder', 'violation_type'],
    })
  }
  catch (error) {
    console.error('Error loading fines:', error)
  }
}

const openFineDetail = (fine: Fine) => {
  selectedFine.value = fine
  showFineDetail.value = true
}

const closeFineDetail = () => {
  showFineDetail.value = false
  selectedFine.value = null
}

const refresh = () => {
  loadFines()
  emit('refresh')
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-MX')
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

const getSubjectTypeIcon = (subjectType: string) => {
  const icons = {
    concession: 'tabler-certificate',
    concession_holder: 'tabler-user',
    driver: 'tabler-user-check',
  }

  return icons[subjectType as keyof typeof icons] || 'tabler-file'
}

const isOverdue = (fine: Fine) => {
  return fine.status === 'OVERDUE' || (fine.days_overdue && fine.days_overdue > 0)
}

// Lifecycle
onMounted(() => {
  loadFines()
})

watch(() => props.concessionId || props.concession?.id, newId => {
  if (newId)
    loadFines()
})
</script>

<template>
  <VCard>
    <VCardText class="pa-6">
      <!-- Header with Stats -->
      <div class="d-flex align-center justify-space-between mb-6">
        <h4 class="text-h6 d-flex align-center">
          <VIcon class="me-2">
            tabler-file-dollar
          </VIcon>
          Multas de la Concesión
          <VChip
            v-if="filteredStats.unpaid > 0"
            color="error"
            size="small"
            class="ms-3"
          >
            {{ filteredStats.unpaid }} Pendientes
          </VChip>
        </h4>

        <!-- Summary Stats -->
        <div class="d-flex align-center gap-4">
          <div class="text-center">
            <div class="text-h6 font-weight-bold">
              {{ filteredStats.total }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Total
            </div>
          </div>

          <VDivider vertical />

          <div class="text-center">
            <div class="text-h6 font-weight-bold text-warning">
              {{ filteredStats.unpaid }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Pendientes
            </div>
          </div>

          <VDivider vertical />

          <div class="text-center">
            <div class="text-h6 font-weight-bold text-error">
              {{ formatCurrency(filteredStats.unpaid_amount) }} MXN
            </div>
            <div class="text-caption text-medium-emphasis">
              Monto Pendiente
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <VRow class="mb-4">
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model="searchQuery"
            placeholder="Buscar multas..."
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="compact"
            clearable
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VBtnGroup
            variant="outlined"
            density="compact"
          >
            <VBtn
              :variant="activeFilter === 'all' ? 'flat' : 'outlined'"
              @click="activeFilter = 'all'"
            >
              Todas ({{ stats.total }})
            </VBtn>
            <VBtn
              :variant="activeFilter === 'unpaid' ? 'flat' : 'outlined'"
              @click="activeFilter = 'unpaid'"
            >
              Pendientes ({{ stats.unpaid }})
            </VBtn>
            <VBtn
              :variant="activeFilter === 'paid' ? 'flat' : 'outlined'"
              @click="activeFilter = 'paid'"
            >
              Pagadas ({{ stats.paid }})
            </VBtn>
            <VBtn
              :variant="activeFilter === 'overdue' ? 'flat' : 'outlined'"
              @click="activeFilter = 'overdue'"
            >
              Vencidas ({{ stats.overdue }})
            </VBtn>
          </VBtnGroup>
        </VCol>
      </VRow>

      <!-- Loading State -->
      <div
        v-if="fineStore.loading"
        class="text-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="64"
        />
        <p class="mt-4 text-h6 text-medium-emphasis">
          Cargando multas...
        </p>
      </div>

      <!-- No Fines -->
      <div
        v-else-if="fines.length === 0"
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
          {{ activeFilter === 'all' ? 'Sin Multas Registradas' : 'No hay multas con este filtro' }}
        </h6>
        <p class="text-body-2">
          {{ activeFilter === 'all'
            ? 'Esta concesión no tiene multas registradas.'
            : 'Intenta cambiar los filtros para ver más resultados.'
          }}
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
            :color="isOverdue(fine) ? 'error' : undefined"
            class="fine-card h-100"
            @click="openFineDetail(fine)"
          >
            <VCardText class="pa-4">
              <!-- Header -->
              <div class="d-flex justify-space-between align-start mb-4">
                <div class="d-flex align-center">
                  <VAvatar
                    size="40"
                    :color="getSubjectTypeColor(fine.subject_type)"
                    variant="tonal"
                    class="me-3"
                  >
                    <VIcon>{{ getSubjectTypeIcon(fine.subject_type) }}</VIcon>
                  </VAvatar>

                  <div>
                    <div class="d-flex align-center gap-2 mb-1">
                      <h6 class="text-h6 font-weight-bold">
                        {{ fine.id.slice(-8) }}
                      </h6>
                      <VChip
                        :color="getSubjectTypeColor(fine.subject_type)"
                        size="x-small"
                        variant="outlined"
                        class="text-caption"
                      >
                        <VIcon
                          start
                          size="10"
                        >
                          {{ getSubjectTypeIcon(fine.subject_type) }}
                        </VIcon>
                        {{ getSubjectTypeLabel(fine.subject_type) }}
                      </VChip>
                    </div>
                    <VChip
                      :color="getStatusColor(fine.status)"
                      size="small"
                      variant="tonal"
                    >
                      {{ fine.status_label }}
                    </VChip>
                  </div>
                </div>

                <div class="d-flex flex-column align-end gap-1">
                  <VChip
                    :color="getStatusColor(fine.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ fine.status_label }}
                  </VChip>
                  <VChip
                    v-if="isOverdue(fine)"
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
                    <div :class="{ 'text-error font-weight-bold': isOverdue(fine) }">
                      {{ formatDate(fine.due_date) }}
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="text-caption text-medium-emphasis">
                      Ubicación
                    </div>
                    <div class="font-weight-medium">
                      {{ fine.place || 'No especificada' }}
                    </div>
                  </VCol>
                </VRow>
              </div>

              <!-- Violation Type -->
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis">
                  Tipo de Violación
                </div>
                <div class="font-weight-medium">
                  {{ fine.violation_type?.name || 'No especificado' }}
                </div>
              </div>

              <!-- Subject Details -->
              <div class="mb-4">
                <VAlert
                  :color="getSubjectTypeColor(fine.subject_type)"
                  variant="tonal"
                  density="compact"
                  class="text-caption"
                >
                  <template #prepend>
                    <VIcon size="16">
                      {{ getSubjectTypeIcon(fine.subject_type) }}
                    </VIcon>
                  </template>
                  <span class="font-weight-medium">{{ getSubjectTypeLabel(fine.subject_type) }}:</span>
                  <span v-if="fine.subject_type === 'concession'">{{ props.concession?.concessionNumber }}</span>
                  <span v-else-if="fine.subject_type === 'concession_holder'">{{ fine.concession_holder?.name }}</span>
                  <span v-else-if="fine.subject_type === 'driver'">{{ fine.vehicle?.plate_number || 'Vehículo asociado' }}</span>
                </VAlert>
              </div>

              <!-- Actions -->
              <div class="d-flex gap-2">
                <VBtn
                  variant="outlined"
                  size="small"
                  @click.stop="openFineDetail(fine)"
                >
                  <VIcon start>
                    tabler-eye
                  </VIcon>
                  Ver Detalle
                </VBtn>

                <VBtn
                  v-if="fine.status === 'ISSUED' || fine.status === 'OVERDUE'"
                  color="success"
                  size="small"
                  @click.stop="() => {}"
                >
                  <VIcon start>
                    tabler-credit-card
                  </VIcon>
                  Pagar
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCardText>

    <!-- Fine Detail Dialog -->
    <FineDetailDialog
      v-model:visible="showFineDetail"
      :fine="selectedFine"
      @close="closeFineDetail"
    />
  </VCard>
</template>

<style scoped>
.fine-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.fine-card:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
  transform: translateY(-2px);
}
</style>
