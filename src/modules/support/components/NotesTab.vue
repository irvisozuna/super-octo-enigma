<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListaContrato } from '../composables/useListaContrato'
import { useContractStore } from '../stores/contractStore'
import AddNoteDialog from './dialog/AddNoteDialog.vue'
import MensajeDialogo from './MensajeDialogo.vue'
import type { ColumnaTabla } from '@/components/as/tipos'

/* Notas de atención del contrato: bitácora de quien atendió, con alta desde la misma pestaña. */
const props = defineProps<{ activa: boolean }>()

const { t, te } = useI18n()
const store = useContractStore()
const lista = useListaContrato((id, p) => store.getNotesByContract(id, p), () => props.activa)

const notaAbierta = ref(false)
const mensajeAbierto = ref(false)
const mensaje = ref('')

const asunto = (v: unknown) => (v && te(String(v)) ? t(String(v)) : String(v || '—'))

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'subject', titulo: t('support.notas.asunto'), formato: 'personalizado', ancho: 220 },
  { clave: 'content', titulo: t('support.notas.contenido'), formato: 'personalizado', anchoMin: 260 },
  { clave: 'datec', titulo: t('support.notas.fecha'), formato: 'fechaHora', ancho: 150 },
  { clave: 'author_name', titulo: t('support.notas.autor'), formato: 'texto', truncar: true, ancho: 200 },
].map(c => ({ ...c, ordenable: false })))

function verMensaje(html: string) {
  mensaje.value = html
  mensajeAbierto.value = true
}
</script>

<template>
  <div class="d-flex justify-end px-4 pt-3">
    <AsBtnPrimario
      prepend-icon="tabler-plus"
      @click="notaAbierta = true"
    >
      {{ t('support.nota.titulo') }}
    </AsBtnPrimario>
  </div>

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
    vacio-icono="tabler-note-off"
    class="notas__tabla"
    @update:pagina="lista.cambiarPagina"
    @reintentar="lista.cargar"
  >
    <template #vacio-acciones>
      <AsBtnSecundario
        prepend-icon="tabler-plus"
        @click="notaAbierta = true"
      >
        {{ t('support.nota.titulo') }}
      </AsBtnSecundario>
    </template>
    <template #celda-subject="{ fila }">
      {{ asunto(fila.subject) }}
    </template>
    <template #celda-content="{ fila }">
      <div class="d-flex align-center gap-1">
        <!-- eslint-disable vue/no-v-html -- contenido ya saneado por Aquasoft Comercial -->
        <span
          class="text-truncate notas__contenido"
          v-html="fila.content"
        />
        <!-- eslint-enable vue/no-v-html -->
        <VBtn
          v-if="fila.content"
          icon="tabler-eye"
          size="x-small"
          variant="text"
          :title="t('support.lista.verMensaje')"
          :aria-label="t('support.lista.verMensaje')"
          @click="verMensaje(fila.content)"
        />
      </div>
    </template>
  </AsTablaDatos>

  <AddNoteDialog
    v-model:abierto="notaAbierta"
    @guardado="lista.cargar()"
  />
  <MensajeDialogo
    v-model:abierto="mensajeAbierto"
    :html="mensaje"
  />
</template>

<style scoped>
.notas__contenido {
  display: inline-block;
  max-inline-size: var(--as-ancho-filtro-lg);
}
</style>
