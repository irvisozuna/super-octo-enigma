<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentEntity } from '../../domain/entities/DocumentEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// State
const selectedDocuments = ref<string[]>([])
const documents = ref<DocumentEntity[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showBulkForm = ref(false)
const bulkAction = ref('')

// Form for bulk actions
const bulkForm = ref({
  action: '',
  category: '',
  tags: '',
  access_level: 'internal',
  is_public: false,
})

// Computed
const hasSelection = computed(() => selectedDocuments.value.length > 0)
const selectedCount = computed(() => selectedDocuments.value.length)
const allSelected = computed(() => selectedDocuments.value.length === documents.value.length)
const someSelected = computed(() => selectedDocuments.value.length > 0 && selectedDocuments.value.length < documents.value.length)

// Methods
const loadDocuments = async () => {
  try {
    loading.value = true
    error.value = null

    documents.value = await documentStore.fetchDocuments()
  }
  catch (err) {
    error.value = 'Error al cargar los documentos'
    console.error('Error loading documents:', err)
  }
  finally {
    loading.value = false
  }
}

const handleSelectAll = () => {
  if (allSelected.value)
    selectedDocuments.value = []
  else
    selectedDocuments.value = documents.value.map(doc => doc.id)
}

const handleSelectDocument = (documentId: string) => {
  const index = selectedDocuments.value.indexOf(documentId)
  if (index > -1)
    selectedDocuments.value.splice(index, 1)
  else
    selectedDocuments.value.push(documentId)
}

const handleBulkAction = (action: string) => {
  bulkAction.value = action
  bulkForm.value.action = action
  showBulkForm.value = true
}

const executeBulkAction = async () => {
  if (!hasSelection.value)
    return

  try {
    loading.value = true

    switch (bulkAction.value) {
      case 'delete':
        await documentStore.bulkDeleteDocuments(selectedDocuments.value)
        break
      case 'archive':
        await documentStore.bulkArchiveDocuments(selectedDocuments.value)
        break
      case 'update_category':
        await documentStore.bulkUpdateCategory(selectedDocuments.value, bulkForm.value.category)
        break
      case 'update_tags':
        await documentStore.bulkUpdateTags(selectedDocuments.value, bulkForm.value.tags.split(',').map(tag => tag.trim()))
        break
      case 'update_access_level':
        await documentStore.bulkUpdateAccessLevel(selectedDocuments.value, bulkForm.value.access_level)
        break
      case 'update_public':
        await documentStore.bulkUpdatePublic(selectedDocuments.value, bulkForm.value.is_public)
        break
    }

    // Reset selection and form
    selectedDocuments.value = []
    showBulkForm.value = false
    bulkForm.value = {
      action: '',
      category: '',
      tags: '',
      access_level: 'internal',
      is_public: false,
    }

    // Reload documents
    await loadDocuments()
  }
  catch (err) {
    console.error('Error executing bulk action:', err)
  }
  finally {
    loading.value = false
  }
}

const handleCancel = () => {
  showBulkForm.value = false
  bulkForm.value = {
    action: '',
    category: '',
    tags: '',
    access_level: 'internal',
    is_public: false,
  }
}

const getDocumentIcon = (document: DocumentEntity): string => {
  return documentStore.getDocumentIcon(document)
}

const getStatusColor = (status: string): string => {
  const colors = {
    draft: 'grey',
    active: 'success',
    archived: 'warning',
    deleted: 'error',
  }

  return colors[status as keyof typeof colors] || 'grey'
}

const getStatusLabel = (status: string): string => {
  return documentStore.statusOptions.find(option => option.value === status)?.label || status
}

const getDocumentTypeLabel = (type: string): string => {
  return documentStore.documentTypeOptions.find(option => option.value === type)?.label || type
}

const getCategoryLabel = (category: string): string => {
  return documentStore.categoryOptions.find(option => option.value === category)?.label || category
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadDocuments()
})
</script>

<template>
  <div class="document-bulk-actions">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.bulk_actions') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.bulk_actions_subtitle') }}
        </p>
      </div>

      <VBtn
        variant="outlined"
        prepend-icon="tabler-arrow-left"
        @click="router.push({ name: 'documents-list' })"
      >
        {{ t('DocumentsModule.common.back') }}
      </VBtn>
    </div>

    <!-- Selection Summary -->
    <VCard
      v-if="hasSelection"
      class="mb-6"
    >
      <VCardText>
        <div class="d-flex justify-space-between align-center">
          <div class="d-flex align-center gap-3">
            <VIcon
              icon="tabler-check-circle"
              color="primary"
              size="24"
            />
            <div>
              <div class="font-weight-medium">
                {{ selectedCount }} {{ t('DocumentsModule.document.selected_documents') }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ t('DocumentsModule.document.selected_documents_subtitle') }}
              </div>
            </div>
          </div>

          <div class="d-flex gap-2">
            <VBtn
              size="small"
              variant="outlined"
              prepend-icon="tabler-trash"
              @click="handleBulkAction('delete')"
            >
              {{ t('DocumentsModule.common.delete') }}
            </VBtn>

            <VBtn
              size="small"
              variant="outlined"
              prepend-icon="tabler-archive"
              @click="handleBulkAction('archive')"
            >
              {{ t('DocumentsModule.common.archive') }}
            </VBtn>

            <VBtn
              size="small"
              variant="outlined"
              prepend-icon="tabler-edit"
              @click="handleBulkAction('update_category')"
            >
              {{ t('DocumentsModule.common.update_category') }}
            </VBtn>

            <VBtn
              size="small"
              variant="outlined"
              prepend-icon="tabler-tag"
              @click="handleBulkAction('update_tags')"
            >
              {{ t('DocumentsModule.common.update_tags') }}
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Bulk Action Form -->
    <VCard
      v-if="showBulkForm"
      class="mb-6"
    >
      <VCardTitle>
        {{ t('DocumentsModule.document.bulk_action_form') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="executeBulkAction">
          <VRow>
            <!-- Category Update -->
            <VCol
              v-if="bulkAction === 'update_category'"
              cols="12"
              md="6"
            >
              <VSelect
                v-model="bulkForm.category"
                :items="documentStore.categoryOptions"
                :label="t('DocumentsModule.document.fields.category')"
                variant="outlined"
                required
              />
            </VCol>

            <!-- Tags Update -->
            <VCol
              v-if="bulkAction === 'update_tags'"
              cols="12"
              md="6"
            >
              <VTextField
                v-model="bulkForm.tags"
                :label="t('DocumentsModule.document.fields.tags')"
                variant="outlined"
                placeholder="tag1, tag2, tag3"
                hint="Separate tags with commas"
                persistent-hint
                required
              />
            </VCol>

            <!-- Access Level Update -->
            <VCol
              v-if="bulkAction === 'update_access_level'"
              cols="12"
              md="6"
            >
              <VSelect
                v-model="bulkForm.access_level"
                :items="documentStore.accessLevelOptions"
                :label="t('DocumentsModule.document.fields.access_level')"
                variant="outlined"
                required
              />
            </VCol>

            <!-- Public Update -->
            <VCol
              v-if="bulkAction === 'update_public'"
              cols="12"
              md="6"
            >
              <VSwitch
                v-model="bulkForm.is_public"
                :label="t('DocumentsModule.document.fields.is_public')"
                color="primary"
              />
            </VCol>
          </VRow>

          <div class="d-flex gap-3 mt-4">
            <VBtn
              type="submit"
              color="primary"
              :loading="loading"
            >
              {{ t('DocumentsModule.common.execute') }}
            </VBtn>

            <VBtn
              variant="outlined"
              @click="handleCancel"
            >
              {{ t('DocumentsModule.common.cancel') }}
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
      <div class="text-h6 mt-4">
        {{ t('DocumentsModule.common.loading') }}
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-center py-8"
    >
      <VIcon
        icon="tabler-alert-circle"
        size="64"
        color="error"
        class="mb-4"
      />
      <div class="text-h6 mb-2">
        {{ t('DocumentsModule.common.error') }}
      </div>
      <div class="text-body-2 text-medium-emphasis mb-4">
        {{ error }}
      </div>
      <VBtn
        color="primary"
        @click="loadDocuments"
      >
        {{ t('DocumentsModule.common.refresh') }}
      </VBtn>
    </div>

    <!-- Documents List -->
    <div v-else>
      <VCard v-if="documents.length === 0">
        <VCardText class="text-center py-8">
          <VIcon
            icon="tabler-file-off"
            size="48"
            class="text-medium-emphasis mb-4"
          />
          <div class="text-h6 mb-2">
            {{ t('DocumentsModule.common.no_data') }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t('DocumentsModule.document.no_documents') }}
          </div>
        </VCardText>
      </VCard>

      <div
        v-else
        class="d-flex flex-column gap-4"
      >
        <VCard
          v-for="document in documents"
          :key="document.id"
          :class="{ 'border-primary': selectedDocuments.includes(document.id) }"
        >
          <VCardText>
            <div class="d-flex align-center gap-4">
              <VCheckbox
                :model-value="selectedDocuments.includes(document.id)"
                @click="handleSelectDocument(document.id)"
              />

              <VIcon
                :icon="getDocumentIcon(document)"
                size="32"
              />

              <div class="flex-grow-1">
                <div class="d-flex justify-space-between align-start mb-2">
                  <div>
                    <h3 class="text-h6 font-weight-medium mb-1">
                      {{ document.title }}
                    </h3>

                    <div class="text-body-2 text-medium-emphasis mb-2">
                      {{ document.file_name }} • {{ document.file_size_formatted }}
                    </div>

                    <div class="d-flex flex-wrap gap-3 text-caption text-medium-emphasis">
                      <div class="d-flex align-center gap-1">
                        <VIcon
                          icon="tabler-file"
                          size="16"
                        />
                        {{ getDocumentTypeLabel(document.document_type) }}
                      </div>

                      <div class="d-flex align-center gap-1">
                        <VIcon
                          icon="tabler-folder"
                          size="16"
                        />
                        {{ getCategoryLabel(document.category) }}
                      </div>

                      <div class="d-flex align-center gap-1">
                        <VIcon
                          icon="tabler-calendar"
                          size="16"
                        />
                        {{ formatDate(document.created_at) }}
                      </div>

                      <div class="d-flex align-center gap-1">
                        <VIcon
                          icon="tabler-user"
                          size="16"
                        />
                        {{ document.uploaded_by_user?.name || document.uploaded_by }}
                      </div>
                    </div>
                  </div>

                  <VChip
                    :color="getStatusColor(document.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ getStatusLabel(document.status) }}
                  </VChip>
                </div>

                <div
                  v-if="document.description"
                  class="text-body-2 mt-2"
                >
                  {{ document.description }}
                </div>

                <div
                  v-if="document.tags && document.tags.length > 0"
                  class="d-flex flex-wrap gap-2 mt-3"
                >
                  <VChip
                    v-for="tag in document.tags"
                    :key="tag"
                    size="small"
                    variant="outlined"
                  >
                    {{ tag }}
                  </VChip>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-bulk-actions {
  padding: 24px;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
