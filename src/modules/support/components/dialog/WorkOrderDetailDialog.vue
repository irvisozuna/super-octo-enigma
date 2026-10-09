<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTiposOrden } from '../../composables/useTiposOrden'
import { COLOR_ESTADO_ORDEN, COLOR_PRIORIDAD_ORDEN, colorDe } from '@/utils/estados'
import { fechaHora, texto } from '@/utils/formato'

/* Detalle de una orden de trabajo del contrato (ticket de Aquasoft Comercial), sin salir de la pestaña en la que se esté. */
const props = defineProps<{
  abierto: boolean
  orden: Record<string, any> | null

  /** Órdenes del contrato en total: si hay más de una, ofrece ir a la pestaña. */
  total?: number
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'verTodas': []
}>()

const { t, te } = useI18n()
const { nombreTipo } = useTiposOrden()

const traducir = (prefijo: string, v: unknown) => (v !== null && v !== undefined && te(`${prefijo}${String(v)}`) ? t(`${prefijo}${String(v)}`) : texto(v))

const datos = computed(() => {
  const o = props.orden ?? {}

  return [
    { etiqueta: t('support.ordenes.fecha'), valor: fechaHora(o.datec), num: true },
    { etiqueta: t('support.ordenes.tipo'), valor: nombreTipo(o.type_code) },
    { etiqueta: t('support.ordenes.reportadoPor'), valor: texto(o.reported_by) },
    { etiqueta: t('support.orden.area'), valor: texto(o.area) },
    { etiqueta: t('support.orden.departamento'), valor: texto(o.department) },
    { etiqueta: t('support.orden.telefono'), valor: texto(o.phone), num: true },
    { etiqueta: t('support.ordenes.resolucion'), valor: texto(o.resolution) },
    { etiqueta: t('support.ordenes.fechaCierre'), valor: fechaHora(o.date_close), num: true },
  ]
})
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.ordenes.detalleTitulo', { ref: orden?.ref ?? '' })"
    :subtitulo="orden?.subject ?? undefined"
    tamano="md"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <template v-if="orden">
      <div class="d-flex flex-wrap align-center gap-2 mb-4">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="colorDe(COLOR_ESTADO_ORDEN, String(orden.fk_statut))"
        >
          {{ traducir('support.ordenes.estados.', orden.fk_statut) }}
        </VChip>
        <VChip
          size="small"
          label
          variant="tonal"
          :color="colorDe(COLOR_PRIORIDAD_ORDEN, String(orden.severity_code))"
        >
          {{ t('support.ordenes.prioridad') }}: {{ traducir('support.orden.prioridades.', orden.severity_code) }}
        </VChip>
      </div>

      <dl class="as-datos mb-0">
        <div
          v-for="d in datos"
          :key="d.etiqueta"
          class="as-dato"
        >
          <dt class="as-etiqueta">
            {{ d.etiqueta }}
          </dt>
          <dd
            class="as-valor mb-0"
            :class="{ 'as-num': d.num }"
          >
            {{ d.valor }}
          </dd>
        </div>
      </dl>

      <h3 class="as-seccion">
        {{ t('support.ordenes.mensaje') }}
      </h3>
      <!-- eslint-disable vue/no-v-html -- contenido ya saneado por Aquasoft Comercial -->
      <div
        v-if="orden.message"
        class="orden__texto"
        v-html="orden.message"
      />
      <!-- eslint-enable vue/no-v-html -->
      <p
        v-else
        class="as-secundario mb-0"
      >
        {{ t('support.ordenes.sinMensaje') }}
      </p>

      <template v-if="orden.observations">
        <h3 class="as-seccion">
          {{ t('support.ordenes.observaciones') }}
        </h3>
        <p class="orden__texto mb-0">
          {{ orden.observations }}
        </p>
      </template>
      <template v-if="orden.closed_comments">
        <h3 class="as-seccion">
          {{ t('support.ordenes.cierre') }}
        </h3>
        <p class="orden__texto mb-0">
          {{ orden.closed_comments }}
        </p>
      </template>
    </template>

    <template
      v-if="(total ?? 0) > 1"
      #acciones-inicio
    >
      <AsBtnTerciario
        prepend-icon="tabler-clipboard-list"
        @click="emit('verTodas')"
      >
        {{ t('support.ordenes.verTodas', { n: total }) }}
      </AsBtnTerciario>
    </template>
  </AsDialogo>
</template>

<style scoped>
.orden__texto {
  overflow-wrap: anywhere;
}

.orden__texto :deep(p:last-child) {
  margin-block-end: 0;
}
</style>
