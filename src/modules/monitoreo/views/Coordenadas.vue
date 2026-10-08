<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCoordenadas } from '../composables/useCoordenadas'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { ConfianzaPropuesta, EstadoPropuesta, PropuestaCoordenada, TipoPropuesta } from '../types/coordenadas'
import type { ColumnaTabla } from '@/components/as/tipos'
import { COLOR_CONFIANZA, COLOR_PROPUESTA } from '@/utils/estados'
import { decimal, entero, fechaHoraCorta, haceCuanto } from '@/utils/formato'

/*
 * Tomas sin coordenada válida y coordenadas desactualizadas (respuesta D2): propuestas calculadas desde las últimas
 * lecturas con GPS, decisión (aceptar / descartar / reabrir, con `operate monitoring`) y CSV para sistemas. Nada se
 * escribe en Aquasoft Comercial: lo aceptado queda como coordenada corregida en Atención.
 * Sobre los componentes del sistema de diseño: encabezado con resumen, barra de filtros y tabla paginada en el servidor.
 */
const { t } = useI18n()
const router = useRouter()
const alcance = useAlcanceStore()
const c = useCoordenadas()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const capitalizar = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`
const etiquetaTipo = (tipo: TipoPropuesta) => (tipo === 'sin_coordenada' ? t('monitoreo.coordenadas.tipoSinCoordenada') : t('monitoreo.coordenadas.tipoDesactualizada'))
const etiquetaEstado = (estado: EstadoPropuesta) => t(`monitoreo.coordenadas.estado${capitalizar(estado)}`)
const etiquetaConfianza = (v: ConfianzaPropuesta) => t(`monitoreo.coordenadas.confianza${capitalizar(v)}`)

const opcionesTipo = computed(() => [{ value: 'sin_coordenada', title: t('monitoreo.coordenadas.tipoSinCoordenada') }, { value: 'desactualizada', title: t('monitoreo.coordenadas.tipoDesactualizada') }])
const opcionesEstado = computed(() => (['propuesta', 'aceptada', 'descartada', 'aplicada'] as EstadoPropuesta[]).map(e => ({ value: e, title: etiquetaEstado(e) })))
const opcionesConfianza = computed(() => (['alta', 'media', 'baja'] as ConfianzaPropuesta[]).map(v => ({ value: v, title: etiquetaConfianza(v) })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))

const filtrosActivos = computed(() => [c.filtros.tipo, c.filtros.gerencia, c.filtros.confianza, c.filtros.q.trim() || null].filter(v => v !== null).length + (c.filtros.estado !== 'propuesta' ? 1 : 0))
const paginacion = computed(() => ({ pagina: c.filtros.pagina, porPagina: c.filtros.por_pagina, total: c.total.value }))

/** Atajos del resumen: cada chip aplica el filtro que le corresponde y se marca cuando está activo. */
const atajos = computed(() => {
  const res = c.resumen.value
  if (!res)
    return []

  return [
    { clave: 'conPropuesta', color: 'warning', tipo: 'sin_coordenada' as TipoPropuesta, estado: 'propuesta' as EstadoPropuesta, n: res.sin_coordenada.propuesta },
    { clave: 'desactualizadas', color: 'error', tipo: 'desactualizada' as TipoPropuesta, estado: 'propuesta' as EstadoPropuesta, n: res.desactualizada.propuesta },
    { clave: 'aceptadas', color: 'success', tipo: null, estado: 'aceptada' as EstadoPropuesta, n: res.sin_coordenada.aceptada + res.desactualizada.aceptada },
    { clave: 'descartadas', color: undefined, tipo: null, estado: 'descartada' as EstadoPropuesta, n: res.sin_coordenada.descartada + res.desactualizada.descartada },
  ].map(a => ({ ...a, activo: c.filtros.tipo === a.tipo && c.filtros.estado === a.estado }))
})

const columnas = computed<ColumnaTabla<PropuestaCoordenada>[]>(() => [
  { clave: 'cuenta', titulo: t('monitoreo.coordenadas.cuenta'), formato: 'personalizado', ordenable: false, ancho: 110 },
  { clave: 'nombre', titulo: t('monitoreo.coordenadas.toma'), formato: 'personalizado', ordenable: false, anchoMin: 220 },
  { clave: 'tipo', titulo: t('monitoreo.coordenadas.tipo'), formato: 'estado', ordenable: false, ancho: 140, colorEstado: v => (v === 'desactualizada' ? 'error' : 'warning'), textoEstado: v => etiquetaTipo(v as TipoPropuesta) },
  { clave: 'actual', titulo: t('monitoreo.coordenadas.actual'), formato: 'personalizado', ordenable: false, ancho: 190 },
  { clave: 'propuesta', titulo: t('monitoreo.coordenadas.propuesta'), formato: 'personalizado', ordenable: false, ancho: 190 },
  { clave: 'lecturas_base', titulo: t('monitoreo.coordenadas.base'), formato: 'entero', ordenable: false, ancho: 90 },
  { clave: 'dispersion_m', titulo: t('monitoreo.coordenadas.dispersion'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 100 },
  { clave: 'confianza', titulo: t('monitoreo.coordenadas.confianza'), formato: 'estado', ordenable: false, ancho: 100, colorEstado: v => COLOR_CONFIANZA[v as ConfianzaPropuesta], textoEstado: v => etiquetaConfianza(v as ConfianzaPropuesta) },
  { clave: 'estado', titulo: t('monitoreo.coordenadas.estado'), formato: 'personalizado', ordenable: false, ancho: 170 },
  { clave: 'acciones', titulo: t('monitoreo.coordenadas.decision'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 240 },
])

function coord(lat: number | null, lng: number | null): string {
  return lat === null || lng === null ? '—' : `${decimal(lat, 6)}, ${decimal(lng, 6)}`
}

function verEnMapa(fila: PropuestaCoordenada) {
  router.push({ name: 'monitoreoInicio', query: { sector: fila.sector_id ? String(fila.sector_id) : undefined } })
}

function limpiarFiltros() {
  c.aplicar({ tipo: null, estado: 'propuesta', gerencia: null, confianza: null, q: '' })
}

let busquedaTimer: ReturnType<typeof setTimeout> | null = null
watch(() => c.filtros.q, () => {
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
  busquedaTimer = setTimeout(() => c.aplicar({}), 350)
})

onMounted(async () => {
  if (!alcance.cargado)
    await alcance.cargar()
  await c.cargar()
})
onBeforeUnmount(() => {
  c.cancelar()
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
})
</script>

<template>
  <div class="coordenadas">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.coordenadas.titulo')"
      :descripcion="t('monitoreo.coordenadas.descripcion')"
    >
      <template #acciones>
        <AsBtnSecundario
          prepend-icon="tabler-file-type-csv"
          :loading="c.exportando.value"
          :disabled="!c.total.value"
          :title="t('monitoreo.coordenadas.exportarDetalle')"
          @click="c.exportar()"
        >
          {{ t('monitoreo.coordenadas.exportar') }}
        </AsBtnSecundario>
      </template>

      <div
        v-if="c.resumen.value"
        class="d-flex flex-wrap align-center gap-2 mt-3"
      >
        <VChip
          label
          size="small"
          variant="tonal"
          prepend-icon="tabler-map-pin-off"
          class="as-num"
        >
          {{ t('monitoreo.coordenadas.tomasSinCoordenada', { n: entero(c.resumen.value.tomas_sin_coordenada) }) }} · {{ t('monitoreo.coordenadas.activas', { n: entero(c.resumen.value.tomas_sin_coordenada_activas) }) }}
        </VChip>
        <VChip
          v-for="a in atajos"
          :key="a.clave"
          label
          size="small"
          :variant="a.activo ? 'flat' : 'tonal'"
          :color="a.color"
          class="as-num"
          @click="c.aplicar({ tipo: a.tipo, estado: a.estado })"
        >
          {{ t(`monitoreo.coordenadas.${a.clave}`, { n: entero(a.n) }) }}
        </VChip>
        <span class="as-secundario ms-1">
          {{ c.resumen.value.calculado ? t('monitoreo.coordenadas.calculado', { hace: haceCuanto(c.resumen.value.calculado, relativo) }) : t('monitoreo.coordenadas.sinCalcular') }}
        </span>
      </div>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="c.error.value && !c.datos.value"
      tipo="error"
      class="mb-4"
      :error="c.error.value"
      @reintentar="c.cargar()"
    />
    <VAlert
      v-if="c.datos.value && !c.puedeDecidir.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('monitoreo.coordenadas.soloLectura') }}
    </VAlert>
    <VAlert
      v-if="c.errorDecision.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="c.errorDecision.value = null"
    >
      {{ c.errorDecision.value.mensaje || t('monitoreo.coordenadas.errorDecision') }}
    </VAlert>

    <AsBarraFiltros
      class="mb-3"
      :activos="filtrosActivos"
      @limpiar="limpiarFiltros"
    >
      <VSelect
        :model-value="c.filtros.tipo"
        :items="opcionesTipo"
        :label="t('monitoreo.coordenadas.tipo')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: TipoPropuesta | null) => c.aplicar({ tipo: v ?? null })"
      />
      <VSelect
        :model-value="c.filtros.estado"
        :items="opcionesEstado"
        :label="t('monitoreo.coordenadas.estado')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: EstadoPropuesta | null) => c.aplicar({ estado: v ?? null })"
      />
      <VSelect
        v-if="alcance.gerencias.length !== 1"
        :model-value="c.filtros.gerencia"
        :items="opcionesGerencia"
        :label="t('monitoreo.coordenadas.gerencia')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: number | null) => c.aplicar({ gerencia: v ?? null })"
      />
      <VSelect
        :model-value="c.filtros.confianza"
        :items="opcionesConfianza"
        :label="t('monitoreo.coordenadas.confianza')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: ConfianzaPropuesta | null) => c.aplicar({ confianza: v ?? null })"
      />
      <template #fin>
        <VTextField
          v-model="c.filtros.q"
          clearable
          prepend-inner-icon="tabler-search"
          :placeholder="t('monitoreo.coordenadas.buscar')"
          :aria-label="t('monitoreo.coordenadas.buscar')"
          class="as-filtro--lg"
        />
      </template>
    </AsBarraFiltros>

    <AsTablaDatos
      :columnas="columnas"
      :filas="c.filas.value"
      clave-fila="id"
      densidad="estandar"
      :cargando="c.cargando.value"
      :paginacion="paginacion"
      :vacio-titulo="t('monitoreo.coordenadas.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-map-pin-check"
      class="coordenadas__tabla"
      @update:pagina="(p: number) => c.aplicar({ pagina: p })"
    >
      <template #celda-cuenta="{ fila }">
        <span class="font-weight-medium as-num">{{ fila.cuenta ?? '—' }}</span>
        <div
          v-if="!fila.activo"
          class="as-secundario text-warning"
        >
          {{ t('monitoreo.coordenadas.inactivo') }}
        </div>
      </template>
      <template #celda-nombre="{ fila }">
        <div
          class="text-truncate coordenadas__nombre"
          :title="fila.nombre ?? ''"
        >
          {{ fila.nombre ?? '—' }}
        </div>
        <div class="as-secundario text-truncate coordenadas__nombre">
          {{ fila.sector ?? '' }}<span v-if="fila.gerencia"> · {{ fila.gerencia }}</span>
        </div>
      </template>
      <template #celda-actual="{ fila }">
        <span class="as-num">{{ coord(fila.actual.lat, fila.actual.lng) }}</span>
        <div
          v-if="fila.distancia_actual_m !== null"
          class="as-secundario text-error as-num"
        >
          {{ t('monitoreo.coordenadas.distancia', { n: entero(fila.distancia_actual_m) }) }}
        </div>
      </template>
      <template #celda-propuesta="{ fila }">
        <span class="font-weight-medium as-num">{{ coord(fila.propuesta.lat, fila.propuesta.lng) }}</span>
      </template>
      <template #celda-dispersion_m="{ fila }">
        <span class="as-num">{{ entero(fila.dispersion_m) }} m</span>
      </template>
      <template #celda-estado="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="COLOR_PROPUESTA[fila.estado as EstadoPropuesta]"
        >
          {{ etiquetaEstado(fila.estado) }}
        </VChip>
        <div
          v-if="fila.decidido_por"
          class="as-secundario mt-1"
        >
          {{ t('monitoreo.coordenadas.decididoPor', { quien: fila.decidido_por, cuando: fila.decidido_en ? fechaHoraCorta(fila.decidido_en) : '' }) }}
        </div>
      </template>
      <template #celda-acciones="{ fila }">
        <div class="d-flex align-center justify-end gap-1 text-no-wrap">
          <template v-if="fila.estado === 'propuesta'">
            <VBtn
              size="small"
              color="success"
              variant="tonal"
              :disabled="!c.puedeDecidir.value"
              :loading="c.decidiendo.value === fila.contrato_id"
              @click="c.decidir(fila, 'aceptar')"
            >
              {{ t('monitoreo.coordenadas.aceptar') }}
            </VBtn>
            <VBtn
              size="small"
              variant="text"
              :disabled="!c.puedeDecidir.value"
              :loading="c.decidiendo.value === fila.contrato_id"
              @click="c.decidir(fila, 'descartar')"
            >
              {{ t('monitoreo.coordenadas.descartar') }}
            </VBtn>
          </template>
          <VBtn
            v-else-if="fila.estado !== 'aplicada'"
            size="small"
            variant="text"
            :disabled="!c.puedeDecidir.value"
            :loading="c.decidiendo.value === fila.contrato_id"
            @click="c.decidir(fila, 'reabrir')"
          >
            {{ t('monitoreo.coordenadas.reabrir') }}
          </VBtn>
          <VBtn
            v-if="fila.sector_id"
            size="small"
            variant="text"
            icon="tabler-map-pin"
            :title="t('monitoreo.coordenadas.verMapa')"
            :aria-label="t('monitoreo.coordenadas.verMapa')"
            @click="verEnMapa(fila)"
          />
        </div>
      </template>
    </AsTablaDatos>
  </div>
</template>

<style scoped>
.coordenadas__nombre {
  max-inline-size: 260px;
}

.coordenadas__tabla :deep(td) {
  vertical-align: top;
}
</style>
