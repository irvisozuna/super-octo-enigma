<!-- TypographyAtom.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle-1' | 'subtitle-2' | 'body-1' | 'body-2' | 'caption' | 'overline'
  color?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  weight?: 'light' | 'normal' | 'medium' | 'bold'
  truncate?: boolean
  noWrap?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'body-1',
  color: 'inherit',
  align: 'left',
  weight: 'normal',
  truncate: false,
  noWrap: false,
})

const typographyClass = computed(() => ({
  [`text-${props.variant}`]: true,
  [`text-${props.color}`]: props.color !== 'inherit',
  [`text-${props.align}`]: true,
  [`font-weight-${props.weight}`]: true,
  'text-truncate': props.truncate,
  'text-no-wrap': props.noWrap,
}))
</script>

<template>
  <component
    :is="variant?.startsWith('h') ? variant : 'span'"
    :class="typographyClass"
  >
    <slot />
  </component>
</template>

<style scoped>
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-no-wrap {
  white-space: nowrap;
}
</style>
