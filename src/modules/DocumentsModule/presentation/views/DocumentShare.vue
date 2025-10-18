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
const shareLinks = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showCreateForm = ref(false)

// Form for creating share link
const createForm = ref({
  password: '',
  expires_at: '',
  max_downloads: null as number | null,
  permissions: ['view'] as string[],
  allowed_emails: [] as string[],
  notes: '',
})

// Computed
const documentId = computed(() => route.params.id as string)

// Methods
const loadShareLinks = async () => {
  try {
    loading.value = true
    error.value = null

    shareLinks.value = await documentStore.fetchDocumentShareLinks(documentId.value)
  }
  catch (err) {
    error.value = 'Error al cargar los enlaces de compartir'
    console.error('Error loading share links:', err)
  }
  finally {
    loading.value = false
  }
}

const handleCreateShareLink = async () => {
  try {
    loading.value = true

    await documentStore.createShareLink(documentId.value, createForm.value)

    // Reset form
    createForm.value = {
      password: '',
      expires_at: '',
      max_downloads: null,
      permissions: ['view'],
      allowed_emails: [],
      notes: '',
    }

    showCreateForm.value = false

    // Reload share links
    await loadShareLinks()
  }
  catch (err) {
    console.error('Error creating share link:', err)
  }
  finally {
    loading.value = false
  }
}

const handleRevokeShareLink = async (shareLinkId: string) => {
  if (confirm(t('DocumentsModule.messages.confirm_revoke_share_link'))) {
    try {
      await documentStore.revokeShareLink(documentId.value, shareLinkId)
      await loadShareLinks()
    }
    catch (err) {
      console.error('Error revoking share link:', err)
    }
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)

  // Show success message
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const isExpired = (expiresAt: string | null) => {
  if (!expiresAt)
    return false

  return new Date(expiresAt) < new Date()
}

// Lifecycle
onMounted(() => {
  loadShareLinks()
})
</script>

<template>
  <div class="document-share">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.share_links') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.share_subtitle') }}
        </p>
      </div>

      <div class="d-flex gap-3">
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          @click="showCreateForm = !showCreateForm"
        >
          {{ t('DocumentsModule.common.create') }}
        </VBtn>

        <VBtn
          variant="outlined"
          prepend-icon="tabler-arrow-left"
          @click="router.push({ name: 'documents-detail', params: { id: documentId } })"
        >
          {{ t('DocumentsModule.common.back') }}
        </VBtn>
      </div>
    </div>

    <!-- Create Share Link Form -->
    <VCard
      v-if="showCreateForm"
      class="mb-6"
    >
      <VCardTitle>
        {{ t('DocumentsModule.document.create_share_link') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleCreateShareLink">
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="createForm.password"
                :label="t('DocumentsModule.document.share_password')"
                variant="outlined"
                type="password"
                hint="Optional password protection"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="createForm.expires_at"
                :label="t('DocumentsModule.document.share_expires')"
                variant="outlined"
                type="datetime-local"
                hint="Optional expiration date"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="createForm.max_downloads"
                :label="t('DocumentsModule.document.share_max_downloads')"
                variant="outlined"
                type="number"
                hint="Maximum number of downloads"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="createForm.permissions"
                :items="[
                  { value: 'view', title: 'View' },
                  { value: 'download', title: 'Download' },
                  { value: 'print', title: 'Print' },
                ]"
                :label="t('DocumentsModule.document.share_permissions')"
                variant="outlined"
                multiple
                chips
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="createForm.notes"
                :label="t('DocumentsModule.document.share_notes')"
                variant="outlined"
                rows="2"
                hint="Internal notes about this share link"
                persistent-hint
              />
            </VCol>
          </VRow>

          <div class="d-flex gap-3 mt-4">
            <VBtn
              type="submit"
              color="primary"
              :loading="loading"
            >
              {{ t('DocumentsModule.common.create') }}
            </VBtn>

            <VBtn
              variant="outlined"
              @click="showCreateForm = false"
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
        @click="loadShareLinks"
      >
        {{ t('DocumentsModule.common.refresh') }}
      </VBtn>
    </div>

    <!-- Share Links List -->
    <div v-else>
      <VCard v-if="shareLinks.length === 0">
        <VCardText class="text-center py-8">
          <VIcon
            icon="tabler-share-off"
            size="48"
            class="text-medium-emphasis mb-4"
          />
          <div class="text-h6 mb-2">
            {{ t('DocumentsModule.common.no_data') }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t('DocumentsModule.document.no_share_links') }}
          </div>
        </VCardText>
      </VCard>

      <div
        v-else
        class="d-flex flex-column gap-4"
      >
        <VCard
          v-for="shareLink in shareLinks"
          :key="shareLink.id"
          :class="{ 'border-error': isExpired(shareLink.expires_at) }"
        >
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <div class="d-flex align-center gap-3 mb-2">
                  <VIcon
                    :icon="shareLink.is_active ? 'tabler-link' : 'tabler-link-off'"
                    :color="shareLink.is_active ? 'primary' : 'error'"
                    size="20"
                  />

                  <div class="font-weight-medium">
                    {{ t('DocumentsModule.document.share_link') }}
                    <VChip
                      v-if="isExpired(shareLink.expires_at)"
                      size="small"
                      color="error"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ t('DocumentsModule.document.expired') }}
                    </VChip>
                    <VChip
                      v-else-if="!shareLink.is_active"
                      size="small"
                      color="error"
                      variant="tonal"
                      class="ml-2"
                    >
                      {{ t('DocumentsModule.document.revoked') }}
                    </VChip>
                  </div>
                </div>

                <div class="text-body-2 text-medium-emphasis mb-2">
                  {{ shareLink.share_url }}
                </div>

                <div class="d-flex flex-wrap gap-4 text-caption text-medium-emphasis">
                  <div v-if="shareLink.has_password">
                    <VIcon
                      icon="tabler-lock"
                      size="16"
                      class="mr-1"
                    />
                    {{ t('DocumentsModule.document.password_protected') }}
                  </div>

                  <div v-if="shareLink.expires_at">
                    <VIcon
                      icon="tabler-clock"
                      size="16"
                      class="mr-1"
                    />
                    {{ t('DocumentsModule.document.expires') }}: {{ formatDate(shareLink.expires_at) }}
                  </div>

                  <div v-if="shareLink.max_downloads">
                    <VIcon
                      icon="tabler-download"
                      size="16"
                      class="mr-1"
                    />
                    {{ t('DocumentsModule.document.downloads') }}: {{ shareLink.download_count }}/{{ shareLink.max_downloads }}
                  </div>

                  <div>
                    <VIcon
                      icon="tabler-calendar"
                      size="16"
                      class="mr-1"
                    />
                    {{ t('DocumentsModule.common.created_at') }}: {{ formatDate(shareLink.created_at) }}
                  </div>
                </div>

                <div
                  v-if="shareLink.notes"
                  class="text-body-2 mt-2"
                >
                  {{ shareLink.notes }}
                </div>
              </div>

              <div class="d-flex gap-2">
                <VBtn
                  size="small"
                  variant="outlined"
                  prepend-icon="tabler-copy"
                  @click="copyToClipboard(shareLink.share_url)"
                >
                  {{ t('DocumentsModule.common.copy') }}
                </VBtn>

                <VBtn
                  v-if="shareLink.is_active"
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="tabler-x"
                  @click="handleRevokeShareLink(shareLink.id)"
                >
                  {{ t('DocumentsModule.common.revoke') }}
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
.document-share {
  padding: 24px;
}

.border-error {
  border: 2px solid rgb(var(--v-theme-error));
}
</style>
