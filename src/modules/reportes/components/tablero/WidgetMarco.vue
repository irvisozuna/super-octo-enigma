<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ErrorReporte } from '../../services/errores'
import type { WidgetDef } from '../../types/tablero'
import { claveMensaje } from '../../services/errores'

defineProps<{
  widget: WidgetDef
  cargando: boolean
  error: ErrorReporte | null
  vacio: boolean
}>()

const emit = defineEmits<{
  reintentar: []
}>()

const { t } = useI18n()
</script>

<template>
  <VCard
    class="widget-marco h-100 d-flex flex-column"
    :loading="cargando"
  >
    <VCardItem class="pb-2">
      <VCardTitle class="text-body-1 font-weight-medium">
        {{ widget.titulo }}
      </VCardTitle>
    </VCardItem>

    <VCardText class="flex-grow-1 d-flex flex-column">
      <div
        v-if="error"
        class="widget-estado text-error"
      >
        <VIcon
          icon="tabler-alert-circle"
          size="28"
        />
        <p class="text-body-2 mb-1">
          {{ t(claveMensaje(error)) }}
        </p>
        <VBtn
          size="small"
          variant="text"
          @click="emit('reintentar')"
        >
          {{ t('reportes.comunes.reintentar') }}
        </VBtn>
      </div>

      <div
        v-else-if="vacio && !cargando"
        class="widget-estado text-medium-emphasis"
      >
        <VIcon
          icon="tabler-database-off"
          size="28"
        />
        <p class="text-body-2 mb-0">
          {{ t('reportes.tablero.widgetSinDatos') }}
        </p>
      </div>

      <div
        v-else-if="vacio && cargando"
        class="widget-estado text-medium-emphasis"
      >
        <VProgressCircular
          indeterminate
          size="28"
          width="3"
        />
      </div>

      <slot v-else />
    </VCardText>
  </VCard>
</template>

<style scoped>
.widget-estado {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-block-size: 120px;
  text-align: center;
}
</style>
