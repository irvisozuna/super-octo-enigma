<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EquipmentApiService } from '../../../infrastructure/api/services/EquipmentApiService'

interface Props {
  visible: boolean
  equipment: any
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

// Form data
const formData = ref({
  notes: '',
})

// Form ref
const formRef = ref()

// Validation rules
const rules = {
  maxLength: (value: string) => !value || value.length <= 500 || 'Máximo 500 caracteres',
}

// Local loading state
const localLoading = ref(false)

// Handle form submission
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  localLoading.value = true
  
  try {
    await EquipmentApiService.unassignFromProject(props.equipment.id, formData.value.notes)
    emit('success')
    handleClose()
  }
  catch (error: any) {
    console.error('❌ Error unassigning equipment:', error)
    // Handle error - you can add error state here if needed
  }
  finally {
    localLoading.value = false
  }
}

// Handle dialog close
const handleClose = () => {
  formData.value.notes = ''
  emit('update:visible', false)
}

// Reset form when dialog opens
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    formData.value.notes = ''
  }
})
</script>

<template>
  <VDialog
    :model-value="visible"
    max-width="500"
    @update:model-value="handleClose"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-tool-off"
          color="warning"
        />
        {{ $t('DrillingReportsModule.equipment.unassignEquipment') }}
      </VCardTitle>

      <VCardText>
        <VAlert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <template #prepend>
            <VIcon
              icon="tabler-alert-triangle"
              size="24"
            />
          </template>
          <VAlertTitle class="text-h6 mb-2">
            {{ $t('DrillingReportsModule.equipment.unassignConfirm') }}
          </VAlertTitle>
          <p class="mb-0">
            ¿Está seguro de desasignar el equipo <strong>{{ equipment?.equipment_name }}</strong> 
            ({{ equipment?.equipment_code }}) del proyecto?
          </p>
        </VAlert>

        <VForm
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                :label="$t('DrillingReportsModule.equipment.unassignNotes')"
                :placeholder="$t('DrillingReportsModule.equipment.unassignNotesPlaceholder')"
                :rules="[rules.maxLength]"
                rows="3"
                counter="500"
                clearable
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          @click="handleClose"
        >
          {{ $t('DrillingReportsModule.common.cancel') }}
        </VBtn>
        <VBtn
          color="warning"
          :loading="localLoading"
          @click="handleSubmit"
        >
          {{ $t('DrillingReportsModule.equipment.unassignEquipment') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
