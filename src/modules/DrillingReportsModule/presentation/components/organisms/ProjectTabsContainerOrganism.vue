<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectTab, TabConfig } from '../../composables/tabs/useTabManager'

/**
 * Container para los tabs del proyecto
 * Organism siguiendo Atomic Design
 * Gestiona la visualización y navegación de tabs
 */

interface Props {
  activeTab: ProjectTab
  availableTabs: TabConfig[]
  tabBadges?: Record<string, number>
  loading?: Record<string, boolean>
}

interface Emits {
  (e: 'update:activeTab', tab: ProjectTab): void
  (e: 'tab-action', tab: ProjectTab, action: string): void
}

const props = withDefaults(defineProps<Props>(), {
  tabBadges: () => ({}),
  loading: () => ({}),
})

const emit = defineEmits<Emits>()

// Model para v-model bidireccional
const currentTab = computed({
  get: () => props.activeTab,
  set: value => emit('update:activeTab', value),
})

// Verificar si un tab está cargando
function isTabLoading(tabName: ProjectTab): boolean {
  return props.loading[tabName] || false
}

// Obtener badge para un tab
function getTabBadge(tabName: ProjectTab): number | undefined {
  const count = props.tabBadges[tabName]

  return count && count > 0 ? count : undefined
}

// Manejar acciones específicas del tab
function handleTabAction(tab: ProjectTab, action: string) {
  emit('tab-action', tab, action)
}
</script>

<template>
  <VCard>
    <!-- Tabs Header -->
    <VTabs
      v-model="currentTab"
      align-tabs="start"
      color="primary"
      show-arrows
      class="project-tabs-header"
    >
      <VTab
        v-for="tab in availableTabs"
        :key="tab.name"
        :value="tab.name"
        :disabled="tab.disabled"
        class="tab-item"
      >
        <VIcon
          :icon="tab.icon"
          start
        />
        {{ tab.label }}

        <!-- Badge -->
        <VBadge
          v-if="getTabBadge(tab.name)"
          :content="getTabBadge(tab.name)"
          color="primary"
          inline
          class="ml-2"
        />

        <!-- Loading Indicator -->
        <VProgressCircular
          v-if="isTabLoading(tab.name)"
          indeterminate
          size="16"
          width="2"
          class="ml-2"
        />
      </VTab>
    </VTabs>

    <VDivider />

    <!-- Tab Content -->
    <VWindow
      v-model="currentTab"
      class="project-tabs-content"
    >
      <VWindowItem
        v-for="tab in availableTabs"
        :key="tab.name"
        :value="tab.name"
      >
        <!-- Loading State -->
        <div
          v-if="isTabLoading(tab.name)"
          class="pa-8 text-center"
        >
          <VProgressCircular
            indeterminate
            size="48"
          />
          <p class="text-body-2 text-medium-emphasis mt-4">
            Cargando {{ tab.label.toLowerCase() }}...
          </p>
        </div>

        <!-- Content Slot -->
        <div
          v-else
          class="tab-content"
        >
          <slot
            :name="`tab-${tab.name}`"
            :tab="tab"
          >
            <!-- Default content if no slot provided -->
            <VContainer>
              <VRow>
                <VCol cols="12">
                  <VAlert
                    type="info"
                    variant="tonal"
                  >
                    <template #title>
                      {{ tab.label }}
                    </template>
                    Contenido del tab {{ tab.name }} no implementado
                  </VAlert>
                </VCol>
              </VRow>
            </VContainer>
          </slot>
        </div>

        <!-- Tab Actions Bar (optional) -->
        <div
          v-if="$slots[`tab-actions-${tab.name}`]"
          class="tab-actions-bar pa-4 bg-grey-lighten-5"
        >
          <slot
            :name="`tab-actions-${tab.name}`"
            :tab="tab"
          />
        </div>
      </VWindowItem>
    </VWindow>
  </VCard>
</template>

<style scoped>
.project-tabs-header {
  background-color: rgb(var(--v-theme-surface));
}

.tab-item {
  min-width: 120px;
  text-transform: none;
  letter-spacing: normal;
}

.project-tabs-content {
  min-height: 400px;
}

.tab-content {
  position: relative;
}

.tab-actions-bar {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Responsive */
@media (max-width: 600px) {
  .tab-item {
    min-width: auto;
    padding: 0 12px;
  }

  .tab-item .v-icon {
    margin-right: 4px !important;
  }
}
</style>
