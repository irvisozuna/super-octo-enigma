<!-- LoadingAtom.vue -->
<script setup lang="ts">
interface Props {
  size?: number | string
  color?: string
  indeterminate?: boolean
  thickness?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 32,
  color: 'primary',
  indeterminate: true,
  thickness: 2,
})
</script>

<template>
  <VProgressCircular
    :size="size"
    :color="color"
    :indeterminate="indeterminate"
    :thickness="thickness"
  />
</template>

<style scoped>
.v-progress-circular {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
