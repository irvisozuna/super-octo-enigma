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

/** Orden de las categorías en el índice: las de uso diario primero; las demás, alfabéticas al final. */
const ORDEN_CATEGORIAS = ['Facturación', 'Cartera', 'Padrón', 'Operación', 'Trámites']

const categoriasOrdenadas = computed(() => [...menu.categorias].sort((a, b) => {
  const pa = ORDEN_CATEGORIAS.indexOf(a.nombre)
  const pb = ORDEN_CATEGORIAS.indexOf(b.nombre)

  return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a.nombre.localeCompare(b.nombre, 'es')
}))

const categoriasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q)
    return categoriasOrdenadas.value

  return categoriasOrdenadas.value
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
      <VCard
        v-for="categoria in categoriasFiltradas"
        :key="categoria.nombre"
        class="mb-4"
      >
        <VCardItem class="pb-0">
          <VCardTitle class="d-flex align-center gap-2">
            {{ categoria.nombre }}
            <VChip
              size="x-small"
              variant="tonal"
            >
              {{ categoria.elementos.length }}
            </VChip>
          </VCardTitle>
        </VCardItem>
        <VCardText class="pt-2">
          <VRow dense>
            <VCol
              v-for="elemento in categoria.elementos"
              :key="`${elemento.tipo}-${elemento.key}`"
              cols="12"
              sm="6"
              lg="4"
            >
              <VListItem
                :to="destino(elemento)"
                :prepend-icon="elemento.tipo === 'tablero' ? 'tabler-layout-dashboard' : 'tabler-table'"
                :title="elemento.titulo"
                :subtitle="elemento.descripcion ?? undefined"
                lines="two"
                rounded="lg"
                class="indice-elemento"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

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

.indice-elemento {
  block-size: 100%;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
