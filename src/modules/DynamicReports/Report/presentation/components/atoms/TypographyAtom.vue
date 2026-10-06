<!-- TypographyAtom.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  text: string
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle-1' | 'subtitle-2' | 'body-1' | 'body-2' | 'caption' | 'overline'
  color?: string
  weight?: 'thin' | 'light' | 'regular' | 'medium' | 'bold' | 'black'
  align?: 'left' | 'center' | 'right' | 'justify'
  truncate?: boolean
  component?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'body-1',
  color: undefined,
  weight: 'regular',
  align: 'left',
  truncate: false,
  component: 'span',
})

const computedTag = computed(() => {
  if (props.component !== 'span')
    return props.component

  switch (props.variant) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return props.variant
    default:
      return 'span'
  }
})

const computedClass = computed(() => [
  `text-${props.variant}`,
  props.color ? `text-${props.color}` : '',
  props.weight !== 'regular' ? `font-weight-${props.weight}` : '',
  props.align !== 'left' ? `text-${props.align}` : '',
  props.truncate ? 'text-truncate' : '',
].filter(Boolean))
</script>

<template>
  <component
    :is="computedTag"
    :class="computedClass"
    class="typography-atom"
  >
    {{ text }}
  </component>
</template>

<style scoped>
.typography-atom {
  margin: 0;
  line-height: 1.5;
  transition: color 0.2s ease;
}

/* Weight variants */
.font-weight-thin { font-weight: 100; }
.font-weight-light { font-weight: 300; }
.font-weight-regular { font-weight: 400; }
.font-weight-medium { font-weight: 500; }
.font-weight-bold { font-weight: 700; }
.font-weight-black { font-weight: 900; }

/* Text alignment */
.text-left { text-align: start; }
.text-center { text-align: center; }
.text-right { text-align: end; }
.text-justify { text-align: justify; }

/* Truncation */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
