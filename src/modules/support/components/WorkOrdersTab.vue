<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListaContrato } from '../composables/useListaContrato'
import { useTiposOrden } from '../composables/useTiposOrden'
import { useContractStore } from '../stores/contractStore'
import MensajeDialogo from './MensajeDialogo.vue'
import type { ColumnaTabla } from '@/components/as/tipos'
import { COLOR_ESTADO_ORDEN, COLOR_PRIORIDAD_ORDEN, colorDe } from '@/utils/estados'

/* Órdenes de trabajo del contrato (tickets de Aquasoft Comercial): prioridad, tipo, resolución y mensajes completos. */
const props = defineProps<{ activa: boolean }>()

const { t, te } = useI18n()
const store = useContractStore()
const lista = useListaContrato((id, p) => store.getWorkOrdersByContract(id, p), () => props.activa)

const mensajeAbierto = ref(false)
const mensaje = ref('')

const prioridad = (v: unknown) => (te(`support.orden.prioridades.${String(v)}`) ? t(`support.orden.prioridades.${String(v)}`) : String(v ?? '—'))
const { nombreTipo } = useTiposOrden()

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'datec', titulo: t('support.ordenes.fecha'), formato: 'fecha', ancho: 120 },
  { clave: 'ref', titulo: t('support.ordenes.referencia'), formato: 'texto', ancho: 120 },
  { clave: 'subject', titulo: t('support.ordenes.asunto'), formato: 'texto', truncar: true, anchoMin: 200 },
  { clave: 'severity_code', titulo: t('support.ordenes.prioridad'), formato: 'estado', ancho: 120, colorEstado: v => colorDe(COLOR_PRIORIDAD_ORDEN, String(v)), textoEstado: prioridad },
  { clave: 'type_code', titulo: t('support.ordenes.tipo'), formato: 'personalizado', ancho: 200 },
  { clave: 'resolution', titulo: t('support.ordenes.resolucion'), formato: 'texto', truncar: true },
  { clave: 'reported_by', titulo: t('support.ordenes.autor'), formato: 'texto', truncar: true, ancho: 160 },
  { clave: 'message', titulo: t('support.ordenes.mensaje'), formato: 'personalizado', anchoMin: 220 },
  { clave: 'closed_comments', titulo: t('support.ordenes.cierre'), formato: 'texto', truncar: true },
  { clave: 'fk_statut', titulo: t('support.ordenes.estado'), formato: 'estado', ancho: 140, colorEstado: v => colorDe(COLOR_ESTADO_ORDEN, String(v)), textoEstado: v => (te(`support.ordenes.estados.${String(v)}`) ? t(`support.ordenes.estados.${String(v)}`) : String(v ?? '—')) },
].map(c => ({ ...c, ordenable: false })))

function verMensaje(html: string) {
  mensaje.value = html
  mensajeAbierto.value = true
}
</script>

<template>
  <AsTablaDatos
    sin-tarjeta
    :columnas="columnas"
    :filas="lista.filas.value"
    clave-fila="_k"
    densidad="estandar"
    :cargando="lista.cargando.value"
    :error="lista.error.value"
    :paginacion="lista.paginacion.value"
    :vacio-titulo="t('support.lista.sinFilas')"
    vacio-detalle=""
    vacio-icono="tabler-clipboard-off"
    class="ordenes__tabla"
    @update:pagina="lista.cambiarPagina"
    @reintentar="lista.cargar"
  >
    <template #celda-type_code="{ fila }">
      {{ nombreTipo(fila.type_code) }}
    </template>
    <template #celda-message="{ fila }">
      <div class="d-flex align-center gap-1">
        <!-- eslint-disable vue/no-v-html -- contenido ya saneado por Aquasoft Comercial -->
        <span
          class="text-truncate ordenes__mensaje"
          v-html="fila.message"
        />
        <!-- eslint-enable vue/no-v-html -->
        <VBtn
          v-if="fila.message"
          icon="tabler-eye"
          size="x-small"
          variant="text"
          :title="t('support.lista.verMensaje')"
          :aria-label="t('support.lista.verMensaje')"
          @click="verMensaje(fila.message)"
        />
      </div>
    </template>
  </AsTablaDatos>

  <MensajeDialogo
    v-model:abierto="mensajeAbierto"
    :html="mensaje"
  />
</template>

<style scoped>
.ordenes__mensaje {
  display: inline-block;
  max-inline-size: var(--as-ancho-filtro-md);
}

.ordenes__tabla :deep(.as-tabla__td--truncar) {
  max-inline-size: var(--as-ancho-filtro-md);
}
</style>
