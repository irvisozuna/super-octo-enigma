<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  icon?: string
  color?: string
  showDivider?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  icon: '',
  color: 'primary',
  showDivider: true,
  loading: false,
})
</script>

<template>
  <div class="widget-header-wrapper">
    <div class="widget-header-content">
      <div class="widget-header-main">
        <VIcon
          v-if="icon"
          :icon="icon"
          :color="color"
          size="24"
          class="mr-3"
        />

        <div class="widget-header-text">
          <h3 class="widget-header-title">
            {{ title }}
            <VProgressCircular
              v-if="loading"
              indeterminate
              size="16"
              width="2"
              class="ml-2"
            />
          </h3>
          <p
            v-if="subtitle"
            class="widget-header-subtitle"
          >
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div class="widget-header-actions">
        <slot name="actions" />
      </div>
    </div>

    <VDivider v-if="showDivider" />
  </div>
</template>

<style scoped lang="scss">
.widget-header-wrapper {
  margin-block-end: 16px;
}

.widget-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 8px;
}

.widget-header-main {
  display: flex;
  align-items: center;
  flex: 1;
}

.widget-header-text {
  flex: 1;
}

.widget-header-title {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.widget-header-subtitle {
  margin: 0;
  margin-block-start: 4px;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.widget-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
