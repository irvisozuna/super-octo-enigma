<!-- ActionButtonGroupMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// Atoms
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

interface MenuItem {
  icon: string
  label: string
  color?: string
  action: () => void
  disabled?: boolean
}

interface ButtonConfig {
  icon: string
  tooltip: string
  color?: string
  loading?: boolean
  disabled?: boolean
  action?: () => void
  menu?: MenuItem[]
}

interface Props {
  buttons: ButtonConfig[]
  density?: 'default' | 'comfortable' | 'compact'
  variant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined'
}

const props = withDefaults(defineProps<Props>(), {
  density: 'default',
  variant: 'text',
})

const buttonSize = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'small'
    case 'comfortable':
      return 'large'
    default:
      return 'default'
  }
})

const handleButtonClick = (button: ButtonConfig): void => {
  if (button.action && !button.disabled && !button.loading)
    button.action()
}

const handleMenuItemClick = (item: MenuItem): void => {
  if (!item.disabled)
    item.action()
}
</script>

<template>
  <div class="action-button-group-molecule d-flex align-center">
    <template
      v-for="(button, index) in buttons"
      :key="index"
    >
      <!-- Button with Menu -->
      <VMenu v-if="button.menu && button.menu.length > 0">
        <template #activator="{ props: menuProps }">
          <IconButtonAtom
            :icon="button.icon"
            :tooltip="button.tooltip"
            :variant="variant"
            :color="button.color"
            :size="buttonSize"
            :disabled="button.disabled"
            :loading="button.loading"
            class="me-1"
            v-bind="menuProps"
          />
        </template>

        <VList
          density="compact"
          min-width="160"
        >
          <VListItem
            v-for="(item, itemIndex) in button.menu"
            :key="itemIndex"
            :disabled="item.disabled"
            @click="handleMenuItemClick(item)"
          >
            <template #prepend>
              <VIcon
                :icon="item.icon"
                :color="item.color"
                size="18"
              />
            </template>

            <VListItemTitle class="text-body-2">
              {{ item.label }}
            </VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>

      <!-- Simple Button -->
      <IconButtonAtom
        v-else
        :icon="button.icon"
        :tooltip="button.tooltip"
        :variant="variant"
        :color="button.color"
        :size="buttonSize"
        :disabled="button.disabled"
        :loading="button.loading"
        class="me-1"
        @click="handleButtonClick(button)"
      />
    </template>
  </div>
</template>

<style scoped>
.action-button-group-molecule {
  gap: 4px;
}

.action-button-group-molecule :deep(.icon-button-atom:last-child) {
  margin-inline-end: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .action-button-group-molecule {
    flex-wrap: wrap;
    gap: 8px;
  }
}

/* Focus management for keyboard navigation */
.action-button-group-molecule :deep(.icon-button-atom) {
  position: relative;
}

.action-button-group-molecule :deep(.icon-button-atom:focus-within) {
  z-index: 1;
}
</style>
