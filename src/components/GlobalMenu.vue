<template>
  <VMenu location="bottom" offset="4" transition="scale-transition">
    <template #activator="{ props }">
      <VBtn v-bind="props" :color="color">
        {{ label }} <VIcon>{{ icon }}</VIcon>
      </VBtn>
    </template>

    <VList>
      <VListItem v-for="(option, index) in options" :key="index" @click="handleOptionClick(option)" :title="option.text"
        :prepend-icon="option.icon" />
    </VList>
  </VMenu>


</template>

<script setup lang="ts">
import { useAppManager } from '@/composables/useAppManager';
import { computed, ref } from 'vue';

// Props para personalización del menú
const props = defineProps({
  label: {
    type: String,
    default: 'Menu', // Texto del botón
  },
  variant: {
    type: String,
    default: 'tonal', // Variante del botón
  },
  color: {
    type: String,
    default: 'secundary', // Color del botón
  },
  icon: {
    type: String,
    default: 'tabler-chevron-down', // Ícono del botón
  },
  options: {
    type: Array as () => Array<{
      text: string;
      icon: string;
      actionType: 'api' | 'dialog' | 'url';
      payload?: any;
    }>,
    default: () => [],
  },
});

// Estado del menú
const menuVisible = ref(false);

// Referencia para el activador del menú
const menuActivator = ref<HTMLElement | null>(null);
const menuActivatorRef = computed(() => menuActivator.value); // Computed para asegurar compatibilidad

// AppManager para manejar acciones
const { navigateTo, openDialog, makeApiCall } = useAppManager();



async function handleOptionClick(option: any) {
  menuVisible.value = false; // Cierra el menú

  switch (option.actionType) {
    case 'api':
      if (option.payload?.url) {
        await makeApiCall(option.payload.url, option.payload.method || 'GET', option.payload.data || {});
      }
      break;
    case 'dialog':
      if (option.payload?.component) {
        await openDialog(option.payload.component, option.payload.props || {}, option.payload.options || {});
      }
      break;
    case 'url':
      if (option.payload?.url) {
        navigateTo(option.payload.url, option.payload.params || {}, option.payload.query || {});
      }
      break;
    default:
      console.warn(`Acción no soportada: ${option.actionType}`);
  }
}
</script>
