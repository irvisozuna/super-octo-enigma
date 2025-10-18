<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '../stores/toolsStore'
import { useAppManager } from '@/composables/useAppManager'

// Props
interface Props {
  tool?: any
  isEditing?: boolean
  showCloseButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tool: null,
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
const toolsStore = useToolsStore()

// Form ref
const formRef = ref()

// Loading state
const loading = ref(false)

// Form data
const formData = reactive({
  name: '',
  code: '',
  category: '',
  status: 'active',
  serial_number: '',
  model: '',
  manufacturer: '',
  capacity: null,
  purchase_date: '',
  last_maintenance: '',
  description: '',
})

// Category options
const categoryOptions = computed(() => [
  { title: t('DrillingReportsModule.tools.categories.drilling'), value: 'drilling' },
  { title: t('DrillingReportsModule.tools.categories.measurement'), value: 'measurement' },
  { title: t('DrillingReportsModule.tools.categories.safety'), value: 'safety' },
  { title: t('DrillingReportsModule.tools.categories.maintenance'), value: 'maintenance' },
])

// Status options
const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.common.active'), value: 'active' },
  { title: t('DrillingReportsModule.common.inactive'), value: 'inactive' },
  { title: t('DrillingReportsModule.common.maintenance'), value: 'maintenance' },
  { title: t('DrillingReportsModule.common.retired'), value: 'retired' },
])

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Campo requerido',
}

// Watch for tool changes
watch(() => props.tool, newTool => {
  if (newTool)
    Object.assign(formData, newTool)
}, { immediate: true })

// Methods
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  loading.value = true
  try {
    if (props.isEditing)
      await toolsStore.updateTool(props.tool.id, formData)
    else
      await toolsStore.createTool(formData)

    emit('submit', formData)
    if (props.showCloseButton)
      closeDialog('submit')
  }
  catch (error) {
    console.error('Error saving tool:', error)
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
      <span>{{ isEditing ? $t('DrillingReportsModule.tools.editTool') : $t('DrillingReportsModule.tools.newTool') }}</span>
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
              :label="$t('DrillingReportsModule.tools.name')"
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
              :label="$t('DrillingReportsModule.tools.code')"
              :rules="[rules.required]"
              required
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.category"
              :items="categoryOptions"
              :label="$t('DrillingReportsModule.tools.category')"
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
              v-model="formData.serial_number"
              :label="$t('DrillingReportsModule.tools.serialNumber')"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.model"
              :label="$t('DrillingReportsModule.tools.model')"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.manufacturer"
              :label="$t('DrillingReportsModule.tools.manufacturer')"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.capacity"
              :label="$t('DrillingReportsModule.tools.capacity')"
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
              v-model="formData.purchase_date"
              :label="$t('DrillingReportsModule.tools.purchaseDate')"
              type="date"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.last_maintenance"
              :label="$t('DrillingReportsModule.tools.lastMaintenance')"
              type="date"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="formData.description"
              :label="$t('DrillingReportsModule.tools.description')"
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
