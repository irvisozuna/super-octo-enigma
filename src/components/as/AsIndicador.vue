<script setup lang="ts">
import { computed } from 'vue'
import { conSigno, porFormato } from '@/utils/formato'
import type { FormatoValor } from '@/utils/formato'

/*
 * Tarjeta de indicador: etiqueta, cifra tabular grande, apoyo, barra de avance o delta, icono y estado.
 * Sustituye a las seis construcciones de tarjeta KPI. El valor llega como número (se formatea con `formato`) o como
 * texto ya armado.
 */
const props = withDefaults(defineProps<{
  etiqueta: string
  valor?: string | number | null
  formato?: FormatoValor
  decimales?: number
  sufijo?: string
  apoyo?: string
  icono?: string

  /** Token de color para la cifra y el icono (`error`, `success`, `sector-rezagado`…). */
  color?: string
  progreso?: number | null
  colorProgreso?: string
  delta?: number | null
  deltaDecimales?: number
  deltaSufijo?: string

  /** Cuando bajar es bueno (tiempo muerto, anomalías), invierte el color del delta. */
  deltaInvertido?: boolean
  estado?: 'normal' | 'alerta' | 'advertencia'
  cargando?: boolean
  interactivo?: boolean
}>(), { formato: 'entero', estado: 'normal', deltaDecimales: 1 })

const emit = defineEmits<{
  click: []
}>()

const textoValor = computed(() => {
  if (typeof props.valor === 'string')
    return props.valor

  const base = props.formato === 'decimal' && props.decimales !== undefined
    ? porFormato(props.valor, 'decimal')
    : porFormato(props.valor, props.formato)

  return props.sufijo && props.valor !== null && props.valor !== undefined ? `${base}${props.sufijo}` : base
})

const textoDelta = computed(() => (props.delta === null || props.delta === undefined ? '' : `${conSigno(props.delta, props.deltaDecimales)}${props.deltaSufijo ?? ''}`))

const claseDelta = computed(() => {
  if (props.delta === null || props.delta === undefined || props.delta === 0)
    return 'text-medium-emphasis'
  const positivoEsBueno = !props.deltaInvertido

  return (props.delta > 0) === positivoEsBueno ? 'text-success' : 'text-error'
})

const iconoDelta = computed(() => (props.delta && props.delta > 0 ? 'tabler-trending-up' : props.delta && props.delta < 0 ? 'tabler-trending-down' : 'tabler-minus'))
</script>

<template>
  <VCard
    class="as-indicador as-tarjeta h-100"
    :class="[estado !== 'normal' && `as-indicador--${estado}`, { 'as-indicador--interactivo': interactivo }]"
    variant="flat"
    :tabindex="interactivo ? 0 : undefined"
    :role="interactivo ? 'button' : undefined"
    @click="interactivo && emit('click')"
    @keydown.enter="interactivo && emit('click')"
  >
    <div class="as-indicador__cabecera">
      <span class="as-indicador__etiqueta text-body-2 text-medium-emphasis">{{ etiqueta }}</span>
      <slot name="acciones">
        <VIcon
          v-if="icono"
          :icon="icono"
          size="18"
          :class="color ? `text-${color}` : 'text-medium-emphasis'"
        />
      </slot>
    </div>
    <VSkeletonLoader
      v-if="cargando"
      type="heading"
      class="as-indicador__esqueleto"
    />
    <template v-else>
      <div class="d-flex align-baseline flex-wrap gap-x-2">
        <slot name="valor">
          <span
            class="as-indicador__valor as-num"
            :class="color && `text-${color}`"
          >{{ textoValor }}</span>
        </slot>
        <span
          v-if="textoDelta"
          class="as-indicador__delta as-num text-body-2 d-inline-flex align-center gap-1"
          :class="claseDelta"
        >
          <VIcon
            :icon="iconoDelta"
            size="14"
          />{{ textoDelta }}
        </span>
      </div>
      <VProgressLinear
        v-if="progreso !== undefined && progreso !== null"
        :model-value="progreso"
        :color="colorProgreso ?? 'primary'"
        height="6"
        rounded
        class="my-2"
        :aria-label="etiqueta"
      />
      <div
        v-if="apoyo"
        class="as-indicador__apoyo text-caption text-medium-emphasis"
      >
        {{ apoyo }}
      </div>
      <slot />
    </template>
  </VCard>
</template>

<style scoped>
.as-indicador {
  display: flex;
  flex-direction: column;
  min-block-size: 120px;
  padding-block: var(--as-sp-3) var(--as-sp-4);
  padding-inline: var(--as-sp-4);
}

.as-indicador__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-sp-2);
  margin-block-end: var(--as-sp-1);
}

.as-indicador :deep(.as-indicador__valor) {
  font-size: var(--as-fs-3xl);
  font-weight: var(--as-peso-semi);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.as-indicador--alerta {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-error));
}

.as-indicador--advertencia {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-warning));
}

.as-indicador--interactivo {
  cursor: pointer;
  transition: border-color var(--as-dur-rapida) var(--as-ease), box-shadow var(--as-dur-rapida) var(--as-ease);
}

.as-indicador--interactivo:hover,
.as-indicador--interactivo:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  outline: none;
}

.as-indicador__esqueleto :deep(.v-skeleton-loader__heading) {
  margin: 0;
  block-size: 2rem;
  inline-size: 60%;
}
</style>
