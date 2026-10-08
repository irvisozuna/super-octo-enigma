<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { claveMensaje } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/*
 * Estados de una tabla, panel o pantalla: cargando (esqueleto), vacío, error (con reintentar y detalle técnico) y
 * sin permiso. Un solo componente para que los tres módulos se vean igual y ningún fallo quede mudo.
 */
const props = withDefaults(defineProps<{
  tipo: 'cargando' | 'vacio' | 'error' | 'sin-permiso'
  titulo?: string
  detalle?: string
  icono?: string
  error?: ErrorReporte | null

  /** Solo administradores: muestra el detalle técnico del error. */
  mostrarDetalle?: boolean

  /** Variante en línea, para tarjetas pequeñas y celdas. */
  compacto?: boolean

  /** Filas del esqueleto cuando está cargando. */
  filas?: number
  esqueleto?: 'tabla' | 'lista' | 'texto' | 'tarjeta'
}>(), { filas: 4, esqueleto: 'tabla' })

const emit = defineEmits<{
  reintentar: []
}>()

const { t } = useI18n()
const copiado = ref(false)

const tipoEsqueleto = computed(() => {
  const n = props.filas
  if (props.esqueleto === 'lista')
    return `list-item-two-line@${n}`
  if (props.esqueleto === 'texto')
    return `text@${n}`
  if (props.esqueleto === 'tarjeta')
    return 'heading, text@2'

  return `table-row@${n}`
})

const tituloError = computed(() => props.titulo ?? (props.error ? t(claveMensaje(props.error)) : t('as.estado.errorTitulo')))

async function copiarDetalle() {
  if (!props.error?.detalle)
    return
  await navigator.clipboard.writeText(props.error.detalle)
  copiado.value = true
  setTimeout(() => (copiado.value = false), 2000)
}
</script>

<template>
  <!-- Cargando -->
  <div
    v-if="tipo === 'cargando'"
    class="as-estado as-estado--cargando"
    :class="{ 'as-estado--compacto': compacto }"
    role="status"
    :aria-label="t('as.estado.cargando')"
  >
    <VSkeletonLoader
      :type="tipoEsqueleto"
      class="as-estado__esqueleto"
    />
  </div>

  <!-- Error -->
  <VAlert
    v-else-if="tipo === 'error'"
    type="error"
    variant="tonal"
    :density="compacto ? 'compact' : 'default'"
    class="as-estado as-estado--error"
    :title="tituloError"
  >
    <p
      v-if="detalle || error?.mensaje"
      class="mb-2"
    >
      {{ detalle ?? error?.mensaje }}
    </p>
    <details
      v-if="mostrarDetalle && error?.detalle"
      class="mb-2"
    >
      <summary class="cursor-pointer">
        {{ t('as.estado.detalleTecnico') }}
      </summary>
      <pre class="text-caption mt-2 as-estado__detalle">{{ error.detalle }}</pre>
      <VBtn
        size="small"
        variant="text"
        prepend-icon="tabler-copy"
        @click="copiarDetalle"
      >
        {{ copiado ? t('as.estado.copiado') : t('as.estado.copiar') }}
      </VBtn>
    </details>
    <div class="d-flex flex-wrap gap-2">
      <VBtn
        v-if="error?.reintentable !== false"
        size="small"
        color="error"
        variant="outlined"
        prepend-icon="tabler-refresh"
        @click="emit('reintentar')"
      >
        {{ t('as.estado.reintentar') }}
      </VBtn>
      <slot name="acciones" />
    </div>
  </VAlert>

  <!-- Sin permiso -->
  <VAlert
    v-else-if="tipo === 'sin-permiso'"
    type="info"
    variant="tonal"
    :density="compacto ? 'compact' : 'default'"
    class="as-estado"
    :title="titulo ?? t('as.estado.sinPermisoTitulo')"
    :text="detalle ?? t('as.estado.sinPermisoDetalle')"
  />

  <!-- Vacío -->
  <div
    v-else
    class="as-estado as-estado--vacio d-flex flex-column align-center text-center"
    :class="compacto ? 'py-4 px-3' : 'py-10 px-4'"
  >
    <VIcon
      :icon="icono ?? 'tabler-inbox'"
      :size="compacto ? 28 : 40"
      class="text-disabled"
      :class="compacto ? 'mb-2' : 'mb-3'"
    />
    <div
      class="as-estado__titulo"
      :class="compacto ? 'text-body-2 font-weight-medium' : 'text-subtitle-1'"
    >
      {{ titulo ?? t('as.estado.vacioTitulo') }}
    </div>
    <p
      v-if="detalle !== ''"
      class="text-body-2 text-medium-emphasis mb-0 mt-1 as-estado__detalle-vacio"
    >
      {{ detalle ?? t('as.estado.vacioDetalle') }}
    </p>
    <div
      v-if="$slots.acciones"
      class="d-flex flex-wrap gap-2 mt-3"
    >
      <slot name="acciones" />
    </div>
  </div>
</template>

<style scoped>
.as-estado__detalle {
  overflow: auto;
  max-block-size: 240px;
  white-space: pre-wrap;
}

.as-estado__detalle-vacio {
  max-inline-size: 48ch;
}

.as-estado--cargando {
  padding-block: var(--as-sp-2);
}

.as-estado--compacto .as-estado__esqueleto {
  overflow: hidden;
  max-block-size: 120px;
}
</style>
