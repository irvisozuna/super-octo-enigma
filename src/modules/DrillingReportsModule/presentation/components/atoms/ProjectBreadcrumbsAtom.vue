<script setup lang="ts">
import { computed } from 'vue'

export interface Breadcrumb {
  title: string
  to?: string
  disabled?: boolean
}

export interface ProjectBreadcrumbsProps {
  projectName?: string
  projectCode?: string
}

const props = defineProps<ProjectBreadcrumbsProps>()

const breadcrumbItems = computed(() => {
  const items: Breadcrumb[] = [
    {
      title: 'Inicio',
      to: '/',
      disabled: false,
    },
    {
      title: 'Proyectos',
      to: '/drilling/projects',
      disabled: false,
    },
  ]

  if (props.projectName) {
    items.push({
      title: props.projectCode
        ? `${props.projectName} (${props.projectCode})`
        : props.projectName,
      disabled: true,
    })
  }

  return items
})
</script>

<template>
  <VBreadcrumbs
    :items="breadcrumbItems"
    class="pa-0"
  >
    <template #divider>
      <VIcon
        icon="tabler-chevron-right"
        size="16"
      />
    </template>
    <template #title="{ item }">
      <span :class="{ 'text-primary': item.disabled }">{{ item.title }}</span>
    </template>
  </VBreadcrumbs>
</template>

<style scoped lang="scss">
:deep(.v-breadcrumbs-item) {
  font-size: 0.875rem;
}
</style>
