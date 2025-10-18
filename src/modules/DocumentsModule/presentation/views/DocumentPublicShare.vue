<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'

// Composables
const { t } = useI18n()
const route = useRoute()

// Store
const documentStore = useDocumentStore()

// State
const document = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const password = ref('')
const showPasswordForm = ref(false)

// Computed
const shareToken = computed(() => route.params.token as string)

// Methods
const loadSharedDocument = async () => {
  try {
    loading.value = true
    error.value = null

    document.value = await documentStore.fetchSharedDocument(shareToken.value)
  }
  catch (err) {
    error.value = 'Error al cargar el documento compartido'
    console.error('Error loading shared document:', err)
  }
  finally {
    loading.value = false
  }
}

const handleDownload = async () => {
  try {
    const blob = await documentStore.downloadSharedDocument(shareToken.value, password.value)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.value.createElement('a')

    link.href = url
    link.download = document.value?.file_name || 'document'
    document.value.body.appendChild(link)
    link.click()
    document.value.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
  catch (err) {
    console.error('Error downloading shared document:', err)
  }
}

const getDocumentIcon = (document: any): string => {
  return documentStore.getDocumentIcon(document)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  loadSharedDocument()
})
</script>

<template>
  <div class="document-public-share">
    <!-- Header -->
    <div class="d-flex justify-center align-center mb-6">
      <div class="text-center">
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.shared_document') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.shared_document_subtitle') }}
        </p>
      </div>
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
    </div>

    <!-- Document Content -->
    <div
      v-else-if="document"
      class="max-width-800 mx-auto"
    >
      <VCard>
        <VCardText>
          <div class="d-flex align-center gap-4 mb-4">
            <VIcon
              :icon="getDocumentIcon(document)"
              size="48"
              color="primary"
            />

            <div class="flex-grow-1">
              <h2 class="text-h5 font-weight-medium mb-1">
                {{ document.title }}
              </h2>

              <div class="text-body-2 text-medium-emphasis mb-2">
                {{ document.file_name }} • {{ document.file_size_formatted }}
              </div>

              <div class="d-flex flex-wrap gap-3 text-caption text-medium-emphasis">
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
          </div>

          <div
            v-if="document.description"
            class="text-body-1 mb-4"
          >
            {{ document.description }}
          </div>

          <div
            v-if="document.tags && document.tags.length > 0"
            class="d-flex flex-wrap gap-2 mb-4"
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

          <!-- Password Form -->
          <div
            v-if="document.has_password && !showPasswordForm"
            class="mb-4"
          >
            <VBtn
              color="primary"
              prepend-icon="tabler-lock"
              @click="showPasswordForm = true"
            >
              {{ t('DocumentsModule.document.enter_password') }}
            </VBtn>
          </div>

          <VForm
            v-if="showPasswordForm"
            class="mb-4"
            @submit.prevent="handleDownload"
          >
            <VRow>
              <VCol
                cols="12"
                md="8"
              >
                <VTextField
                  v-model="password"
                  :label="t('DocumentsModule.document.password')"
                  type="password"
                  variant="outlined"
                  required
                />
              </VCol>

              <VCol
                cols="12"
                md="4"
              >
                <VBtn
                  type="submit"
                  color="primary"
                  block
                >
                  {{ t('DocumentsModule.common.download') }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>

          <!-- Download Button -->
          <div
            v-else
            class="d-flex justify-center"
          >
            <VBtn
              color="primary"
              size="large"
              prepend-icon="tabler-download"
              @click="handleDownload"
            >
              {{ t('DocumentsModule.common.download') }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.document-public-share {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-block-size: 100vh;
}

.max-width-800 {
  max-inline-size: 800px;
}
</style>
