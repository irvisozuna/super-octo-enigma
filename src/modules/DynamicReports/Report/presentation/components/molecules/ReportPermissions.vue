<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportValidation } from '@/modules/DynamicReports/Report/presentation/composables/useReportValidation'

// Props
interface Props {
  modelValue: {
    permissions: string[]
    tags: string[]
    department: string
    category: string
    cacheEnabled: boolean
    cacheDuration: number
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']]
  validation: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()
const { validateMetadata, validationErrors } = useReportValidation()

// Estado local
const cacheDuration = ref('3600')

// Computed
const availablePermissions = [
  'reports.view',
  'reports.create',
  'reports.edit',
  'reports.delete',
  'reports.export',
  'reports.share',
  'data.view',
  'data.export',
]

const availableTags = [
  'sales',
  'marketing',
  'finance',
  'hr',
  'operations',
  'analytics',
  'monthly',
  'quarterly',
  'annual',
]

const cacheDurationOptions = [
  { value: '3600', title: t('DynamicReports.report.permissions.cache.1_hour') },
  { value: '7200', title: t('DynamicReports.report.permissions.cache.2_hours') },
  { value: '21600', title: t('DynamicReports.report.permissions.cache.6_hours') },
  { value: '43200', title: t('DynamicReports.report.permissions.cache.12_hours') },
  { value: '86400', title: t('DynamicReports.report.permissions.cache.1_day') },
  { value: 'custom', title: t('DynamicReports.report.permissions.cache.custom') },
]

const hasAnyConfiguration = computed(() => {
  return props.modelValue.permissions.length > 0
         || props.modelValue.tags.length > 0
         || props.modelValue.department
         || props.modelValue.category
         || props.modelValue.cacheEnabled
})

// Métodos
const validatePermissions = async () => {
  const errors = await validateMetadata(props.modelValue)
  const isValid = errors.length === 0

  emit('validation', isValid)
}

const updateCacheDuration = (value: string) => {
  if (value !== 'custom') {
    props.modelValue.cacheDuration = Number.parseInt(value)
    emit('update:modelValue', { ...props.modelValue })
  }
}

const formatCacheDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds} ${t('DynamicReports.report.permissions.cache.seconds')}`
  }
  else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)

    return `${minutes} ${t('DynamicReports.report.permissions.cache.minutes')}`
  }
  else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)

    return `${hours} ${t('DynamicReports.report.permissions.cache.hours')}`
  }
  else {
    const days = Math.floor(seconds / 86400)

    return `${days} ${t('DynamicReports.report.permissions.cache.days')}`
  }
}

// Observar cambios en el modelo
watch(() => props.modelValue, validatePermissions, { deep: true })

// Validación inicial
onMounted(() => {
  validatePermissions()
})
</script>

<template>
  <div class="report-permissions">
    <!-- Header -->
    <div class="d-flex align-center mb-4">
      <VIcon
        icon="tabler-settings"
        color="primary"
        size="24"
        class="mr-3"
      />
      <div>
        <h5 class="text-h6 font-weight-medium">
          {{ t('DynamicReports.report.permissions.title') }}
        </h5>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('DynamicReports.report.permissions.description') }}
        </p>
      </div>
    </div>

    <!-- Permisos -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-shield-lock"
          color="warning"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.permissions.permissions_title') }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <VSelect
              v-model="modelValue.permissions"
              :label="t('DynamicReports.report.permissions.required_permissions')"
              variant="outlined"
              :items="availablePermissions"
              multiple
              chips
              closable-chips
              @update:model-value="validatePermissions"
            />
          </VCol>
        </VRow>

        <VRow class="mt-2">
          <VCol cols="12">
            <VAlert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <template #prepend>
                <VIcon icon="tabler-info-circle" />
              </template>
              <p class="text-caption mb-0">
                {{ t('DynamicReports.report.permissions.permissions_info') }}
              </p>
            </VAlert>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Metadatos -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-tags"
          color="info"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.permissions.metadata_title') }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="modelValue.department"
              :label="t('DynamicReports.report.permissions.department')"
              variant="outlined"
              :placeholder="t('DynamicReports.report.permissions.department_placeholder')"
              @update:model-value="validatePermissions"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="modelValue.category"
              :label="t('DynamicReports.report.permissions.category')"
              variant="outlined"
              :placeholder="t('DynamicReports.report.permissions.category_placeholder')"
              @update:model-value="validatePermissions"
            />
          </VCol>
        </VRow>

        <VRow>
          <VCol cols="12">
            <VSelect
              v-model="modelValue.tags"
              :label="t('DynamicReports.report.permissions.tags')"
              variant="outlined"
              :items="availableTags"
              multiple
              chips
              closable-chips
              :allow-input="true"
              @update:model-value="validatePermissions"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Configuración de Caché -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-clock"
          color="success"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.permissions.cache_title') }}
        <VSpacer />
        <VSwitch
          v-model="modelValue.cacheEnabled"
          color="success"
          hide-details
          @update:model-value="validatePermissions"
        />
      </VCardTitle>

      <VCardText v-if="modelValue.cacheEnabled">
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="cacheDuration"
              :label="t('DynamicReports.report.permissions.cache_duration')"
              variant="outlined"
              :items="cacheDurationOptions"
              @update:model-value="updateCacheDuration"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="modelValue.cacheDuration"
              :label="t('DynamicReports.report.permissions.cache_duration_custom')"
              variant="outlined"
              type="number"
              :min="60"
              :max="86400"
              suffix="seconds"
              @update:model-value="validatePermissions"
            />
          </VCol>
        </VRow>

        <VRow class="mt-2">
          <VCol cols="12">
            <VAlert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <template #prepend>
                <VIcon icon="tabler-info-circle" />
              </template>
              <p class="text-caption mb-0">
                {{ t('DynamicReports.report.permissions.cache_info') }}
              </p>
            </VAlert>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Preview de Configuración -->
    <VCard
      class="mt-4"
      variant="tonal"
    >
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-eye"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.permissions.preview') }}
      </VCardTitle>

      <VCardText>
        <div class="permissions-preview">
          <!-- Permisos -->
          <div
            v-if="modelValue.permissions.length > 0"
            class="preview-section"
          >
            <h6 class="text-subtitle-2 font-weight-medium mb-2">
              {{ t('DynamicReports.report.permissions.required_permissions') }}
            </h6>
            <div class="preview-chips">
              <VChip
                v-for="permission in modelValue.permissions"
                :key="permission"
                color="warning"
                variant="tonal"
                size="small"
                class="ma-1"
              >
                <VIcon
                  icon="tabler-shield-lock"
                  size="14"
                  class="mr-1"
                />
                {{ permission }}
              </VChip>
            </div>
          </div>

          <!-- Metadatos -->
          <div class="preview-section">
            <h6 class="text-subtitle-2 font-weight-medium mb-2">
              {{ t('DynamicReports.report.permissions.metadata') }}
            </h6>
            <div class="preview-metadata">
              <div
                v-if="modelValue.department"
                class="metadata-item"
              >
                <VIcon
                  icon="tabler-building"
                  size="16"
                  color="info"
                  class="mr-2"
                />
                <span class="metadata-label">{{ t('DynamicReports.report.permissions.department') }}:</span>
                <span class="metadata-value">{{ modelValue.department }}</span>
              </div>

              <div
                v-if="modelValue.category"
                class="metadata-item"
              >
                <VIcon
                  icon="tabler-category"
                  size="16"
                  color="info"
                  class="mr-2"
                />
                <span class="metadata-label">{{ t('DynamicReports.report.permissions.category') }}:</span>
                <span class="metadata-value">{{ modelValue.category }}</span>
              </div>

              <div
                v-if="modelValue.tags.length > 0"
                class="metadata-item"
              >
                <VIcon
                  icon="tabler-tags"
                  size="16"
                  color="info"
                  class="mr-2"
                />
                <span class="metadata-label">{{ t('DynamicReports.report.permissions.tags') }}:</span>
                <div class="metadata-tags">
                  <VChip
                    v-for="tag in modelValue.tags"
                    :key="tag"
                    size="x-small"
                    variant="tonal"
                    color="info"
                    class="ma-1"
                  >
                    {{ tag }}
                  </VChip>
                </div>
              </div>
            </div>
          </div>

          <!-- Caché -->
          <div
            v-if="modelValue.cacheEnabled"
            class="preview-section"
          >
            <h6 class="text-subtitle-2 font-weight-medium mb-2">
              {{ t('DynamicReports.report.permissions.cache_configuration') }}
            </h6>
            <div class="preview-cache">
              <VIcon
                icon="tabler-clock"
                size="16"
                color="success"
                class="mr-2"
              />
              <span class="metadata-label">{{ t('DynamicReports.report.permissions.cache_duration') }}:</span>
              <span class="metadata-value">{{ formatCacheDuration(modelValue.cacheDuration) }}</span>
            </div>
          </div>

          <div
            v-if="!hasAnyConfiguration"
            class="text-center py-4"
          >
            <VIcon
              icon="tabler-settings-off"
              size="32"
              color="grey"
              class="mb-2"
            />
            <p class="text-body-2 text-medium-emphasis">
              {{ t('DynamicReports.report.permissions.no_configuration') }}
            </p>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Validation Messages -->
    <VAlert
      v-if="validationErrors.length > 0"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <template #prepend>
        <VIcon icon="tabler-alert-triangle" />
      </template>
      <div>
        <p class="font-weight-medium mb-2">
          {{ t('validation.permissions_errors') }}
        </p>
        <ul class="mb-0">
          <li
            v-for="error in validationErrors"
            :key="error.field"
            class="text-caption"
          >
            {{ error.message }}
          </li>
        </ul>
      </div>
    </VAlert>
  </div>
</template>

<style scoped>
.report-permissions {
  inline-size: 100%;
}

.permissions-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-section {
  padding: 12px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
}

.preview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-metadata {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metadata-item {
  display: flex;
  align-items: center;
}

.metadata-label {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
  margin-inline-end: 8px;
}

.metadata-value {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.metadata-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-cache {
  display: flex;
  align-items: center;
}

:deep(.v-card) {
  transition: all 0.2s ease;
}

:deep(.v-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
}
</style>
