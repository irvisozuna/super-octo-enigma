<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DialogoResultado from '../components/DialogoResultado.vue'
import FichaNotificacion from '../components/FichaNotificacion.vue'
import TablaNotificaciones from '../components/TablaNotificaciones.vue'
import { useCapturaBloque, useNotificaciones } from '../composables/useNotificaciones'
import { obtenerCatalogos } from '../services/carteraApi'
import type { EstadoNotificacion, Notificacion, RespuestaCatalogos } from '../types/cartera'
import { useNotificacion } from '@/composables/useNotificacion'
import { fechaIso } from '@/utils/formato'

/*
 * Notificaciones: la lista general (nuevas e importadas) con filtros, su ficha y la captura en bloque de las marcadas.
 */
const { t } = useI18n()
const route = useRoute()
const notificar = useNotificacion()
const n = useNotificaciones()
const bloque = useCapturaBloque()
const catalogos = ref<RespuestaCatalogos | null>(null)
const fichaId = ref<string | null>(null)
const fichaAbierta = ref(false)
const capturando = ref(false)
const cuenta = ref('')

const resultados = computed(() => catalogos.value?.resultados ?? [])

const estados = computed(() => [
  { value: 'en_proceso', title: 'En proceso' },
  ...resultados.value.map(r => ({ value: r.codigo, title: r.nombre })),
  { value: 'vencida', title: 'Vencida' },
  { value: 'cancelada', title: 'Cancelada' },
])

const notificadores = computed(() => (catalogos.value?.notificadores ?? []).map(a => ({ value: a.id, title: a.nombre })))
const origenes = computed(() => [{ value: 'atencion', title: t('cartera.comun.origenAtencion') }, { value: 'legado', title: t('cartera.comun.origenLegado') }])

const minimo = computed(() => {
  const dias = n.filas.value.filter(f => n.seleccion.value.has(f.id) && f.emitida).map(f => fechaIso(new Date(f.emitida!)))

  return dias.length ? dias.sort().at(-1)! : null
})

function ver(f: Notificacion) {
  fichaId.value = f.id
  fichaAbierta.value = true
}

async function capturar(datos: { resultado: Parameters<typeof bloque.capturar>[1]; fecha: string; observacion: string | null }) {
  const r = await bloque.capturar([...n.seleccion.value], datos.resultado, datos.fecha, datos.observacion)
  if (!r)
    return
  capturando.value = false
  n.seleccion.value = new Set()
  if (r.capturadas)
    notificar.exito(t('cartera.captura.bloqueGuardado', { n: r.capturadas }))
  if (r.errores.length)
    notificar.aviso(`${t('cartera.captura.bloqueErrores', { n: r.errores.length })} ${r.errores.map(e => `${e.ref ?? e.id}: ${e.motivo}`).join(' · ')}`, { timeout: 12000 })
  n.cargar(n.paginacion.value.pagina)
}

function buscarCuenta() {
  n.aplicar({ cuenta: cuenta.value })
}

function limpiar() {
  cuenta.value = ''
  n.limpiar()
}

onMounted(async () => {
  const lote = typeof route.query.lote === 'string' ? route.query.lote : null
  const estado = typeof route.query.estado === 'string' ? route.query.estado as EstadoNotificacion : null

  Object.assign(n.filtros, { lote, estado })
  await Promise.all([n.cargar(1), obtenerCatalogos().then(c => {
    catalogos.value = c
  }).catch(() => null)])
})
onBeforeUnmount(() => n.detener())
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('cartera.notificaciones.titulo')"
      :descripcion="t('cartera.notificaciones.descripcion')"
    />

    <VAlert
      v-if="!n.cargando.value && n.filas.value.length && !n.puedeOperar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('cartera.notificaciones.soloLectura') }}
    </VAlert>

    <AsBarraFiltros
      class="mb-3"
      :activos="n.activos.value"
      @limpiar="limpiar"
    >
      <VTextField
        v-model="cuenta"
        :label="t('cartera.notificaciones.buscarCuenta')"
        prepend-inner-icon="tabler-search"
        clearable
        class="as-filtro--sm"
        @keyup.enter="buscarCuenta"
        @click:clear="cuenta = ''; buscarCuenta()"
        @blur="cuenta !== n.filtros.cuenta && buscarCuenta()"
      />
      <VSelect
        :model-value="n.filtros.estado"
        :items="estados"
        :label="t('cartera.comun.estado')"
        clearable
        class="as-filtro--md"
        @update:model-value="(v: EstadoNotificacion | null) => n.aplicar({ estado: v })"
      />
      <VSelect
        :model-value="n.filtros.notificador"
        :items="notificadores"
        :label="t('cartera.comun.notificador')"
        clearable
        class="as-filtro--md"
        @update:model-value="(v: string | null) => n.aplicar({ notificador: v })"
      />
      <VTextField
        :model-value="n.filtros.desde"
        type="date"
        :label="t('cartera.notificaciones.desde')"
        class="as-filtro--sm"
        @update:model-value="(v: string) => n.aplicar({ desde: v || null })"
      />
      <VTextField
        :model-value="n.filtros.hasta"
        type="date"
        :label="t('cartera.notificaciones.hasta')"
        class="as-filtro--sm"
        @update:model-value="(v: string) => n.aplicar({ hasta: v || null })"
      />
      <VSelect
        :model-value="n.filtros.origen"
        :items="origenes"
        :label="t('cartera.notificaciones.origen')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: 'atencion' | 'legado' | null) => n.aplicar({ origen: v })"
      />
    </AsBarraFiltros>

    <TablaNotificaciones
      :filas="n.filas.value"
      :seleccion="n.seleccion.value"
      :seleccionable="n.puedeOperar.value"
      :cargando="n.cargando.value"
      :error="n.error.value"
      :paginacion="n.paginacion.value"
      mostrar-lote
      @ver="ver"
      @alternar="n.alternar"
      @marcar-todas="n.marcarTodas"
      @update:pagina="(p: number) => n.cargar(p)"
      @reintentar="n.cargar(n.paginacion.value.pagina)"
    />

    <div
      v-if="n.seleccion.value.size"
      class="notificaciones__barra"
    >
      <span>{{ t('cartera.notificaciones.marcadas', { n: n.seleccion.value.size }) }}</span>
      <AsBtnPrimario
        prepend-icon="tabler-clipboard-check"
        @click="capturando = true"
      >
        {{ t('cartera.notificaciones.capturar') }}
      </AsBtnPrimario>
    </div>

    <FichaNotificacion
      :id="fichaId"
      v-model:abierto="fichaAbierta"
      :resultados="resultados"
      @cambio="n.cargar(n.paginacion.value.pagina)"
    />
    <DialogoResultado
      v-model:abierto="capturando"
      :titulo="t('cartera.captura.tituloBloque', { n: n.seleccion.value.size })"
      :resultados="resultados"
      :cargando="bloque.enviando.value"
      :minimo="minimo"
      @confirmar="capturar"
    >
      <VAlert
        v-if="bloque.error.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        {{ bloque.error.value.mensaje }}
      </VAlert>
    </DialogoResultado>
  </div>
</template>

<style scoped>
.notificaciones__barra {
  position: sticky;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  border: var(--as-borde);
  border-radius: var(--as-radio, 8px);
  background: rgb(var(--v-theme-surface));
  gap: var(--as-sp-3);
  inset-block-end: var(--as-sp-3);
  margin-block-start: var(--as-sp-3);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}
</style>
