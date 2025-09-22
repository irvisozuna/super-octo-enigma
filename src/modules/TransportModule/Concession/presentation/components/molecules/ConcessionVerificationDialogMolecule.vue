<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConcessionStore } from '../../stores/concessionStore'
import { ConcessionApiService } from '../../../infrastructure/api/services/ConcessionApiService'

// Props
interface Props {
  modelValue: boolean
  concession?: any
  mode?: 'verify' | 'suspend'
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
const concessionStore = useConcessionStore()
const concessionApi = new ConcessionApiService()

// State
const loading = ref(false)

const verificationForm = ref({
  verification_notes: '',
})

const suspensionForm = ref({
  suspension_reason: '',
  suspension_notes: '',
  suspension_duration_days: undefined as number | undefined,
  indefinite: false,
})

// Computed
const dialogValue = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isValid = computed(() => {
  if (props.mode === 'suspend') {
    const hasReason = !!suspensionForm.value.suspension_reason?.trim()
    const days = suspensionForm.value.suspension_duration_days

    const durationValid = suspensionForm.value.indefinite
      || (typeof days === 'number'
        && Number.isInteger(days)
        && days >= 1
        && days <= 365)

    return hasReason && durationValid
  }

  // default verify
  return verificationForm.value.verification_notes.trim().length > 0
})

// Methods
const handleCancel = () => {
  verificationForm.value.verification_notes = ''
  emit('cancel')
}

const handleConfirm = async () => {
  if (!isValid.value)
    return

  loading.value = true
  try {
    if (props.mode === 'suspend') {
      const payload = {
        suspension_reason: suspensionForm.value.suspension_reason,
        suspension_notes: suspensionForm.value.suspension_notes || undefined,
        suspension_duration_days: suspensionForm.value.indefinite ? undefined : suspensionForm.value.suspension_duration_days,
      }

      if (typeof (concessionStore as any).suspend === 'function')
        await (concessionStore as any).suspend(props.concession.id, payload)
      else
        await concessionApi.suspendConcession(props.concession.id, payload)
    }
    else {
      await concessionStore.verify(props.concession.id, { verification_notes: verificationForm.value.verification_notes })
    }

    emit('success')
  }
  catch (error) {
    console.error('Error processing concession action:', error)
  }
  finally {
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
          v-if="props.mode === 'verify'"
          icon="tabler-shield-check"
          size="20"
          class="me-2"
          color="success"
        />
        <VIcon
          v-else
          icon="tabler-pause"
          size="20"
          class="me-2"
          color="warning"
        />
        {{ props.mode === 'suspend' ? 'Suspender Concesión' : 'Verificar Concesión' }}
      </VCardTitle>

      <VCardText>
        <VAlert
          type="info"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <VAlertTitle>{{ props.mode === 'suspend' ? 'Suspensión de Concesión' : 'Verificación de Concesión' }}</VAlertTitle>
          <template v-if="props.mode === 'suspend'">
            Esta acción suspenderá temporalmente la concesión. Puedes indicar la duración o dejarla indefinida.
          </template>
          <template v-else>
            Esta acción marcará la concesión como verificada por un supervisor autorizado.
          </template>
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
          <template v-if="props.mode === 'suspend'">
            <VTextField
              v-model="suspensionForm.suspension_reason"
              label="Razón de la Suspensión *"
              placeholder="Describe la razón de la suspensión"
              variant="outlined"
              :rules="[v => !!v?.trim() || 'La razón es requerida']"
            />

            <div class="d-flex gap-4 mt-2">
              <VCheckbox
                v-model="suspensionForm.indefinite"
                label="Indefinida"
                density="comfortable"
                hide-details
              />
              <VTextField
                v-model.number="suspensionForm.suspension_duration_days"
                label="Duración (días)"
                type="number"
                :disabled="suspensionForm.indefinite"
                :rules="[
                  v => suspensionForm.indefinite || (Number.isInteger(v) && v >= 1 && v <= 365) || 'Debe ser un entero entre 1 y 365',
                ]"
                min="1"
                max="365"
                step="1"
                variant="outlined"
                hint="Dejar en blanco si es indefinida"
                persistent-hint
              />
            </div>

            <VTextarea
              v-model="suspensionForm.suspension_notes"
              label="Notas adicionales"
              placeholder="Información adicional sobre la suspensión"
              variant="outlined"
              rows="3"
            />
          </template>
          <template v-else>
            <VTextarea
              v-model="verificationForm.verification_notes"
              label="Notas de Verificación *"
              placeholder="Describa las observaciones y confirmaciones realizadas"
              variant="outlined"
              rows="4"
              :rules="[v => !!v?.trim() || 'Las notas son requeridas']"
              hint="Proporcione detalles sobre la verificación realizada"
              persistent-hint
            />
          </template>
        </VForm>
      </VCardText>

      <VCardActions class="px-6 pb-4">
        <VSpacer />
        <VBtn
          color="secondary"
          variant="text"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancelar
        </VBtn>
        <VBtn
          :color="props.mode === 'suspend' ? 'warning' : 'success'"
          :disabled="!isValid"
          :loading="loading"
          @click="handleConfirm"
        >
          <VIcon
            :icon="props.mode === 'suspend' ? 'tabler-pause' : 'tabler-shield-check'"
            size="16"
            start
          />
          {{ props.mode === 'suspend' ? 'Suspender' : 'Verificar' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
