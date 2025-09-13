<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const saving = ref(false)

const driverData = ref({
  full_name: '',
  document_number: '',
  license_number: '',
  license_type: null,
  license_expiration_date: '',
  phone: '',
  email: '',
  address: '',
  status: 'ACTIVE',
})

const licenseTypes = [
  { title: 'Type A (Motorcycles)', value: 'A' },
  { title: 'Type B (Cars)', value: 'B' },
  { title: 'Type C (Trucks)', value: 'C' },
  { title: 'Type D (Public Transport)', value: 'D' },
  { title: 'Type E (Special)', value: 'E' },
]

const statusOptions = [
  { title: 'Active', value: 'ACTIVE' },
  { title: 'Inactive', value: 'INACTIVE' },
]

const saveDriver = async () => {
  saving.value = true
  try {
    console.log('Saving driver:', driverData.value)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push({ name: 'driversList' })
  }
  catch (error) {
    console.error('Error saving driver:', error)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="driver-create">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              icon
              variant="text"
              @click="$router.go(-1)"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              Add New Driver
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardTitle>Driver Information</VCardTitle>
            <VCardText>
              <VForm ref="form">
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="driverData.full_name"
                      label="Full Name *"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="driverData.document_number"
                      label="Document Number *"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="driverData.license_number"
                      label="License Number *"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="driverData.license_type"
                      label="License Type *"
                      :items="licenseTypes"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="driverData.license_expiration_date"
                      label="License Expiration *"
                      type="date"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="driverData.phone"
                      label="Phone"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="driverData.email"
                      label="Email"
                      type="email"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="driverData.status"
                      label="Status *"
                      :items="statusOptions"
                      required
                    />
                  </VCol>
                  <VCol cols="12">
                    <VTextarea
                      v-model="driverData.address"
                      label="Address"
                      rows="3"
                    />
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
            <VCardActions>
              <VSpacer />
              <VBtn
                variant="text"
                @click="$router.go(-1)"
              >
                Cancel
              </VBtn>
              <VBtn
                color="primary"
                :loading="saving"
                @click="saveDriver"
              >
                Save Driver
              </VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
