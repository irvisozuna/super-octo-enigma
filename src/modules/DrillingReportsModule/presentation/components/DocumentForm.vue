<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentsStore } from '../stores/documentsStore'
import { useAppManager } from '@/composables/useAppManager'

// Props
interface Props {
  document?: any
  isEditing?: boolean
  showCloseButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  document: null,
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
const documentsStore = useDocumentsStore()

// Form ref
const formRef = ref()

// Loading state
const loading = ref(false)

// Form data
const formData = reactive({
  name: '',
  code: '',
  type: '',
  status: 'active',
  version: '',
  author: '',
  creation_date: '',
  expiry_date: '',
  description: '',
})

// Type options
const typeOptions = computed(() => [
  { title: t('DrillingReportsModule.documents.types.manual'), value: 'manual' },
  { title: t('DrillingReportsModule.documents.types.procedure'), value: 'procedure' },
  { title: t('DrillingReportsModule.documents.types.certificate'), value: 'certificate' },
  { title: t('DrillingReportsModule.documents.types.report'), value: 'report' },
])

// Status options
const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.common.active'), value: 'active' },
  { title: t('DrillingReportsModule.common.draft'), value: 'draft' },
  { title: t('DrillingReportsModule.common.archived'), value: 'archived' },
  { title: t('DrillingReportsModule.common.expired'), value: 'expired' },
])

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Campo requerido',
}

// Watch for document changes
watch(() => props.document, newDocument => {
  if (newDocument)
    Object.assign(formData, newDocument)
}, { immediate: true })

// Methods
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  loading.value = true
  try {
    if (props.isEditing)
      await documentsStore.updateDocument(props.document.id, formData)
    else
      await documentsStore.createDocument(formData)

    emit('submit', formData)
    if (props.showCloseButton)
      closeDialog('submit')
  }
  catch (error) {
    console.error('Error saving document:', error)
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
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <span>{{ isEditing ? $t('DrillingReportsModule.documents.editDocument') : $t('DrillingReportsModule.documents.newDocument') }}</span>
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
              :label="$t('DrillingReportsModule.documents.name')"
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
              :label="$t('DrillingReportsModule.documents.code')"
              :rules="[rules.required]"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.type"
              :items="typeOptions"
              :label="$t('DrillingReportsModule.documents.type')"
              :rules="[rules.required]"
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
              v-model="formData.version"
              :label="$t('DrillingReportsModule.documents.version')"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.author"
              :label="$t('DrillingReportsModule.documents.author')"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.creation_date"
              :label="$t('DrillingReportsModule.documents.creationDate')"
              type="date"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.expiry_date"
              :label="$t('DrillingReportsModule.documents.expiryDate')"
              type="date"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="formData.description"
              :label="$t('DrillingReportsModule.documents.description')"
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
