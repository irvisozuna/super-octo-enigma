<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const deleteDialog = ref(false)

const vehicle = ref({
  id: '',
  plate_number: '',
  vin: '',
  brand: '',
  model: '',
  year: 0,
  vehicle_type: '',
  capacity: 0,
  color: '',
  status: '',
  registration_date: '',
  created_at: '',
  updated_at: '',
})

const loadVehicle = async () => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock data - replace with real API call
    vehicle.value = {
      id: route.params.id as string,
      plate_number: 'ABC-123',
      vin: 'VIN123456789',
      brand: 'Toyota',
      model: 'Hiace',
      year: 2020,
      vehicle_type: 'MICROBUS',
      capacity: 15,
      color: 'White',
      status: 'ACTIVE',
      registration_date: '2020-01-15',
      created_at: '2020-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    }
  }
  catch (error) {
    console.error('Error loading vehicle:', error)
  }
  finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    SUSPENDED: 'error',
  }

  return colors[status] || 'grey'
}

const getTypeColor = (type: string) => {
  const colors = {
    MICROBUS: 'primary',
    TAXI: 'secondary',
    BUS: 'info',
    TRUCK: 'warning',
    MOTORCYCLE: 'accent',
  }

  return colors[type] || 'grey'
}

const formatDate = (dateString: string) => {
  if (!dateString)
    return 'N/A'

  return new Date(dateString).toLocaleDateString()
}

const confirmDelete = () => {
  deleteDialog.value = true
}

const deleteVehicle = async () => {
  try {
    // Implement delete logic here
    console.log('Deleting vehicle:', vehicle.value.id)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    router.push({ name: 'vehiclesList' })
  }
  catch (error) {
    console.error('Error deleting vehicle:', error)
  }
  finally {
    deleteDialog.value = false
  }
}

onMounted(() => {
  loadVehicle()
})
</script>

<template>
  <div class="vehicle-view">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center justify-space-between mb-6">
            <div class="d-flex align-center">
              <VBtn
                icon
                variant="text"
                @click="$router.go(-1)"
              >
                <VIcon>tabler-arrow-left</VIcon>
              </VBtn>
              <h1 class="text-h4 ml-4">
                Vehicle Details
              </h1>
            </div>
            <div>
              <VBtn
                color="primary"
                :to="{ name: 'vehiclesEdit', params: { id: route.params.id } }"
                class="mr-2"
              >
                <VIcon start>
                  tabler-edit
                </VIcon>
                Edit
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                @click="confirmDelete"
              >
                <VIcon start>
                  tabler-trash
                </VIcon>
                Delete
              </VBtn>
            </div>
          </div>
        </VCol>
      </VRow>

      <VRow v-if="loading">
        <VCol
          cols="12"
          class="text-center"
        >
          <VProgressCircular indeterminate />
          <p class="mt-4">
            Loading vehicle data...
          </p>
        </VCol>
      </VRow>

      <VRow v-else>
        <!-- Basic Information -->
        <VCol
          cols="12"
          md="8"
        >
          <VCard class="mb-4">
            <VCardTitle>
              <VIcon start>
                tabler-car
              </VIcon>
              Basic Information
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      Plate Number
                    </div>
                    <div class="text-h6">
                      {{ vehicle.plate_number }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      VIN
                    </div>
                    <div class="text-body-1">
                      {{ vehicle.vin || 'N/A' }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      Brand
                    </div>
                    <div class="text-body-1">
                      {{ vehicle.brand }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      Model
                    </div>
                    <div class="text-body-1">
                      {{ vehicle.model }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      Year
                    </div>
                    <div class="text-body-1">
                      {{ vehicle.year }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      Color
                    </div>
                    <div class="text-body-1">
                      {{ vehicle.color || 'N/A' }}
                    </div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      Capacity
                    </div>
                    <div class="text-body-1">
                      {{ vehicle.capacity }} passengers
                    </div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">
                      Registration Date
                    </div>
                    <div class="text-body-1">
                      {{ formatDate(vehicle.registration_date) }}
                    </div>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Status Card -->
        <VCol
          cols="12"
          md="4"
        >
          <VCard class="mb-4">
            <VCardTitle>Status</VCardTitle>
            <VCardText>
              <VChip
                :color="getStatusColor(vehicle.status)"
                size="large"
                class="mb-4"
              >
                {{ vehicle.status }}
              </VChip>
              <div class="mb-2">
                <VChip
                  :color="getTypeColor(vehicle.vehicle_type)"
                  variant="outlined"
                >
                  {{ vehicle.vehicle_type }}
                </VChip>
              </div>
            </VCardText>
          </VCard>

          <!-- Quick Stats -->
          <VCard>
            <VCardTitle>Quick Stats</VCardTitle>
            <VCardText>
              <div class="mb-2">
                <div class="text-caption text-medium-emphasis">
                  Created
                </div>
                <div class="text-body-2">
                  {{ formatDate(vehicle.created_at) }}
                </div>
              </div>
              <div class="mb-2">
                <div class="text-caption text-medium-emphasis">
                  Last Updated
                </div>
                <div class="text-body-2">
                  {{ formatDate(vehicle.updated_at) }}
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="deleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle>Confirm Delete</VCardTitle>
        <VCardText>
          Are you sure you want to delete vehicle "{{ vehicle.plate_number }}"?
          This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            @click="deleteVehicle"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
