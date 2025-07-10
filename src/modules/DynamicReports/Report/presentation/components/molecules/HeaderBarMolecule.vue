<!-- HeaderBarMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// Atoms
import TypographyAtom from '../atoms/TypographyAtom.vue'

interface Props {
  title: string
  subtitle?: string
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  titleClass?: string
  subtitleClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  variant: 'h4',
  titleClass: '',
  subtitleClass: 'text-medium-emphasis',
})

const titleVariant = computed(() => props.variant)

const subtitleVariant = computed(() => {
  switch (props.variant) {
    case 'h1':
    case 'h2':
      return 'h6'
    case 'h3':
    case 'h4':
      return 'subtitle-1'
    case 'h5':
    case 'h6':
      return 'subtitle-2'
    default:
      return 'body-2'
  }
})
</script>

<template>
  <div class="header-bar">
    <TypographyAtom
      :variant="titleVariant"
      :text="title"
      class="header-bar__title"
      :class="[titleClass]"
    />

    <TypographyAtom
      v-if="subtitle"
      :variant="subtitleVariant"
      :text="subtitle"
      class="header-bar__subtitle"
      :class="[subtitleClass]"
    />
  </div>
</template>

<style scoped>
.header-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-bar__title {
  margin: 0;
  font-weight: 600;
  line-height: 1.2;
}

.header-bar__subtitle {
  margin: 0;
  line-height: 1.4;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-bar__title {
    font-size: 1.1em;
  }

  .header-bar__subtitle {
    font-size: 0.9em;
  }
}
</style>
