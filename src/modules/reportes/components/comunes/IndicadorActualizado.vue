<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { tiempoRelativo } from '../../utils/formato'

const props = defineProps<{
  fecha: string | null
  desdeCache: boolean
  duracionMs: number
  cargando: boolean
}>()

const emit = defineEmits<{
  actualizar: []
}>()

const { t } = useI18n()

// El texto "hace X minutos" se refresca solo cada 30 s
const ahora = ref(new Date())

useIntervalFn(() => {
  ahora.value = new Date()
}, 30_000)

const texto = computed(() => (props.fecha ? t('reportes.comunes.actualizadoHace', { tiempo: tiempoRelativo(props.fecha, ahora.value) }) : ''))
</script>

<template>
  <div
    v-if="fecha"
    class="d-flex align-center gap-2 text-body-2 text-medium-emphasis"
  >
    <span>{{ texto }}</span>
    <VChip
      v-if="desdeCache"
      size="x-small"
      label
      color="secondary"
    >
      {{ t('reportes.comunes.desdeCache') }}
    </VChip>
    <VBtn
      icon
      size="small"
      variant="text"
      :loading="cargando"
      :aria-label="t('reportes.comunes.actualizar')"
      @click="emit('actualizar')"
    >
      <VIcon icon="tabler-refresh" />
      <VTooltip
        activator="parent"
        location="bottom"
      >
        {{ t('reportes.comunes.actualizar') }}
      </VTooltip>
    </VBtn>
  </div>
</template>
