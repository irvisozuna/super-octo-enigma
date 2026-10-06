<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import EstadoError from '../../components/comunes/EstadoError.vue'
import { useMenuReportes } from '../../composables/useMenuReportes'
import { normalizarError } from '../../services/errores'
import type { ErrorReporte } from '../../services/errores'
import { eliminarReporte, listarReportesAdmin } from '../../services/reportesApi'
import type { ReporteAdmin } from '../../types/admin'
import { formatearFechaHora } from '../../utils/formato'

const { t } = useI18n()
const route = useRoute()
const menuReportes = useMenuReportes()

const reportes = ref<ReporteAdmin[]>([])
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const busqueda = ref('')
const aviso = ref<string | null>(typeof route.query.guardado === 'string' ? t('reportes.admin.reportes.guardado', { clave: route.query.guardado }) : null)
const porEliminar = ref<ReporteAdmin | null>(null)
const eliminando = ref(false)

const headers = computed(() => [
  { title: t('reportes.admin.comunes.nombre'), key: 'name' },
  { title: t('reportes.admin.comunes.categoria'), key: 'category' },
  { title: t('reportes.admin.comunes.fuente'), key: 'source' },
  { title: t('reportes.admin.comunes.origen'), key: 'origin' },
  { title: t('reportes.admin.comunes.actualizado'), key: 'updated_at' },
  { title: '', key: 'acciones', sortable: false, align: 'end' as const },
])

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  return texto ? reportes.value.filter(r => r.name.toLowerCase().includes(texto) || r.key.includes(texto) || (r.category ?? '').toLowerCase().includes(texto)) : reportes.value
})

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    reportes.value = await listarReportesAdmin()
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

async function confirmarEliminar() {
  if (!porEliminar.value)
    return
  eliminando.value = true
  try {
    await eliminarReporte(porEliminar.value.key)
    aviso.value = t('reportes.admin.reportes.eliminado', { nombre: porEliminar.value.name })
    porEliminar.value = null
    menuReportes.recargar().catch(() => undefined)
    await cargar()
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    eliminando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('reportes.admin.reportes.titulo') }}
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          {{ t('reportes.admin.reportes.descripcion') }}
        </p>
      </div>
      <div class="d-flex align-center gap-2">
        <AppTextField
          v-model="busqueda"
          :placeholder="t('reportes.indice.buscar')"
          prepend-inner-icon="tabler-search"
          clearable
          hide-details
          style="min-inline-size: 240px;"
        />
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          :to="{ name: 'reportesAdminReporteEditor' }"
        >
          {{ t('reportes.admin.reportes.nuevo') }}
        </VBtn>
      </div>
    </div>

    <EstadoError
      v-if="error"
      class="mb-4"
      :error="error"
      mostrar-detalle
      @reintentar="cargar"
    />

    <VCard>
      <VDataTable
        :headers="headers"
        :items="filtrados"
        :loading="cargando"
        :items-per-page="25"
        :no-data-text="t('reportes.admin.reportes.vacio')"
        :items-per-page-text="t('reportes.tabla.filasPorPagina')"
      >
        <template #item.name="{ item }">
          <div class="font-weight-medium">
            {{ item.name }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ item.key }}
          </div>
        </template>
        <template #item.origin="{ item }">
          <VChip
            size="small"
            :color="item.origin === 'code' ? 'secondary' : 'primary'"
            variant="tonal"
          >
            {{ t(`reportes.admin.comunes.origenes.${item.origin}`) }} · {{ t('reportes.admin.comunes.version', { n: item.version }) }}
          </VChip>
        </template>
        <template #item.updated_at="{ item }">
          {{ formatearFechaHora(item.updated_at) }}
        </template>
        <template #item.acciones="{ item }">
          <VBtn
            icon="tabler-eye"
            size="small"
            variant="text"
            :to="{ name: 'reportesVisor', params: { clave: item.key } }"
          />
          <VBtn
            icon="tabler-pencil"
            size="small"
            variant="text"
            :to="{ name: 'reportesAdminReporteEditor', params: { clave: item.key } }"
          />
          <VBtn
            icon="tabler-trash"
            size="small"
            variant="text"
            color="error"
            @click="porEliminar = item"
          />
        </template>
      </VDataTable>
    </VCard>

    <VDialog
      :model-value="porEliminar !== null"
      max-width="460"
      @update:model-value="porEliminar = null"
    >
      <VCard v-if="porEliminar">
        <VCardItem>
          <VCardTitle>{{ t('reportes.admin.reportes.eliminarTitulo') }}</VCardTitle>
        </VCardItem>
        <VCardText>
          {{ t('reportes.admin.reportes.eliminarDetalle', { nombre: porEliminar.name }) }}
          <VAlert
            v-if="porEliminar.origin === 'code'"
            type="warning"
            variant="tonal"
            class="mt-3"
          >
            {{ t('reportes.admin.comunes.origenCodigoAviso') }}
          </VAlert>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="porEliminar = null"
          >
            {{ t('reportes.exportar.cancelar') }}
          </VBtn>
          <VBtn
            color="error"
            :loading="eliminando"
            @click="confirmarEliminar"
          >
            {{ t('reportes.admin.comunes.eliminar') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar
      :model-value="aviso !== null"
      timeout="5000"
      @update:model-value="aviso = null"
    >
      {{ aviso }}
    </VSnackbar>
  </div>
</template>
