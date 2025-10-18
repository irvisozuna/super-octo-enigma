<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// State
const versions = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const documentId = computed(() => route.params.id as string)

// Methods
const loadVersions = async () => {
  try {
    loading.value = true
    error.value = null

    versions.value = await documentStore.fetchDocumentVersions(documentId.value)
  }
  catch (err) {
    error.value = 'Error al cargar las versiones del documento'
    console.error('Error loading document versions:', err)
  }
  finally {
    loading.value = false
  }
}

const handleRestore = async (versionId: string) => {
  if (confirm(t('DocumentsModule.messages.confirm_restore_version'))) {
    try {
      await documentStore.restoreToVersion(documentId.value, versionId)
      await loadVersions()
    }
    catch (err) {
      console.error('Error restoring version:', err)
    }
  }
}

const handleDelete = async (versionId: string) => {
  if (confirm(t('DocumentsModule.messages.confirm_delete_version'))) {
    try {
      await documentStore.deleteDocumentVersion(documentId.value, versionId)
      await loadVersions()
    }
    catch (err) {
      console.error('Error deleting version:', err)
    }
  }
}

// Lifecycle
onMounted(() => {
  loadVersions()
})
</script>

<template>
  <div class="document-versions">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.versions') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.versions_subtitle') }}
        </p>
      </div>

      <VBtn
        variant="outlined"
        prepend-icon="tabler-arrow-left"
        @click="router.push({ name: 'documents-detail', params: { id: documentId } })"
      >
        {{ t('DocumentsModule.common.back') }}
      </VBtn>
    </div>

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
        @click="loadVersions"
      >
        {{ t('DocumentsModule.common.refresh') }}
      </VBtn>
    </div>

    <!-- Versions List -->
    <div v-else>
      <VCard v-if="versions.length === 0">
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
            {{ t('DocumentsModule.document.no_versions') }}
          </div>
        </VCardText>
      </VCard>

      <div
        v-else
        class="d-flex flex-column gap-4"
      >
        <VCard
          v-for="version in versions"
          :key="version.id"
          :class="{ 'border-primary': version.is_current }"
        >
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-4">
                <VIcon
                  :icon="version.is_current ? 'tabler-check-circle' : 'tabler-file'"
                  :color="version.is_current ? 'primary' : 'default'"
                  size="24"
                />

                <div>
                  <div class="font-weight-medium">
                    {{ t('DocumentsModule.document.version') }} {{ version.version_number }}
                    <VChip
                      v-if="version.is_current"
                      size="small"
                      color="primary"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ t('DocumentsModule.document.current') }}
                    </VChip>
                  </div>

                  <div class="text-caption text-medium-emphasis">
                    {{ version.file_name }} ({{ version.file_size }} bytes)
                  </div>

                  <div class="text-caption text-medium-emphasis">
                    {{ t('DocumentsModule.document.created_by') }}: {{ version.created_by }}
                    • {{ new Date(version.created_at).toLocaleString() }}
                  </div>

                  <div
                    v-if="version.change_description"
                    class="text-body-2 mt-2"
                  >
                    {{ version.change_description }}
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2">
                <VBtn
                  v-if="!version.is_current"
                  size="small"
                  variant="outlined"
                  prepend-icon="tabler-restore"
                  @click="handleRestore(version.id)"
                >
                  {{ t('DocumentsModule.common.restore') }}
                </VBtn>

                <VBtn
                  v-if="!version.is_current"
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="tabler-trash"
                  @click="handleDelete(version.id)"
                >
                  {{ t('DocumentsModule.common.delete') }}
                </VBtn>
              </div>
            </div>
          </VCardText>
        </VCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-versions {
  padding: 24px;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
