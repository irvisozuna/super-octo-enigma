<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWellsStore } from '../stores/wellsStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useAppManager } from '@/composables/useAppManager'

// Props
interface Props {
  well?: any
  isEditing?: boolean
  showCloseButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  well: null,
  isEditing: false,
  showCloseButton: true,
})

// Emits
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

// Composables
const { t } = useI18n()
const { closeDialog } = useAppManager()
const wellsStore = useWellsStore()
const projectsStore = useProjectsStore()

// Form ref
const formRef = ref()

// Loading states
const loading = ref(false)
const loadingProjects = ref(false)

// Form data
const formData = reactive({
  name: '',
  code: '',
  project_id: '',
  status: 'active',
  depth: null,
  diameter: null,
  latitude: null,
  longitude: null,
  description: '',
})

// Project options
const projectOptions = ref([])

// Status options
const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.common.active'), value: 'active' },
  { title: t('DrillingReportsModule.common.completed'), value: 'completed' },
  { title: t('DrillingReportsModule.common.suspended'), value: 'suspended' },
  { title: t('DrillingReportsModule.common.cancelled'), value: 'cancelled' },
])

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Campo requerido',
}

// Watch for well changes
watch(() => props.well, newWell => {
  if (newWell)
    Object.assign(formData, newWell)
}, { immediate: true })

// Load projects
const loadProjects = async () => {
  loadingProjects.value = true
  try {
    await projectsStore.fetchProjects()
    projectOptions.value = projectsStore.projects.map(project => ({
      title: project.name,
      value: project.id,
    }))
  }
  catch (error) {
    console.error('Error loading projects:', error)
  }
  finally {
    loadingProjects.value = false
  }
}

// Methods
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  loading.value = true
  try {
    if (props.isEditing)
      await wellsStore.updateWell(props.well.id, formData)
    else
      await wellsStore.createWell(formData)

    emit('submit', formData)
    if (props.showCloseButton)
      closeDialog('submit')
  }
  catch (error) {
    console.error('Error saving well:', error)
  }
  finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  if (props.showCloseButton)
    closeDialog()
}

// Lifecycle
onMounted(() => {
  loadProjects()
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <span>{{ isEditing ? $t('DrillingReportsModule.wells.editWell') : $t('DrillingReportsModule.wells.newWell') }}</span>
      <DialogCloseBtn
        v-if="showCloseButton"
        @click="closeDialog"
      />
    </VCardTitle>

    <VCardText>
      <VForm
        ref="formRef"
        @submit.prevent="handleSubmit"
      >
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.name"
              :label="$t('DrillingReportsModule.wells.name')"
              :rules="[rules.required]"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.code"
              :label="$t('DrillingReportsModule.wells.code')"
              :rules="[rules.required]"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.project_id"
              :items="projectOptions"
              :label="$t('DrillingReportsModule.wells.project')"
              :rules="[rules.required]"
              :loading="loadingProjects"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.status"
              :items="statusOptions"
              :label="$t('DrillingReportsModule.common.status')"
              :rules="[rules.required]"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.depth"
              :label="$t('DrillingReportsModule.wells.depth')"
              type="number"
              step="0.1"
              min="0"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.diameter"
              :label="$t('DrillingReportsModule.wells.diameter')"
              type="number"
              step="0.1"
              min="0"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.latitude"
              :label="$t('DrillingReportsModule.wells.latitude')"
              type="number"
              step="0.000001"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.longitude"
              :label="$t('DrillingReportsModule.wells.longitude')"
              type="number"
              step="0.000001"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="formData.description"
              :label="$t('DrillingReportsModule.wells.description')"
              rows="3"
            />
          </VCol>
        </VRow>
      </VForm>
    </VCardText>

    <VCardActions>
      <VSpacer />
      <VBtn
        color="grey"
        variant="text"
        @click="handleCancel"
      >
        {{ $t('DrillingReportsModule.common.cancel') }}
      </VBtn>
      <VBtn
        color="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ $t('DrillingReportsModule.common.save') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
