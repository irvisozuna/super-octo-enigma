<!-- EmptyStateMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  title: string
  subtitle?: string
  icon?: string
  actionLabel?: string
  showAction?: boolean
  variant?: 'default' | 'info' | 'warning' | 'error'
}

interface Emits {
  action: []
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: 'tabler-inbox',
  actionLabel: '',
  showAction: false,
  variant: 'default',
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

const containerClass = computed(() => ({
  [`empty-state-${props.variant}`]: true,
}))

const handleAction = (): void => {
  emit('action')
}
</script>

<template>
  <div
    class="empty-state-container"
    :class="containerClass"
  >
    <div class="empty-state-content">
      <!-- Icon -->
      <div class="empty-state-icon">
        <VIcon
          :icon="icon"
          size="64"
          :color="variant === 'default' ? 'primary' : variant"
        />
      </div>

      <!-- Title -->
      <h3 class="empty-state-title text-h6 font-weight-medium">
        {{ title }}
      </h3>

      <!-- Subtitle -->
      <p
        v-if="subtitle"
        class="empty-state-subtitle text-body-1 text-medium-emphasis"
      >
        {{ subtitle }}
      </p>

      <!-- Action Button -->
      <VBtn
        v-if="showAction && actionLabel"
        variant="outlined"
        color="primary"
        @click="handleAction"
      >
        {{ actionLabel }}
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  min-block-size: 300px;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-inline-size: 400px;
  text-align: center;
}

.empty-state-icon {
  margin-block-end: 16px;
  opacity: 0.6;
}

.empty-state-title {
  color: rgb(var(--v-theme-on-surface));
  margin-block-end: 8px;
}

.empty-state-subtitle {
  line-height: 1.5;
  margin-block-end: 24px;
}

.empty-state-info {
  background-color: rgb(var(--v-theme-info-container));
  color: rgb(var(--v-theme-on-info-container));
}

.empty-state-warning {
  background-color: rgb(var(--v-theme-warning-container));
  color: rgb(var(--v-theme-on-warning-container));
}

.empty-state-error {
  background-color: rgb(var(--v-theme-error-container));
  color: rgb(var(--v-theme-on-error-container));
}
</style>
