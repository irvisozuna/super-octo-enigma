<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentStatistics } from '../../domain/entities/DocumentEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// State
const statistics = ref<DocumentStatistics | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Methods
const loadStatistics = async () => {
  try {
    loading.value = true
    error.value = null

    statistics.value = await documentStore.fetchStatistics()
  }
  catch (err) {
    error.value = 'Error al cargar las estadísticas'
    console.error('Error loading statistics:', err)
  }
  finally {
    loading.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const getPercentage = (value: number, total: number): number => {
  if (total === 0)
    return 0

  return Math.round((value / total) * 100)
}

// Lifecycle
onMounted(() => {
  loadStatistics()
})
</script>

<template>
  <div class="document-statistics">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.statistics') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.statistics_subtitle') }}
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
        @click="loadStatistics"
      >
        {{ t('DocumentsModule.common.refresh') }}
      </VBtn>
    </div>

    <!-- Statistics Content -->
    <div v-else-if="statistics">
      <VRow>
        <!-- Overview Cards -->
        <VCol
          cols="12"
          md="3"
        >
          <VCard>
            <VCardText class="text-center">
              <VIcon
                icon="tabler-file-text"
                size="48"
                color="primary"
                class="mb-4"
              />
              <div class="text-h4 font-weight-bold">
                {{ statistics.total_documents }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('DocumentsModule.document.statistics.total_documents') }}
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="3"
        >
          <VCard>
            <VCardText class="text-center">
              <VIcon
                icon="tabler-database"
                size="48"
                color="success"
                class="mb-4"
              />
              <div class="text-h4 font-weight-bold">
                {{ formatFileSize(statistics.total_size) }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('DocumentsModule.document.statistics.total_size') }}
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="3"
        >
          <VCard>
            <VCardText class="text-center">
              <VIcon
                icon="tabler-upload"
                size="48"
                color="info"
                class="mb-4"
              />
              <div class="text-h4 font-weight-bold">
                {{ statistics.recent_uploads }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('DocumentsModule.document.statistics.recent_uploads') }}
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="3"
        >
          <VCard>
            <VCardText class="text-center">
              <VIcon
                icon="tabler-share"
                size="48"
                color="warning"
                class="mb-4"
              />
              <div class="text-h4 font-weight-bold">
                {{ statistics.active_share_links }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('DocumentsModule.document.statistics.active_share_links') }}
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Documents by Type -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>
              {{ t('DocumentsModule.document.statistics.by_type') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <div
                  v-for="(count, type) in statistics.documents_by_type"
                  :key="type"
                  class="d-flex justify-space-between align-center"
                >
                  <div class="d-flex align-center gap-3">
                    <VIcon
                      icon="tabler-file"
                      size="20"
                    />
                    <span class="text-body-1">{{ type }}</span>
                  </div>

                  <div class="d-flex align-center gap-3">
                    <VProgressLinear
                      :model-value="getPercentage(count, statistics.total_documents)"
                      color="primary"
                      style="inline-size: 100px;"
                    />
                    <span class="text-body-2 font-weight-medium">{{ count }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Documents by Category -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>
              {{ t('DocumentsModule.document.statistics.by_category') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <div
                  v-for="(count, category) in statistics.documents_by_category"
                  :key="category"
                  class="d-flex justify-space-between align-center"
                >
                  <div class="d-flex align-center gap-3">
                    <VIcon
                      icon="tabler-folder"
                      size="20"
                    />
                    <span class="text-body-1">{{ category }}</span>
                  </div>

                  <div class="d-flex align-center gap-3">
                    <VProgressLinear
                      :model-value="getPercentage(count, statistics.total_documents)"
                      color="success"
                      style="inline-size: 100px;"
                    />
                    <span class="text-body-2 font-weight-medium">{{ count }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Documents by Status -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>
              {{ t('DocumentsModule.document.statistics.by_status') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <div
                  v-for="(count, status) in statistics.documents_by_status"
                  :key="status"
                  class="d-flex justify-space-between align-center"
                >
                  <div class="d-flex align-center gap-3">
                    <VIcon
                      :icon="status === 'active' ? 'tabler-check-circle' : 'tabler-circle'"
                      :color="status === 'active' ? 'success' : 'default'"
                      size="20"
                    />
                    <span class="text-body-1">{{ status }}</span>
                  </div>

                  <div class="d-flex align-center gap-3">
                    <VProgressLinear
                      :model-value="getPercentage(count, statistics.total_documents)"
                      :color="status === 'active' ? 'success' : 'default'"
                      style="inline-size: 100px;"
                    />
                    <span class="text-body-2 font-weight-medium">{{ count }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Storage Information -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>
              {{ t('DocumentsModule.document.statistics.storage_info') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-4">
                <div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2">{{ t('DocumentsModule.document.statistics.total_size') }}</span>
                    <span class="text-body-2 font-weight-medium">{{ formatFileSize(statistics.total_size) }}</span>
                  </div>

                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2">{{ t('DocumentsModule.document.statistics.average_size') }}</span>
                    <span class="text-body-2 font-weight-medium">{{ formatFileSize(statistics.average_size) }}</span>
                  </div>
                </div>

                <VDivider />

                <div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2">{{ t('DocumentsModule.document.statistics.active_share_links') }}</span>
                    <span class="text-body-2 font-weight-medium">{{ statistics.active_share_links }}</span>
                  </div>

                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2">{{ t('DocumentsModule.document.statistics.expired_share_links') }}</span>
                    <span class="text-body-2 font-weight-medium">{{ statistics.expired_share_links }}</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </div>
</template>

<style scoped>
.document-statistics {
  padding: 24px;
}
</style>
