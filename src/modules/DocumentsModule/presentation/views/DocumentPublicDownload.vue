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
const loading = ref(false)
const error = ref<string | null>(null)
const password = ref('')

// Computed
const shareToken = computed(() => route.params.token as string)

// Methods
const downloadDocument = async () => {
  try {
    loading.value = true
    error.value = null

    const blob = await documentStore.downloadSharedDocument(shareToken.value, password.value)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'document'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Redirect to success page or close window
    setTimeout(() => {
      window.close()
    }, 1000)
  }
  catch (err) {
    error.value = 'Error al descargar el documento'
    console.error('Error downloading shared document:', err)
  }
  finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Auto-download when component mounts
  downloadDocument()
})
</script>

<template>
  <div class="document-public-download">
    <div class="text-center py-8">
      <VProgressCircular
        v-if="loading"
        indeterminate
        color="primary"
        size="64"
      />

      <div
        v-else-if="error"
        class="text-center"
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
          @click="downloadDocument"
        >
          {{ t('DocumentsModule.common.retry') }}
        </VBtn>
      </div>

      <div
        v-else
        class="text-center"
      >
        <VIcon
          icon="tabler-check-circle"
          size="64"
          color="success"
          class="mb-4"
        />
        <div class="text-h6 mb-2">
          {{ t('DocumentsModule.document.download_success') }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t('DocumentsModule.document.download_success_subtitle') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-public-download {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-block-size: 100vh;
}
</style>
