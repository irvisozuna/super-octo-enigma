<!-- TabsHeaderMolecule.vue -->
<script setup lang="ts">
interface TabItem {
  value: string
  label: string
  icon?: string
  disabled?: boolean
  badge?: number | string
}

interface Props {
  modelValue: string
  tabs: TabItem[]
  density?: 'default' | 'comfortable' | 'compact'
  showArrows?: boolean
  centerActive?: boolean
  color?: string
  bgColor?: string
}

interface Emits {
  'update:modelValue': [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  density: 'default',
  showArrows: true,
  centerActive: false,
  color: 'primary',
  bgColor: undefined,
})

const emit = defineEmits<Emits>()

const handleTabChange = (value: string): void => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="tabs-header-molecule">
    <VTabs
      :model-value="modelValue"
      :density="density"
      :show-arrows="showArrows"
      :center-active="centerActive"
      :color="color"
      :bg-color="bgColor"
      class="tabs-header"
      @update:model-value="handleTabChange"
    >
      <VTab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled"
        class="tabs-header__tab"
      >
        <!-- Icon -->
        <VIcon
          v-if="tab.icon"
          :icon="tab.icon"
          start
          :size="density === 'compact' ? 18 : 20"
        />

        <!-- Label -->
        <span class="tabs-header__label">{{ tab.label }}</span>

        <!-- Badge -->
        <VBadge
          v-if="tab.badge"
          :content="tab.badge"
          color="error"
          class="ms-2"
        >
          <template #badge>
            <span class="text-caption">{{ tab.badge }}</span>
          </template>
        </VBadge>
      </VTab>
    </VTabs>
  </div>
</template>

<style scoped>
.tabs-header-molecule {
  inline-size: 100%;
}

.tabs-header {
  border-block-end: 1px solid rgb(var(--v-theme-outline-variant));
}

.tabs-header__tab {
  font-weight: 500;
  text-transform: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tabs-header__tab:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.tabs-header__label {
  overflow: hidden;
  max-inline-size: 200px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Density adjustments */
.tabs-header.v-tabs--density-compact .tabs-header__label {
  font-size: 0.875rem;
  max-inline-size: 150px;
}

.tabs-header.v-tabs--density-comfortable .tabs-header__label {
  font-size: 1rem;
  max-inline-size: 250px;
}

/* Focus styles for accessibility */
.tabs-header__tab:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

/* Active state styling */
.tabs-header__tab.v-tab--selected {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

/* Responsive behavior */
@media (max-width: 768px) {
  .tabs-header__label {
    font-size: 0.875rem;
    max-inline-size: 120px;
  }

  .tabs-header__tab .v-icon {
    display: none;
  }
}

/* Animation for tab selection */
.tabs-header :deep(.v-tabs-slider) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
