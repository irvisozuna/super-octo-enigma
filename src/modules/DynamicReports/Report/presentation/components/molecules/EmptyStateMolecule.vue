<!-- EmptyStateMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// Atoms
import TypographyAtom from '../atoms/TypographyAtom.vue'
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

interface Props {
  title: string
  subtitle?: string
  icon?: string
  illustration?: string
  actionLabel?: string
  secondaryActionLabel?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'outlined' | 'minimal'
}

interface Emits {
  action: []
  secondaryAction: []
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: 'tabler-inbox',
  illustration: '',
  actionLabel: '',
  secondaryActionLabel: '',
  size: 'medium',
  variant: 'default',
})

const emit = defineEmits<Emits>()

const containerClass = computed(() => [
  'empty-state-molecule',
  `empty-state--${props.size}`,
  `empty-state--${props.variant}`,
])

const iconSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 48
    case 'large':
      return 120
    default:
      return 80
  }
})

const titleVariant = computed(() => {
  switch (props.size) {
    case 'small':
      return 'h6'
    case 'large':
      return 'h4'
    default:
      return 'h5'
  }
})

const subtitleVariant = computed(() => {
  switch (props.size) {
    case 'small':
      return 'body-2'
    case 'large':
      return 'body-1'
    default:
      return 'body-2'
  }
})

const handleAction = (): void => {
  emit('action')
}

const handleSecondaryAction = (): void => {
  emit('secondaryAction')
}
</script>

<template>
  <div :class="containerClass">
    <div class="empty-state__content">
      <!-- Illustration or Icon -->
      <div class="empty-state__visual mb-4">
        <img
          v-if="illustration"
          :src="illustration"
          :alt="title"
          class="empty-state__illustration"
        >
        <VIcon
          v-else
          :icon="icon"
          :size="iconSize"
          color="medium-emphasis"
          class="empty-state__icon"
        />
      </div>

      <!-- Text Content -->
      <div class="empty-state__text text-center mb-6">
        <TypographyAtom
          :text="title"
          :variant="titleVariant"
          weight="medium"
          color="on-surface"
          class="empty-state__title mb-2"
        />

        <TypographyAtom
          v-if="subtitle"
          :text="subtitle"
          :variant="subtitleVariant"
          color="on-surface-variant"
          class="empty-state__subtitle"
        />
      </div>

      <!-- Actions -->
      <div
        v-if="actionLabel || secondaryActionLabel"
        class="empty-state__actions"
      >
        <div class="d-flex flex-column flex-sm-row align-center justify-center gap-3">
          <VBtn
            v-if="actionLabel"
            color="primary"
            variant="elevated"
            size="large"
            @click="handleAction"
          >
            {{ actionLabel }}
          </VBtn>

          <VBtn
            v-if="secondaryActionLabel"
            variant="outlined"
            size="large"
            @click="handleSecondaryAction"
          >
            {{ secondaryActionLabel }}
          </VBtn>
        </div>
      </div>

      <!-- Custom Action Slot -->
      <div
        v-if="$slots.actions"
        class="empty-state__custom-actions"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-state-molecule {
  display: flex;
  align-items: center;
  justify-content: center;
  min-block-size: 300px;
  padding-block: 32px;
  padding-inline: 24px;
  text-align: center;
}

.empty-state__content {
  inline-size: 100%;
  max-inline-size: 400px;
}

.empty-state__visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state__illustration {
  block-size: auto;
  inline-size: auto;
  max-block-size: 150px;
  max-inline-size: 200px;
  opacity: 0.8;
}

.empty-state__icon {
  opacity: 0.6;
  transition: all 0.3s ease;
}

.empty-state__text {
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 350px;
}

.empty-state__title {
  line-height: 1.3;
}

.empty-state__subtitle {
  line-height: 1.5;
  opacity: 0.8;
}

.empty-state__actions {
  margin-block-start: 24px;
}

.empty-state__custom-actions {
  margin-block-start: 16px;
}

/* Size variants */
.empty-state--small {
  min-block-size: 200px;
  padding-block: 24px;
  padding-inline: 16px;
}

.empty-state--small .empty-state__content {
  max-inline-size: 300px;
}

.empty-state--small .empty-state__text {
  margin-block-end: 16px;
}

.empty-state--large {
  min-block-size: 500px;
  padding-block: 48px;
  padding-inline: 32px;
}

.empty-state--large .empty-state__content {
  max-inline-size: 500px;
}

.empty-state--large .empty-state__illustration {
  max-block-size: 200px;
  max-inline-size: 300px;
}

/* Variant styles */
.empty-state--outlined {
  border: 2px dashed rgb(var(--v-theme-outline-variant));
  border-radius: 12px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.empty-state--minimal {
  padding: 16px;
  min-block-size: 150px;
}

.empty-state--minimal .empty-state__visual {
  margin-block-end: 16px;
}

.empty-state--minimal .empty-state__text {
  margin-block-end: 16px;
}

/* Hover effects */
.empty-state-molecule:hover .empty-state__icon {
  opacity: 0.8;
  transform: scale(1.05);
}

.empty-state-molecule:hover .empty-state__illustration {
  opacity: 1;
  transform: scale(1.02);
}

/* Animation for entrance */
.empty-state__content {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .empty-state-molecule {
    min-block-size: 250px;
    padding-block: 24px;
    padding-inline: 16px;
  }

  .empty-state__content {
    max-inline-size: 280px;
  }

  .empty-state__illustration {
    max-block-size: 120px;
    max-inline-size: 150px;
  }

  .empty-state__actions .d-flex {
    flex-direction: column;
    gap: 12px;
  }

  .empty-state__actions .v-btn {
    inline-size: 100%;
    max-inline-size: 200px;
  }
}

@media (max-width: 480px) {
  .empty-state-molecule {
    padding-block: 16px;
    padding-inline: 12px;
  }

  .empty-state__text {
    margin-block-end: 20px;
  }
}

/* Dark theme adjustments */
@media (prefers-color-scheme: dark) {
  .empty-state__illustration {
    filter: brightness(0.9) contrast(1.1);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .empty-state--outlined {
    border-width: 3px;
    border-color: rgb(var(--v-theme-outline));
  }

  .empty-state__icon {
    opacity: 0.9;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .empty-state__content {
    animation: none;
  }

  .empty-state__icon,
  .empty-state__illustration {
    transition: none;
  }

  .empty-state-molecule:hover .empty-state__icon,
  .empty-state-molecule:hover .empty-state__illustration {
    transform: none;
  }
}

/* Print styles */
@media print {
  .empty-state__actions {
    display: none;
  }

  .empty-state-molecule {
    break-inside: avoid;
  }
}

/* Focus management for accessibility */
.empty-state__actions .v-btn:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Loading state variant */
.empty-state--loading .empty-state__icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
 100% {
    opacity: 0.6;
  }

  50% {
    opacity: 0.3;
  }
}
</style>
