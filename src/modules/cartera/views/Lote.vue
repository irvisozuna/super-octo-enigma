<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DialogoResultado from '../components/DialogoResultado.vue'
import FichaNotificacion from '../components/FichaNotificacion.vue'
import TablaNotificaciones from '../components/TablaNotificaciones.vue'
import { useLote } from '../composables/useLotes'
import { useCapturaBloque } from '../composables/useNotificaciones'
import { obtenerCatalogos } from '../services/carteraApi'
import type { ItemCatalogo, Notificacion, Opcion, RespuestaCatalogos, ResultadoNotificacion } from '../types/cartera'
import { esCapturable } from '../utils/cartera'
import { useNotificacion } from '@/composables/useNotificacion'
import { can } from '@layouts/plugins/casl'
import { entero, fechaHoraCorta, fechaIso, moneda, porcentaje } from '@/utils/formato'

/*
 * Un lote: su PDF (lista, notificaciones y actas) y sus notificaciones. Al regresar el notificador se marcan las
 * entregadas y se captura el mismo resultado en bloque; cada una se abre en su ficha para capturarla aparte.
 */
// MapLibre se baja solo al abrir un lote (y no se carga en las pruebas de pantallas, que corren sin WebGL)
const MapaLote = defineAsyncComponent(() => import('../components/MapaLote.vue'))

const { t } = useI18n()
const route = useRoute()
const notificar = useNotificacion()
const l = useLote()
const bloque = useCapturaBloque()
const resultados = ref<Opcion<ResultadoNotificacion>[]>([])
const catalogos = ref<RespuestaCatalogos | null>(null)
const seleccion = ref<Set<string>>(new Set())
const fichaId = ref<string | null>(null)
const fichaAbierta = ref(false)
const capturando = ref(false)

const lote = computed(() => l.lote.value)
const notificaciones = computed(() => lote.value?.notificaciones ?? [])
const puedeOperar = computed(() => can('operate', 'cartera-operar'))
const marcadas = computed(() => notificaciones.value.filter(f => seleccion.value.has(f.id)))
const resumen = computed(() => lote.value?.resumen ?? null)
const avance = computed(() => resumen.value?.total ? resumen.value.capturadas / resumen.value.total * 100 : 0)
const entregadas = computed(() => resumen.value?.total ? resumen.value.entregadas / resumen.value.total * 100 : 0)

/*
 * Los filtros con que se generó el lote (XEL1-680), en palabras: los de catálogo con sus nombres y los de rango con su
 * valor. Lo que no se reconoce no se pinta.
 */
const LISTAS: { clave: string; etiqueta: string; items: (c: RespuestaCatalogos) => ItemCatalogo[] }[] = [
  { clave: 'gerencias', etiqueta: 'gerencias', items: c => c.gerencias },
  { clave: 'sistemas', etiqueta: 'sistemas', items: c => c.sistemas },
  { clave: 'sectores', etiqueta: 'sectores', items: c => c.sectores },
  { clave: 'colonias', etiqueta: 'colonias', items: c => c.colonias },
  { clave: 'tipos_contrato', etiqueta: 'tiposContrato', items: c => c.tipos_contrato },
  { clave: 'giros', etiqueta: 'giros', items: c => c.giros },
  { clave: 'estatus', etiqueta: 'estatus', items: c => c.estatus },
]

const RANGOS: { clave: string; etiqueta: string; moneda?: boolean }[] = [
  { clave: 'meses_desde', etiqueta: 'mesesDesde' },
  { clave: 'meses_hasta', etiqueta: 'mesesHasta' },
  { clave: 'importe_desde', etiqueta: 'importeDesde', moneda: true },
  { clave: 'importe_hasta', etiqueta: 'importeHasta', moneda: true },
  { clave: 'ultimo_pago_dias', etiqueta: 'ultimoPagoDias' },
  { clave: 'ultimo_pago_importe_max', etiqueta: 'ultimoPagoImporte', moneda: true },
]

const filtrosLote = computed(() => {
  const f = lote.value?.filtros ?? {}
  const c = catalogos.value
  const out: string[] = []
  for (const lista of LISTAS) {
    const ids = Array.isArray(f[lista.clave]) ? f[lista.clave] as number[] : []
    if (!ids.length)
      continue
    const nombres = c ? lista.items(c).filter(i => ids.includes(i.id)).map(i => i.nombre) : []

    out.push(`${t(`cartera.notificar.${lista.etiqueta}`)}: ${nombres.length ? nombres.join(', ') : entero(ids.length)}`)
  }
  for (const r of RANGOS) {
    const v = f[r.clave]
    if (v !== null && v !== undefined && v !== '')
      out.push(`${t(`cartera.notificar.${r.etiqueta}`)}: ${r.moneda ? moneda(v) : entero(v)}`)
  }

  return out
})

const minimo = computed(() => {
  const dias = marcadas.value.map(f => f.emitida).filter((x): x is string => !!x).map(x => fechaIso(new Date(x)))

  return dias.length ? dias.sort().at(-1)! : null
})

function alternar(id: string) {
  const s = new Set(seleccion.value)

  s.has(id) ? s.delete(id) : s.add(id)
  seleccion.value = s
}

function marcarTodas(v: boolean) {
  seleccion.value = v ? new Set(notificaciones.value.filter(esCapturable).map(f => f.id)) : new Set()
}

function ver(f: Notificacion) {
  fichaId.value = f.id
  fichaAbierta.value = true
}

async function capturar(datos: { resultado: ResultadoNotificacion; fecha: string; observacion: string | null }) {
  const r = await bloque.capturar([...seleccion.value], datos.resultado, datos.fecha, datos.observacion)
  if (!r)
    return
  capturando.value = false
  seleccion.value = new Set()
  if (r.capturadas)
    notificar.exito(t('cartera.captura.bloqueGuardado', { n: r.capturadas }))
  if (r.errores.length)
    notificar.aviso(`${t('cartera.captura.bloqueErrores', { n: r.errores.length })} ${r.errores.map(e => `${e.ref ?? e.id}: ${e.motivo}`).join(' · ')}`, { timeout: 12000 })
  l.cargar()
}

async function rearmar() {
  await l.rearmar()
  if (!l.errorAccion.value)
    notificar.info(t('cartera.lotes.rearmado'))
}

watch(() => route.params.id, id => {
  if (typeof id === 'string')
    l.cargar(id)
})

onMounted(async () => {
  l.cargar(String(route.params.id))
  catalogos.value = await obtenerCatalogos().catch(() => null)
  resultados.value = catalogos.value?.resultados ?? []
})
onBeforeUnmount(() => l.detener())
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="lote?.ref ?? t('cartera.comun.lote')"
      :descripcion="lote ? t('cartera.lotes.descripcionLote', { notificador: lote.notificador ?? '—', n: entero(lote.cuentas), fecha: fechaHoraCorta(lote.generado_en) }, lote.cuentas) : undefined"
      :volver="{ texto: t('cartera.lotes.volver'), to: { name: 'carteraLotes' } }"
    >
      <template #acciones>
        <AsBtnSecundario
          v-if="puedeOperar && lote && lote.documento !== 'listo' && !l.enCurso.value"
          prepend-icon="tabler-refresh"
          :loading="l.rearmando.value"
          @click="rearmar"
        >
          {{ t('cartera.lotes.rearmar') }}
        </AsBtnSecundario>
        <AsBtnPrimario
          prepend-icon="tabler-download"
          :loading="l.descargando.value || l.enCurso.value"
          :disabled="lote?.documento !== 'listo'"
          @click="l.descargar()"
        >
          {{ t('cartera.lotes.descargar') }}
        </AsBtnPrimario>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="l.error.value && !lote"
      tipo="error"
      :error="l.error.value"
      @reintentar="l.cargar()"
    />
    <template v-else>
      <VAlert
        v-if="l.enCurso.value"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ t('cartera.lotes.armandoDetalle') }}
      </VAlert>
      <VAlert
        v-if="lote?.documento === 'error'"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ lote.documento_error ?? t('cartera.lotes.documentoError') }}
      </VAlert>
      <VAlert
        v-if="l.errorAccion.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
        closable
        @click:close="l.errorAccion.value = null"
      >
        {{ l.errorAccion.value.mensaje }}
      </VAlert>

      <!-- Avance del lote (XEL1-680) -->
      <div
        v-if="resumen"
        class="lote__cifras mb-4"
      >
        <AsIndicador
          :etiqueta="t('cartera.lotes.kpiAvance')"
          :valor="`${entero(resumen.capturadas)} / ${entero(resumen.total)}`"
          formato="texto"
          :progreso="avance"
          :color-progreso="avance === 100 ? 'success' : 'primary'"
          :apoyo="t('cartera.lotes.kpiAvanceApoyo', { p: porcentaje(avance, 0) })"
        />
        <AsIndicador
          :etiqueta="t('cartera.lotes.kpiEntregadas')"
          :valor="resumen.entregadas"
          color="success"
          :apoyo="t('cartera.lotes.kpiEntregadasApoyo', { p: porcentaje(entregadas, 0) })"
        />
        <AsIndicador
          :etiqueta="t('cartera.lotes.kpiPendientes')"
          :valor="resumen.por_estado.en_proceso ?? 0"
          :color="(resumen.por_estado.en_proceso ?? 0) > 0 ? 'warning' : undefined"
        />
        <AsIndicador
          :etiqueta="t('cartera.lotes.kpiAdeudo')"
          :valor="resumen.adeudo"
          formato="moneda"
        />
      </div>

      <div
        v-if="filtrosLote.length"
        class="lote__filtros mb-4"
      >
        <span class="as-etiqueta">{{ t('cartera.lotes.filtrosLote') }}</span>
        <VChip
          v-for="f in filtrosLote"
          :key="f"
          size="small"
          label
          variant="tonal"
        >
          {{ f }}
        </VChip>
      </div>

      <MapaLote
        v-if="notificaciones.length"
        :notificaciones="notificaciones"
        class="mb-4"
        @ver="id => { fichaId = id; fichaAbierta = true }"
      />

      <TablaNotificaciones
        :filas="notificaciones"
        :seleccion="seleccion"
        :seleccionable="puedeOperar"
        :cargando="l.cargando.value && !lote"
        @ver="ver"
        @alternar="alternar"
        @marcar-todas="marcarTodas"
      />

      <div
        v-if="seleccion.size"
        class="lote__barra"
      >
        <span>{{ t('cartera.notificaciones.marcadas', { n: seleccion.size }) }}</span>
        <AsBtnPrimario
          prepend-icon="tabler-clipboard-check"
          @click="capturando = true"
        >
          {{ t('cartera.lotes.capturarBloque') }}
        </AsBtnPrimario>
      </div>
    </template>

    <FichaNotificacion
      :id="fichaId"
      v-model:abierto="fichaAbierta"
      :resultados="resultados"
      @cambio="l.cargar()"
    />
    <DialogoResultado
      v-model:abierto="capturando"
      :titulo="t('cartera.captura.tituloBloque', { n: seleccion.size })"
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
.lote__cifras {
  display: grid;
  gap: var(--as-sp-3);
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.lote__filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-2);
}

.lote__barra {
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
