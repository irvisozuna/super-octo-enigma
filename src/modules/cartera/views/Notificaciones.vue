<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DialogoResultado from '../components/DialogoResultado.vue'
import FichaNotificacion from '../components/FichaNotificacion.vue'
import TablaNotificaciones from '../components/TablaNotificaciones.vue'
import { useCapturaBloque, useNotificaciones } from '../composables/useNotificaciones'
import { obtenerCatalogos, obtenerLotes } from '../services/carteraApi'
import type { EstadoNotificacion, Lote, Notificacion, RespuestaCatalogos } from '../types/cartera'
import { COLOR_NOTIFICACION } from '../utils/cartera'
import { useNotificacion } from '@/composables/useNotificacion'
import { entero, fechaIso } from '@/utils/formato'

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
const lotes = ref<Lote[]>([])
const opcionesLote = computed(() => lotes.value.map(l => ({ value: l.id, title: [l.ref, l.notificador].filter(Boolean).join(' · ') })))

const estados = computed(() => [
  { value: 'en_proceso', title: 'En proceso' },
  ...resultados.value.map(r => ({ value: r.codigo, title: r.nombre })),
  { value: 'vencida', title: 'Vencida' },
  { value: 'cancelada', title: 'Cancelada' },
])

/*
 * Contadores por estado con los demás filtros (XEL1-680): tocar uno filtra por ese estado y tocarlo otra vez lo quita.
 * Solo salen los estados que tienen algo, en el orden de la lista de estados.
 */
const contadores = computed(() => estados.value
  .map(e => ({ ...e, n: n.conteos.value[e.value as EstadoNotificacion] ?? 0 }))
  .filter(e => e.n > 0))

const totalConteos = computed(() => contadores.value.reduce((s, e) => s + e.n, 0))

function alternarEstado(codigo: string) {
  n.aplicar({ estado: n.filtros.estado === codigo ? null : codigo as EstadoNotificacion })
}

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
  }).catch(() => null), obtenerLotes(1, 100).then(r => {
    lotes.value = r.lotes
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
      <VAutocomplete
        :model-value="n.filtros.lote"
        :items="opcionesLote"
        :label="t('cartera.notificaciones.lote')"
        clearable
        class="as-filtro--md"
        @update:model-value="(v: string | null) => n.aplicar({ lote: v })"
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

    <div
      v-if="contadores.length"
      class="notificaciones__conteos mb-3"
      role="group"
      :aria-label="t('cartera.notificaciones.porEstado')"
    >
      <span class="as-secundario as-num me-1">{{ t('cartera.notificaciones.totalConteos', { n: entero(totalConteos) }) }}</span>
      <VChip
        v-for="c in contadores"
        :key="c.value"
        size="small"
        label
        :variant="n.filtros.estado === c.value ? 'flat' : 'tonal'"
        :color="COLOR_NOTIFICACION[c.value as EstadoNotificacion] ?? 'secondary'"
        :aria-pressed="n.filtros.estado === c.value"
        @click="alternarEstado(c.value)"
      >
        {{ c.title }} <span class="as-num ms-1">{{ entero(c.n) }}</span>
      </VChip>
    </div>

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
      <span>{{ t('cartera.notificaciones.marcadas', { n: n.seleccion.value.size }, n.seleccion.value.size) }}</span>
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
.notificaciones__conteos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-2);
}

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

  /* Flota sobre la tabla al quedar fija abajo; sin sombra parecía un renglón más */
  box-shadow: var(--as-sombra-flotante);
  gap: var(--as-sp-3);
  inset-block-end: var(--as-sp-3);
  margin-block-start: var(--as-sp-3);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}
</style>
