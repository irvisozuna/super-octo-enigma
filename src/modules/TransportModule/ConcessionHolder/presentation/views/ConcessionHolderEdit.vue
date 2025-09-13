<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConcessionHolderEdit } from '../composables/useConcessionHolderEdit'
import type { ConcessionHolderUpdateDto } from '../../application/dtos/ConcessionHolderDtos'

const router = useRouter()
const route = useRoute()
const holderId = route.params.id as string

// Usar el composable que maneja la lógica de negocio
const { holder, loading, error, loadHolder, updateHolder } = useConcessionHolderEdit()

const formRef = ref()
const formValid = ref(false)
const initialLoading = ref(true)
const successDialog = ref(false)

const form = ref<ConcessionHolderUpdateDto>({
  holder_type: 'NATURAL',
  full_name: '',
  curp: '',
  rfc: '',
  phone: '',
  email: '',
  legal_representative: '',
  verification_status: 'PENDING',
})

// Campos adicionales para el formulario (no en el DTO)
const formData = ref({
  first_name: '',
  last_name: '',
  company_name: '',
  identification_number: '',
  address: '',
  city: '',
  notes: '',
})

const holderTypes = [
  { title: 'Persona Natural', value: 'NATURAL' },
  { title: 'Persona Individual', value: 'INDIVIDUAL' },
  { title: 'Empresa', value: 'COMPANY' },
  { title: 'Cooperativa', value: 'COOPERATIVE' },
]

const statusOptions = [
  { title: 'Verificado', value: 'VERIFIED' },
  { title: 'Pendiente', value: 'PENDING' },
  { title: 'Rechazado', value: 'REJECTED' },
]

const loadHolderData = async () => {
  try {
    initialLoading.value = true
    await loadHolder(holderId)

    if (holder.value) {
      // Mapear datos del API al formulario
      form.value = {
        holder_type: holder.value.holder_type,
        full_name: holder.value.full_name,
        curp: holder.value.curp || '',
        rfc: holder.value.rfc || '',
        phone: holder.value.phone || '',
        email: holder.value.email || '',
        legal_representative: holder.value.legal_representative || '',
        verification_status: holder.value.verification_status,
      }

      // Campos adicionales para el formulario
      formData.value = {
        first_name: holder.value.full_name?.split(' ')[0] || '',
        last_name: holder.value.full_name?.split(' ').slice(1).join(' ') || '',
        company_name: holder.value.company_name || '',
        identification_number: holder.value.curp || holder.value.rfc || '',
        address: holder.value.address || '',
        city: holder.value.city || '',
        notes: holder.value.notes || '',
      }
    }
  }
  catch (err) {
    console.error('Error loading holder:', err)
  }
  finally {
    initialLoading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value?.validate())
    return

  try {
    // Preparar los datos para el update
    const updateData: ConcessionHolderUpdateDto = {
      ...form.value,
      full_name: `${formData.value.first_name} ${formData.value.last_name}`.trim(),
      curp: formData.value.identification_number,
      rfc: formData.value.identification_number,
    }

    await updateHolder(holderId, updateData)
    successDialog.value = true
  }
  catch (err) {
    console.error('Error updating holder:', err)

    // El error se maneja en el composable
  }
}

const goToList = () => router.push({ name: 'concessionHoldersList' })
const goToView = () => router.push({ name: 'concessionHoldersView', params: { id: holderId } })

onMounted(() => loadHolderData())
</script>

<template>
  <div class="concession-holder-edit">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              :to="{ name: 'concessionHoldersList' }"
              icon
              variant="text"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              Edit Concession Holder
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow v-if="initialLoading">
        <VCol
          cols="12"
          class="text-center py-8"
        >
          <VProgressCircular
            size="64"
            indeterminate
          />
          <p class="mt-4">
            Loading holder details...
          </p>
        </VCol>
      </VRow>

      <VRow v-else-if="holder">
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon class="mr-2">
                tabler-edit
              </VIcon>
              Edit - {{ holder.full_name }}
            </VCardTitle>
            <VCardText>
              <VForm
                ref="formRef"
                v-model="formValid"
                @submit.prevent="submitForm"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.holder_type"
                      label="Holder Type *"
                      :items="holderTypes"
                      :rules="[v => !!v || 'Required']"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.verification_status"
                      label="Estado de Verificación *"
                      :items="statusOptions"
                      :rules="[v => !!v || 'Required']"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="formData.first_name"
                      label="Nombre *"
                      :rules="[v => !!v || 'Required']"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="formData.last_name"
                      label="Apellidos *"
                      :rules="[v => !!v || 'Required']"
                      required
                    />
                  </VCol>
                  <VCol
                    v-if="form.holder_type !== 'INDIVIDUAL'"
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="formData.company_name"
                      :label="`${form.holder_type === 'COOPERATIVE' ? 'Nombre de Cooperativa' : 'Nombre de Empresa'}`"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="formData.identification_number"
                      label="CURP/RFC *"
                      :rules="[v => !!v || 'Required']"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.phone"
                      label="Teléfono *"
                      :rules="[v => !!v || 'Required']"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.email"
                      label="Email"
                    />
                  </VCol>
                  <VCol cols="12">
                    <VTextField
                      v-model="form.legal_representative"
                      label="Representante Legal"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="formData.address"
                      label="Dirección"
                    />
                  </VCol>
                  <VCol cols="12">
                    <VTextarea
                      v-model="formData.notes"
                      label="Notas"
                      rows="3"
                    />
                  </VCol>
                </VRow>
                <VRow class="mt-4">
                  <VCol
                    cols="12"
                    class="d-flex gap-3"
                  >
                    <VBtn
                      type="submit"
                      color="primary"
                      :loading="loading"
                      :disabled="!formValid"
                      size="large"
                    >
                      <VIcon start>
                        tabler-check
                      </VIcon> Update Holder
                    </VBtn>
                    <VBtn
                      variant="outlined"
                      :to="{ name: 'concessionHoldersList' }"
                      size="large"
                    >
                      <VIcon start>
                        tabler-x
                      </VIcon> Cancel
                    </VBtn>
                    <VBtn
                      variant="outlined"
                      color="info"
                      :to="{ name: 'concessionHoldersView', params: { id: holderId } }"
                      size="large"
                    >
                      <VIcon start>
                        tabler-eye
                      </VIcon> View Details
                    </VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VDialog
        v-model="successDialog"
        max-width="400"
      >
        <VCard>
          <VCardTitle class="text-center">
            <VIcon
              color="success"
              size="48"
            >
              tabler-check-circle
            </VIcon>
          </VCardTitle>
          <VCardText class="text-center">
            <h3 class="text-h6 mb-2">
              Holder Updated Successfully!
            </h3>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              color="primary"
              @click="goToList"
            >
              View Holders
            </VBtn>
            <VBtn
              variant="outlined"
              @click="goToView"
            >
              View Details
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </VContainer>
  </div>
</template>

<style scoped>
.concession-holder-edit { padding: 20px; }
</style>
