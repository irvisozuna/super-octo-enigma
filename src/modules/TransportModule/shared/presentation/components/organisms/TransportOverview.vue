<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTransportStatisticsStore } from '../../stores/transportStatisticsStore'

const store = useTransportStatisticsStore()

const overviewCards = computed(() => {
  if (!store.overview)
    return []

  return [
    {
      title: 'Total Concesiones',
      value: store.overview.concessions.total,
      subtitle: `${store.overview.concessions.active} activas`,
      icon: 'tabler-certificate',
      color: 'primary',
      percentage: store.overview.concessions.active_percentage,
    },
    {
      title: 'Total Vehículos',
      value: store.overview.vehicles.total,
      subtitle: `${store.overview.vehicles.active} activos`,
      icon: 'tabler-car',
      color: 'success',
      percentage: store.overview.vehicles.active_percentage,
    },
    {
      title: 'Total Multas',
      value: store.overview.fines.total,
      subtitle: `${store.overview.fines.paid} pagadas`,
      icon: 'tabler-file-invoice',
      color: 'warning',
      percentage: store.overview.fines.paid_percentage,
    },
    {
      title: 'Ingresos Totales',
      value: store.overview.revenue.formatted_total,
      subtitle: `${store.overview.revenue.formatted_pending} pendiente`,
      icon: 'tabler-currency-dollar',
      color: 'info',
      percentage: null,
    },
  ]
})

onMounted(() => {
  store.fetchOverview()
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center">
      <VIcon class="me-2">
        tabler-dashboard
      </VIcon>
      Resumen General del Transporte
    </VCardTitle>

    <VCardText>
      <!-- Loading State -->
      <div
        v-if="store.loading.overview"
        class="text-center py-8"
      >
        <VProgressCircular
          indeterminate
          size="64"
          color="primary"
        />
        <p class="mt-4">
          Cargando estadísticas...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="store.errors.overview && !store.overview"
        class="text-center py-8"
      >
        <VIcon
          color="error"
          size="64"
        >
          tabler-alert-circle
        </VIcon>
        <h6 class="text-h6 mt-4">
          Error al cargar datos
        </h6>
        <p class="text-body-2 mt-2">
          {{ store.errors.overview }}
        </p>
        <VBtn
          color="primary"
          variant="outlined"
          class="mt-4"
          @click="store.fetchOverview()"
        >
          <VIcon start>
            tabler-refresh
          </VIcon>
          Reintentar
        </VBtn>
      </div>

      <!-- Content -->
      <VRow v-else>
        <VCol
          v-for="card in overviewCards"
          :key="card.title"
          cols="12"
          sm="6"
          md="3"
        >
          <VCard
            :color="card.color"
            variant="tonal"
            class="h-100"
          >
            <VCardText>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <VIcon
                    :color="card.color"
                    size="32"
                  >
                    {{ card.icon }}
                  </VIcon>
                </div>
                <div class="text-end">
                  <h4 class="text-h4 font-weight-bold">
                    {{ typeof card.value === 'number' ? card.value.toLocaleString() : card.value }}
                  </h4>
                  <p class="text-body-2 mb-0">
                    {{ card.title }}
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <p class="text-caption mb-1">
                  {{ card.subtitle }}
                </p>
                <VProgressLinear
                  v-if="card.percentage"
                  :model-value="card.percentage"
                  :color="card.color"
                  height="6"
                  rounded
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Warning if using mock data -->
        <VCol
          v-if="store.errors.overview"
          cols="12"
        >
          <VAlert
            color="warning"
            variant="tonal"
            border="start"
            icon="tabler-alert-triangle"
          >
            <VAlertTitle>Datos de demostración</VAlertTitle>
            <p class="mb-0">
              No se pudieron cargar los datos desde el servidor. Se están mostrando datos de ejemplo.
            </p>
          </VAlert>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>
