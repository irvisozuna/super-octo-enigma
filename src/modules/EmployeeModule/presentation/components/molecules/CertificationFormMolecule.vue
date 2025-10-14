<script setup lang="ts">
import { ref, watch } from 'vue'
import type { EmployeeCertificationEntity } from '../../../domain/entities/EmployeeEntity'

interface Props {
  certification?: EmployeeCertificationEntity | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  certification: null,
  loading: false,
})

const emit = defineEmits<{
  submit: [data: Partial<EmployeeCertificationEntity>]
  cancel: []
}>()

const form = ref({
  certification_name: '',
  issuing_organization: '',
  issue_date: '',
  expiry_date: '',
  credential_id: '',
  credential_url: '',
})

watch(() => props.certification, newCert => {
  if (newCert) {
    form.value = {
      certification_name: newCert.certification_name || '',
      issuing_organization: newCert.issuing_organization || '',
      issue_date: newCert.issue_date || '',
      expiry_date: newCert.expiry_date || '',
      credential_id: newCert.credential_id || '',
      credential_url: newCert.credential_url || '',
    }
  }
  else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    certification_name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: '',
  }
}

function handleSubmit() {
  emit('submit', form.value)
}
</script>

<template>
  <VForm @submit.prevent="handleSubmit">
    <VRow>
      <VCol cols="12">
        <VTextField
          v-model="form.certification_name"
          label="Nombre de la certificación *"
          placeholder="Ej: Licencia de conducir tipo C"
          variant="outlined"
          required
        />
      </VCol>

      <VCol cols="12">
        <VTextField
          v-model="form.issuing_organization"
          label="Organización emisora *"
          placeholder="Ej: Secretaría de Transporte"
          variant="outlined"
          required
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.issue_date"
          label="Fecha de emisión *"
          type="date"
          variant="outlined"
          required
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.expiry_date"
          label="Fecha de vencimiento"
          type="date"
          variant="outlined"
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.credential_id"
          label="ID de credencial"
          placeholder="Número de certificado"
          variant="outlined"
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.credential_url"
          label="URL de verificación"
          placeholder="https://..."
          type="url"
          variant="outlined"
        />
      </VCol>

      <VCol
        cols="12"
        class="d-flex gap-2 justify-end"
      >
        <VBtn
          variant="outlined"
          @click="emit('cancel')"
        >
          Cancelar
        </VBtn>
        <VBtn
          type="submit"
          color="primary"
          :loading="loading"
        >
          {{ certification ? 'Actualizar' : 'Agregar' }}
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
