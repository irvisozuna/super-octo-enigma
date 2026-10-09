<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DatosWidget } from '../../types/tablero'
import { formatearEntero, formatearValor } from '../../utils/formato'

const props = defineProps<{
  datos: DatosWidget
}>()

const { t } = useI18n()

const columna = computed(() => props.datos.columnas[0])
const fila = computed(() => props.datos.filas[0])
const valor = computed(() => (columna.value && fila.value ? formatearValor(fila.value.valor, columna.value.formato) : '—'))
</script>

<template>
  <div class="indicador">
    <div class="text-h3 font-weight-bold indicador-valor">
      {{ valor }}
    </div>
    <div
      class="text-body-2 text-medium-emphasis"
      :title="datos.filas_fuente ? t('reportes.tablero.filasFuente', { n: formatearEntero(datos.filas_fuente) }) : undefined"
    >
      {{ columna?.etiqueta }}
    </div>
  </div>
</template>

<style scoped>
.indicador {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-block-size: 96px;
}

.indicador-valor {
  overflow-wrap: anywhere;
  line-height: 1.1;
}
</style>
