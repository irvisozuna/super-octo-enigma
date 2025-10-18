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
const searchQuery = ref('')
const searchResults = ref<DocumentEntity[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const hasSearched = ref(false)

// Computed
const hasResults = computed(() => searchResults.value.length > 0)

// Methods
const performSearch = async () => {
  if (!searchQuery.value.trim())
    return

  try {
    loading.value = true
    error.value = null
    hasSearched.value = true

    searchResults.value = await documentStore.searchDocuments(searchQuery.value)
  }
  catch (err) {
    error.value = 'Error al realizar la búsqueda'
    console.error('Error searching documents:', err)
  }
  finally {
    loading.value = false
  }
}

const handleSearch = () => {
  performSearch()
}

const handleClear = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
  error.value = null
}

const handleDocumentClick = (document: DocumentEntity) => {
  router.push({ name: 'documents-detail', params: { id: document.id } })
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

const highlightText = (text: string, query: string): string => {
  if (!query)
    return text

  const regex = new RegExp(`(${query})`, 'gi')

  return text.replace(regex, '<mark>$1</mark>')
}

// Lifecycle
onMounted(() => {
  // Focus on search input
  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
  if (searchInput)
    searchInput.focus()
})
</script>

<template>
  <div class="document-search">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.search') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.search_subtitle') }}
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

    <!-- Search Form -->
    <VCard class="mb-6">
      <VCardText>
        <VForm @submit.prevent="handleSearch">
          <VRow>
            <VCol
              cols="12"
              md="10"
            >
              <VTextField
                v-model="searchQuery"
                :label="t('DocumentsModule.document.search_placeholder')"
                variant="outlined"
                prepend-inner-icon="tabler-search"
                clearable
                @click:clear="handleClear"
                @keyup.enter="handleSearch"
              />
            </VCol>

            <VCol
              cols="12"
              md="2"
            >
              <VBtn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                :disabled="!searchQuery.trim()"
              >
                {{ t('DocumentsModule.common.search') }}
              </VBtn>
            </VCol>
          </VRow>
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
        {{ t('DocumentsModule.common.searching') }}
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
        @click="performSearch"
      >
        {{ t('DocumentsModule.common.retry') }}
      </VBtn>
    </div>

    <!-- No Results -->
    <div
      v-else-if="hasSearched && !hasResults"
      class="text-center py-8"
    >
      <VIcon
        icon="tabler-search-off"
        size="64"
        class="text-medium-emphasis mb-4"
      />
      <div class="text-h6 mb-2">
        {{ t('DocumentsModule.document.no_results') }}
      </div>
      <div class="text-body-2 text-medium-emphasis mb-4">
        {{ t('DocumentsModule.document.no_results_subtitle') }}
      </div>
      <VBtn
        variant="outlined"
        @click="handleClear"
      >
        {{ t('DocumentsModule.common.clear_search') }}
      </VBtn>
    </div>

    <!-- Search Results -->
    <div v-else-if="hasResults">
      <div class="d-flex justify-space-between align-center mb-4">
        <div class="text-h6">
          {{ t('DocumentsModule.document.search_results') }} ({{ searchResults.length }})
        </div>

        <VBtn
          variant="outlined"
          prepend-icon="tabler-x"
          @click="handleClear"
        >
          {{ t('DocumentsModule.common.clear_search') }}
        </VBtn>
      </div>

      <div class="d-flex flex-column gap-4">
        <VCard
          v-for="document in searchResults"
          :key="document.id"
          class="search-result-card"
          @click="handleDocumentClick(document)"
        >
          <VCardText>
            <div class="d-flex align-start gap-4">
              <VIcon
                :icon="getDocumentIcon(document)"
                size="32"
                class="mt-1"
              />

              <div class="flex-grow-1">
                <div class="d-flex justify-space-between align-start mb-2">
                  <div>
                    <h3 class="text-h6 font-weight-medium mb-1">
                      <span v-html="highlightText(document.title, searchQuery)" />
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
                  <span v-html="highlightText(document.description, searchQuery)" />
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

    <!-- Initial State -->
    <div
      v-else
      class="text-center py-8"
    >
      <VIcon
        icon="tabler-search"
        size="64"
        class="text-medium-emphasis mb-4"
      />
      <div class="text-h6 mb-2">
        {{ t('DocumentsModule.document.search_initial_title') }}
      </div>
      <div class="text-body-2 text-medium-emphasis">
        {{ t('DocumentsModule.document.search_initial_subtitle') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-search {
  padding: 24px;
}

.search-result-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-result-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
  transform: translateY(-2px);
}

mark {
  border-radius: 4px;
  background-color: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-on-warning));
  padding-block: 2px;
  padding-inline: 4px;
}
</style>
