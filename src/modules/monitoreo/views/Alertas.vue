<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { destinoSujeto, useAlertas } from '../composables/useAlertas'
import { obtenerAlerta } from '../services/monitoreoApi'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { Alerta, EstadoFiltroAlertas, SeveridadAlerta, SujetoAlerta } from '../types/alertas'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import type { ColumnaTabla } from '@/components/as/tipos'
import { normalizarError } from '@/services/errores'
import { COLOR_ESTADO_ALERTA, TOKEN_SEVERIDAD } from '@/utils/estados'
import { entero } from '@/utils/formato'

/*
 * Bandeja de alertas (F2.2): lo que el motor abrió con las 13 reglas, acotado al alcance por gerencia del usuario.
 * Quien opera atiende, silencia N horas, reabre o cierra; todos pueden ver el detalle, el historial y saltar al monitor.
 * Sobre los componentes del sistema de diseño: encabezado, barra de filtros, tabla de datos y diálogo.
 */
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const alcance = useAlcanceStore()
const a = useAlertas()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const ESTADOS: EstadoFiltroAlertas[] = ['activas', 'abierta', 'atendida', 'silenciada', 'cerrada', 'todas']
const SEVERIDADES: SeveridadAlerta[] = ['alta', 'media', 'aviso']
const HORAS = [1, 4, 8, 24]

const opcionesRegla = computed(() => a.reglas.value.map(r => ({ value: r.codigo, title: `${r.codigo} · ${r.titulo}` })))
const opcionesTipo = computed(() => (['sector', 'lecturista', 'lectura', 'dispositivo', 'gerencia'] as SujetoAlerta[]).map(s => ({ value: s, title: t(`monitoreo.alertas.sujeto.${s}`) })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))
const nombreGerencia = (id: number | null) => (id === null ? '—' : alcance.gerencias.find(g => g.id === id)?.label ?? `#${id}`)

const filtrosActivos = computed(() => [a.filtros.severidad, a.filtros.regla, a.filtros.tipo, a.filtros.gerencia, a.filtros.q.trim() || null].filter(v => v !== null).length + (a.filtros.estado !== 'activas' ? 1 : 0))

const columnas = computed<ColumnaTabla<Alerta>[]>(() => [
  { clave: 'titulo', titulo: t('monitoreo.alertas.colAlerta'), formato: 'personalizado', ordenable: false },
  { clave: 'sujeto_tipo', titulo: t('monitoreo.alertas.colSujeto'), formato: 'personalizado', ordenable: false, ancho: 112 },
  { clave: 'gerencia_id', titulo: t('monitoreo.alertas.colGerencia'), formato: 'personalizado', ordenable: false, ancho: 150 },
  { clave: 'abierta', titulo: t('monitoreo.alertas.colDesde'), formato: 'personalizado', ordenable: false, ancho: 160 },
  { clave: 'estado', titulo: t('monitoreo.alertas.colEstado'), formato: 'personalizado', ordenable: false, ancho: 200 },
  { clave: 'acciones', titulo: t('monitoreo.alertas.colAcciones'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 250 },
])

const paginacion = computed(() => ({ pagina: a.filtros.pagina, porPagina: a.filtros.por_pagina, total: a.total.value }))

const seleccionada = ref<Alerta | null>(null)
const nota = ref('')
const ultimoCiclo = computed(() => (a.resumen.value?.ultimo_ciclo ? t('monitoreo.alertas.ultimoCiclo', { hace: haceCuanto(a.resumen.value.ultimo_ciclo, relativo) }) : t('monitoreo.alertas.sinCiclo')))

const entradasDetalle = computed(() => {
  const d = seleccionada.value?.detalle ?? {}

  return Object.entries(d).filter(([, v]) => v !== null && typeof v !== 'object').map(([k, v]) => ({ clave: k.replaceAll('_', ' '), valor: String(v) }))
})

function claseFila(fila: Record<string, unknown>) {
  return `alertas__fila--${(fila as Alerta).severidad}`
}

function irAlMonitor(fila: Alerta) {
  const destino = destinoSujeto(fila)
  if (destino)
    router.push(destino)
}

async function abrirDetalle(fila: Alerta) {
  seleccionada.value = fila
  nota.value = ''
  await a.verEventos(fila.id)
}

async function accionar(fila: Alerta, accion: 'atender' | 'silenciar' | 'reabrir' | 'cerrar', horas?: number) {
  const r = await a.accionar(fila.id, accion, { nota: nota.value.trim() || null, horas })
  if (r && seleccionada.value?.id === fila.id) {
    seleccionada.value = r
    nota.value = ''
    await a.verEventos(fila.id)
  }
}

function limpiarFiltros() {
  a.aplicar({ estado: 'activas', severidad: null, regla: null, tipo: null, gerencia: null, q: '' })
}

let busquedaTimer: ReturnType<typeof setTimeout> | null = null
watch(() => a.filtros.q, () => {
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
  busquedaTimer = setTimeout(() => a.aplicar({}), 350)
})

onMounted(async () => {
  if (!alcance.cargado)
    await alcance.cargar()
  await a.cargar()

  // Enlace directo desde la campana o el correo: /monitoreo/alertas?alerta=<id>
  const id = typeof route.query.alerta === 'string' ? route.query.alerta : null
  if (id) {
    try {
      await abrirDetalle(a.filas.value.find(f => f.id === id) ?? await obtenerAlerta(id))
    }
    catch (e) {
      a.errorAccion.value = normalizarError(e)
    }
  }
})
onBeforeUnmount(() => {
  a.cancelar()
  a.pausarRefresco()
  if (busquedaTimer)
    clearTimeout(busquedaTimer)
})
</script>

<template>
  <div class="alertas">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.alertas.titulo')"
      :descripcion="t('monitoreo.alertas.descripcion')"
    >
      <template
        v-if="a.resumen.value"
        #contexto
      >
        <VChip
          v-for="s in SEVERIDADES"
          :key="s"
          label
          size="small"
          :variant="a.filtros.severidad === s ? 'flat' : 'tonal'"
          :color="TOKEN_SEVERIDAD[s]"
          :aria-pressed="a.filtros.severidad === s"
          @click="a.aplicar({ severidad: a.filtros.severidad === s ? null : s })"
        >
          <span class="as-num me-1">{{ entero(a.resumen.value.por_severidad[s]) }}</span>{{ t(`monitoreo.alertas.${s}`) }}
        </VChip>
      </template>
      <template #acciones>
        <span class="text-caption text-medium-emphasis">{{ ultimoCiclo }}</span>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="a.error.value && !a.datos.value"
      tipo="error"
      class="mb-4"
      :error="a.error.value"
      @reintentar="a.cargar()"
    />
    <VAlert
      v-if="a.datos.value && !a.puedeOperar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('monitoreo.alertas.soloLectura') }}
    </VAlert>
    <VAlert
      v-if="a.errorAccion.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="a.errorAccion.value = null"
    >
      {{ a.errorAccion.value.mensaje }}
    </VAlert>

    <AsBarraFiltros
      class="mb-3"
      :activos="filtrosActivos"
      @limpiar="limpiarFiltros"
    >
      <template #inicio>
        <VChipGroup
          :model-value="a.filtros.estado"
          mandatory
          @update:model-value="(v: EstadoFiltroAlertas) => a.aplicar({ estado: v })"
        >
          <VChip
            v-for="e in ESTADOS"
            :key="e"
            :value="e"
            filter
          >
            {{ t(`monitoreo.alertas.estado${e.charAt(0).toUpperCase()}${e.slice(1)}`) }}
            <template v-if="a.resumen.value && e !== 'todas' && e !== 'cerrada'">
              &nbsp;· <span class="as-num">{{ e === 'activas' ? a.resumen.value.activas : a.resumen.value.por_estado[e] }}</span>
            </template>
          </VChip>
        </VChipGroup>
      </template>
      <VSelect
        :model-value="a.filtros.regla"
        :items="opcionesRegla"
        :label="t('monitoreo.alertas.regla')"
        clearable
        class="as-filtro--md"
        @update:model-value="(v: string | null) => a.aplicar({ regla: v })"
      />
      <VSelect
        :model-value="a.filtros.tipo"
        :items="opcionesTipo"
        :label="t('monitoreo.alertas.tipo')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: SujetoAlerta | null) => a.aplicar({ tipo: v })"
      />
      <VSelect
        v-if="alcance.gerencias.length !== 1"
        :model-value="a.filtros.gerencia"
        :items="opcionesGerencia"
        :label="t('monitoreo.alertas.gerencia')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: number | null) => a.aplicar({ gerencia: v })"
      />
      <template #fin>
        <VTextField
          v-model="a.filtros.q"
          clearable
          prepend-inner-icon="tabler-search"
          :placeholder="t('monitoreo.alertas.buscar')"
          :aria-label="t('monitoreo.alertas.buscar')"
          class="as-filtro--md"
        />
      </template>
    </AsBarraFiltros>

    <AsTablaDatos
      :columnas="columnas"
      :filas="a.filas.value"
      clave-fila="id"
      densidad="estandar"
      :cargando="a.cargando.value"
      :paginacion="paginacion"
      :clase-fila="claseFila"
      clic-fila
      :vacio-titulo="t('monitoreo.alertas.sinAlertas')"
      vacio-icono="tabler-bell-check"
      class="alertas__tabla"
      @update:pagina="(p: number) => a.aplicar({ pagina: p })"
      @fila="(f: Record<string, unknown>) => abrirDetalle(f as Alerta)"
    >
      <template #celda-titulo="{ fila }">
        <div class="d-flex align-start gap-2 py-1">
          <VChip
            size="x-small"
            label
            :color="TOKEN_SEVERIDAD[fila.severidad]"
            variant="flat"
            class="mt-1 flex-shrink-0 as-num"
          >
            {{ fila.regla }}
          </VChip>
          <div>
            <div class="font-weight-medium">
              {{ fila.titulo }}
            </div>
            <div class="as-secundario">
              {{ fila.regla_titulo }}<span v-if="fila.veces > 1"> · {{ t('monitoreo.alertas.veces', { n: fila.veces }) }}</span>
            </div>
          </div>
        </div>
      </template>
      <template #celda-sujeto_tipo="{ fila }">
        {{ t(`monitoreo.alertas.sujeto.${fila.sujeto_tipo}`) }}
      </template>
      <template #celda-gerencia_id="{ fila }">
        {{ nombreGerencia(fila.gerencia_id) }}
      </template>
      <template #celda-abierta="{ fila }">
        <div :title="fila.abierta">
          {{ t('monitoreo.alertas.abiertaHace', { hace: haceCuanto(fila.abierta, relativo) }) }}
        </div>
        <div
          class="as-secundario"
          :title="fila.ultima_vez"
        >
          {{ t('monitoreo.alertas.vistaHace', { hace: haceCuanto(fila.ultima_vez, relativo) }) }}
        </div>
      </template>
      <template #celda-estado="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="COLOR_ESTADO_ALERTA[fila.estado]"
        >
          {{ t(`monitoreo.alertas.estado.${fila.estado}`) }}
        </VChip>
        <div
          v-if="fila.estado === 'atendida' && fila.atendida_por"
          class="as-secundario mt-1"
        >
          {{ t('monitoreo.alertas.atendidaPor', { quien: fila.atendida_por, hace: haceCuanto(fila.atendida_en, relativo) }) }}
        </div>
        <div
          v-else-if="fila.estado === 'silenciada' && fila.silenciada_hasta"
          class="as-secundario mt-1"
        >
          {{ t('monitoreo.alertas.silenciadaHasta', { hasta: `${fechaCorta(fila.silenciada_hasta)} ${horaCorta(fila.silenciada_hasta)}`, quien: fila.silenciada_por ?? '—' }) }}
        </div>
        <div
          v-else-if="fila.estado === 'cerrada' && fila.motivo_cierre"
          class="as-secundario mt-1"
        >
          {{ t(`monitoreo.alertas.cerradaMotivo.${fila.motivo_cierre}`) }}
        </div>
      </template>
      <template #celda-acciones="{ fila }">
        <div
          class="d-flex align-center justify-end gap-1 text-no-wrap"
          @click.stop
        >
          <VBtn
            icon="tabler-map-pin"
            size="small"
            variant="text"
            :title="t('monitoreo.alertas.verMonitor')"
            :aria-label="t('monitoreo.alertas.verMonitor')"
            :disabled="!destinoSujeto(fila)"
            @click="irAlMonitor(fila)"
          />
          <template v-if="a.puedeOperar.value">
            <VBtn
              v-if="fila.estado === 'abierta' || fila.estado === 'silenciada'"
              size="small"
              variant="tonal"
              color="primary"
              :loading="a.accionando.value === fila.id"
              @click="accionar(fila, 'atender')"
            >
              {{ fila.es_evento ? t('monitoreo.alertas.atenderEvento') : t('monitoreo.alertas.atender') }}
            </VBtn>
            <VMenu
              v-if="fila.estado !== 'cerrada' && fila.estado !== 'silenciada'"
              location="bottom end"
            >
              <template #activator="{ props: activador }">
                <VBtn
                  v-bind="activador"
                  size="small"
                  variant="text"
                  :disabled="a.accionando.value === fila.id"
                >
                  {{ t('monitoreo.alertas.silenciar') }}
                </VBtn>
              </template>
              <VList density="compact">
                <VListItem
                  v-for="h in HORAS"
                  :key="h"
                  :title="t('monitoreo.alertas.silenciarHoras', { n: h })"
                  @click="accionar(fila, 'silenciar', h)"
                />
              </VList>
            </VMenu>
            <VBtn
              v-if="fila.estado === 'cerrada' || fila.estado === 'silenciada'"
              size="small"
              variant="text"
              :loading="a.accionando.value === fila.id"
              @click="accionar(fila, 'reabrir')"
            >
              {{ t('monitoreo.alertas.reabrir') }}
            </VBtn>
          </template>
        </div>
      </template>
    </AsTablaDatos>

    <!-- Detalle e historial -->
    <AsDialogo
      :abierto="!!seleccionada"
      :titulo="seleccionada?.titulo ?? ''"
      :subtitulo="seleccionada ? `${seleccionada.regla_titulo} · ${t(`monitoreo.alertas.estado.${seleccionada.estado}`)}` : undefined"
      tamano="md"
      @update:abierto="(v: boolean) => { if (!v) seleccionada = null }"
    >
      <template
        v-if="seleccionada"
        #encabezado-prefijo
      >
        <VChip
          size="small"
          label
          variant="flat"
          :color="TOKEN_SEVERIDAD[seleccionada.severidad]"
          class="mt-1 as-num"
        >
          {{ seleccionada.regla }}
        </VChip>
      </template>

      <template v-if="seleccionada">
        <h3 class="as-seccion">
          {{ t('monitoreo.alertas.detalle') }}
        </h3>
        <dl class="as-datos mb-0">
          <div
            v-for="e in entradasDetalle"
            :key="e.clave"
            class="as-dato"
          >
            <dt class="as-etiqueta text-capitalize">
              {{ e.clave }}
            </dt>
            <dd class="as-valor mb-0">
              {{ e.valor }}
            </dd>
          </div>
        </dl>

        <h3 class="as-seccion">
          {{ t('monitoreo.alertas.historial') }}
        </h3>
        <AsEstado
          v-if="a.cargandoEventos.value"
          tipo="cargando"
          esqueleto="lista"
          :filas="3"
        />
        <VTimeline
          v-else
          density="compact"
          side="end"
          align="start"
          truncate-line="both"
        >
          <VTimelineItem
            v-for="(ev, i) in a.eventos.value"
            :key="i"
            size="x-small"
            dot-color="primary"
          >
            <div class="text-body-2">
              {{ t(`monitoreo.alertas.accion.${ev.accion}`) }}
              <span v-if="ev.hasta"> · {{ t('monitoreo.alertas.hasta', { hasta: `${fechaCorta(ev.hasta)} ${horaCorta(ev.hasta)}` }) }}</span>
              <span v-if="ev.nota"> · {{ ev.nota }}</span>
            </div>
            <div class="as-secundario as-num">
              {{ fechaCorta(ev.fecha) }} {{ horaCorta(ev.fecha) }} · {{ ev.usuario ?? t('monitoreo.alertas.motor') }}
            </div>
          </VTimelineItem>
        </VTimeline>
        <VTextField
          v-if="a.puedeOperar.value && seleccionada.estado !== 'cerrada'"
          v-model="nota"
          density="compact"
          variant="outlined"
          hide-details
          maxlength="500"
          :label="t('monitoreo.alertas.nota')"
          class="mt-4"
        />
      </template>

      <template #acciones-inicio>
        <VBtn
          variant="text"
          prepend-icon="tabler-map-pin"
          :disabled="!seleccionada || !destinoSujeto(seleccionada)"
          @click="seleccionada && irAlMonitor(seleccionada)"
        >
          {{ t('monitoreo.alertas.verMonitor') }}
        </VBtn>
      </template>
      <template #acciones>
        <template v-if="seleccionada && a.puedeOperar.value">
          <VBtn
            v-if="seleccionada.estado !== 'cerrada'"
            variant="text"
            :loading="a.accionando.value === seleccionada.id"
            @click="accionar(seleccionada, 'cerrar')"
          >
            {{ t('monitoreo.alertas.cerrar') }}
          </VBtn>
          <VBtn
            v-if="seleccionada.estado === 'cerrada' || seleccionada.estado === 'silenciada'"
            variant="text"
            :loading="a.accionando.value === seleccionada.id"
            @click="accionar(seleccionada, 'reabrir')"
          >
            {{ t('monitoreo.alertas.reabrir') }}
          </VBtn>
          <VBtn
            v-if="seleccionada.estado === 'abierta' || seleccionada.estado === 'silenciada'"
            color="primary"
            variant="flat"
            :loading="a.accionando.value === seleccionada.id"
            @click="accionar(seleccionada, 'atender')"
          >
            {{ seleccionada.es_evento ? t('monitoreo.alertas.atenderEvento') : t('monitoreo.alertas.atender') }}
          </VBtn>
        </template>
        <VBtn
          v-else
          variant="flat"
          color="primary"
          @click="seleccionada = null"
        >
          {{ t('as.dialogo.cerrar') }}
        </VBtn>
      </template>
    </AsDialogo>
  </div>
</template>

<style scoped>
.alertas__tabla :deep(.alertas__fila--alta td:first-child) {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-alerta-alta));
}

.alertas__tabla :deep(.alertas__fila--media td:first-child) {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-alerta-media));
}

.alertas__tabla :deep(td) {
  vertical-align: top;
}
</style>
