<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'imported', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const importType = ref('')
const file = ref<File | null>(null)
const updateExisting = ref(false)
const validateData = ref(true)
const skipErrors = ref(false)
const importing = ref(false)
const importProgress = ref(0)
const importResults = ref<any>(null)

const importTypeOptions = computed(() => [
  { title: t('DrillingReportsModule.projects.title'), value: 'project' },
  { title: t('DrillingReportsModule.wells.title'), value: 'well' },
  { title: t('DrillingReportsModule.tools.title'), value: 'tool' },
  { title: t('DrillingReportsModule.employees.title'), value: 'employee' },
  { title: t('DrillingReportsModule.equipment.title'), value: 'equipment' },
  { title: t('DrillingReportsModule.documents.title'), value: 'document' },
])

const acceptedFormats = computed(() => {
  const formats: Record<string, string> = {
    project: '.xlsx,.csv,.json',
    well: '.xlsx,.csv,.json',
    tool: '.xlsx,.csv,.json',
    employee: '.xlsx,.csv,.json',
    equipment: '.xlsx,.csv,.json',
    document: '.xlsx,.csv,.json',
  }

  return formats[importType.value] || '.xlsx,.csv,.json'
})

const handleImport = async () => {
  if (!importType.value || !file.value)
    return

  importing.value = true
  importProgress.value = 0
  importResults.value = null

  try {
    // Simulate import progress
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90)
        importProgress.value += 10
    }, 200)

    // Simulate file processing
    setTimeout(() => {
      clearInterval(progressInterval)
      importProgress.value = 100

      // Simulate import results
      importResults.value = {
        success: Math.floor(Math.random() * 50) + 20,
        errors: Math.floor(Math.random() * 5),
        warnings: Math.floor(Math.random() * 10),
        skipped: Math.floor(Math.random() * 3),
        errorDetails: [
          {
            row: 5,
            field: 'email',
            message: 'Invalid email format',
          },
          {
            row: 12,
            field: 'phone',
            message: 'Phone number is required',
          },
        ],
      }

      importing.value = false
    }, 2000)
  }
  catch (error) {
    console.error('Import error:', error)
    importing.value = false
  }
}

const handleClear = () => {
  importType.value = ''
  file.value = null
  updateExisting.value = false
  validateData.value = true
  skipErrors.value = false
  importResults.value = null
}
</script>

<template>
  <div class="related-entities-import">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-upload"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.importData') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleImport">
          <VRow>
            <!-- Entity Type -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="importType"
                :items="importTypeOptions"
                :label="$t('DrillingReportsModule.common.entityType')"
                :rules="[v => !!v || 'Debe seleccionar un tipo de entidad']"
                required
              />
            </VCol>

            <!-- File Upload -->
            <VCol
              cols="12"
              md="6"
            >
              <VFileInput
                v-model="file"
                :label="$t('DrillingReportsModule.common.selectFile')"
                :rules="[v => !!v || 'Debe seleccionar un archivo']"
                :accept="acceptedFormats"
                required
              />
            </VCol>

            <!-- Import Options -->
            <VCol cols="12">
              <VCheckbox
                v-model="updateExisting"
                :label="$t('DrillingReportsModule.common.updateExisting')"
              />
            </VCol>

            <VCol cols="12">
              <VCheckbox
                v-model="validateData"
                :label="$t('DrillingReportsModule.common.validateData')"
              />
            </VCol>

            <VCol cols="12">
              <VCheckbox
                v-model="skipErrors"
                :label="$t('DrillingReportsModule.common.skipErrors')"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol
              cols="12"
              class="d-flex justify-end"
            >
              <VBtn
                color="grey"
                variant="text"
                @click="handleClear"
              >
                {{ $t('DrillingReportsModule.common.clear') }}
              </VBtn>
              <VBtn
                color="primary"
                type="submit"
                :loading="importing"
                :disabled="!importType || !file"
              >
                <VIcon
                  icon="mdi-upload"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.import') }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>

    <!-- Import Progress -->
    <VCard
      v-if="importing"
      class="mt-4"
    >
      <VCardText>
        <div class="text-center">
          <VProgressCircular
            :model-value="importProgress"
            :size="60"
            :width="6"
            color="primary"
            class="mb-4"
          >
            {{ importProgress }}%
          </VProgressCircular>
          <div class="text-h6 mb-2">
            {{ $t('DrillingReportsModule.common.importing') }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ $t('DrillingReportsModule.common.importProgress') }}
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Import Results -->
    <VCard
      v-if="importResults"
      class="mt-4"
    >
      <VCardTitle>
        <VIcon
          icon="mdi-check-circle"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.importResults') }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <VCard
              color="success"
              variant="tonal"
            >
              <VCardText class="text-center">
                <div class="text-h4 font-weight-bold text-success">
                  {{ importResults.success }}
                </div>
                <div class="text-caption">
                  {{ $t('DrillingReportsModule.common.successful') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCard
              color="error"
              variant="tonal"
            >
              <VCardText class="text-center">
                <div class="text-h4 font-weight-bold text-error">
                  {{ importResults.errors }}
                </div>
                <div class="text-caption">
                  {{ $t('DrillingReportsModule.common.errors') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCard
              color="warning"
              variant="tonal"
            >
              <VCardText class="text-center">
                <div class="text-h4 font-weight-bold text-warning">
                  {{ importResults.warnings }}
                </div>
                <div class="text-caption">
                  {{ $t('DrillingReportsModule.common.warnings') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCard
              color="info"
              variant="tonal"
            >
              <VCardText class="text-center">
                <div class="text-h4 font-weight-bold text-info">
                  {{ importResults.skipped }}
                </div>
                <div class="text-caption">
                  {{ $t('DrillingReportsModule.common.skipped') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <!-- Error Details -->
        <VExpansionPanels
          v-if="importResults.errorDetails.length > 0"
          class="mt-4"
        >
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon
                icon="mdi-alert-circle"
                class="me-2"
              />
              {{ $t('DrillingReportsModule.common.errorDetails') }}
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <VList>
                <VListItem
                  v-for="(error, index) in importResults.errorDetails"
                  :key="index"
                >
                  <VListItemTitle>{{ error.message }}</VListItemTitle>
                  <VListItemSubtitle>{{ error.row }}: {{ error.field }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.related-entities-import {
  inline-size: 100%;
}
</style>
