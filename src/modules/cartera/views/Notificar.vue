<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useNotificar } from '../composables/useNotificar'
import type { CuentaCandidata, FiltroConvenio, FiltrosBusqueda, ItemCatalogo, NuncaHaPagado } from '../types/cartera'
import { filtrosActivos } from '../utils/cartera'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'
import { fecha, moneda } from '@/utils/formato'

/*
 * Notificar: filtros del padrón y del adeudo, conteo inmediato, lista en orden de recorrido con casillas y generación
 * del lote para un notificador. Reemplaza la búsqueda del módulo viejo (queja 2: ya no se repite una cuenta vigente).
 */
const { t } = useI18n()
const router = useRouter()
const dialogo = useDialogo()
const notificar = useNotificacion()
const n = useNotificar()

const opciones = (items: ItemCatalogo[]) => items.map(i => ({ value: i.id, title: i.nombre }))
const catalogo = computed(() => n.catalogos.value)

const convenios = computed(() => [
  { value: 'excluir_al_corriente', title: t('cartera.notificar.convenioExcluir') },
  { value: 'incluir', title: t('cartera.notificar.convenioIncluir') },
  { value: 'solo_atrasados', title: t('cartera.notificar.convenioAtrasados') },
])

const excluidas = computed(() => (n.resumen.value?.con_convenio ?? 0) + (n.resumen.value?.pagaron_despues ?? 0))
const nunca = computed(() => (['incluir', 'excluir', 'solo'] as NuncaHaPagado[]).map(v => ({ value: v, title: t(`cartera.notificar.nunca${v.charAt(0).toUpperCase()}${v.slice(1)}`) })))
const notificadores = computed(() => (catalogo.value?.notificadores ?? []).map(a => ({ value: a.id, title: a.nombre })))
const activos = computed(() => filtrosActivos(n.filtros))
const todasMarcadas = computed(() => n.cuentas.value.length > 0 && n.seleccion.value.size === n.cuentas.value.length)

const listas: { clave: keyof FiltrosBusqueda; etiqueta: string; items: () => ItemCatalogo[] }[] = [
  { clave: 'gerencias', etiqueta: 'gerencias', items: () => catalogo.value?.gerencias ?? [] },
  { clave: 'sistemas', etiqueta: 'sistemas', items: () => n.sistemas.value },
  { clave: 'sectores', etiqueta: 'sectores', items: () => n.sectores.value },
  { clave: 'colonias', etiqueta: 'colonias', items: () => catalogo.value?.colonias ?? [] },
  { clave: 'tipos_contrato', etiqueta: 'tiposContrato', items: () => catalogo.value?.tipos_contrato ?? [] },
  { clave: 'giros', etiqueta: 'giros', items: () => catalogo.value?.giros ?? [] },
  { clave: 'estatus', etiqueta: 'estatus', items: () => catalogo.value?.estatus ?? [] },
]

const numeros: { clave: keyof FiltrosBusqueda; etiqueta: string }[] = [
  { clave: 'meses_desde', etiqueta: 'mesesDesde' },
  { clave: 'meses_hasta', etiqueta: 'mesesHasta' },
  { clave: 'importe_desde', etiqueta: 'importeDesde' },
  { clave: 'importe_hasta', etiqueta: 'importeHasta' },
  { clave: 'ultimo_pago_dias', etiqueta: 'ultimoPagoDias' },
  { clave: 'ultimo_pago_importe_max', etiqueta: 'ultimoPagoImporte' },
]

function aNumero(v: string | number | null): number | null {
  if (v === null || v === '')
    return null
  const x = Number(v)

  return Number.isFinite(x) && x >= 0 ? x : null
}

const columnas: ColumnaTabla<CuentaCandidata>[] = [
  { clave: 'marca', titulo: '', formato: 'personalizado', ordenable: false, ancho: 48 },
  { clave: 'cuenta', titulo: t('cartera.comun.cuenta'), formato: 'personalizado', anchoMin: 260, ordenable: false },
  { clave: 'sector', titulo: t('cartera.notificar.sectores'), formato: 'personalizado', ancho: 200 },
  { clave: 'adeudo', titulo: t('cartera.comun.adeudo'), formato: 'moneda', ancho: 120 },
  { clave: 'meses', titulo: t('cartera.comun.meses'), formato: 'entero', ancho: 80 },
  { clave: 'ultimo_pago', titulo: t('cartera.notificar.pago'), formato: 'personalizado', ancho: 170 },
  { clave: 'prioridad', titulo: t('cartera.notificar.prioridad'), formato: 'personalizado', ancho: 150, ordenable: false },
]

const COLOR_PRIORIDAD = { alta: 'success', media: 'warning', baja: 'secondary' } as const
const ordenes = computed(() => [{ value: 'recorrido', title: t('cartera.notificar.ordenRecorrido') }, { value: 'prioridad', title: t('cartera.notificar.ordenPrioridad') }])

async function generar() {
  const quien = notificadores.value.find(o => o.value === n.notificador.value)?.title ?? ''

  const ok = await dialogo.confirmar({
    titulo: t('cartera.notificar.confirmarTitulo'),
    mensaje: t('cartera.notificar.confirmarDetalle', { n: n.seleccion.value.size, notificador: quien }),
    icono: 'tabler-file-invoice',
    textoConfirmar: t('cartera.notificar.generar'),
  })

  if (!ok)
    return
  const r = await n.generar()
  if (r) {
    notificar.exito(t('cartera.notificar.generado', { ref: r.lote.ref ?? '', n: r.generadas }))
    if (r.descartadas.length)
      notificar.aviso(t('cartera.notificar.descartadas', { n: r.descartadas.length }))
    router.push({ name: 'carteraLote', params: { id: r.lote.id } })
  }
}

onMounted(() => n.iniciar())
onBeforeUnmount(() => n.detener())
</script>

<template>
  <div class="notificar">
    <AsEncabezadoPagina
      :titulo="t('cartera.notificar.titulo')"
      :descripcion="t('cartera.notificar.descripcion')"
    >
      <template #contexto>
        <span class="as-secundario">
          {{ catalogo?.corte ? t('cartera.comun.corte', { fecha: fecha(catalogo.corte) }) : t('cartera.comun.sinCorte') }}
        </span>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="n.error.value && !catalogo"
      tipo="error"
      class="mb-4"
      :error="n.error.value"
      @reintentar="n.iniciar()"
    />
    <VAlert
      v-else-if="n.error.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="n.error.value = null"
    >
      {{ n.error.value.mensaje }}
    </VAlert>

    <AsBarraFiltros
      class="mb-3"
      :activos="activos"
      :deshabilitado="!catalogo"
      @limpiar="n.limpiar()"
    >
      <VAutocomplete
        v-for="l in listas"
        :key="l.clave"
        :model-value="n.filtros[l.clave] as number[]"
        :items="opciones(l.items())"
        :label="t(`cartera.notificar.${l.etiqueta}`)"
        multiple
        chips
        closable-chips
        clearable
        :placeholder="t('cartera.notificar.todas')"
        persistent-placeholder
        class="as-filtro--md"
        @update:model-value="(v: readonly number[]) => n.aplicar({ [l.clave]: [...(v ?? [])] })"
      />
      <template #fin>
        <VTextField
          v-for="x in numeros"
          :key="x.clave"
          :model-value="n.filtros[x.clave]"
          type="number"
          min="0"
          :label="t(`cartera.notificar.${x.etiqueta}`)"
          class="as-filtro--sm"
          @update:model-value="(v: string) => n.aplicar({ [x.clave]: aNumero(v) })"
        />
        <VSelect
          :model-value="n.filtros.nunca_ha_pagado"
          :items="nunca"
          :label="t('cartera.notificar.nuncaHaPagado')"
          class="as-filtro--sm"
          @update:model-value="(v: NuncaHaPagado) => n.aplicar({ nunca_ha_pagado: v })"
        />
        <VSelect
          :model-value="n.filtros.convenio"
          :items="convenios"
          :label="t('cartera.notificar.convenioFiltro')"
          class="as-filtro--md"
          @update:model-value="(v: FiltroConvenio) => n.aplicar({ convenio: v })"
        />
      </template>
    </AsBarraFiltros>

    <!-- Conteo -->
    <div class="notificar__cifras mb-3">
      <AsIndicador
        :etiqueta="t('cartera.notificar.enPadron')"
        :valor="n.resumen.value?.en_padron ?? null"
        :cargando="n.contando.value && !n.resumen.value"
      />
      <AsIndicador
        :etiqueta="t('cartera.notificar.conAdeudo')"
        :valor="n.resumen.value?.con_adeudo ?? null"
        :cargando="n.contando.value && !n.resumen.value"
      />
      <AsIndicador
        :etiqueta="t('cartera.notificar.conVigente')"
        :valor="n.resumen.value?.con_vigente ?? null"
        :cargando="n.contando.value && !n.resumen.value"
      />
      <AsIndicador
        :etiqueta="t('cartera.notificar.aNotificar')"
        :valor="n.resumen.value?.a_notificar ?? null"
        color="primary"
        :cargando="n.contando.value && !n.resumen.value"
      >
        <template #acciones>
          <VSelect
            v-model="n.orden.value"
            :items="ordenes"
            :label="t('cartera.notificar.orden')"
            :title="t('cartera.notificar.ordenAyuda')"
            density="compact"
            hide-details
            class="notificar__orden"
          />
          <VBtn
            size="small"
            color="primary"
            variant="tonal"
            prepend-icon="tabler-list-search"
            :loading="n.cargandoLista.value"
            :disabled="!n.resumen.value?.a_notificar"
            @click="n.verCuentas()"
          >
            {{ t('cartera.notificar.verCuentas') }}
          </VBtn>
        </template>
      </AsIndicador>
    </div>

    <VAlert
      v-if="n.catalogos.value && !n.generacionActiva.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
      data-test="generacion-apagada"
    >
      {{ t('cartera.notificar.generacionApagada') }}
    </VAlert>
    <VAlert
      v-if="excluidas"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('cartera.notificar.excluidasDetalle', { convenio: n.resumen.value?.con_convenio ?? 0, pagaron: n.resumen.value?.pagaron_despues ?? 0 }) }}
    </VAlert>
    <VAlert
      v-if="n.cuentas.value.length && !n.listaVigente.value"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('cartera.notificar.listaVieja') }}
    </VAlert>

    <AsTablaDatos
      v-if="n.cuentas.value.length || n.cargandoLista.value"
      :columnas="columnas"
      :filas="n.cuentas.value"
      clave-fila="contrato"
      densidad="media"
      :cargando="n.cargandoLista.value"
      :por-pagina="100"
      :titulo="t('cartera.notificar.seleccionadas', { n: n.seleccion.value.size, importe: moneda(n.totalSeleccionado.value) })"
      :subtitulo="t('cartera.notificar.capacidad', { n: n.capacidad.value })"
      :vacio-titulo="t('cartera.notificar.sinCuentas')"
      vacio-detalle=""
      class="notificar__tabla"
    >
      <template #encabezado-acciones>
        <div class="d-flex flex-wrap align-center gap-2">
          <VBtn
            size="small"
            variant="text"
            @click="n.marcar(n.cuentas.value.map(c => c.contrato), !todasMarcadas)"
          >
            {{ todasMarcadas ? t('cartera.notificar.desmarcar') : t('cartera.notificar.marcarTodas') }}
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            @click="n.marcar(n.cuentas.value.map(c => c.contrato), false); n.marcar(n.cuentas.value.slice(0, n.capacidad.value).map(c => c.contrato), true)"
          >
            {{ t('cartera.notificar.marcarCapacidad', { n: n.capacidad.value }) }}
          </VBtn>
          <VSelect
            v-model="n.notificador.value"
            :items="notificadores"
            :label="t('cartera.notificar.elegirNotificador')"
            density="compact"
            hide-details
            class="notificar__notificador"
          />
          <VBtn
            color="primary"
            prepend-icon="tabler-file-plus"
            :loading="n.generando.value"
            :disabled="!n.puedeGenerar.value"
            @click="generar"
          >
            {{ t('cartera.notificar.generar') }}
          </VBtn>
        </div>
      </template>
      <template #celda-marca="{ fila }">
        <VCheckboxBtn
          :model-value="n.seleccion.value.has(fila.contrato)"
          density="compact"
          :aria-label="fila.cuenta ?? String(fila.contrato)"
          @update:model-value="n.alternar(fila.contrato)"
        />
      </template>
      <template #celda-cuenta="{ fila }">
        <span class="as-num">{{ fila.cuenta ?? fila.contrato }}</span> · {{ fila.nombre ?? '—' }}
        <div
          class="as-secundario text-truncate"
          :title="fila.domicilio.join('; ')"
        >
          {{ fila.domicilio.join('; ') || '—' }}
        </div>
      </template>
      <template #celda-sector="{ fila }">
        {{ fila.sector ?? '—' }}
        <VChip
          v-if="fila.revision_padron"
          size="x-small"
          label
          variant="tonal"
          color="warning"
          class="ms-1"
          :title="t('cartera.notificar.revisionPadronDetalle')"
        >
          {{ t('cartera.notificar.revisionPadron') }}
        </VChip>
        <div class="as-secundario">
          {{ t('cartera.notificar.manzanaLote', { mza: fila.manzana ?? '—', lote: fila.lote ?? '—' }) }}
        </div>
      </template>
      <template #celda-ultimo_pago="{ fila }">
        <template v-if="fila.ultimo_pago">
          <span class="as-num">{{ fecha(fila.ultimo_pago) }}</span>
          <div class="as-secundario as-num">
            {{ moneda(fila.ultimo_pago_importe) }}
          </div>
        </template>
        <span
          v-else
          class="as-secundario"
        >{{ t('cartera.notificar.nunca') }}</span>
        <div
          v-if="fila.convenio"
          class="as-secundario"
        >
          {{ t('cartera.notificar.convenio', { ref: fila.convenio }) }}
        </div>
        <VChip
          v-if="fila.convenio_estado"
          size="x-small"
          label
          variant="tonal"
          :color="fila.convenio_estado === 'atrasado' ? 'warning' : 'info'"
          class="mt-1"
        >
          {{ fila.convenio_estado === 'atrasado' ? t('cartera.notificar.convenioAtrasado') : t('cartera.notificar.convenioAlCorriente') }}
        </VChip>
        <div
          v-if="fila.pagado_despues"
          class="as-secundario text-success"
        >
          {{ t('cartera.notificar.pagadoDespues', { importe: moneda(fila.pagado_despues) }) }}
        </div>
      </template>
      <template #celda-prioridad="{ fila }">
        <template v-if="fila.prioridad">
          <VChip
            size="small"
            label
            variant="tonal"
            :color="COLOR_PRIORIDAD[fila.prioridad.nivel as keyof typeof COLOR_PRIORIDAD]"
            :title="fila.prioridad.razon"
          >
            {{ t(`cartera.notificar.nivel.${fila.prioridad.nivel}`) }} · <span class="as-num">{{ Math.round(fila.prioridad.probabilidad * 100) }} %</span>
          </VChip>
          <div class="as-secundario as-num mt-1">
            {{ t('cartera.notificar.esperado', { importe: moneda(fila.prioridad.esperado) }) }}
          </div>
        </template>
      </template>
    </AsTablaDatos>
  </div>
</template>

<style scoped>
.notificar__cifras {
  display: grid;
  gap: var(--as-sp-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.notificar__orden {
  max-inline-size: 160px;
}

.notificar__notificador {
  min-inline-size: 220px;
}

.notificar__tabla :deep(td) {
  vertical-align: top;
}
</style>
