<script setup lang="ts">
import { computed, onMounted, ref, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConcessionStore } from '../stores/concessionStore'

// Components
import ConcessionOverviewTab from '../components/organisms/ConcessionOverviewTab.vue'
import ConcessionVehiclesTab from '../components/organisms/ConcessionVehiclesTab.vue'
import ConcessionHoldersTab from '../components/organisms/ConcessionHoldersTab.vue'
import ConcessionFinesTab from '../components/organisms/ConcessionFinesTab.vue'
import ConcessionPaymentsTab from '../components/organisms/ConcessionPaymentsTab.vue'
import DocumentManagerTab from '../../../shared/presentation/components/organisms/DocumentManagerTab.vue'
import ConcessionHistoryTab from '../components/organisms/ConcessionHistoryTab.vue'

// Dialogs
import ConcessionEditDialogMolecule from '../components/molecules/ConcessionEditDialogMolecule.vue'
import ConcessionDeleteDialogMolecule from '../components/molecules/ConcessionDeleteDialogMolecule.vue'
import ConcessionVerificationDialogMolecule from '../components/molecules/ConcessionVerificationDialogMolecule.vue'

// Composables
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const concessionStore = useConcessionStore()

// Reactive data
const loading = ref(true)
const activeTab = ref(0)
const concessionId = computed(() => route.params.id as string)
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const verificationDialogVisible = ref(false)

// Computed
const concession = computed(() => concessionStore.currentItem)

// Log concession para debugging
watch(concession, (newConcession) => {
  console.log('🏢 Concession loaded:', {
    id: newConcession?.id,
    idType: typeof newConcession?.id,
    idLength: newConcession?.id?.length,
    concessionNumber: newConcession?.concession_number,
    status: newConcession?.status,
    fullObject: newConcession
  })
}, { immediate: true })

const canVerify = computed(() => {
  // TODO: Check user permissions for verification
  // In a real implementation, this would check user roles like:
  // - Supervisor
  // - Administrator
  // - Verification Officer
  return true // For now, allow all users
})

const canDelete = computed(() => {
  // Only allow deletion if concession is in PENDING status
  // and user has appropriate permissions
  return concession.value?.status === 'PENDING' && canVerify.value
})

const generateComplianceReport = () => {
  console.log('Generating compliance report for concession:', concession.value?.id)
  // TODO: Implement compliance report generation
  // This would generate a detailed PDF report with:
  // - Current status and compliance level
  // - Document verification status
  // - Expiration dates and renewal requirements
  // - Vehicle and driver information
  // - Fine and payment history
  // - Regulatory compliance checklist
}

const tabs = ref([
  {
    title: 'Información Básica',
    icon: 'tabler-info-circle',
    component: markRaw(ConcessionOverviewTab),
  },
  {
    title: 'Vehículos Activos',
    icon: 'tabler-car',
    component: markRaw(ConcessionVehiclesTab),
  },
  {
    title: 'Concesionario',
    icon: 'tabler-user',
    component: markRaw(ConcessionHoldersTab),
  },
  {
    title: 'Multas',
    icon: 'tabler-alert-triangle',
    component: markRaw(ConcessionFinesTab),
  },
  {
    title: 'Documentos',
    icon: 'tabler-files',
    component: markRaw(DocumentManagerTab),
  },
  {
    title: 'Historial',
    icon: 'tabler-history',
    component: markRaw(ConcessionHistoryTab),
  },
])


// Methods
const fetchConcessionDetail = async () => {
  if (!concessionId.value) {
    router.push({ name: 'concessionsList' })

    return
  }

  loading.value = true
  try {
    await concessionStore.fetchById(concessionId.value)
  }
  catch (error) {
    console.error('Error loading concession:', error)
    // Handle error - maybe show toast
  }
  finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'concessionsList' })
}

const openEditDialog = () => {
  editDialogVisible.value = true
}

const openDeleteDialog = () => {
  deleteDialogVisible.value = true
}

const openVerificationDialog = () => {
  verificationDialogVisible.value = true
}

const handleEditSuccess = () => {
  editDialogVisible.value = false
  fetchConcessionDetail()
}

const handleDeleteSuccess = () => {
  deleteDialogVisible.value = false
  router.push({ name: 'concessionsList' })
}

const handleVerificationSuccess = () => {
  verificationDialogVisible.value = false
  fetchConcessionDetail()
}

const getStatusColor = (status: string) => {
  const colors = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    EXPIRED: 'error',
    SUSPENDED: 'error',
    PENDING: 'info',
    REVOKED: 'error'
  }

  return colors[status?.toUpperCase()] || 'default'
}

const getStatusIcon = (status: string) => {
  const icons = {
    ACTIVE: 'tabler-circle-check',
    INACTIVE: 'tabler-circle-x',
    EXPIRED: 'tabler-calendar-x',
    SUSPENDED: 'tabler-pause',
    PENDING: 'tabler-clock',
    REVOKED: 'tabler-ban'
  }

  return icons[status?.toUpperCase()] || 'tabler-help-circle'
}

const getComplianceStatus = () => {
  if (!concession.value) return 'PENDIENTE'

  const c = concession.value
  if (c.isExpired) return 'NO CUMPLE'
  if (!c.isActive) return 'INACTIVA'
  if (c.status === 'SUSPENDED') return 'SUSPENDIDA'
  if (c.daysUntilExpiration <= 30) return 'POR REVISAR'

  // Check document compliance
  const docStatus = getDocumentComplianceStatus()
  if (docStatus === 'missing') return 'DOCUMENTOS FALTANTES'
  if (docStatus === 'expiring') return 'DOCS. POR VENCER'

  return 'CUMPLE'
}

const getComplianceColor = () => {
  const status = getComplianceStatus()
  const colors = {
    'CUMPLE': 'success',
    'POR REVISAR': 'warning',
    'NO CUMPLE': 'error',
    'SUSPENDIDA': 'error',
    'INACTIVA': 'warning',
    'DOCUMENTOS FALTANTES': 'error',
    'DOCS. POR VENCER': 'warning',
    'PENDIENTE': 'info'
  }

  return colors[status] || 'default'
}

const getDocumentComplianceStatus = () => {
  // This would normally check the actual document status from the API
  // For now, simulate document compliance checking
  if (!concession.value) return 'unknown'

  // In a real implementation, this would check:
  // - Required documents are uploaded and approved
  // - Documents are not expired
  // - Documents are properly verified

  return 'complete' // Assume complete for now
}

const getDocumentComplianceLabel = () => {
  const status = getDocumentComplianceStatus()
  const labels = {
    'missing': 'Docs. Faltantes',
    'expiring': 'Docs. por Vencer',
    'expired': 'Docs. Vencidos',
    'pending': 'Docs. Pendientes'
  }

  return labels[status] || 'Verificar Docs.'
}

const isExpiringSoon = (expiryDate: string, days = 90) => {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

const formatDate = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  fetchConcessionDetail()
})
</script>

<template>
  <div class="concession-detail">
    <!-- Header Information -->
    <VRow>
      <VCol>
        <VCard>
          <VCardTitle>
            <VSheet class="d-flex mb-6">
              <VSheet class="ma-2 pa-2 me-auto">
                <VBtn
                  icon
                  variant="text"
                  @click="goBack"
                  class="me-4"
                >
                  <VIcon>tabler-arrow-left</VIcon>
                </VBtn>
                <span class="text-h6">Concesión:</span>
                <span class="text-h6 ms-2">
                  <VChip color="primary">{{ concession?.concessionNumber || 'Cargando...' }}</VChip>
                </span>
                <span class="text-h6 ms-4">Modalidad:</span>
                <span class="text-h6 ms-2">
                  <VChip color="info">{{ concession?.modalityLabel || 'Cargando...' }}</VChip>
                </span>
              </VSheet>
              <VSheet class="ma-2 pa-2">
                <!-- Main Status -->
                <VChip
                  :color="getStatusColor(concession?.status)"
                  class="me-2"
                  size="default"
                >
                  <VIcon start size="14">{{ getStatusIcon(concession?.status) }}</VIcon>
                  {{ concession?.statusLabel || 'Pendiente' }}
                </VChip>

                <!-- Compliance Status -->
                <VChip
                  :color="getComplianceColor()"
                  class="me-2"
                  variant="outlined"
                >
                  <VIcon start size="14">tabler-shield-check</VIcon>
                  {{ getComplianceStatus() }}
                </VChip>

                <!-- Expiration Status -->
                <VChip
                  v-if="concession?.isExpired"
                  color="error"
                  class="me-2"
                  variant="flat"
                >
                  <VIcon start size="14">tabler-calendar-x</VIcon>
                  VENCIDA - REQUIERE RENOVACIÓN
                </VChip>
                <VChip
                  v-else-if="concession?.daysUntilExpiration <= 30"
                  color="warning"
                  class="me-2"
                  variant="flat"
                >
                  <VIcon start size="14">tabler-clock-exclamation</VIcon>
                  VENCE EN {{ concession?.daysUntilExpiration }} DÍAS
                </VChip>
                <VChip
                  v-else-if="concession?.daysUntilExpiration <= 90"
                  color="info"
                  class="me-2"
                  variant="tonal"
                >
                  <VIcon start size="14">tabler-info-circle</VIcon>
                  {{ concession?.daysUntilExpiration }} días restantes
                </VChip>
                <VChip
                  v-else-if="concession?.isActive"
                  color="success"
                  class="me-2"
                  variant="tonal"
                >
                  <VIcon start size="14">tabler-circle-check</VIcon>
                  VIGENTE
                </VChip>

                <!-- Document Status -->
                <VChip
                  v-if="getDocumentComplianceStatus() !== 'complete'"
                  :color="getDocumentComplianceStatus() === 'missing' ? 'error' : 'warning'"
                  size="small"
                  variant="outlined"
                >
                  <VIcon start size="12">tabler-file-alert</VIcon>
                  {{ getDocumentComplianceLabel() }}
                </VChip>
              </VSheet>
            </VSheet>
          </VCardTitle>
          <VCardText>
            <VRow>
              <!-- Información de la concesión -->
              <VCol align-self="end">
                <div>
                  <span class="text-h6 font-weight-500">
                    <VIcon
                      icon="tabler-map-pin"
                      class="me-2"
                    />Municipio:
                  </span>
                  {{ concession?.municipality || 'N/A' }}
                </div>
                <div class="d-flex flex-wrap mt-2">
                  <span
                    v-if="concession?.routeOrSite"
                    class="flex-1-1-100"
                  >
                    <span class="text-h6 font-weight-500">
                      <VIcon
                        icon="tabler-route"
                        class="me-2"
                      />Ruta o Sitio:
                    </span>
                    {{ concession?.routeOrSite }}
                  </span>
                  <span
                    v-if="concession?.validFrom"
                    class="flex-1-0"
                  >
                    <span class="text-h6 font-weight-500">Vigencia:</span>
                    {{ formatDate(concession?.validFrom) }} - {{ formatDate(concession?.validTo) }}
                  </span>
                  <span
                    v-if="concession?.holder"
                    class="flex-1-0"
                  >
                    <span class="text-h6 font-weight-500">
                      <VIcon
                        icon="tabler-user"
                        class="me-2"
                      />Concesionario:
                    </span>
                    {{ concession?.holder.fullName }} ({{ concession?.holder.holderTypeLabel }})
                  </span>
                </div>
              </VCol>

              <!-- Action Buttons -->
              <VCol align-self="end">
                <VRow>
                  <VCol class="d-flex flex-wrap ga-3">
                    <!-- Verification Actions -->
                    <VBtn
                      v-if="canVerify && concession?.status === 'PENDING'"
                      color="success"
                      size="large"
                      @click="openVerificationDialog"
                    >
                      <VIcon
                        icon="tabler-shield-check"
                        class="me-2"
                      />
                      Activar Concesión
                    </VBtn>
                    <VBtn
                      v-else-if="canVerify && concession?.status === 'ACTIVE'"
                      color="warning"
                      variant="outlined"
                      @click="openVerificationDialog"
                    >
                      <VIcon
                        icon="tabler-pause"
                        class="me-2"
                      />
                      Suspender
                    </VBtn>
                    <VBtn
                      v-else-if="canVerify && concession?.status === 'SUSPENDED'"
                      color="info"
                      variant="outlined"
                      @click="openVerificationDialog"
                    >
                      <VIcon
                        icon="tabler-play"
                        class="me-2"
                      />
                      Reactivar
                    </VBtn>

                    <!-- Document Compliance Actions -->
                    <VBtn
                      v-if="getDocumentComplianceStatus() !== 'complete'"
                      color="warning"
                      variant="outlined"
                      size="small"
                      @click="activeTab = 4"
                    >
                      <VIcon
                        icon="tabler-file-check"
                        class="me-2"
                      />
                      Revisar Documentos
                    </VBtn>
                    <!-- Standard Actions -->
                    <VBtn
                      color="primary"
                      variant="outlined"
                      @click="openEditDialog"
                    >
                      <VIcon
                        icon="tabler-edit"
                        class="me-2"
                      />
                      Editar
                    </VBtn>

                    <!-- Compliance Report -->
                    <!-- <VBtn
                      color="info"
                      variant="tonal"
                      @click="generateComplianceReport"
                    >
                      <VIcon
                        icon="tabler-file-report"
                        class="me-2"
                      />
                      Reporte de Cumplimiento
                    </VBtn> -->

                    <!-- Delete (restricted) -->
                    <VBtn
                      v-if="canDelete"
                      color="error"
                      variant="outlined"
                      prepend-icon="tabler-trash"
                      @click="openDeleteDialog"
                    >
                      Eliminar
                    </VBtn>
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

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
        Cargando información de la concesión...
      </p>
      <p class="text-body-2 text-medium-emphasis">
        Verificando estado de cumplimiento y documentos
      </p>
    </div>

    <!-- Content with Tabs -->
    <template v-else-if="concession">
      <VRow>
        <VCol cols="12">
          <VCard>
            <VTabs v-model="activeTab">
              <VTab
                v-for="(tab, index) in tabs"
                :key="index"
              >
                <VIcon
                  :size="18"
                  :icon="tab.icon"
                  class="me-1"
                />
                {{ tab.title }}
              </VTab>
            </VTabs>
          </VCard>

          <VWindow
            v-model="activeTab"
            class="mt-4 disable-tab-transition"
            :touch="false"
          >
            <VWindowItem
              v-for="(tab, index) in tabs"
              :key="`tab-${index}-${tab.title}`"
            >
              <!-- DocumentManagerTab con props específicas -->
              <template v-if="tab.title === 'Documentos'">
                <DocumentManagerTab
                  v-if="concession?.id"
                  :entity-id="concession.id"
                  entity-type="CONCESSION"
                  title="Documentos de Concesión"
                />
                <!-- Estado de carga para DocumentManagerTab -->
                <VCard
                  v-else
                  class="pa-4"
                >
                  <div class="text-center">
                    <VProgressCircular
                      indeterminate
                      color="primary"
                      size="48"
                    />
                    <p class="mt-4 text-medium-emphasis">
                      Cargando datos de la concesión...
                    </p>
                  </div>
                </VCard>
              </template>
              <!-- Otros componentes con sus props específicas -->
              <component
                v-else
                :is="tab.component"
                :concession="concession"
                :concession-id="concession?.id"
                :loading="loading"
                @refresh="fetchConcessionDetail"
              />
            </VWindowItem>
          </VWindow>
        </VCol>
      </VRow>
    </template>
    <!-- Error State -->
    <VAlert
      v-else
      type="error"
      variant="tonal"
      class="my-8"
    >
      Error al cargar los datos de la concesión
    </VAlert>

    <!-- Dialogs -->
    <ConcessionEditDialogMolecule
      :visible="editDialogVisible"
      :item="concession"
      @success="handleEditSuccess"
      @close="editDialogVisible = false"
    />

    <ConcessionDeleteDialogMolecule
      v-model="deleteDialogVisible"
      :concession="concession"
      @success="handleDeleteSuccess"
      @cancel="deleteDialogVisible = false"
    />

    <ConcessionVerificationDialogMolecule
      v-model="verificationDialogVisible"
      :concession="concession"
      @success="handleVerificationSuccess"
      @cancel="verificationDialogVisible = false"
    />
  </div>
</template>

<style scoped>
/* Estilos para los tabs siguiendo el patrón de ConcessionHolderDetail */
.concession-detail .disable-tab-transition {
  transition: none;
}
</style>
