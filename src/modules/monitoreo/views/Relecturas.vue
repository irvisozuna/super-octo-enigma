<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRelecturas } from '../composables/useRelecturas'
import { obtenerCatalogos } from '../services/monitoreoApi'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { RespuestaCatalogos } from '../types/monitor'
import type { EstadoRelectura, Relectura } from '../types/relecturas'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'
import { COLOR_RELECTURA } from '@/utils/estados'
import { fechaHoraCorta, haceCuanto } from '@/utils/formato'

/*
 * Re-lecturas (F2.5): órdenes pedidas desde el detalle de la lectura, por periodo y gerencia. Pendientes agrupadas por
 * lecturista y sector en orden de secuencia (igual que la lista imprimible); re-leídas y canceladas en lista.
 * Sobre los componentes del sistema de diseño: encabezado, barra de filtros, tabla de datos y confirmación.
 */
const { t } = useI18n()
const router = useRouter()
const alcance = useAlcanceStore()
const dialogo = useDialogo()
const notificar = useNotificacion()
const r = useRelecturas()
const catalogos = ref<RespuestaCatalogos | null>(null)
const vista = ref<'grupos' | 'lista'>('grupos')

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const ESTADOS: (EstadoRelectura | 'todas')[] = ['solicitada', 'releida', 'cancelada', 'todas']
const periodos = computed(() => (catalogos.value?.periodos ?? []).map(p => ({ value: p.id, title: p.abierto ? `${p.nombre} (abierto)` : p.nombre })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))
const etiquetaEstado = (e: EstadoRelectura | 'todas') => t(`monitoreo.relecturas.estado${e.charAt(0).toUpperCase()}${e.slice(1)}`)
const mostrarGrupos = computed(() => r.filtros.estado === 'solicitada' && vista.value === 'grupos')
const filtrosActivos = computed(() => (r.filtros.gerencia !== null ? 1 : 0) + (r.filtros.estado !== 'solicitada' ? 1 : 0))

const columnaSecuencia: ColumnaTabla<Relectura> = { clave: 'secuencia', titulo: t('monitoreo.relecturas.secuencia'), formato: 'entero', ancho: 72, descripcion: t('monitoreo.relecturas.secuenciaCompleta') }
const columnaCuenta: ColumnaTabla<Relectura> = { clave: 'cuenta', titulo: t('monitoreo.relecturas.cuenta'), formato: 'personalizado', ancho: 110 }
const columnaToma: ColumnaTabla<Relectura> = { clave: 'nombre', titulo: t('monitoreo.relecturas.toma'), formato: 'personalizado', ordenable: false, anchoMin: 260 }
const columnaMotivo: ColumnaTabla<Relectura> = { clave: 'motivo_etiqueta', titulo: t('monitoreo.relecturas.motivo'), formato: 'personalizado', ancho: 180 }
const columnaPedida: ColumnaTabla<Relectura> = { clave: 'pedida_en', titulo: t('monitoreo.relecturas.pedida'), formato: 'personalizado', ancho: 200 }
const columnaAcciones: ColumnaTabla<Relectura> = { clave: 'acciones', titulo: t('monitoreo.relecturas.acciones'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 230 }

const columnasGrupo: ColumnaTabla<Relectura>[] = [columnaSecuencia, columnaCuenta, columnaToma, columnaMotivo, columnaPedida, columnaAcciones]

const columnasLista: ColumnaTabla<Relectura>[] = [
  columnaSecuencia,
  columnaCuenta,
  columnaToma,
  { clave: 'sector', titulo: t('monitoreo.relecturas.sector'), formato: 'personalizado', ancho: 190 },
  columnaMotivo,
  columnaPedida,
  { clave: 'estado', titulo: t('monitoreo.relecturas.estado'), formato: 'personalizado', ancho: 230 },
  columnaAcciones,
]

function verLectura(f: Relectura) {
  router.push({ name: 'monitoreoInicio', query: { sector: f.sector_id ? String(f.sector_id) : undefined, periodo: String(f.periodo_id), vista: 'periodo', contrato: String(f.contrato_id) } })
}

async function cancelar(f: Relectura) {
  const ok = await dialogo.confirmar({
    titulo: t('monitoreo.relecturas.cancelarTitulo'),
    mensaje: t('monitoreo.relecturas.cancelarDetalle', { cuenta: f.cuenta ?? f.contrato_id }),
    color: 'error',
    icono: 'tabler-clipboard-x',
    textoConfirmar: t('monitoreo.relecturas.cancelarConfirmar'),
    textoCancelar: t('monitoreo.relecturas.cancelarVolver'),
  })

  if (ok && await r.cancelar(f.id))
    notificar.exito(t('monitoreo.relecturas.cancelado'))
}

function limpiarFiltros() {
  r.aplicar({ estado: 'solicitada', gerencia: null })
}

onMounted(async () => {
  await Promise.all([alcance.cargado ? Promise.resolve() : alcance.cargar(), obtenerCatalogos().then(c => {
    catalogos.value = c
  }).catch(() => null)])
  await r.cargar()
})
onBeforeUnmount(() => r.detener())
</script>

<template>
  <div class="relecturas">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.relecturas.titulo')"
      :descripcion="t('monitoreo.relecturas.descripcion')"
    >
      <template #acciones>
        <AsBtnSecundario
          prepend-icon="tabler-printer"
          :loading="r.exportando.value"
          :disabled="!r.conteos.value.solicitada"
          @click="r.exportarPdf()"
        >
          {{ t('monitoreo.relecturas.imprimir') }}
        </AsBtnSecundario>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="r.error.value && !r.datos.value"
      tipo="error"
      class="mb-4"
      :error="r.error.value"
      @reintentar="r.cargar()"
    />
    <VAlert
      v-if="r.datos.value && !r.puedeOperar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('monitoreo.relecturas.soloLectura') }}
    </VAlert>
    <VAlert
      v-if="r.errorAccion.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="r.errorAccion.value = null"
    >
      {{ r.errorAccion.value.mensaje }}
    </VAlert>

    <AsBarraFiltros
      class="mb-3"
      :activos="filtrosActivos"
      @limpiar="limpiarFiltros"
    >
      <template #inicio>
        <VChipGroup
          :model-value="r.filtros.estado"
          mandatory
          @update:model-value="(v: EstadoRelectura | 'todas') => r.aplicar({ estado: v })"
        >
          <VChip
            v-for="e in ESTADOS"
            :key="e"
            :value="e"
            filter
          >
            {{ etiquetaEstado(e) }}
            <template v-if="e !== 'todas'">
              &nbsp;· <span class="as-num">{{ r.conteos.value[e] }}</span>
            </template>
          </VChip>
        </VChipGroup>
      </template>
      <VSelect
        :model-value="r.filtros.periodo"
        :items="periodos"
        :label="t('monitoreo.relecturas.periodo')"
        class="as-filtro--md"
        @update:model-value="(v: number | null) => r.aplicar({ periodo: v })"
      />
      <VSelect
        v-if="alcance.gerencias.length !== 1"
        :model-value="r.filtros.gerencia"
        :items="opcionesGerencia"
        :label="t('monitoreo.relecturas.gerencia')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: number | null) => r.aplicar({ gerencia: v })"
      />
      <template
        v-if="r.filtros.estado === 'solicitada'"
        #fin
      >
        <VChipGroup
          v-model="vista"
          mandatory
          :aria-label="t('monitoreo.relecturas.vistaLista')"
        >
          <VChip
            value="grupos"
            filter
          >
            {{ t('monitoreo.relecturas.vistaGrupos') }}
          </VChip>
          <VChip
            value="lista"
            filter
          >
            {{ t('monitoreo.relecturas.vistaLista') }}
          </VChip>
        </VChipGroup>
      </template>
    </AsBarraFiltros>

    <!-- Pendientes por lecturista y sector: una tabla densa por grupo, en el orden de la lista imprimible -->
    <VCard
      v-if="mostrarGrupos"
      variant="flat"
      class="as-tarjeta relecturas__grupos"
    >
      <AsEstado
        v-if="r.cargando.value && !r.grupos.value.length"
        tipo="cargando"
        :filas="5"
      />
      <AsEstado
        v-else-if="!r.grupos.value.length"
        tipo="vacio"
        :titulo="t('monitoreo.relecturas.sinFilas')"
        detalle=""
        icono="tabler-clipboard-check"
      />
      <template v-else>
        <section
          v-for="g in r.grupos.value"
          :key="g.clave"
          class="relecturas__grupo"
        >
          <h2 class="as-seccion relecturas__grupo-titulo">
            {{ t('monitoreo.relecturas.grupo', { lecturista: g.lecturista, sector: g.sector, n: g.filas.length }) }}
          </h2>
          <AsTablaDatos
            sin-tarjeta
            ocultar-pie
            densidad="densa"
            :columnas="columnasGrupo"
            :filas="g.filas"
            clave-fila="id"
            :por-pagina="-1"
          >
            <template #celda-cuenta="{ fila }">
              <span class="as-num">{{ fila.cuenta ?? fila.contrato_id }}</span>
            </template>
            <template #celda-nombre="{ fila }">
              <div>{{ fila.nombre ?? '—' }}</div>
              <div class="as-secundario">
                {{ fila.direccion ?? '' }}
              </div>
            </template>
            <template #celda-motivo_etiqueta="{ fila }">
              {{ fila.motivo_etiqueta }}
              <div
                v-if="fila.nota"
                class="as-secundario"
              >
                {{ fila.nota }}
              </div>
            </template>
            <template #celda-pedida_en="{ fila }">
              <span :title="fechaHoraCorta(fila.pedida_en)">{{ t('monitoreo.relecturas.pedidaPor', { quien: fila.pedida_por ?? '—', hace: haceCuanto(fila.pedida_en, relativo) }) }}</span>
            </template>
            <template #celda-acciones="{ fila }">
              <div class="d-flex align-center justify-end gap-1 text-no-wrap">
                <VBtn
                  size="small"
                  variant="text"
                  @click="verLectura(fila)"
                >
                  {{ t('monitoreo.relecturas.verLectura') }}
                </VBtn>
                <VBtn
                  v-if="r.puedeOperar.value"
                  size="small"
                  variant="text"
                  color="error"
                  :loading="r.accionando.value === fila.id"
                  @click="cancelar(fila)"
                >
                  {{ t('monitoreo.relecturas.cancelar') }}
                </VBtn>
              </div>
            </template>
          </AsTablaDatos>
        </section>
      </template>
    </VCard>

    <!-- Lista -->
    <AsTablaDatos
      v-else
      :columnas="columnasLista"
      :filas="r.filas.value"
      clave-fila="id"
      densidad="estandar"
      :cargando="r.cargando.value"
      :por-pagina="50"
      :vacio-titulo="t('monitoreo.relecturas.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-clipboard-check"
      class="relecturas__tabla"
    >
      <template #celda-cuenta="{ fila }">
        <span class="as-num">{{ fila.cuenta ?? fila.contrato_id }}</span>
      </template>
      <template #celda-nombre="{ fila }">
        <div>{{ fila.nombre ?? '—' }}</div>
        <div class="as-secundario">
          {{ fila.direccion ?? '' }}
        </div>
      </template>
      <template #celda-sector="{ fila }">
        <div>{{ fila.sector ?? '—' }}</div>
        <div class="as-secundario">
          {{ fila.lecturista ?? '' }}
        </div>
      </template>
      <template #celda-motivo_etiqueta="{ fila }">
        {{ fila.motivo_etiqueta }}
        <div
          v-if="fila.nota"
          class="as-secundario"
        >
          {{ fila.nota }}
        </div>
      </template>
      <template #celda-pedida_en="{ fila }">
        <div>{{ fila.pedida_por ?? '—' }}</div>
        <div class="as-secundario as-num">
          {{ fechaHoraCorta(fila.pedida_en) }}
        </div>
      </template>
      <template #celda-estado="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="COLOR_RELECTURA[fila.estado as EstadoRelectura]"
        >
          {{ etiquetaEstado(fila.estado) }}
        </VChip>
        <div
          v-if="fila.estado === 'releida' && fila.resultado"
          class="as-secundario mt-1"
        >
          {{ t('monitoreo.relecturas.releidaCon', { actual: fila.resultado.actual ?? '—', consumo: fila.resultado.consumo ?? '—', hace: haceCuanto(fila.resuelta_en, relativo) }) }}
        </div>
        <div
          v-else-if="fila.estado === 'cancelada' && fila.cancelacion?.nota"
          class="as-secundario mt-1"
        >
          {{ fila.cancelacion.nota }}
        </div>
      </template>
      <template #celda-acciones="{ fila }">
        <div class="d-flex align-center justify-end gap-1 text-no-wrap">
          <VBtn
            size="small"
            variant="text"
            @click="verLectura(fila)"
          >
            {{ t('monitoreo.relecturas.verLectura') }}
          </VBtn>
          <VBtn
            v-if="r.puedeOperar.value && fila.estado === 'solicitada'"
            size="small"
            variant="text"
            color="error"
            :loading="r.accionando.value === fila.id"
            @click="cancelar(fila)"
          >
            {{ t('monitoreo.relecturas.cancelar') }}
          </VBtn>
        </div>
      </template>
    </AsTablaDatos>
  </div>
</template>

<style scoped>
.relecturas__grupo + .relecturas__grupo {
  border-block-start: var(--as-borde);
}

.relecturas__grupo-titulo {
  margin-block: var(--as-sp-3) var(--as-sp-2);
  padding-inline: var(--as-sp-4);
}

.relecturas__tabla :deep(td) {
  vertical-align: top;
}
</style>
