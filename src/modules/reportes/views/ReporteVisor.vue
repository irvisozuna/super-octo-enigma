<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EstadoError from '../components/comunes/EstadoError.vue'
import EstadoVacio from '../components/comunes/EstadoVacio.vue'
import IndicadorActualizado from '../components/comunes/IndicadorActualizado.vue'
import ExportarDialogo from '../components/exportar/ExportarDialogo.vue'
import TareasExportacion from '../components/exportar/TareasExportacion.vue'
import FiltroChips from '../components/filtros/FiltroChips.vue'
import FiltroPanel from '../components/filtros/FiltroPanel.vue'
import TablaReporte from '../components/tabla/TablaReporte.vue'
import ExplicacionColumnaDialogo from '../components/tabla/ExplicacionColumnaDialogo.vue'
import { useFiltros } from '../composables/useFiltros'
import { useReporte } from '../composables/useReporte'
import { normalizarError } from '../services/errores'
import { useExportacionesStore } from '../stores/exportacionesStore'
import type { AlcanceExportacion, FormatoExportacion } from '../types/exportacion'
import type { FiltroDef } from '../types/reporte'

const props = defineProps<{
  clave: string
}>()

const { t } = useI18n()

const reporte = useReporte(toRef(props, 'clave'))
const filtros = useFiltros(computed(() => reporte.config.value?.filtros ?? []))
const exportaciones = useExportacionesStore()
const drawer = ref(false)
const dialogoExportar = ref(false)
const dialogoAyuda = ref(false)
const enviandoExportacion = ref(false)
const aviso = ref<string | null>(null)

const columnasVisibles = computed(() => reporte.config.value?.columnas.filter(c => c.visible) ?? [])
const hayAyuda = computed(() => columnasVisibles.value.some(c => c.ayuda))
const tieneFiltros = computed(() => filtros.defs.value.some(d => !d.oculto))
const primerFaltante = computed(() => filtros.faltantes.value[0]?.etiqueta ?? '')

const puedeExportar = computed(() => {
  const config = reporte.config.value

  return !!config && config.permisos.puede_exportar && config.formatos.length > 0 && reporte.consultado.value && reporte.totalFilas.value > 0
})

async function exportar({ formato, alcance }: { formato: FormatoExportacion; alcance: AlcanceExportacion }) {
  const config = reporte.config.value
  if (!config)
    return
  enviandoExportacion.value = true
  try {
    await exportaciones.iniciar(props.clave, config.titulo, {
      formato,
      alcance,
      filtros: reporte.filtrosAplicados.value ?? {},
      orden: reporte.orden.value,
      pagina: reporte.pagina.value,
      por_pagina: reporte.porPagina.value,
      consulta_id: reporte.consultaId.value,
    })
    dialogoExportar.value = false
    aviso.value = t('reportes.exportar.encolada')
  }
  catch (e) {
    aviso.value = t(`reportes.errores.${normalizarError(e).codigo}`)
  }
  finally {
    enviandoExportacion.value = false
  }
}

async function consultar() {
  if (!filtros.validar())
    return
  drawer.value = false
  await reporte.consultar(filtros.aPayload())
}

function limpiar() {
  filtros.limpiar()
  filtros.cargarTodasLasOpciones()
}

function quitarFiltro(key: string) {
  const def = filtros.defs.value.find(d => d.key === key)
  if (!def)
    return
  filtros.establecer(key, def.tipo === 'multiselect' ? [] : null)
  consultar()
}

function buscar(def: FiltroDef, texto: string) {
  filtros.cargarOpciones(def, texto)
}

async function iniciar() {
  await reporte.cargarConfig()
  if (!reporte.config.value)
    return
  filtros.aplicarDefaults()
  filtros.cargarTodasLasOpciones()
  if (filtros.completo.value)
    await reporte.consultar(filtros.aPayload())
}

onMounted(() => {
  exportaciones.asegurar()
  iniciar()
})
watch(() => props.clave, iniciar)
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <RouterLink
          :to="{ name: 'reportesIndice' }"
          class="text-body-2 d-inline-flex align-center gap-1 mb-1"
        >
          <VIcon
            icon="tabler-arrow-left"
            size="16"
          />
          {{ t('reportes.visor.volver') }}
        </RouterLink>
        <h4 class="text-h4 mb-1">
          {{ reporte.config.value?.titulo ?? '' }}
        </h4>
        <p
          v-if="reporte.config.value?.descripcion"
          class="text-body-1 text-medium-emphasis mb-0"
        >
          {{ reporte.config.value.descripcion }}
        </p>
      </div>

      <div class="d-flex flex-wrap align-center gap-2">
        <IndicadorActualizado
          :fecha="reporte.actualizadoEn.value"
          :desde-cache="reporte.desdeCache.value"
          :duracion-ms="reporte.duracionMs.value"
          :cargando="reporte.cargando.value"
          @actualizar="reporte.actualizar"
        />
        <VBtn
          v-if="hayAyuda"
          variant="text"
          prepend-icon="tabler-help-circle"
          @click="dialogoAyuda = true"
        >
          {{ t('reportes.ayuda.boton') }}
        </VBtn>
        <VBtn
          v-if="tieneFiltros && reporte.config.value"
          variant="tonal"
          prepend-icon="tabler-adjustments"
          @click="drawer = true"
        >
          {{ t('reportes.visor.mostrarFiltros') }}
        </VBtn>
        <VBtn
          v-if="puedeExportar"
          color="primary"
          prepend-icon="tabler-download"
          @click="dialogoExportar = true"
        >
          {{ t('reportes.visor.exportar') }}
        </VBtn>
      </div>
    </div>

    <VProgressLinear
      v-if="reporte.cargandoConfig.value"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-else-if="reporte.errorConfig.value"
      :error="reporte.errorConfig.value"
      @reintentar="iniciar"
    />

    <VRow v-else-if="reporte.config.value">
      <VCol cols="12">
        <FiltroChips
          v-if="reporte.consultado.value && reporte.filtrosAplicados.value"
          class="mb-4"
          :definiciones="filtros.defs.value"
          :valores="reporte.filtrosAplicados.value"
          :etiqueta="filtros.etiqueta"
          :mostrar-acceso="tieneFiltros"
          @quitar="quitarFiltro"
          @abrir="drawer = true"
        />

        <VAlert
          v-if="reporte.enSegundoPlano.value"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          {{ t('reportes.visor.enSegundoPlano') }}
        </VAlert>

        <EstadoError
          v-if="reporte.error.value"
          class="mb-4"
          :error="reporte.error.value"
          :mostrar-detalle="$can('manage', 'reportes-admin')"
          @reintentar="consultar"
        />

        <VCard v-if="!reporte.consultado.value && !reporte.error.value">
          <EstadoVacio
            icono="tabler-filter"
            :titulo="t('reportes.visor.seleccionaParaConsultar', { filtro: primerFaltante })"
          >
            <VBtn
              color="primary"
              prepend-icon="tabler-adjustments"
              @click="drawer = true"
            >
              {{ t('reportes.visor.abrirFiltros') }}
            </VBtn>
          </EstadoVacio>
        </VCard>

        <VCard v-else-if="reporte.consultado.value">
          <EstadoVacio
            v-if="!reporte.cargando.value && reporte.totalFilas.value === 0 && !reporte.error.value"
            icono="tabler-database-off"
            :titulo="t('reportes.visor.sinDatos')"
            :detalle="t('reportes.visor.sinDatosDetalle')"
          />
          <TablaReporte
            v-else
            :columnas="columnasVisibles"
            :filas="reporte.filas.value"
            :total-filas="reporte.totalFilas.value"
            :totales="reporte.totales.value"
            :pagina="reporte.pagina.value"
            :por-pagina="reporte.porPagina.value"
            :orden="reporte.orden.value"
            :cargando="reporte.cargando.value"
            :por-pagina-max="reporte.config.value.por_pagina_max"
            @update:pagina="reporte.irAPagina"
            @update:por-pagina="reporte.cambiarPorPagina"
            @update:orden="reporte.ordenar"
          />
        </VCard>
      </VCol>
    </VRow>

    <ExplicacionColumnaDialogo
      v-model:abierto="dialogoAyuda"
      :columnas="columnasVisibles"
      :todas="columnasVisibles"
      :totales="reporte.totales.value"
    />

    <ExportarDialogo
      v-if="reporte.config.value"
      v-model="dialogoExportar"
      :formatos="reporte.config.value.formatos"
      :limites="reporte.config.value.limites_exportacion ?? {}"
      :total-filas="reporte.totalFilas.value"
      :por-pagina="reporte.porPagina.value"
      :enviando="enviandoExportacion"
      @exportar="exportar"
    />

    <TareasExportacion />

    <VSnackbar
      :model-value="aviso !== null"
      timeout="6000"
      @update:model-value="aviso = null"
    >
      {{ aviso }}
    </VSnackbar>

    <VNavigationDrawer
      v-model="drawer"
      temporary
      location="end"
      width="360"
    >
      <FiltroPanel
        v-if="reporte.config.value"
        :definiciones="filtros.defs.value"
        :valores="filtros.valores.value"
        :opciones="filtros.opciones.value"
        :cargando-opciones="filtros.cargandoOpciones.value"
        :errores="filtros.errores.value"
        :cargando="reporte.cargando.value"
        :completo="filtros.completo.value"
        @cambiar="filtros.establecer"
        @buscar="buscar"
        @consultar="consultar"
        @limpiar="limpiar"
      />
    </VNavigationDrawer>
  </div>
</template>
