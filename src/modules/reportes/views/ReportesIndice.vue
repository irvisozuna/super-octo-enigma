<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import EstadoError from '../components/comunes/EstadoError.vue'
import EstadoVacio from '../components/comunes/EstadoVacio.vue'
import TareasExportacion from '../components/exportar/TareasExportacion.vue'
import { useExportacionesStore } from '../stores/exportacionesStore'
import { useMenuReportesStore } from '../stores/menuReportesStore'
import type { ElementoMenu } from '../types/api'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const menu = useMenuReportesStore()
const exportaciones = useExportacionesStore()

const busqueda = ref('')
const sinAcceso = computed(() => (typeof route.query.sinAcceso === 'string' ? route.query.sinAcceso : ''))

const categoriasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q)
    return menu.categorias

  return menu.categorias
    .map(categoria => ({
      ...categoria,
      elementos: categoria.elementos.filter(e => e.titulo.toLowerCase().includes(q) || (e.descripcion ?? '').toLowerCase().includes(q)),
    }))
    .filter(categoria => categoria.elementos.length > 0)
})

const hayElementos = computed(() => menu.categorias.some(c => c.elementos.length > 0) || menu.documentos.length > 0)

// Las rutas de tableros llegan en la fase 6: mientras no existan, el elemento no navega
function destino(elemento: ElementoMenu) {
  const nombre = elemento.tipo === 'tablero' ? 'reportesTablero' : 'reportesVisor'

  return router.hasRoute(nombre) ? { name: nombre, params: { clave: elemento.key } } : undefined
}

onMounted(() => {
  if (!menu.cargado)
    menu.cargar()
  exportaciones.asegurar()
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('reportes.indice.titulo') }}
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          {{ t('reportes.indice.descripcion') }}
        </p>
      </div>
      <AppTextField
        v-model="busqueda"
        :placeholder="t('reportes.indice.buscar')"
        prepend-inner-icon="tabler-search"
        clearable
        class="indice-busqueda"
      />
    </div>

    <VAlert
      v-if="sinAcceso"
      type="warning"
      variant="tonal"
      class="mb-4"
      closable
    >
      {{ t('reportes.indice.sinAcceso', { clave: sinAcceso }) }}
    </VAlert>

    <VProgressLinear
      v-if="menu.cargando && !menu.cargado"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-else-if="menu.error"
      :error="menu.error"
      @reintentar="menu.cargar()"
    />

    <EstadoVacio
      v-else-if="menu.cargado && !hayElementos"
      :titulo="t('reportes.indice.vacioTitulo')"
      :detalle="t('reportes.indice.vacioDetalle')"
    />

    <template v-else-if="menu.cargado">
      <VRow>
        <VCol
          v-for="categoria in categoriasFiltradas"
          :key="categoria.nombre"
          cols="12"
          md="6"
          lg="4"
        >
          <VCard>
            <VCardItem>
              <VCardTitle>{{ categoria.nombre }}</VCardTitle>
            </VCardItem>
            <VList
              density="comfortable"
              nav
            >
              <VListItem
                v-for="elemento in categoria.elementos"
                :key="`${elemento.tipo}-${elemento.key}`"
                :to="destino(elemento)"
                :prepend-icon="elemento.tipo === 'tablero' ? 'tabler-layout-dashboard' : 'tabler-table'"
                :title="elemento.titulo"
                :subtitle="elemento.descripcion ?? undefined"
              />
            </VList>
          </VCard>
        </VCol>
      </VRow>

      <p
        v-if="busqueda && categoriasFiltradas.length === 0"
        class="text-medium-emphasis mt-4"
      >
        {{ t('reportes.indice.sinResultados') }}
      </p>

      <VCard
        v-if="menu.documentos.length"
        class="mt-6"
      >
        <VCardItem>
          <VCardTitle>{{ t('reportes.indice.documentos') }}</VCardTitle>
          <VCardSubtitle>{{ t('reportes.indice.documentosDetalle') }}</VCardSubtitle>
        </VCardItem>
        <VCardText class="d-flex flex-wrap gap-2">
          <VChip
            v-for="documento in menu.documentos"
            :key="documento.key"
            prepend-icon="tabler-file-text"
            label
          >
            {{ documento.titulo }}
          </VChip>
        </VCardText>
      </VCard>
    </template>

    <TareasExportacion />
  </div>
</template>

<style scoped>
.indice-busqueda {
  inline-size: 100%;
  max-inline-size: 320px;
}
</style>
