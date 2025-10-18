<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DOCUMENT_ACCESS_LEVELS, DOCUMENT_TYPES } from '../../shared/constants/DocumentConstants'
import { documentUploadSchema } from '../../shared/validations/DocumentValidations'

interface Props {
  modelValue: boolean
  entityType: string
  entityId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'uploaded', document: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const formRef = ref()
const valid = ref(false)
const uploading = ref(false)
const file = ref<File | null>(null)

const form = ref({
  name: '',
  description: '',
  document_type: '',
  access_level: 'internal',
})

const fileErrors = ref<string[]>([])
const nameErrors = ref<string[]>([])
const descriptionErrors = ref<string[]>([])
const typeErrors = ref<string[]>([])
const accessErrors = ref<string[]>([])

const documentTypes = computed(() =>
  DOCUMENT_TYPES.map(type => ({
    title: type.label,
    value: type.value,
  })),
)

const accessLevels = computed(() =>
  DOCUMENT_ACCESS_LEVELS.map(level => ({
    title: level.label,
    value: level.value,
  })),
)

const fileRules = computed(() => [
  (v: File) => !!v || t('DrillingReportsModule.validation.document.fileRequired'),
  (v: File) => !v || v.size <= 10 * 1024 * 1024 || t('DrillingReportsModule.validation.document.fileSizeMax'),
])

const nameRules = computed(() => [
  (v: string) => !!v || t('DrillingReportsModule.validation.document.nameRequired'),
  (v: string) => !v || v.length >= 3 || t('DrillingReportsModule.validation.document.nameMinLength'),
  (v: string) => !v || v.length <= 100 || t('DrillingReportsModule.validation.document.nameMaxLength'),
])

const descriptionRules = computed(() => [
  (v: string) => !v || v.length <= 500 || t('DrillingReportsModule.validation.document.descriptionMaxLength'),
])

const typeRules = computed(() => [
  (v: string) => !!v || t('DrillingReportsModule.validation.document.typeRequired'),
])

const accessRules = computed(() => [
  (v: string) => !!v || 'Debe seleccionar un nivel de acceso',
])

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0])
    file.value = target.files[0]
}

const handleSubmit = async () => {
  if (!valid.value || !file.value)
    return

  uploading.value = true

  try {
    const metadata = {
      name: form.value.name,
      description: form.value.description,
      document_type: form.value.document_type,
      related_entity_type: props.entityType,
      related_entity_id: props.entityId,
    }

    // Aquí se llamaría al servicio de upload
    // const document = await uploadDocument(file.value, metadata);

    emit('uploaded', { file: file.value, metadata })
    handleCancel()
  }
  catch (error) {
    console.error('Error uploading document:', error)
  }
  finally {
    uploading.value = false
  }
}

const handleCancel = () => {
  form.value = {
    name: '',
    description: '',
    document_type: '',
    access_level: 'internal',
  }
  file.value = null
  dialog.value = false
}

watch(dialog, newValue => {
  if (!newValue)
    handleCancel()
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="600px"
  >
    <VCard>
      <VCardTitle>
        {{ $t('DrillingReportsModule.documents.uploadDocument') }}
      </VCardTitle>

      <VCardText>
        <VForm
          ref="formRef"
          v-model="valid"
          @submit.prevent="handleSubmit"
        >
          <VFileInput
            v-model="file"
            :label="$t('DrillingReportsModule.documents.selectFile')"
            :rules="fileRules"
            :error-messages="fileErrors"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar"
            @change="handleFileChange"
          />

          <VTextField
            v-model="form.name"
            :label="$t('DrillingReportsModule.documents.name')"
            :rules="nameRules"
            :error-messages="nameErrors"
            required
          />

          <VTextarea
            v-model="form.description"
            :label="$t('DrillingReportsModule.documents.description')"
            :rules="descriptionRules"
            :error-messages="descriptionErrors"
            rows="3"
          />

          <VSelect
            v-model="form.document_type"
            :items="documentTypes"
            :label="$t('DrillingReportsModule.documents.type')"
            :rules="typeRules"
            :error-messages="typeErrors"
            required
          />

          <VSelect
            v-model="form.access_level"
            :items="accessLevels"
            :label="$t('DrillingReportsModule.documents.accessLevel')"
            :rules="accessRules"
            :error-messages="accessErrors"
            required
          />
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
          :loading="uploading"
          :disabled="!valid || !file"
          @click="handleSubmit"
        >
          {{ $t('DrillingReportsModule.common.upload') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.document-upload {
  inline-size: 100%;
}
</style>
