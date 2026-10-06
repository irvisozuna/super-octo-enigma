<script setup lang="ts">
import { computed, onMounted, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EstadoError from '../components/comunes/EstadoError.vue'
import TareasExportacion from '../components/exportar/TareasExportacion.vue'
import FiltroChips from '../components/filtros/FiltroChips.vue'
import FiltroPanel from '../components/filtros/FiltroPanel.vue'
import { useFiltros } from '../composables/useFiltros'
import { useLoteDocumento } from '../composables/useLoteDocumento'
import { useExportacionesStore } from '../stores/exportacionesStore'
import type { FiltroDef } from '../types/reporte'
import { formatearEntero } from '../utils/formato'

const props = defineProps<{
  clave: string
}>()

const { t } = useI18n()

const lote = useLoteDocumento(toRef(props, 'clave'))
const filtros = useFiltros(computed(() => lote.config.value?.filtros ?? []))
const exportaciones = useExportacionesStore()
const drawer = ref(false)

const tieneFiltros = computed(() => filtros.defs.value.some(d => !d.oculto))
const enCurso = computed(() => lote.ejecucion.value !== null && (lote.ejecucion.value.estado === 'queued' || lote.ejecucion.value.estado === 'running'))

async function contar() {
  if (!filtros.validar())
    return
  drawer.value = false
  await lote.contar(filtros.aPayload())
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
  contar()
}

function buscar(def: FiltroDef, texto: string) {
  filtros.cargarOpciones(def, texto)
}

async function iniciar() {
  await lote.cargarConfig()
  if (!lote.config.value)
    return
  filtros.aplicarDefaults()
  filtros.cargarTodasLasOpciones()
  exportaciones.asegurar()
  if (filtros.completo.value)
    await lote.contar(filtros.aPayload())
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
          {{ lote.config.value?.titulo ?? '' }}
        </h4>
        <p
          v-if="lote.config.value?.descripcion"
          class="text-body-1 text-medium-emphasis mb-0"
        >
          {{ lote.config.value.descripcion }}
        </p>
      </div>

      <VBtn
        v-if="tieneFiltros && lote.config.value"
        variant="tonal"
        prepend-icon="tabler-adjustments"
        @click="drawer = true"
      >
        {{ t('reportes.visor.filtros') }}
      </VBtn>
    </div>

    <VProgressLinear
      v-if="lote.cargandoConfig.value"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-else-if="lote.errorConfig.value"
      :error="lote.errorConfig.value"
      @reintentar="iniciar"
    />

    <template v-else-if="lote.config.value">
      <FiltroChips
        v-if="lote.filtrosAplicados.value"
        class="mb-4"
        :definiciones="filtros.defs.value"
        :valores="lote.filtrosAplicados.value"
        :etiqueta="filtros.etiqueta"
        :mostrar-acceso="tieneFiltros"
        @quitar="quitarFiltro"
        @abrir="drawer = true"
      />

      <VCard>
        <VCardText
          v-if="!lote.filtrosAplicados.value && !lote.contando.value"
          class="d-flex flex-column align-center text-center text-medium-emphasis py-10 gap-4"
        >
          {{ t('reportes.lote.elige') }}
          <VBtn
            color="primary"
            prepend-icon="tabler-adjustments"
            @click="drawer = true"
          >
            {{ t('reportes.visor.abrirFiltros') }}
          </VBtn>
        </VCardText>

        <VCardText
          v-else-if="lote.contando.value"
          class="d-flex flex-column align-center text-center text-medium-emphasis py-10 gap-4"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
          {{ t('reportes.lote.contando') }}
        </VCardText>

        <EstadoError
          v-else-if="lote.errorConteo.value"
          :error="lote.errorConteo.value"
          @reintentar="contar"
        />

        <VCardText
          v-else-if="lote.conteo.value"
          class="d-flex flex-column align-center text-center py-10 gap-3"
        >
          <div class="text-h2 font-weight-bold">
            {{ formatearEntero(lote.conteo.value.contratos) }}
          </div>
          <div class="text-body-1">
            {{ t('reportes.lote.recibos', lote.conteo.value.contratos) }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ t('reportes.lote.maximo', { n: formatearEntero(lote.conteo.value.maximo) }) }}
          </div>

          <VAlert
            v-if="lote.conteo.value.contratos === 0"
            type="info"
            variant="tonal"
            density="compact"
            class="text-start"
          >
            {{ t('reportes.lote.sinContratos') }}
          </VAlert>
          <VAlert
            v-else-if="lote.conteo.value.excede"
            type="warning"
            variant="tonal"
            density="compact"
            class="text-start"
          >
            {{ t('reportes.lote.excede') }}
          </VAlert>
          <p
            v-else
            class="text-body-2 text-medium-emphasis mb-0"
          >
            {{ t('reportes.lote.aviso') }}
          </p>

          <VAlert
            v-if="lote.errorEncolar.value"
            type="error"
            variant="tonal"
            density="compact"
            class="text-start"
          >
            {{ lote.errorEncolar.value.mensaje }}
          </VAlert>

          <VAlert
            v-if="lote.ultimaEjecucionId.value"
            type="success"
            variant="tonal"
            density="compact"
            class="text-start"
          >
            {{ enCurso ? t('reportes.lote.encolado') : t('reportes.lote.terminado') }}
            <RouterLink
              :to="{ name: 'reportesExportaciones' }"
              class="ms-1"
            >
              {{ t('reportes.lote.verExportaciones') }}
            </RouterLink>
          </VAlert>

          <div class="d-flex flex-wrap justify-center gap-2 mt-2">
            <VBtn
              variant="tonal"
              prepend-icon="tabler-adjustments"
              @click="drawer = true"
            >
              {{ t('reportes.filtros.editar') }}
            </VBtn>
            <VBtn
              color="primary"
              prepend-icon="tabler-file-stack"
              :disabled="!lote.puedeGenerar.value || enCurso"
              :loading="lote.encolando.value"
              @click="lote.generar"
            >
              {{ t('reportes.lote.generar') }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </template>

    <VNavigationDrawer
      v-model="drawer"
      temporary
      location="end"
      width="360"
    >
      <FiltroPanel
        v-if="lote.config.value"
        :definiciones="filtros.defs.value"
        :valores="filtros.valores.value"
        :opciones="filtros.opciones.value"
        :cargando-opciones="filtros.cargandoOpciones.value"
        :errores="filtros.errores.value"
        :cargando="lote.contando.value"
        :completo="filtros.completo.value"
        @cambiar="filtros.establecer"
        @buscar="buscar"
        @consultar="contar"
        @limpiar="limpiar"
      />
    </VNavigationDrawer>

    <TareasExportacion />
  </div>
</template>
