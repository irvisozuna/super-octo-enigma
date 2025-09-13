<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const saving = ref(false)

const vehicleData = ref({
  plate_number: '',
  vin: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  vehicle_type: null,
  capacity: null,
  color: '',
  status: 'ACTIVE',
})

const vehicleTypes = [
  { title: 'Microbus', value: 'MICROBUS' },
  { title: 'Taxi', value: 'TAXI' },
  { title: 'Bus', value: 'BUS' },
  { title: 'Truck', value: 'TRUCK' },
  { title: 'Motorcycle', value: 'MOTORCYCLE' },
]

const statusOptions = [
  { title: 'Active', value: 'ACTIVE' },
  { title: 'Inactive', value: 'INACTIVE' },
]

const saveVehicle = async () => {
  saving.value = true
  try {
    // Implement save logic here
    console.log('Saving vehicle:', vehicleData.value)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    router.push({ name: 'vehiclesList' })
  }
  catch (error) {
    console.error('Error saving vehicle:', error)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="vehicle-create">
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
              Add New Vehicle
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardTitle>Vehicle Information</VCardTitle>
            <VCardText>
              <VForm ref="form">
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="vehicleData.plate_number"
                      label="Plate Number *"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="vehicleData.vin"
                      label="VIN Number"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="vehicleData.brand"
                      label="Brand *"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="vehicleData.model"
                      label="Model *"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VTextField
                      v-model="vehicleData.year"
                      label="Year *"
                      type="number"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VSelect
                      v-model="vehicleData.vehicle_type"
                      label="Vehicle Type *"
                      :items="vehicleTypes"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VTextField
                      v-model="vehicleData.capacity"
                      label="Passenger Capacity *"
                      type="number"
                      required
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="vehicleData.color"
                      label="Color"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="vehicleData.status"
                      label="Status *"
                      :items="statusOptions"
                      required
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
                @click="saveVehicle"
              >
                Save Vehicle
              </VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
