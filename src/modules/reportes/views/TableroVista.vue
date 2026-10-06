<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EstadoError from '../components/comunes/EstadoError.vue'
import IndicadorActualizado from '../components/comunes/IndicadorActualizado.vue'
import FiltroChips from '../components/filtros/FiltroChips.vue'
import FiltroPanel from '../components/filtros/FiltroPanel.vue'
import WidgetGrafica from '../components/tablero/WidgetGrafica.vue'
import WidgetIndicador from '../components/tablero/WidgetIndicador.vue'
import WidgetMarco from '../components/tablero/WidgetMarco.vue'
import WidgetTabla from '../components/tablero/WidgetTabla.vue'
import { useFiltros } from '../composables/useFiltros'
import { useTablero } from '../composables/useTablero'
import type { FiltroDef } from '../types/reporte'
import type { WidgetDef } from '../types/tablero'

const props = defineProps<{
  clave: string
}>()

const { t } = useI18n()

const tablero = useTablero(toRef(props, 'clave'))
const filtros = useFiltros(computed(() => tablero.config.value?.filtros ?? []))
const drawer = ref(false)

const tieneFiltros = computed(() => filtros.defs.value.some(d => !d.oculto))

function colsDe(widget: WidgetDef) {
  return { cols: 12, sm: widget.ancho <= 6 ? 6 : 12, lg: widget.ancho }
}

async function consultar() {
  if (!filtros.validar())
    return
  drawer.value = false
  await tablero.consultar(filtros.aPayload())
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
  await tablero.cargarConfig()
  if (!tablero.config.value)
    return
  filtros.aplicarDefaults()
  filtros.cargarTodasLasOpciones()
  if (filtros.completo.value)
    await tablero.consultar(filtros.aPayload())
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
          {{ tablero.config.value?.titulo ?? '' }}
        </h4>
        <p
          v-if="tablero.config.value?.descripcion"
          class="text-body-1 text-medium-emphasis mb-0"
        >
          {{ tablero.config.value.descripcion }}
        </p>
      </div>

      <div class="d-flex align-center gap-2">
        <IndicadorActualizado
          :fecha="tablero.actualizadoEn.value"
          :desde-cache="tablero.desdeCache.value"
          :duracion-ms="tablero.duracionMs.value"
          :cargando="tablero.cargando.value"
          @actualizar="tablero.actualizar"
        />
        <VBtn
          v-if="tieneFiltros && tablero.config.value"
          variant="tonal"
          prepend-icon="tabler-adjustments"
          @click="drawer = true"
        >
          {{ t('reportes.visor.filtros') }}
        </VBtn>
      </div>
    </div>

    <VProgressLinear
      v-if="tablero.cargandoConfig.value"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-else-if="tablero.errorConfig.value"
      :error="tablero.errorConfig.value"
      @reintentar="iniciar"
    />

    <template v-else-if="tablero.config.value">
      <FiltroChips
        v-if="tablero.consultado.value && tablero.filtrosAplicados.value"
        class="mb-4"
        :definiciones="filtros.defs.value"
        :valores="tablero.filtrosAplicados.value"
        :etiqueta="filtros.etiqueta"
        @quitar="quitarFiltro"
      />

      <VCard v-if="!tablero.consultado.value">
        <VCardText class="text-center text-medium-emphasis py-10">
          {{ t('reportes.visor.seleccionaParaConsultar', { filtro: filtros.faltantes.value[0]?.etiqueta ?? '' }) }}
        </VCardText>
      </VCard>

      <VRow v-else>
        <VCol
          v-for="widget in tablero.config.value.widgets"
          :key="widget.id"
          v-bind="colsDe(widget)"
        >
          <WidgetMarco
            :widget="widget"
            :cargando="tablero.estadoDe(widget).cargando"
            :error="tablero.estadoDe(widget).error"
            :vacio="!tablero.estadoDe(widget).datos || tablero.estadoDe(widget).datos!.filas.length === 0"
            @reintentar="tablero.reintentar(widget)"
          >
            <WidgetIndicador
              v-if="widget.tipo === 'kpi'"
              :datos="tablero.estadoDe(widget).datos!"
            />
            <WidgetTabla
              v-else-if="widget.tipo === 'table'"
              :datos="tablero.estadoDe(widget).datos!"
            />
            <WidgetGrafica
              v-else
              :tipo="widget.tipo"
              :datos="tablero.estadoDe(widget).datos!"
            />
          </WidgetMarco>
        </VCol>
      </VRow>
    </template>

    <VNavigationDrawer
      v-model="drawer"
      temporary
      location="end"
      width="340"
    >
      <FiltroPanel
        v-if="tablero.config.value"
        :definiciones="filtros.defs.value"
        :valores="filtros.valores.value"
        :opciones="filtros.opciones.value"
        :cargando-opciones="filtros.cargandoOpciones.value"
        :errores="filtros.errores.value"
        :cargando="tablero.cargando.value"
        :completo="filtros.completo.value"
        @cambiar="filtros.establecer"
        @buscar="buscar"
        @consultar="consultar"
        @limpiar="limpiar"
      />
    </VNavigationDrawer>
  </div>
</template>
