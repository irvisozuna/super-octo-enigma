<!-- AlertAtom.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'info' | 'success' | 'warning' | 'error'
  variant?: 'text' | 'tonal' | 'outlined' | 'elevated' | 'flat'
  title?: string
  text?: string
  icon?: string
  closable?: boolean
  persistent?: boolean
}

interface Emits {
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  variant: 'tonal',
  title: '',
  text: '',
  icon: '',
  closable: false,
  persistent: false,
})

const emit = defineEmits<Emits>()

const alertIcon = computed(() => {
  if (props.icon)
    return props.icon

  switch (props.type) {
    case 'success':
      return 'tabler-check-circle'
    case 'warning':
      return 'tabler-alert-triangle'
    case 'error':
      return 'tabler-alert-circle'
    default:
      return 'tabler-info-circle'
  }
})

const handleClose = (): void => {
  emit('close')
}
</script>

<template>
  <VAlert
    :type="type"
    :variant="variant"
    :icon="alertIcon"
    :closable="closable"
    :persistent="persistent"
    @click:close="handleClose"
  >
    <template
      v-if="title"
      #title
    >
      {{ title }}
    </template>

    <template
      v-if="text"
      #text
    >
      {{ text }}
    </template>

    <template #default>
      <slot />
    </template>
  </VAlert>
</template>

<style scoped>
.v-alert {
  margin-block: 8px;
  margin-inline: 0;
}
</style>
