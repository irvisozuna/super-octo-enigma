<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import EstadoError from '../components/comunes/EstadoError.vue'
import EstadoVacio from '../components/comunes/EstadoVacio.vue'
import IndicadorActualizado from '../components/comunes/IndicadorActualizado.vue'
import FiltroChips from '../components/filtros/FiltroChips.vue'
import FiltroPanel from '../components/filtros/FiltroPanel.vue'
import TablaReporte from '../components/tabla/TablaReporte.vue'
import { useFiltros } from '../composables/useFiltros'
import { useReporte } from '../composables/useReporte'
import type { FiltroDef } from '../types/reporte'

const props = defineProps<{
  clave: string
}>()

const { t } = useI18n()
const { smAndDown } = useDisplay()

const reporte = useReporte(toRef(props, 'clave'))
const filtros = useFiltros(computed(() => reporte.config.value?.filtros ?? []))
const drawer = ref(false)

const columnasVisibles = computed(() => reporte.config.value?.columnas.filter(c => c.visible) ?? [])
const primerFaltante = computed(() => filtros.faltantes.value[0]?.etiqueta ?? '')

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

onMounted(iniciar)
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

      <div class="d-flex align-center gap-2">
        <IndicadorActualizado
          :fecha="reporte.actualizadoEn.value"
          :desde-cache="reporte.desdeCache.value"
          :duracion-ms="reporte.duracionMs.value"
          :cargando="reporte.cargando.value"
          @actualizar="reporte.actualizar"
        />
        <VBtn
          v-if="smAndDown && reporte.config.value"
          variant="tonal"
          prepend-icon="tabler-adjustments"
          @click="drawer = true"
        >
          {{ t('reportes.visor.mostrarFiltros') }}
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
      <VCol
        v-if="!smAndDown"
        cols="12"
        md="4"
        lg="3"
      >
        <FiltroPanel
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
      </VCol>

      <VCol
        cols="12"
        :md="smAndDown ? 12 : 8"
        :lg="smAndDown ? 12 : 9"
      >
        <FiltroChips
          v-if="reporte.consultado.value && reporte.filtrosAplicados.value"
          class="mb-4"
          :definiciones="filtros.defs.value"
          :valores="reporte.filtrosAplicados.value"
          :etiqueta="filtros.etiqueta"
          @quitar="quitarFiltro"
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
          />
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

    <VNavigationDrawer
      v-if="smAndDown"
      v-model="drawer"
      temporary
      location="end"
      width="340"
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
