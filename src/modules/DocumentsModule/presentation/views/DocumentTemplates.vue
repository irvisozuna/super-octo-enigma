<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// State
const templates = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Methods
const loadTemplates = async () => {
  try {
    loading.value = true
    error.value = null

    templates.value = await documentStore.fetchMetadataTemplates()
  }
  catch (err) {
    error.value = 'Error al cargar las plantillas'
    console.error('Error loading templates:', err)
  }
  finally {
    loading.value = false
  }
}

const handleCreateDocument = (template: any) => {
  router.push({
    name: 'documents-create',
    query: { template: template.id },
  })
}

const handleEditTemplate = (template: any) => {
  // Navigate to template editor
  console.log('Edit template:', template)
}

const handleDeleteTemplate = async (template: any) => {
  if (confirm(t('DocumentsModule.messages.confirm_delete_template'))) {
    try {
      await documentStore.deleteMetadataTemplate(template.id)
      await loadTemplates()
    }
    catch (err) {
      console.error('Error deleting template:', err)
    }
  }
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<template>
  <div class="document-templates">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.templates') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.templates_subtitle') }}
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
        @click="loadTemplates"
      >
        {{ t('DocumentsModule.common.refresh') }}
      </VBtn>
    </div>

    <!-- Templates List -->
    <div v-else>
      <VCard v-if="templates.length === 0">
        <VCardText class="text-center py-8">
          <VIcon
            icon="tabler-template-off"
            size="48"
            class="text-medium-emphasis mb-4"
          />
          <div class="text-h6 mb-2">
            {{ t('DocumentsModule.common.no_data') }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t('DocumentsModule.document.no_templates') }}
          </div>
        </VCardText>
      </VCard>

      <div
        v-else
        class="d-flex flex-column gap-4"
      >
        <VCard
          v-for="template in templates"
          :key="template.id"
        >
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-4">
                <VIcon
                  icon="tabler-template"
                  size="32"
                  color="primary"
                />

                <div>
                  <h3 class="text-h6 font-weight-medium mb-1">
                    {{ template.name }}
                  </h3>

                  <div class="text-body-2 text-medium-emphasis mb-2">
                    {{ template.description }}
                  </div>

                  <div class="d-flex flex-wrap gap-3 text-caption text-medium-emphasis">
                    <div class="d-flex align-center gap-1">
                      <VIcon
                        icon="tabler-file"
                        size="16"
                      />
                      {{ template.document_type }}
                    </div>

                    <div class="d-flex align-center gap-1">
                      <VIcon
                        icon="tabler-folder"
                        size="16"
                      />
                      {{ template.category }}
                    </div>

                    <div class="d-flex align-center gap-1">
                      <VIcon
                        icon="tabler-calendar"
                        size="16"
                      />
                      {{ new Date(template.created_at).toLocaleDateString() }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2">
                <VBtn
                  size="small"
                  color="primary"
                  prepend-icon="tabler-plus"
                  @click="handleCreateDocument(template)"
                >
                  {{ t('DocumentsModule.common.use') }}
                </VBtn>

                <VBtn
                  size="small"
                  variant="outlined"
                  prepend-icon="tabler-edit"
                  @click="handleEditTemplate(template)"
                >
                  {{ t('DocumentsModule.common.edit') }}
                </VBtn>

                <VBtn
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="tabler-trash"
                  @click="handleDeleteTemplate(template)"
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
.document-templates {
  padding: 24px;
}
</style>
