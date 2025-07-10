<!-- ExpandablePanelMolecule.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  title: string
  icon?: string
  defaultExpanded?: boolean
  variant?: 'default' | 'elevated' | 'outlined'
}

interface Emits {
  toggle: [expanded: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'tabler-chevron-right',
  defaultExpanded: false,
  variant: 'default',
})

const emit = defineEmits<Emits>()

const isExpanded = ref(props.defaultExpanded)

const toggleExpanded = (): void => {
  isExpanded.value = !isExpanded.value
  emit('toggle', isExpanded.value)
}

const panelClass = computed(() => ({
  [`panel-${props.variant}`]: true,
}))
</script>

<template>
  <VExpansionPanels
    :model-value="isExpanded ? 0 : undefined"
    @update:model-value="(value) => isExpanded = value === 0"
  >
    <VExpansionPanel>
      <VExpansionPanelTitle
        :class="panelClass"
        @click="toggleExpanded"
      >
        <div class="d-flex align-center">
          <VIcon
            v-if="icon"
            :icon="icon"
            size="small"
            class="me-2"
          />
          <span class="text-body-2 font-weight-medium">
            {{ title }}
          </span>
        </div>
      </VExpansionPanelTitle>

      <VExpansionPanelText>
        <slot />
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>

<style scoped>
.panel-default {
  background-color: transparent;
}

.panel-elevated {
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 10%);
}

.panel-outlined {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  background-color: rgb(var(--v-theme-surface));
}

:deep(.v-expansion-panel-title) {
  min-block-size: 48px;
  padding-block: 12px;
  padding-inline: 16px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 16px;
}
</style>
