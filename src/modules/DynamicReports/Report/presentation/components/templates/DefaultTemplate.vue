<!-- DefaultTemplate.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  loading?: boolean
  fullWidth?: boolean
}

interface Slots {
  default: () => any
  header?: () => any
  sidebar?: () => any
  footer?: () => any
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  loading: false,
  fullWidth: false,
})

defineSlots<Slots>()

const containerClass = computed(() => ({
  'full-width': props.fullWidth,
  'loading': props.loading,
}))
</script>

<template>
  <div
    class="default-template"
    :class="containerClass"
  >
    <!-- Header Slot -->
    <header
      v-if="$slots.header"
      class="template-header"
    >
      <slot name="header" />
    </header>

    <!-- Main Content -->
    <main class="template-main">
      <div
        class="template-container"
        :class="{ 'full-width': fullWidth }"
      >
        <!-- Sidebar Slot -->
        <aside
          v-if="$slots.sidebar"
          class="template-sidebar"
        >
          <slot name="sidebar" />
        </aside>

        <!-- Main Content Slot -->
        <section class="template-content">
          <slot />
        </section>
      </div>
    </main>

    <!-- Footer Slot -->
    <footer
      v-if="$slots.footer"
      class="template-footer"
    >
      <slot name="footer" />
    </footer>

    <!-- Loading Overlay -->
    <VOverlay
      v-if="loading"
      model-value
      class="align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        size="64"
        color="primary"
      />
    </VOverlay>
  </div>
</template>

<style scoped>
.default-template {
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-background));
  min-block-size: 100vh;
}

.template-header {
  z-index: 10;
  flex-shrink: 0;
}

.template-main {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.template-container {
  display: flex;
  flex: 1;
  padding: 16px;
  gap: 16px;
  inline-size: 100%;
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 1400px;
}

.template-container.full-width {
  padding: 0;
  max-inline-size: none;
}

.template-sidebar {
  flex-shrink: 0;
  inline-size: 300px;
}

.template-content {
  flex: 1;
  min-inline-size: 0;
}

.template-footer {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .template-container {
    flex-direction: column;
    padding: 8px;
    gap: 8px;
  }

  .template-sidebar {
    inline-size: 100%;
  }
}
</style>
