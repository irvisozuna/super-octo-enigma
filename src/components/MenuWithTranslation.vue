<!-- components/MenuWithTranslation.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { useMenuTranslation } from '@/composables/useMenuTranslation'
import type { VerticalNavItems } from '@/@layouts/types'

interface Props {
  menuComponent?: string
  items?: VerticalNavItems
}

const props = withDefaults(defineProps<Props>(), {
  menuComponent: 'VerticalNavMenu',
  items: undefined,
})

const menuStore = useMenuStore()
const { translateMenuItems } = useMenuTranslation()

// Usar items propios o del store
const sourceItems = computed(() => props.items || menuStore.verticalNavItems)

// Traducir los elementos del menú
const translatedItems = computed(() => translateMenuItems(sourceItems.value))
</script>

<template>
  <component
    :is="menuComponent"
    :items="translatedItems"
    v-bind="$attrs"
  />
</template>
