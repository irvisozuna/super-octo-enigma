<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ColumnaDef } from '../../types/reporte'
import type { EjemploRazon } from '../../utils/ayuda'

/* Secciones de la explicación de una columna (las usa ExplicacionColumnaDialogo). */
defineProps<{
  columna: ColumnaDef
  ejemplo: EjemploRazon | null
  sinResumen?: boolean
}>()

const { t } = useI18n()

const SIGNO_ENTRE = '÷'
const SIGNO_IGUAL = '='
</script>

<template>
  <dl class="explicacion-columna">
    <template v-if="!sinResumen">
      <dt>{{ t('reportes.ayuda.queEs') }}</dt>
      <dd>{{ columna.ayuda?.resumen }}</dd>
    </template>
    <template v-if="columna.ayuda?.origen">
      <dt>{{ t('reportes.ayuda.deDondeSale') }}</dt>
      <dd>{{ columna.ayuda.origen }}</dd>
    </template>
    <template v-if="columna.ayuda?.calculo">
      <dt>{{ t('reportes.ayuda.comoSeCalcula') }}</dt>
      <dd>{{ columna.ayuda.calculo }}</dd>
    </template>
    <template v-if="ejemplo">
      <dt>{{ t('reportes.ayuda.conFiltros') }}</dt>
      <dd class="explicacion-columna__ejemplo">
        {{ ejemplo.numerador.etiqueta }} <strong>{{ ejemplo.numerador.valor }}</strong>
        {{ SIGNO_ENTRE }} {{ ejemplo.denominador.etiqueta }} <strong>{{ ejemplo.denominador.valor }}</strong>
        {{ SIGNO_IGUAL }} <strong>{{ ejemplo.resultado }}</strong>
      </dd>
    </template>
  </dl>
</template>

<style scoped>
.explicacion-columna {
  margin: 0;
}

.explicacion-columna dt {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.explicacion-columna dd {
  margin: 0.25rem 0 1rem;
  line-height: 1.5;
}

.explicacion-columna dd:last-child {
  margin-block-end: 0;
}

.explicacion-columna__ejemplo {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 0.06);
  font-variant-numeric: tabular-nums;
}
</style>
