<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { claveMensaje } from '../../services/errores'
import type { ErrorReporte } from '../../services/errores'

const props = defineProps<{
  error: ErrorReporte

  /** Solo para administradores: muestra el detalle técnico (p. ej. el error de la fuente de datos). */
  mostrarDetalle?: boolean
}>()

const emit = defineEmits<{
  reintentar: []
}>()

const { t } = useI18n()
const copiado = ref(false)

async function copiarDetalle() {
  if (!props.error.detalle)
    return

  await navigator.clipboard.writeText(props.error.detalle)
  copiado.value = true
  setTimeout(() => (copiado.value = false), 2000)
}
</script>

<template>
  <VAlert
    type="error"
    variant="tonal"
    :title="t(claveMensaje(error))"
  >
    <p
      v-if="error.mensaje"
      class="mb-2"
    >
      {{ error.mensaje }}
    </p>

    <details
      v-if="mostrarDetalle && error.detalle"
      class="mb-2"
    >
      <summary class="cursor-pointer">
        {{ t('reportes.errores.detalleTecnico') }}
      </summary>
      <pre class="text-caption mt-2 detalle-tecnico">{{ error.detalle }}</pre>
      <VBtn
        size="small"
        variant="text"
        prepend-icon="tabler-copy"
        @click="copiarDetalle"
      >
        {{ copiado ? t('reportes.errores.copiado') : t('reportes.errores.copiar') }}
      </VBtn>
    </details>

    <VBtn
      v-if="error.reintentable"
      size="small"
      color="error"
      variant="outlined"
      prepend-icon="tabler-refresh"
      @click="emit('reintentar')"
    >
      {{ t('reportes.comunes.reintentar') }}
    </VBtn>
  </VAlert>
</template>

<style scoped>
.detalle-tecnico {
  overflow: auto;
  max-block-size: 240px;
  white-space: pre-wrap;
}
</style>
