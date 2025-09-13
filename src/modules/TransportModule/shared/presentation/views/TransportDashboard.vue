<script setup lang="ts">
const quickStats = [
  {
    title: 'Total Vehicles',
    value: '0',
    icon: 'tabler-car',
    color: 'primary',
  },
  {
    title: 'Active Drivers',
    value: '0',
    icon: 'tabler-user-circle',
    color: 'success',
  },
  {
    title: 'Valid Concessions',
    value: '0',
    icon: 'tabler-certificate',
    color: 'info',
  },
  {
    title: 'Pending Fines',
    value: '0',
    icon: 'tabler-receipt',
    color: 'warning',
  },
]

const quickActions = [
  {
    title: 'Add Vehicle',
    description: 'Register a new vehicle in the system',
    icon: 'tabler-plus',
    color: 'primary',
    route: { name: 'vehiclesCreate' },
  },
  {
    title: 'Register Driver',
    description: 'Add a new driver to the database',
    icon: 'tabler-user-plus',
    color: 'success',
    route: { name: 'driversCreate' },
  },
  {
    title: 'Create Concession',
    description: 'Issue a new transport concession',
    icon: 'tabler-certificate',
    color: 'info',
    route: { name: 'concessionsCreate' },
  },
  {
    title: 'Issue Fine',
    description: 'Record a new traffic violation',
    icon: 'tabler-receipt',
    color: 'warning',
    route: { name: 'finesCreate' },
  },
  {
    title: 'Upload Document',
    description: 'Add supporting documentation',
    icon: 'tabler-upload',
    color: 'secondary',
    route: { name: 'documentsUpload' },
  },
  {
    title: 'View Reports',
    description: 'Access analytics and reports',
    icon: 'tabler-chart-bar',
    color: 'accent',
    route: { name: 'transportReports' },
  },
]
</script>

<template>
  <div class="transport-dashboard">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <h1 class="text-h3 mb-6">
            🚛 Transport Dashboard
          </h1>
        </VCol>
      </VRow>

      <!-- Quick Stats Cards -->
      <VRow>
        <VCol
          v-for="stat in quickStats"
          :key="stat.title"
          cols="12"
          sm="6"
          md="3"
        >
          <VCard
            :color="stat.color"
            dark
            class="text-center"
          >
            <VCardTitle>
              <VIcon
                :icon="stat.icon"
                size="48"
                class="mb-2"
              />
              <div class="text-h4">
                {{ stat.value }}
              </div>
              <div class="text-subtitle-1">
                {{ stat.title }}
              </div>
            </VCardTitle>
          </VCard>
        </VCol>
      </VRow>

      <!-- Quick Actions -->
      <VRow class="mt-6">
        <VCol cols="12">
          <h2 class="text-h5 mb-4">
            Quick Actions
          </h2>
        </VCol>
        <VCol
          v-for="action in quickActions"
          :key="action.title"
          cols="12"
          sm="6"
          md="4"
        >
          <VCard
            class="action-card"
            :to="action.route"
            hover
          >
            <VCardTitle class="text-center">
              <VIcon
                :icon="action.icon"
                size="32"
                :color="action.color"
                class="mb-2"
              />
              <div>{{ action.title }}</div>
            </VCardTitle>
            <VCardText class="text-center">
              {{ action.description }}
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Recent Activity -->
      <VRow class="mt-6">
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon
                icon="tabler-clock"
                class="mr-2"
              />
              Recent Activity
            </VCardTitle>
            <VCardText>
              <VAlert
                type="info"
                variant="tonal"
                class="mb-0"
              >
                Recent activity will be displayed here once the system is fully configured.
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<style scoped>
.transport-dashboard {
  padding: 20px;
}

.action-card {
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-4px);
}

.action-card .v-card-title {
  padding: 24px 16px 8px;
}

.action-card .v-card-text {
  padding: 8px 16px 24px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
