<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTransportStatisticsStore } from '../../stores/transportStatisticsStore'

const store = useTransportStatisticsStore()

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'fine': return 'tabler-file-invoice'
    case 'payment': return 'tabler-currency-dollar'
    case 'concession': return 'tabler-certificate'
    case 'vehicle': return 'tabler-car'
    default: return 'tabler-info-circle'
  }
}

const getActivityColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ISSUED': return 'warning'
    case 'PAID': return 'success'
    case 'CANCELLED': return 'error'
    case 'DISPUTED': return 'info'
    case 'ACTIVE': return 'success'
    case 'PENDING': return 'warning'
    default: return 'default'
  }
}

const activities = computed(() => store.recentActivity?.data || [])

onMounted(() => {
  store.fetchRecentActivity(10)
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <VIcon class="me-2">
          tabler-clock
        </VIcon>
        Actividad Reciente
      </div>
      <VBtn
        v-if="!store.loading.recentActivity"
        variant="text"
        size="small"
        @click="store.fetchRecentActivity(10)"
      >
        <VIcon>tabler-refresh</VIcon>
      </VBtn>
    </VCardTitle>

    <VCardText>
      <!-- Loading State -->
      <div
        v-if="store.loading.recentActivity"
        class="text-center py-8"
      >
        <VProgressCircular
          indeterminate
          size="48"
          color="primary"
        />
        <p class="mt-4 text-body-2">
          Cargando actividad reciente...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="store.errors.recentActivity && !store.hasData.recentActivity"
        class="text-center py-8"
      >
        <VIcon
          color="error"
          size="48"
        >
          tabler-alert-circle
        </VIcon>
        <h6 class="text-h6 mt-4">
          Error al cargar actividad
        </h6>
        <p class="text-body-2 mt-2">
          {{ store.errors.recentActivity }}
        </p>
        <VBtn
          color="primary"
          variant="outlined"
          size="small"
          class="mt-4"
          @click="store.fetchRecentActivity(10)"
        >
          <VIcon start>
            tabler-refresh
          </VIcon>
          Reintentar
        </VBtn>
      </div>

      <!-- No Data State -->
      <div
        v-else-if="!store.hasData.recentActivity"
        class="text-center py-8"
      >
        <VIcon
          color="info"
          size="48"
        >
          tabler-info-circle
        </VIcon>
        <h6 class="text-h6 mt-4">
          Sin actividad reciente
        </h6>
        <p class="text-body-2 mt-2">
          No hay actividad registrada en el sistema
        </p>
      </div>

      <!-- Content -->
      <div v-else>
        <VList class="py-0">
          <VListItem
            v-for="(activity, index) in activities"
            :key="activity.id"
            class="px-0"
          >
            <template #prepend>
              <VAvatar
                size="40"
                :color="getActivityColor(activity.status)"
                variant="tonal"
              >
                <VIcon :icon="getActivityIcon(activity.type)" />
              </VAvatar>
            </template>

            <VListItemTitle class="text-wrap">
              {{ activity.title }}
            </VListItemTitle>

            <VListItemSubtitle class="text-wrap">
              {{ activity.description }}
            </VListItemSubtitle>

            <template #append>
              <div class="text-end">
                <div class="text-body-2 font-weight-medium">
                  {{ activity.formatted_amount }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ activity.formatted_date }}
                </div>
              </div>
            </template>

            <VDivider
              v-if="index < activities.length - 1"
              class="mt-3"
            />
          </VListItem>
        </VList>

        <!-- Warning if using mock data -->
        <VAlert
          v-if="store.errors.recentActivity"
          color="warning"
          variant="tonal"
          border="start"
          icon="tabler-alert-triangle"
          class="mt-4"
        >
          <VAlertTitle>Datos de demostración</VAlertTitle>
          <p class="mb-0">
            No se pudieron cargar los datos desde el servidor.
          </p>
        </VAlert>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.v-list-item {
  min-height: 60px;
}

.text-wrap {
  white-space: normal;
  word-wrap: break-word;
}
</style>
