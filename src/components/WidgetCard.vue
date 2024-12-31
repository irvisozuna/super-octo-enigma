<template>
  <!-- 👉 Widgets -->
  <div class="d-flex mb-6">
    <VRow>
      <template v-for="(data, id) in widgetData" :key="id">
        <VCol cols="12" md="3" sm="6">
          <VCard>
            <VCardText>
              <div class="d-flex justify-space-between">
                <div class="d-flex flex-column gap-y-1">
                  <div class="text-body-1 text-high-emphasis">
                    {{ data.title }}
                  </div>
                  <div class="d-flex gap-x-2 align-center">
                    <h4 class="text-h4">
                      {{ data.value }}
                    </h4>
                    <div class="text-base"
                      :class="data.change && Number(data.change) > 0 ? 'text-success' : 'text-error'">
                      ({{ data.change ? prefixWithPlus(Number(data.change)) : '0' }}%)
                    </div>
                  </div>
                  <div class="text-sm">
                    {{ data.desc }}
                  </div>
                </div>
                <VAvatar :color="data.iconColor" variant="tonal" rounded size="42">
                  <VIcon :icon="data.icon" size="26" />
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </template>
    </VRow>
  </div>
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
