<script setup lang="ts">
interface Props {
  icon: string
  color: string
  title: string
  subtitle: string
  value: string | number
  change?: number | null
  trend?: 'up' | 'down' | 'stable'
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  change: null,
  trend: 'stable',
})

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return 'success'
    case 'down': return 'error'
    default: return 'info'
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return 'tabler-trending-up'
    case 'down': return 'tabler-trending-down'
    default: return 'tabler-trending-up'
  }
}

const formatChange = (change: number | null) => {
  if (change === null)
    return ''
  const sign = change >= 0 ? '+' : ''

  return `${sign}${change}%`
}
</script>

<template>
  <VCard>
    <VCardText>
      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-4"
      >
        <VProgressCircular
          indeterminate
          size="32"
          color="primary"
        />
        <p class="text-caption mt-2">
          Cargando...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center py-4"
      >
        <VIcon
          color="error"
          size="32"
        >
          tabler-alert-circle
        </VIcon>
        <p class="text-caption mt-2 text-error">
          {{ error }}
        </p>
      </div>

      <!-- Content -->
      <div v-else>
        <VAvatar
          :color="color"
          variant="tonal"
          rounded
          size="44"
        >
          <VIcon
            :icon="icon"
            size="28"
          />
        </VAvatar>

        <h5 class="text-h5 mt-3">
          {{ title }}
        </h5>
        <p class="my-1 text-body-2">
          {{ subtitle }}
        </p>
        <p class="mb-3 text-h6 font-weight-bold">
          {{ typeof value === 'number' ? value.toLocaleString() : value }}
        </p>

        <!-- Change indicator -->
        <VChip
          v-if="change !== null"
          :color="getTrendColor(trend)"
          label
          size="small"
          class="d-flex align-center"
        >
          <VIcon
            :icon="getTrendIcon(trend)"
            size="14"
            start
          />
          {{ formatChange(change) }}
        </VChip>
        <VChip
          v-else
          color="info"
          label
          size="small"
          variant="outlined"
        >
          Sin cambios
        </VChip>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.v-chip {
  min-width: auto;
}
</style>
