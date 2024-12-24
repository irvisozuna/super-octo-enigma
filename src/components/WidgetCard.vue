<template>
  <VCard class="mb-6">
    <VCardText class="px-3">
      <VRow>
        <template v-for="(data, id) in widgetData" :key="id">
          <VCol
            cols="12"
            sm="6"
            md="3"
            class="px-6"
          >
            <div
              class="d-flex justify-space-between align-center"
              :class="getDynamicClass(id)"
            >
              <div class="d-flex flex-column">
                <h4 class="text-h4">
                  {{ data.value }}
                </h4>
                <span class="text-body-1 text-capitalize">{{ data.title }}</span>
              </div>

              <VAvatar
                variant="tonal"
                rounded
                size="42"
              >
                <VIcon
                  :icon="data.icon"
                  size="26"
                  color="high-emphasis"
                />
              </VAvatar>
            </div>
          </VCol>
          <VDivider
            v-if="showDivider(id)"
            vertical
            inset
            length="60"
          />
        </template>
      </VRow>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { WidgetData } from '@/types/types';
import { useDisplay } from 'vuetify'; // Importa el composable para los breakpoints

// Props
const props = defineProps({
  widgetData: {
    type: Array as PropType<WidgetData[]>,
    required: true,
    default: () => [],
  },
});

// Usa los breakpoints de Vuetify
const display = useDisplay();

// Método para calcular la clase dinámica basada en el índice
function getDynamicClass(id: number): string {
  const isXs = display.xs.value; // `xs` como valor reactivo
  const isSm = display.sm.value; // `sm` como valor reactivo
  const length = props.widgetData.length;

  if (isXs) {
    return id !== length - 1 ? 'border-b pb-4' : '';
  } else if (isSm) {
    return id < length / 2 ? 'border-b pb-4' : '';
  }
  return '';
}

// Método para determinar si mostrar el divisor
function showDivider(id: number): boolean {
  const isMdAndUp = display.mdAndUp.value; // `mdAndUp` como valor reactivo
  const isSmAndUp = display.smAndUp.value; // `smAndUp` como valor reactivo
  const length = props.widgetData.length;

  if (isMdAndUp) {
    return id !== length - 1;
  } else if (isSmAndUp) {
    return id % 2 === 0;
  }
  return false;
}
</script>
