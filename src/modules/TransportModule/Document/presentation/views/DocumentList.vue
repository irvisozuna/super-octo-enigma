<script setup lang="ts">
import { onMounted } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'

// Composable para manejar diálogos
const { navigateTo } = useAppManager()
const { t } = useI18n()

// Store
const documentStore = useDocumentStore()

// Headers para la tabla
const headers = [
  { title: t('document.fields.document_type'), key: 'documentType' },
  { title: t('document.fields.document_number'), key: 'documentNumber' },
  { title: t('document.fields.owner_type'), key: 'ownerType' },
  { title: t('document.fields.owner'), key: 'ownerName' },
  { title: t('document.fields.file_name'), key: 'fileName' },
  { title: t('document.fields.expiry_date'), key: 'expiryDate' },
  { title: t('common.status'), key: 'status' },
  { title: t('common.actions'), key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: 'Export to Excel',
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: 'Export to PDF',
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
]

// Métodos
const debouncedFetchList = debounce(() => {
  documentStore.fetchList()
}, 500)

function applyFilters() {
  debouncedFetchList()
}

function openViewDialog(item: any) {
  navigateTo(`/documents/${item.id}`)
}

function openEditDialog(item: any) {
  navigateTo(`/documents/${item.id}/edit`)
}

function openDeleteDialog(item: any) {
  console.log('Delete document:', item)
}

function downloadDocument(item: any) {
  documentStore.downloadDocument(item.id)
}

function exportItems(type: string) {
  documentStore.exportItems(type)
}

// Métodos auxiliares para los chips
function getDocumentTypeColor(type: string) {
  const colors = {
    driver_license: 'blue',
    vehicle_registration: 'green',
    insurance_certificate: 'orange',
    technical_inspection: 'purple',
    route_permit: 'amber',
    operating_license: 'cyan',
    medical_certificate: 'pink',
    other: 'grey',
  }

  return colors[type?.toLowerCase()] || 'grey'
}

function getOwnerTypeColor(type: string) {
  const colors = {
    vehicle: 'info',
    concession_holder: 'success',
    driver: 'warning',
  }

  return colors[type?.toLowerCase()] || 'grey'
}

function getStatusColor(status: string) {
  const colors = {
    valid: 'success',
    expired: 'error',
    expiring_soon: 'warning',
    pending: 'info',
    rejected: 'error',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getStatusText(status: string) {
  const texts = {
    valid: 'Valid',
    expired: 'Expired',
    expiring_soon: 'Expiring Soon',
    pending: 'Pending',
    rejected: 'Rejected',
  }

  return texts[status?.toLowerCase()] || status
}

function formatDate(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

function formatFileSize(bytes: number) {
  if (!bytes)
    return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

function getFileIcon(fileName: string) {
  if (!fileName)
    return 'tabler-file'

  const ext = fileName.split('.').pop()?.toLowerCase()

  const icons = {
    pdf: 'tabler-file-type-pdf',
    doc: 'tabler-file-type-doc',
    docx: 'tabler-file-type-docx',
    jpg: 'tabler-file-type-jpg',
    jpeg: 'tabler-file-type-jpg',
    png: 'tabler-file-type-png',
    gif: 'tabler-file-type-gif',
  }

  return icons[ext] || 'tabler-file'
}

function isExpiringSoon(expiryDate: string, days: number = 30) {
  if (!expiryDate)
    return false

  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

// onMounted
onMounted(() => {
  documentStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ t('document.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ t('document.list_title') }}
      </p>
    </VCardTitle>

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="documentStore.filters.search"
          :label="t('document.search_placeholder')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />

        <!-- Botón para exportar -->
        <GlobalMenu
          :menu-options="menuOptions"
          :loading="documentStore.loading"
          :disabled="!documentStore.hasItems"
        >
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              :loading="documentStore.loading"
              :disabled="!documentStore.hasItems"
            >
              <VIcon start>
                tabler-download
              </VIcon>
              Export
            </VBtn>
          </template>
        </GlobalMenu>

        <!-- Botón para agregar -->
        <VBtn
          color="primary"
          :to="{ name: 'documentsUpload' }"
        >
          <VIcon start>
            tabler-plus
          </VIcon>
          {{ t('document.actions.upload_document') }}
        </VBtn>
      </div>

      <!-- Tabla de documentos -->
      <VDataTableServer
        v-model:items-per-page="documentStore.itemsPerPage"
        v-model:page="documentStore.page"
        :headers="headers"
        :items="documentStore.items"
        :items-length="documentStore.total"
        :loading="documentStore.loading"
        :search="documentStore.filters.search"
        class="elevation-1"
        item-value="id"
        @update:options="documentStore.fetchList"
      >
        <!-- Slot para tipo de documento -->
        <template #[`item.documentType`]="{ item }">
          <VChip
            :color="getDocumentTypeColor(item.documentType)"
            size="small"
            variant="tonal"
          >
            {{ item.documentType }}
          </VChip>
        </template>

        <!-- Slot para número de documento -->
        <template #[`item.documentNumber`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-file-certificate
            </VIcon>
            <span class="font-weight-medium">{{ item.documentNumber }}</span>
          </div>
        </template>

        <!-- Slot para tipo de propietario -->
        <template #[`item.ownerType`]="{ item }">
          <VChip
            :color="getOwnerTypeColor(item.ownerType)"
            size="small"
            variant="tonal"
          >
            {{ item.ownerType }}
          </VChip>
        </template>

        <!-- Slot para archivo -->
        <template #[`item.fileName`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              :icon="getFileIcon(item.fileName)"
              size="18"
              class="me-2"
            />
            <div>
              <div class="text-body-2">
                {{ item.fileName }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatFileSize(item.fileSize) }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para fecha de vencimiento -->
        <template #[`item.expiryDate`]="{ item }">
          <span :class="{ 'text-error': isExpiringSoon(item.expiryDate) }">
            {{ formatDate(item.expiryDate) }}
          </span>
        </template>

        <!-- Slot para estatus -->
        <template #[`item.status`]="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusText(item.status) }}
          </VChip>
        </template>

        <!-- Slot para acciones -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              icon
              variant="text"
              size="small"
              color="default"
              @click="openViewDialog(item)"
            >
              <VIcon size="22">
                tabler-eye
              </VIcon>
            </VBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="info"
              @click="downloadDocument(item)"
            >
              <VIcon size="22">
                tabler-download
              </VIcon>
            </VBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="warning"
              @click="openEditDialog(item)"
            >
              <VIcon size="22">
                tabler-pencil
              </VIcon>
            </VBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="error"
              @click="openDeleteDialog(item)"
            >
              <VIcon size="22">
                tabler-trash
              </VIcon>
            </VBtn>
          </div>
        </template>

        <!-- Slot para cuando no hay datos -->
        <template #no-data>
          <div class="text-center pa-5">
            <VIcon
              size="64"
              color="grey-400"
              class="mb-4"
            >
              tabler-file-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ t('document.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('document.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'documentsUpload' }"
            >
              {{ t('document.actions.upload_document') }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>
</template>

<style scoped>
.filter-field {
  min-inline-size: 250px;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}
</style>
