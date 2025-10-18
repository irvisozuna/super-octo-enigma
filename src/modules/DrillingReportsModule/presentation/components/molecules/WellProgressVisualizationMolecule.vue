<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  depthPlanned: number
  depthActual: number
  status: 'planned' | 'drilling' | 'completed' | 'abandoned'
  wellName?: string
}

const props = withDefaults(defineProps<Props>(), {
  depthActual: 0,
  status: 'planned',
})

const maxHeight = 300 // Maximum pixel height for visualization
const wellHeight = maxHeight

const actualHeight = computed(() => {
  if (props.depthPlanned === 0)
    return 0

  return (props.depthActual / props.depthPlanned) * maxHeight
})

const depthRemaining = computed(() => {
  return Math.max(0, props.depthPlanned - props.depthActual)
})

const progressPercentage = computed(() => {
  if (props.depthPlanned === 0)
    return 0

  return (props.depthActual / props.depthPlanned) * 100
})

const statusColor = computed(() => {
  const colors = {
    planned: 'info',
    drilling: 'primary',
    completed: 'success',
    abandoned: 'error',
  }

  return colors[props.status] || 'default'
})

const statusLabel = computed(() => {
  const labels = {
    planned: 'Planificado',
    drilling: 'Perforando',
    completed: 'Completado',
    abandoned: 'Abandonado',
  }

  return labels[props.status] || props.status
})

const progressColor = computed(() => {
  if (progressPercentage.value < 25)
    return 'error'
  if (progressPercentage.value < 50)
    return 'warning'
  if (progressPercentage.value < 75)
    return 'info'

  return 'success'
})

const drilledGradientStart = computed(() => {
  const colors = {
    planned: '#90CAF9',
    drilling: '#42A5F5',
    completed: '#66BB6A',
    abandoned: '#EF5350',
  }

  return colors[props.status] || colors.planned
})

const drilledGradientEnd = computed(() => {
  const colors = {
    planned: '#1976D2',
    drilling: '#1565C0',
    completed: '#2E7D32',
    abandoned: '#C62828',
  }

  return colors[props.status] || colors.planned
})
</script>

<template>
  <VCard
    variant="outlined"
    class="well-progress-card"
  >
    <VCardText class="pa-4">
      <div class="d-flex align-center justify-space-between mb-4">
        <h6 class="text-subtitle-1 font-weight-medium">
          Visualización del Pozo
        </h6>
        <VChip
          :color="statusColor"
          size="small"
          variant="tonal"
        >
          {{ statusLabel }}
        </VChip>
      </div>

      <div class="well-visualization-container">
        <!-- Surface Level -->
        <div class="surface-level">
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="tabler-flag"
              size="16"
              color="success"
            />
            <span class="text-caption">Superficie</span>
          </div>
        </div>

        <!-- Well Shaft Visual -->
        <div class="well-shaft-wrapper">
          <!-- Background (planned depth) -->
          <div
            class="well-shaft planned"
            :style="{ height: `${wellHeight}px` }"
          >
            <div class="well-content">
              <div class="depth-marker planned-marker">
                <VIcon
                  icon="tabler-target"
                  size="14"
                />
                <span>{{ depthPlanned }} m</span>
              </div>
            </div>
          </div>

          <!-- Foreground (actual depth) -->
          <div
            v-if="depthActual > 0"
            class="well-shaft drilled"
            :style="{
              height: `${actualHeight}px`,
              background: `linear-gradient(180deg, ${drilledGradientStart} 0%, ${drilledGradientEnd} 100%)`,
            }"
          >
            <div class="well-content">
              <div class="depth-marker actual-marker">
                <VIcon
                  icon="tabler-drill"
                  size="14"
                />
                <span>{{ depthActual }} m</span>
              </div>
            </div>
          </div>

          <!-- Drill Bit Icon (at current depth) -->
          <div
            v-if="depthActual > 0 && status === 'drilling'"
            class="drill-bit"
            :style="{ top: `${actualHeight}px` }"
          >
            <VIcon
              icon="tabler-tool"
              size="20"
              color="warning"
              class="rotating"
            />
          </div>
        </div>

        <!-- Target Level -->
        <div class="target-level">
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="tabler-flag-filled"
              size="16"
              color="primary"
            />
            <span class="text-caption">Objetivo: {{ depthPlanned }} m</span>
          </div>
        </div>

        <!-- Progress Info -->
        <div class="progress-info mt-4">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">Progreso</span>
            <span class="text-caption font-weight-bold">{{ progressPercentage.toFixed(1) }}%</span>
          </div>
          <VProgressLinear
            :model-value="progressPercentage"
            :color="progressColor"
            height="6"
            rounded
          />
          <div class="d-flex justify-space-between mt-2">
            <div>
              <p class="text-caption text-medium-emphasis mb-0">
                Perforado
              </p>
              <p class="text-body-2 font-weight-medium mb-0">
                {{ depthActual }} m
              </p>
            </div>
            <div class="text-end">
              <p class="text-caption text-medium-emphasis mb-0">
                Restante
              </p>
              <p class="text-body-2 font-weight-medium mb-0">
                {{ depthRemaining }} m
              </p>
            </div>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.well-progress-card {
  overflow: hidden;
}

.well-visualization-container {
  position: relative;
  padding: 1rem 0;
}

.surface-level,
.target-level {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  margin-bottom: 0.5rem;
}

.target-level {
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.well-shaft-wrapper {
  position: relative;
  margin: 0 auto;
  width: 80px;
}

.well-shaft {
  position: relative;
  width: 100%;
  border: 2px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 4px;
  transition: all 0.3s ease;

  &.planned {
    background: linear-gradient(180deg,
      rgba(var(--v-theme-surface-variant), 0.3) 0%,
      rgba(var(--v-theme-surface-variant), 0.5) 100%
    );
  }

  &.drilled {
    position: absolute;
    top: 0;
    left: 0;
    border-color: rgba(var(--v-theme-primary), 0.8);
    box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3);
  }
}

.well-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.depth-marker {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  margin: 0 auto;

  &.planned-marker {
    background: rgba(var(--v-theme-surface), 0.8);
    color: rgb(var(--v-theme-primary));
  }

  &.actual-marker {
    background: rgba(var(--v-theme-surface), 0.9);
    color: rgb(var(--v-theme-primary));
    font-weight: 600;
  }
}

.drill-bit {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  animation: drill-pulse 1.5s ease-in-out infinite;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes drill-pulse {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(4px);
  }
}

.progress-info {
  padding: 1rem;
  background: rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 8px;
}
</style>
