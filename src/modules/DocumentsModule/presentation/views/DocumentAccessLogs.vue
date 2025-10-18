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
const accessLogs = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const documentId = computed(() => route.params.id as string)

// Headers for the table
const headers = [
  { title: t('DocumentsModule.document.access_logs.action'), key: 'action' },
  { title: t('DocumentsModule.document.access_logs.user'), key: 'user_id' },
  { title: t('DocumentsModule.document.access_logs.ip_address'), key: 'ip_address' },
  { title: t('DocumentsModule.document.access_logs.user_agent'), key: 'user_agent' },
  { title: t('DocumentsModule.document.access_logs.created_at'), key: 'created_at' },
]

// Methods
const loadAccessLogs = async () => {
  try {
    loading.value = true
    error.value = null

    accessLogs.value = await documentStore.fetchDocumentAccessLogs(documentId.value)
  }
  catch (err) {
    error.value = 'Error al cargar los registros de acceso'
    console.error('Error loading access logs:', err)
  }
  finally {
    loading.value = false
  }
}

const getActionIcon = (action: string): string => {
  const icons: Record<string, string> = {
    view: 'tabler-eye',
    download: 'tabler-download',
    upload: 'tabler-upload',
    update: 'tabler-edit',
    delete: 'tabler-trash',
    share: 'tabler-share',
    revoke: 'tabler-x',
  }

  return icons[action] || 'tabler-activity'
}

const getActionColor = (action: string): string => {
  const colors: Record<string, string> = {
    view: 'info',
    download: 'success',
    upload: 'primary',
    update: 'warning',
    delete: 'error',
    share: 'secondary',
    revoke: 'error',
  }

  return colors[action] || 'default'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const truncateText = (text: string, maxLength = 50) => {
  if (text.length <= maxLength)
    return text

  return `${text.substring(0, maxLength)}...`
}

// Lifecycle
onMounted(() => {
  loadAccessLogs()
})
</script>

<template>
  <div class="document-access-logs">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.access_logs') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.access_logs_subtitle') }}
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
        @click="loadAccessLogs"
      >
        {{ t('DocumentsModule.common.refresh') }}
      </VBtn>
    </div>

    <!-- Access Logs Table -->
    <div v-else>
      <VCard v-if="accessLogs.length === 0">
        <VCardText class="text-center py-8">
          <VIcon
            icon="tabler-history-off"
            size="48"
            class="text-medium-emphasis mb-4"
          />
          <div class="text-h6 mb-2">
            {{ t('DocumentsModule.common.no_data') }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t('DocumentsModule.document.no_access_logs') }}
          </div>
        </VCardText>
      </VCard>

      <VCard v-else>
        <VDataTable
          :headers="headers"
          :items="accessLogs"
          :loading="loading"
          item-value="id"
        >
          <!-- Action Column -->
          <template #item.action="{ item }">
            <div class="d-flex align-center gap-2">
              <VIcon
                :icon="getActionIcon(item.action)"
                :color="getActionColor(item.action)"
                size="20"
              />
              <span class="text-capitalize">{{ item.action }}</span>
            </div>
          </template>

          <!-- User Column -->
          <template #item.user_id="{ item }">
            <div
              v-if="item.user_id"
              class="d-flex align-center gap-2"
            >
              <VIcon
                icon="tabler-user"
                size="16"
              />
              <span>{{ item.user_id }}</span>
            </div>
            <div
              v-else
              class="text-medium-emphasis"
            >
              {{ t('DocumentsModule.document.access_logs.anonymous') }}
            </div>
          </template>

          <!-- IP Address Column -->
          <template #item.ip_address="{ item }">
            <div
              v-if="item.ip_address"
              class="d-flex align-center gap-2"
            >
              <VIcon
                icon="tabler-world"
                size="16"
              />
              <span>{{ item.ip_address }}</span>
            </div>
            <div
              v-else
              class="text-medium-emphasis"
            >
              {{ t('DocumentsModule.document.access_logs.unknown') }}
            </div>
          </template>

          <!-- User Agent Column -->
          <template #item.user_agent="{ item }">
            <div
              v-if="item.user_agent"
              class="text-truncate"
              style="max-inline-size: 300px;"
            >
              {{ truncateText(item.user_agent) }}
            </div>
            <div
              v-else
              class="text-medium-emphasis"
            >
              {{ t('DocumentsModule.document.access_logs.unknown') }}
            </div>
          </template>

          <!-- Created At Column -->
          <template #item.created_at="{ item }">
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="tabler-clock"
                size="16"
              />
              <span>{{ formatDate(item.created_at) }}</span>
            </div>
          </template>

          <!-- No Data -->
          <template #no-data>
            <div class="text-center py-8">
              <VIcon
                icon="tabler-history-off"
                size="48"
                class="text-medium-emphasis mb-4"
              />
              <div class="text-h6 mb-2">
                {{ t('DocumentsModule.common.no_data') }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('DocumentsModule.document.no_access_logs') }}
              </div>
            </div>
          </template>
        </VDataTable>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.document-access-logs {
  padding: 24px;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
