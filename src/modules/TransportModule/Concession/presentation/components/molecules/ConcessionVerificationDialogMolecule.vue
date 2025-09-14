<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  modelValue: boolean
  concession?: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  cancel: []
}>()

// Composables
const { t } = useI18n()

// State
const loading = ref(false)
const verificationForm = ref({
  status: 'VERIFIED',
  verified_by: '', // This would come from auth user
  verification_notes: '',
  verification_date: new Date().toISOString()
})

// Computed
const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isValid = computed(() => {
  return verificationForm.value.verification_notes.trim().length > 0
})

// Methods
const handleCancel = () => {
  verificationForm.value.verification_notes = ''
  emit('cancel')
}

const handleVerify = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    // TODO: Call API to verify concession
    // await concessionStore.verify(props.concession.id, verificationForm.value)

    console.log('Verifying concession:', props.concession?.id, verificationForm.value)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('success')
  } catch (error) {
    console.error('Error verifying concession:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    v-model="dialogValue"
    max-width="500"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-shield-check"
          size="20"
          class="me-2"
          color="success"
        />
        Verificar Concesión
      </VCardTitle>

      <VCardText>
        <VAlert
          type="info"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <VAlertTitle>Verificación de Concesión</VAlertTitle>
          Esta acción marcará la concesión como verificada por un supervisor autorizado.
        </VAlert>

        <!-- Concession Info -->
        <div class="mb-4">
          <div class="text-subtitle-2 text-medium-emphasis mb-2">
            Información de la Concesión
          </div>
          <VCard
            variant="outlined"
            class="pa-3"
          >
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ concession?.number || 'N/A' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ concession?.modality || 'N/A' }} - {{ concession?.municipality || 'N/A' }}
                </div>
              </div>
              <VChip
                :color="concession?.status === 'ACTIVE' ? 'success' : 'warning'"
                size="small"
              >
                {{ concession?.status || 'PENDING' }}
              </VChip>
            </div>
          </VCard>
        </div>

        <!-- Verification Form -->
        <!-- Verification Notes -->
        <VForm>
          <VTextarea
            v-model="verificationForm.verification_notes"
            :label="verificationForm.action === 'SUSPEND' ? 'Motivo de la Suspensión *' : 'Notas de Verificación *'"
            :placeholder="verificationForm.action === 'SUSPEND' ? 'Explique el motivo de la suspensión' : 'Describa las observaciones y confirmaciones realizadas'"
            variant="outlined"
            rows="4"
            :rules="[v => !!v?.trim() || 'Las notas son requeridas']"
            hint="Proporcione detalles sobre la acción realizada"
            persistent-hint
          />

          <!-- Next Review Date (for activations) -->
          <VTextField
            v-if="verificationForm.action === 'ACTIVATE'"
            v-model="verificationForm.next_review_date"
            label="Fecha de Próxima Revisión"
            type="date"
            variant="outlined"
            density="comfortable"
            class="mt-4"
            hint="Fecha recomendada para la próxima revisión de cumplimiento"
            persistent-hint
          />
        </VForm>
      </VCardText>

      <VCardActions class="px-6 pb-4">
        <VSpacer />
        <VBtn
          color="secondary"
          variant="text"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancelar
        </VBtn>
        <VBtn
          :color="actionColor"
          :disabled="!isValid"
          :loading="loading"
          @click="handleVerify"
        >
          <VIcon
            :icon="verificationForm.action === 'SUSPEND' ? 'tabler-pause' : 'tabler-shield-check'"
            size="16"
            start
          />
          {{ actionTitle }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>