<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EntityType } from '../../../domain/entities/DocumentEntity'
import { useDocumentManager } from '../../composables/useDocumentManager'
import DocumentUploadDialog from '../molecules/DocumentUploadDialog.vue'
import DocumentPreviewDialog from '../molecules/DocumentPreviewDialog.vue'
import DocumentVerificationDialog from '../molecules/DocumentVerificationDialog.vue'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'

interface Props {
  entityId: string
  entityType: EntityType
  title?: string
}

const props = defineProps<Props>()
const { t } = useI18n()

// Document manager
const documentManager = useDocumentManager({
  entityId: props.entityId,
  entityType: props.entityType,
  autoLoad: true,
})

// Local state
const uploadDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const documentToPreview = ref<any>(null)
const viewMode = ref<'grid' | 'list'>('grid')
const deleteDialogVisible = ref(false)
const bulkDeleteDialogVisible = ref(false)
const documentToDelete = ref<any>(null)
const verificationDialogVisible = ref(false)
const documentToVerify = ref<any>(null)
const verificationAction = ref<'verify' | 'reject' | 'pending'>('verify')

// Computed
const documentStats = computed(() => {
  console.log('Computing document stats...')
  console.log('documentManager.documents:', documentManager.documents.value)
  console.log('documents length:', documentManager.documents.value.length)

  const total = documentManager.documents.value.length
  const expired = documentManager.expiredDocuments.value.length
  const expiring = documentManager.expiringDocuments.value.length
  const approved = documentManager.documents.value.filter(doc => doc.status === 'APPROVED').length

  // Verification-specific stats
  const verified = documentManager.documents.value.filter(doc => doc.is_verified).length
  const pendingValidation = documentManager.documents.value.filter(doc => doc.status === 'PENDING_VALIDATION').length
  const rejected = documentManager.documents.value.filter(doc => doc.status === 'REJECTED' || doc.status === 'REVOKED').length

  const stats = {
    total,
    expired,
    expiring,
    approved,
    verified,
    pendingValidation,
    rejected,
  }

  console.log('Computed stats:', stats)

  return stats
})

// Methods
async function handleUploadClick() {
  // Ensure entity types are loaded before showing dialog
  if (!documentManager.entityTypes.value)
    await documentManager.loadEntityTypes()

  uploadDialogVisible.value = true
}

async function handleUpload(data: any) {
  const result = await documentManager.uploadDocument(data)
  if (result)
    uploadDialogVisible.value = false
}

function handleDeleteClick(document: any) {
  documentToDelete.value = document
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  if (documentToDelete.value) {
    const success = await documentManager.deleteDocument(documentToDelete.value.id)
    if (success) {
      deleteDialogVisible.value = false
      documentToDelete.value = null
    }
  }
}

function handleBulkDeleteClick() {
  bulkDeleteDialogVisible.value = true
}

async function confirmBulkDelete() {
  const success = await documentManager.bulkDeleteDocuments()
  if (success)
    bulkDeleteDialogVisible.value = false
}

function handleDownload(document: any) {
  documentManager.downloadDocument(document)
}

function handlePreview(document: any) {
  // Check if document can be previewed in dialog
  if (canPreviewInDialog(document)) {
    documentToPreview.value = document
    previewDialogVisible.value = true
  }
  else {
    // Open in new tab for non-previewable files (Word, Excel, etc.)
    window.open(documentManager.getPreviewUrl(document), '_blank', 'noopener,noreferrer')
  }
}

function canPreviewInDialog(document: any): boolean {
  if (!document?.mime_type)
    return false

  // Preview images and PDFs in dialog
  return document.mime_type.startsWith('image/')
         || document.mime_type.includes('pdf')
}

// Verification methods
function handleVerifyClick(document: any) {
  documentToVerify.value = document
  verificationAction.value = 'verify'
  verificationDialogVisible.value = true
}

function handleRejectClick(document: any) {
  documentToVerify.value = document
  verificationAction.value = 'reject'
  verificationDialogVisible.value = true
}

function handlePendingClick(document: any) {
  documentToVerify.value = document
  verificationAction.value = 'pending'
  verificationDialogVisible.value = true
}

async function handleVerificationConfirm(action: 'verify' | 'reject' | 'pending', data: any) {
  if (!documentToVerify.value)
    return

  let success = false

  if (action === 'verify')
    success = await documentManager.verifyDocument(documentToVerify.value.id, data)
  else if (action === 'reject')
    success = await documentManager.rejectDocument(documentToVerify.value.id, data)
  else if (action === 'pending')
    success = await documentManager.markPendingDocument(documentToVerify.value.id, data)

  if (success) {
    verificationDialogVisible.value = false
    documentToVerify.value = null
  }
}

function getStatusColor(status: string) {
  return documentManager.DocumentDomain.getStatusColor(status as any)
}

function getStatusLabel(status: string) {
  return documentManager.DocumentDomain.getStatusLabel(status as any)
}

function formatFileSize(bytes?: number) {
  return documentManager.DocumentDomain.formatFileSize(bytes)
}

function getFileTypeIcon(mimeType?: string) {
  return documentManager.DocumentDomain.getFileTypeIcon(mimeType)
}

function isExpired(document: any) {
  return documentManager.DocumentDomain.isExpired(document)
}

function isExpiringSoon(document: any) {
  return documentManager.DocumentDomain.isExpiringSoon(document)
}

function formatDate(dateString?: string) {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleDateString('es-MX')
}

// Initialize
onMounted(async () => {
  await documentManager.initialize()
})
</script>

<template>
  <VCard>
    <!-- Header -->
    <VCardTitle class="d-flex align-center justify-space-between">
      <span>
        <VIcon class="me-2">tabler-files</VIcon>
        {{ title || 'Documentos' }}
      </span>

      <div class="d-flex align-center gap-2">
        <!-- Bulk Actions -->
        <VBtn
          v-if="documentManager.hasSelectedDocuments.value"
          color="error"
          variant="outlined"
          size="small"
          @click="handleBulkDeleteClick"
        >
          <VIcon start>
            tabler-trash
          </VIcon>
          Eliminar ({{ documentManager.selectedDocuments.value.length }})
        </VBtn>

        <!-- View Mode Toggle -->
        <VBtnToggle
          v-model="viewMode"
          mandatory
          variant="outlined"
          size="small"
        >
          <VBtn
            value="grid"
            icon
          >
            <VIcon>tabler-layout-grid</VIcon>
          </VBtn>
          <VBtn
            value="list"
            icon
          >
            <VIcon>tabler-list</VIcon>
          </VBtn>
        </VBtnToggle>

        <!-- Upload Button -->
        <VBtn
          color="primary"
          size="small"
          :loading="documentManager.loading.value"
          @click="handleUploadClick"
        >
          <VIcon start>
            tabler-upload
          </VIcon>
          Subir Documento
        </VBtn>
      </div>
    </VCardTitle>

    <VCardText>
      <!-- Stats Cards -->
      <VRow class="mb-4">
        <VCol
          cols="6"
          md="3"
        >
          <VCard
            variant="tonal"
            color="primary"
          >
            <VCardText class="text-center">
              <div class="text-h5 font-weight-bold">
                {{ documentStats.total }}
              </div>
              <div class="text-caption">
                Total Documentos
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="6"
          md="3"
        >
          <VCard
            variant="tonal"
            color="success"
          >
            <VCardText class="text-center">
              <div class="text-h5 font-weight-bold">
                {{ documentStats.verified }}
              </div>
              <div class="text-caption">
                Verificados
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="6"
          md="3"
        >
          <VCard
            variant="tonal"
            color="warning"
          >
            <VCardText class="text-center">
              <div class="text-h5 font-weight-bold">
                {{ documentStats.expiring }}
              </div>
              <div class="text-caption">
                Por Vencer
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="6"
          md="3"
        >
          <VCard
            variant="tonal"
            color="info"
          >
            <VCardText class="text-center">
              <div class="text-h5 font-weight-bold">
                {{ documentStats.pendingValidation }}
              </div>
              <div class="text-caption">
                Pendientes Validación
              </div>
            </VCardText>
          </VCard>
        </VCol>
        
        <VCol
          cols="6"
          md="3"
        >
          <VCard
            variant="tonal"
            color="error"
          >
            <VCardText class="text-center">
              <div class="text-h5 font-weight-bold">
                {{ documentStats.rejected }}
              </div>
              <div class="text-caption">
                Rechazados
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Loading State -->
      <div
        v-if="documentManager.loading.value"
        class="text-center py-8"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="48"
        />
        <p class="mt-4 text-medium-emphasis">
          Cargando documentos...
        </p>
      </div>

      <!-- Error State -->
      <VAlert
        v-else-if="documentManager.error.value"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="documentManager.clearError"
      >
        {{ documentManager.error.value }}
      </VAlert>

      <!-- Empty State -->
      <div
        v-else-if="documentManager.documents.value.length === 0"
        class="text-center py-12"
      >
        <VIcon
          size="64"
          color="grey-400"
          class="mb-4"
        >
          tabler-files-off
        </VIcon>
        <h6 class="text-h6 mb-2">
          No hay documentos
        </h6>
        <p class="text-body-2 mb-4">
          Comienza subiendo tu primer documento
        </p>
        <VBtn
          color="primary"
          :loading="documentManager.loading.value"
          @click="handleUploadClick"
        >
          <VIcon start>
            tabler-upload
          </VIcon>
          Subir Primer Documento
        </VBtn>
      </div>

      <!-- Documents Grid View -->
      <VRow v-else-if="viewMode === 'grid'">
        <VCol
          v-for="document in documentManager.documents.value"
          :key="document.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <VCard
            variant="outlined"
            :color="isExpired(document) ? 'error' : isExpiringSoon(document) ? 'warning' : 'default'"
            class="h-100"
          >
            <VCardText class="d-flex flex-column align-center text-center">
              <!-- Selection Checkbox -->
              <VCheckbox
                :model-value="documentManager.selectedDocuments.value.includes(document.id)"
                class="align-self-end ma-0"
                hide-details
                @update:model-value="documentManager.toggleDocumentSelection(document.id)"
              />

              <!-- File Icon -->
              <VIcon
                :icon="getFileTypeIcon(document.mime_type)"
                size="48"
                :color="getStatusColor(document.status)"
                class="mb-3"
              />

              <!-- Document Info -->
              <h6 class="text-subtitle-1 mb-1 text-center">
                {{ document.title }}
              </h6>

              <div class="d-flex flex-column align-center gap-1 mb-2">
                <VChip
                  size="small"
                  :color="getStatusColor(document.status)"
                >
                  {{ getStatusLabel(document.status) }}
                </VChip>
                
                <!-- Verification Badge -->
                <VChip
                  v-if="document.is_verified"
                  size="x-small"
                  color="success"
                  variant="outlined"
                >
                  <VIcon
                    start
                    size="12"
                  >
                    tabler-shield-check
                  </VIcon>
                  Verificado
                </VChip>
                
                <VChip
                  v-else-if="document.status === 'PENDING_VALIDATION'"
                  size="x-small"
                  color="info"
                  variant="outlined"
                >
                  <VIcon
                    start
                    size="12"
                  >
                    tabler-clock
                  </VIcon>
                  Pendiente
                </VChip>
                
                <VChip
                  v-else-if="document.status === 'REJECTED' || document.status === 'REVOKED'"
                  size="x-small"
                  color="error"
                  variant="outlined"
                >
                  <VIcon
                    start
                    size="12"
                  >
                    tabler-shield-x
                  </VIcon>
                  {{ document.status === 'REVOKED' ? 'Revocado' : 'Rechazado' }}
                </VChip>
                
                <VChip
                  v-else
                  size="x-small"
                  color="warning"
                  variant="outlined"
                >
                  <VIcon
                    start
                    size="12"
                  >
                    tabler-alert-circle
                  </VIcon>
                  Sin Verificar
                </VChip>
              </div>

              <div class="text-caption text-medium-emphasis mb-2">
                {{ document.document_type }}
              </div>

              <div class="text-caption text-medium-emphasis mb-3">
                {{ formatFileSize(document.file_size) }}
              </div>

              <!-- Expiration Warning -->
              <VAlert
                v-if="isExpired(document)"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3 w-100"
              >
                <div class="text-caption">
                  Expirado: {{ formatDate(document.expiration_date) }}
                </div>
              </VAlert>

              <VAlert
                v-else-if="isExpiringSoon(document)"
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-3 w-100"
              >
                <div class="text-caption">
                  Vence: {{ formatDate(document.expiration_date) }}
                </div>
              </VAlert>

              <!-- Actions -->
              <div class="d-flex flex-wrap gap-1 mt-auto">
                <!-- Verification Actions -->
                <VBtn
                  v-if="document.status === 'PENDING_VALIDATION' || !document.is_verified"
                  size="small"
                  variant="outlined"
                  color="success"
                  icon
                  @click="handleVerifyClick(document)"
                >
                  <VIcon>tabler-check-circle</VIcon>
                  <VTooltip activator="parent">Verificar</VTooltip>
                </VBtn>

                <VBtn
                  v-if="document.status !== 'REVOKED'"
                  size="small"
                  variant="outlined"
                  color="error"
                  icon
                  @click="handleRejectClick(document)"
                >
                  <VIcon>tabler-x-circle</VIcon>
                  <VTooltip activator="parent">Rechazar</VTooltip>
                </VBtn>

                <VBtn
                  v-if="document.status !== 'PENDING_VALIDATION'"
                  size="small"
                  variant="outlined"
                  color="warning"
                  icon
                  @click="handlePendingClick(document)"
                >
                  <VIcon>tabler-clock</VIcon>
                  <VTooltip activator="parent">Marcar Pendiente</VTooltip>
                </VBtn>

                <!-- Regular Actions -->
                <VBtn
                  size="small"
                  variant="outlined"
                  color="primary"
                  icon
                  @click="handleDownload(document)"
                >
                  <VIcon>tabler-download</VIcon>
                  <VTooltip activator="parent">Descargar</VTooltip>
                </VBtn>

                <VBtn
                  size="small"
                  variant="outlined"
                  color="primary"
                  icon
                  @click="handlePreview(document)"
                >
                  <VIcon>tabler-eye</VIcon>
                  <VTooltip activator="parent">Ver</VTooltip>
                </VBtn>

                <VBtn
                  size="small"
                  variant="outlined"
                  color="error"
                  icon
                  @click="handleDeleteClick(document)"
                >
                  <VIcon>tabler-trash</VIcon>
                  <VTooltip activator="parent">Eliminar</VTooltip>
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Documents List View -->
      <VDataTable
        v-else
        :headers="[
          { title: '', key: 'selection', sortable: false, width: 50 },
          { title: 'Documento', key: 'title' },
          { title: 'Tipo', key: 'document_type' },
          { title: 'Estado', key: 'status' },
          { title: 'Tamaño', key: 'file_size' },
          { title: 'Vencimiento', key: 'expiration_date' },
          { title: 'Acciones', key: 'actions', sortable: false },
        ]"
        :items="documentManager.documents.value"
        item-key="id"
      >
        <template #[`item.selection`]="{ item }">
          <VCheckbox
            :model-value="documentManager.selectedDocuments.value.includes(item.id)"
            hide-details
            @update:model-value="documentManager.toggleDocumentSelection(item.id)"
          />
        </template>

        <template #[`item.title`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              :icon="getFileTypeIcon(item.mime_type)"
              class="me-2"
            />
            <div>
              <div class="font-weight-medium">
                {{ item.title }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatDate(item.uploaded_at) }}
              </div>
            </div>
          </div>
        </template>

        <template #[`item.status`]="{ item }">
          <VChip
            size="small"
            :color="getStatusColor(item.status)"
          >
            {{ getStatusLabel(item.status) }}
          </VChip>
        </template>

        <template #[`item.file_size`]="{ item }">
          {{ formatFileSize(item.file_size) }}
        </template>

        <template #[`item.expiration_date`]="{ item }">
          <div v-if="item.expiration_date">
            <div :class="{ 'text-error': isExpired(item), 'text-warning': isExpiringSoon(item) }">
              {{ formatDate(item.expiration_date) }}
            </div>
            <VIcon
              v-if="isExpired(item)"
              color="error"
              size="small"
            >
              tabler-alert-circle
            </VIcon>
            <VIcon
              v-else-if="isExpiringSoon(item)"
              color="warning"
              size="small"
            >
              tabler-alert-triangle
            </VIcon>
          </div>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <!-- Verification Actions -->
            <VBtn
              v-if="item.status === 'PENDING_VALIDATION' || !item.is_verified"
              size="small"
              variant="text"
              color="success"
              icon
              @click="handleVerifyClick(item)"
            >
              <VIcon>tabler-check-circle</VIcon>
              <VTooltip activator="parent">
                Verificar
              </VTooltip>
            </VBtn>

            <VBtn
              v-if="item.status !== 'REVOKED'"
              size="small"
              variant="text"
              color="error"
              icon
              @click="handleRejectClick(item)"
            >
              <VIcon>tabler-x-circle</VIcon>
              <VTooltip activator="parent">
                Rechazar
              </VTooltip>
            </VBtn>

            <VBtn
              v-if="item.status !== 'PENDING_VALIDATION'"
              size="small"
              variant="text"
              color="warning"
              icon
              @click="handlePendingClick(item)"
            >
              <VIcon>tabler-clock</VIcon>
              <VTooltip activator="parent">
                Marcar Pendiente
              </VTooltip>
            </VBtn>

            <!-- Regular Actions -->
            <VBtn
              size="small"
              variant="text"
              color="primary"
              icon
              @click="handleDownload(item)"
            >
              <VIcon>tabler-download</VIcon>
              <VTooltip activator="parent">
                Descargar
              </VTooltip>
            </VBtn>

            <VBtn
              size="small"
              variant="text"
              color="primary"
              icon
              @click="handlePreview(item)"
            >
              <VIcon>tabler-eye</VIcon>
              <VTooltip activator="parent">
                Ver
              </VTooltip>
            </VBtn>

            <VBtn
              size="small"
              variant="text"
              color="error"
              icon
              @click="handleDeleteClick(item)"
            >
              <VIcon>tabler-trash</VIcon>
              <VTooltip activator="parent">
                Eliminar
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </VDataTable>
    </VCardText>

    <!-- Upload Dialog -->
    <DocumentUploadDialog
      :visible="uploadDialogVisible"
      :entity-id="props.entityId"
      :entity-type="props.entityType"
      :available-document-types="documentManager.availableDocumentTypes.value"
      :loading="documentManager.uploading.value"
      @close="uploadDialogVisible = false"
      @upload="handleUpload"
    />

    <!-- Preview Dialog -->
    <DocumentPreviewDialog
      :visible="previewDialogVisible"
      :document="documentToPreview"
      @close="previewDialogVisible = false; documentToPreview = null"
      @download="handleDownload"
    />

    <!-- Verification Dialog -->
    <DocumentVerificationDialog
      :visible="verificationDialogVisible"
      :document="documentToVerify"
      :action="verificationAction"
      :loading="documentManager.loading.value"
      @close="verificationDialogVisible = false; documentToVerify = null"
      @confirm="handleVerificationConfirm"
    />

    <!-- Delete Single Document Dialog -->
    <DeleteConfirmationDialog
      :visible="deleteDialogVisible"
      title="Confirmar Eliminación"
      entity-name="documento"
      :entity-id="documentToDelete?.folio || documentToDelete?.id"
      warning-message="Esta acción no se puede deshacer y eliminará permanentemente el documento del sistema."
      confirmation-word="IRREVERSIBLE"
      :loading="documentManager.loading.value"
      @close="deleteDialogVisible = false; documentToDelete = null"
      @confirm="confirmDelete"
    >
      <template #entity-info>
        <div v-if="documentToDelete">
          <div class="font-weight-medium">
            {{ documentToDelete.title }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Tipo: {{ documentToDelete.document_type }}
          </div>
        </div>
      </template>
      <template #confirmation-text>
        el documento "{{ documentToDelete?.title }}"
      </template>
    </DeleteConfirmationDialog>

    <!-- Bulk Delete Dialog -->
    <DeleteConfirmationDialog
      :visible="bulkDeleteDialogVisible"
      title="Confirmar Eliminación Masiva"
      entity-name="documentos"
      warning-message="Esta acción no se puede deshacer y eliminará permanentemente todos los documentos seleccionados del sistema."
      confirmation-word="IRREVERSIBLE"
      :loading="documentManager.loading.value"
      @close="bulkDeleteDialogVisible = false"
      @confirm="confirmBulkDelete"
    >
      <template #entity-info>
        <div>
          <div class="font-weight-medium">
            {{ documentManager.selectedDocuments.value.length }} documento(s) seleccionado(s)
          </div>
          <div class="text-caption text-medium-emphasis">
            Eliminación masiva
          </div>
        </div>
      </template>
      <template #confirmation-text>
        los {{ documentManager.selectedDocuments.value.length }} documento(s) seleccionado(s)
      </template>
    </DeleteConfirmationDialog>
  </VCard>
</template>
