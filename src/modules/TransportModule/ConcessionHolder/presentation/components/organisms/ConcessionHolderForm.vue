<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConcessionHolderCreateDto } from '../../../application/dtos/ConcessionHolderDtos'

interface Props {
  loading?: boolean
  initialData?: Partial<ConcessionHolderCreateDto>
  submitButtonText?: string
  showCancelButton?: boolean
}

interface Emits {
  (e: 'submit', data: ConcessionHolderCreateDto): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  submitButtonText: '',
  showCancelButton: true,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Form data
const formRef = ref()
const formValid = ref(false)

const form = ref<ConcessionHolderCreateDto>({
  full_name: '',
  holder_type: 'NATURAL',
  curp: '',
  rfc: '',
  phone: '',
  email: '',
  legal_representative: '',
  metadata: {},
})

// Initialize form with props data
watch(() => props.initialData, newData => {
  if (newData)
    Object.assign(form.value, newData)
}, { immediate: true })

// Options
const holderTypes = [
  { title: 'Persona Física', value: 'NATURAL' },
  { title: 'Persona Moral', value: 'LEGAL' },
]

// Computed for conditional field visibility
const showCurpField = computed(() => {
  return form.value.holder_type === 'NATURAL'
})

const showLegalRepresentativeField = computed(() => {
  return form.value.holder_type === 'LEGAL'
})

// Computed submit button text
const computedSubmitButtonText = computed(() => {
  return props.submitButtonText || t('TransportModule.concession_holder.actions.create_holder')
})

// CURP validation rules
const curpRules = computed(() => {
  const rules = []
  if (showCurpField.value) {
    rules.push(v => !!v || t('TransportModule.validation.required'))
    rules.push(v => !v || /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/.test(v) || 'CURP format invalid')
  }

  return rules
})

// RFC validation rules
const rfcRules = [
  v => !v || /^[A-Z\u00D1&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/.test(v) || 'RFC format invalid',
]

// Methods
const onHolderTypeChange = () => {
  // Reset conditional fields when holder type changes
  if (form.value.holder_type !== 'LEGAL')
    form.value.legal_representative = ''

  if (form.value.holder_type !== 'NATURAL')
    form.value.curp = ''
}

const submitForm = async () => {
  if (!formRef.value?.validate())
    return
  emit('submit', form.value)
}

const cancelForm = () => {
  emit('cancel')
}

// Public methods for parent components
const validate = () => {
  return formRef.value?.validate()
}

const resetForm = () => {
  form.value = {
    full_name: '',
    holder_type: 'NATURAL',
    curp: '',
    rfc: '',
    phone: '',
    email: '',
    legal_representative: '',
    metadata: {},
  }
  formRef.value?.resetValidation()
}

const resetValidation = () => {
  formRef.value?.resetValidation()
}

// Expose methods to parent
defineExpose({
  validate,
  resetForm,
  resetValidation,
  form: readonly(form),
})
</script>

<template>
  <VForm
    ref="formRef"
    v-model="formValid"
    @submit.prevent="submitForm"
  >
    <VRow>
      <!-- Holder Type -->
      <VCol cols="12">
        <VSelect
          v-model="form.holder_type"
          :label="`${t('TransportModule.concession_holder.fields.holder_type')} *`"
          :items="holderTypes"
          :rules="[v => !!v || t('TransportModule.validation.required')]"
          required
          :disabled="loading"
          @update:model-value="onHolderTypeChange"
        />
      </VCol>

      <!-- Full Name -->
      <VCol cols="12">
        <VTextField
          v-model="form.full_name"
          :label="`${t('TransportModule.concession_holder.fields.full_name')} *`"
          :rules="[v => !!v || t('TransportModule.validation.required')]"
          required
          :disabled="loading"
        />
      </VCol>

      <!-- CURP (conditional) -->
      <VCol
        v-if="showCurpField"
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.curp"
          :label="`${t('TransportModule.concession_holder.fields.curp')} *`"
          :rules="curpRules"
          :required="showCurpField"
          :disabled="loading"
          placeholder="AAAA000000HAAAAA00"
          maxlength="18"
          @input="form.curp = form.curp.toUpperCase()"
        />
      </VCol>

      <!-- RFC -->
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.rfc"
          :label="t('TransportModule.concession_holder.fields.rfc')"
          :rules="rfcRules"
          :disabled="loading"
          placeholder="AAAA000000AAA"
          maxlength="13"
          @input="form.rfc = form.rfc.toUpperCase()"
        />
      </VCol>

      <!-- Legal Representative (for LEGAL type) -->
      <VCol
        v-if="showLegalRepresentativeField"
        cols="12"
      >
        <VTextField
          v-model="form.legal_representative"
          :label="t('TransportModule.concession_holder.fields.legal_representative')"
          :disabled="loading"
          placeholder="Full name of legal representative"
        />
      </VCol>

      <!-- Phone -->
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.phone"
          :label="t('TransportModule.concession_holder.fields.phone')"
          type="tel"
          :disabled="loading"
          :rules="[
            v => !v || /^[+]?[0-9\s\-()]+$/.test(v) || 'Please enter a valid phone number',
          ]"
          placeholder="e.g. +1 234 567 8900"
        />
      </VCol>

      <!-- Email -->
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.email"
          :label="t('TransportModule.concession_holder.fields.email')"
          type="email"
          :rules="[
            v => !v || /.+@.+\..+/.test(v) || 'Email must be valid',
          ]"
          :disabled="loading"
          placeholder="email@example.com"
        />
      </VCol>
    </VRow>

    <!-- Action Buttons -->
    <div class="d-flex flex-wrap gap-4 justify-end mt-6">
      <VBtn
        v-if="showCancelButton"
        variant="outlined"
        :disabled="loading"
        @click="cancelForm"
      >
        {{ t('TransportModule.common.cancel') }}
      </VBtn>

      <VBtn
        type="submit"
        color="primary"
        :loading="loading"
        :disabled="!formValid"
      >
        <VIcon start>
          tabler-check
        </VIcon>
        {{ computedSubmitButtonText }}
      </VBtn>
    </div>
  </VForm>
</template>

<style scoped>
/* Add any specific styles if needed */
</style>
