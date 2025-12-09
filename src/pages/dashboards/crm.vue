<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTransportStatisticsStore } from '@/modules/TransportModule/shared/presentation/stores/transportStatisticsStore'

// Transport Module Components
import TransportOverview from '@/modules/TransportModule/shared/presentation/components/organisms/TransportOverview.vue'
import RecentActivityCard from '@/modules/TransportModule/shared/presentation/components/organisms/RecentActivityCard.vue'
import StatisticsCard from '@/modules/TransportModule/shared/presentation/components/molecules/StatisticsCard.vue'

// Original CRM Components (keeping some for layout)

const transportStore = useTransportStatisticsStore()

// Transform transport summary cards for display
const transportStatisticsCards = computed(() => {
  if (!transportStore.summaryCards)
    return []

  return [
    {
      icon: 'tabler-file-invoice',
      color: 'warning',
      title: transportStore.summaryCards.fines.title,
      subtitle: transportStore.summaryCards.fines.subtitle,
      value: transportStore.summaryCards.fines.value,
      change: transportStore.summaryCards.fines.change,
      trend: transportStore.summaryCards.fines.trend,
      loading: transportStore.loading.summaryCards,
      error: transportStore.errors.summaryCards,
    },
    {
      icon: 'tabler-currency-dollar',
      color: 'success',
      title: transportStore.summaryCards.revenue.title,
      subtitle: transportStore.summaryCards.revenue.subtitle,
      value: transportStore.summaryCards.revenue.formatted_value || transportStore.summaryCards.revenue.value,
      change: transportStore.summaryCards.revenue.change,
      trend: transportStore.summaryCards.revenue.trend,
      loading: transportStore.loading.summaryCards,
      error: transportStore.errors.summaryCards,
    },
    {
      icon: 'tabler-certificate',
      color: 'primary',
      title: transportStore.summaryCards.concessions.title,
      subtitle: transportStore.summaryCards.concessions.subtitle,
      value: transportStore.summaryCards.concessions.value,
      change: transportStore.summaryCards.concessions.change,
      trend: transportStore.summaryCards.concessions.trend,
      loading: transportStore.loading.summaryCards,
      error: transportStore.errors.summaryCards,
    },
    {
      icon: 'tabler-car',
      color: 'info',
      title: transportStore.summaryCards.vehicles.title,
      subtitle: transportStore.summaryCards.vehicles.subtitle,
      value: transportStore.summaryCards.vehicles.value,
      change: transportStore.summaryCards.vehicles.change,
      trend: transportStore.summaryCards.vehicles.trend,
      loading: transportStore.loading.summaryCards,
      error: transportStore.errors.summaryCards,
    },
  ]
})

onMounted(() => {
  // Load transport statistics
  transportStore.fetchSummaryCards('week')
})

definePage({
  meta: {
    action: 'read',
    subject: 'Profile',
  },
})
</script>

<template>
  <VRow class="match-height">
    <!-- 👉 Transport Overview -->
    <VCol cols="12">
      <TransportOverview />
    </VCol>

    <!-- 👉 Transport Statistics Cards -->
    <VCol
      v-for="card in transportStatisticsCards"
      :key="card.title"
      cols="12"
      sm="6"
      md="3"
    >
      <StatisticsCard
        :icon="card.icon"
        :color="card.color"
        :title="card.title"
        :subtitle="card.subtitle"
        :value="card.value"
        :change="card.change"
        :trend="card.trend"
        :loading="card.loading"
        :error="card.error"
      />
    </VCol>

    <!-- 👉 Revenue Growth -->
    <!--
      <VCol
      cols="12"
      md="8"
      lg="4"
      >
      <CrmRevenueGrowth />
      </VCol>
    -->

    <!-- 👉 Recent Activity -->
    <VCol
      cols="12"
      md="4"
      lg="4"
    >
      <RecentActivityCard />
    </VCol>
  </VRow>
</template>
