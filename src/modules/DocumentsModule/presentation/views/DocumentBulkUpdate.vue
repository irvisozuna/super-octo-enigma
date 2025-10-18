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
const updating = ref(false)
const showUpdateForm = ref(false)

// Form for bulk update
const updateForm = ref({
  action: '',
  category: '',
  tags: '',
  access_level: 'internal',
  is_public: false,
  description: '',
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
  updateForm.value.action = action
  showUpdateForm.value = true
}

const executeBulkUpdate = async () => {
  if (!hasSelection.value)
    return

  try {
    updating.value = true

    switch (updateForm.value.action) {
      case 'update_category':
        await documentStore.bulkUpdateCategory(selectedDocuments.value, updateForm.value.category)
        break
      case 'update_tags':
        await documentStore.bulkUpdateTags(selectedDocuments.value, updateForm.value.tags.split(',').map(tag => tag.trim()))
        break
      case 'update_access_level':
        await documentStore.bulkUpdateAccessLevel(selectedDocuments.value, updateForm.value.access_level)
        break
      case 'update_public':
        await documentStore.bulkUpdatePublic(selectedDocuments.value, updateForm.value.is_public)
        break
      case 'update_description':
        await documentStore.bulkUpdateDescription(selectedDocuments.value, updateForm.value.description)
        break
    }

    // Reset selection and form
    selectedDocuments.value = []
    showUpdateForm.value = false
    updateForm.value = {
      action: '',
      category: '',
      tags: '',
      access_level: 'internal',
      is_public: false,
      description: '',
    }

    // Reload documents
    await loadDocuments()
  }
  catch (err) {
    console.error('Error executing bulk update:', err)
  }
  finally {
    updating.value = false
  }
}

const handleCancel = () => {
  showUpdateForm.value = false
  updateForm.value = {
    action: '',
    category: '',
    tags: '',
    access_level: 'internal',
    is_public: false,
    description: '',
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
  <div class="document-bulk-update">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.bulk_update') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.bulk_update_subtitle') }}
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
              prepend-icon="tabler-folder"
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

            <VBtn
              size="small"
              variant="outlined"
              prepend-icon="tabler-shield"
              @click="handleBulkAction('update_access_level')"
            >
              {{ t('DocumentsModule.common.update_access_level') }}
            </VBtn>

            <VBtn
              size="small"
              variant="outlined"
              prepend-icon="tabler-globe"
              @click="handleBulkAction('update_public')"
            >
              {{ t('DocumentsModule.common.update_public') }}
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Bulk Update Form -->
    <VCard
      v-if="showUpdateForm"
      class="mb-6"
    >
      <VCardTitle>
        {{ t('DocumentsModule.document.bulk_update_form') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="executeBulkUpdate">
          <VRow>
            <!-- Category Update -->
            <VCol
              v-if="updateForm.action === 'update_category'"
              cols="12"
              md="6"
            >
              <VSelect
                v-model="updateForm.category"
                :items="documentStore.categoryOptions"
                :label="t('DocumentsModule.document.fields.category')"
                variant="outlined"
                required
              />
            </VCol>

            <!-- Tags Update -->
            <VCol
              v-if="updateForm.action === 'update_tags'"
              cols="12"
              md="6"
            >
              <VTextField
                v-model="updateForm.tags"
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
              v-if="updateForm.action === 'update_access_level'"
              cols="12"
              md="6"
            >
              <VSelect
                v-model="updateForm.access_level"
                :items="documentStore.accessLevelOptions"
                :label="t('DocumentsModule.document.fields.access_level')"
                variant="outlined"
                required
              />
            </VCol>

            <!-- Public Update -->
            <VCol
              v-if="updateForm.action === 'update_public'"
              cols="12"
              md="6"
            >
              <VSwitch
                v-model="updateForm.is_public"
                :label="t('DocumentsModule.document.fields.is_public')"
                color="primary"
              />
            </VCol>

            <!-- Description Update -->
            <VCol
              v-if="updateForm.action === 'update_description'"
              cols="12"
            >
              <VTextarea
                v-model="updateForm.description"
                :label="t('DocumentsModule.document.fields.description')"
                variant="outlined"
                rows="3"
                required
              />
            </VCol>
          </VRow>

          <div class="d-flex gap-3 mt-4">
            <VBtn
              type="submit"
              color="primary"
              :loading="updating"
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

      <div v-else>
        <!-- Select All -->
        <VCard class="mb-4">
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VCheckbox
                :model-value="allSelected"
                :indeterminate="someSelected"
                @click="handleSelectAll"
              />

              <div class="flex-grow-1">
                <div class="font-weight-medium">
                  {{ t('DocumentsModule.document.select_all_documents') }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('DocumentsModule.document.select_all_subtitle') }}
                </div>
              </div>

              <div class="text-body-2 text-medium-emphasis">
                {{ documents.length }} {{ t('DocumentsModule.document.total_documents') }}
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Documents List -->
        <div class="d-flex flex-column gap-4">
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
  </div>
</template>

<style scoped>
.document-bulk-update {
  padding: 24px;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
