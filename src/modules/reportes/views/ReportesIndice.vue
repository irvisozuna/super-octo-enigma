<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import EstadoError from '../components/comunes/EstadoError.vue'
import EstadoVacio from '../components/comunes/EstadoVacio.vue'
import TareasExportacion from '../components/exportar/TareasExportacion.vue'
import { useExportacionesStore } from '../stores/exportacionesStore'
import { useMenuReportesStore } from '../stores/menuReportesStore'
import type { ElementoMenu, TipoElementoMenu } from '../types/api'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const menu = useMenuReportesStore()
const exportaciones = useExportacionesStore()

const busqueda = ref('')

/** Filtro por tipo (tabla, tablero o lote): el mismo que distingue el icono de cada tarjeta. */
const tipo = ref<TipoElementoMenu | 'todos'>('todos')
const TIPOS: TipoElementoMenu[] = ['reporte', 'tablero', 'lote']
const sinAcceso = computed(() => (typeof route.query.sinAcceso === 'string' ? route.query.sinAcceso : ''))

/** Orden de las categorías en el índice: las de uso diario primero; las demás, alfabéticas al final. */
const ORDEN_CATEGORIAS = ['Facturación', 'Ingresos', 'Cartera', 'Padrón', 'Operación', 'Trámites']

const categoriasOrdenadas = computed(() => [...menu.categorias].sort((a, b) => {
  const pa = ORDEN_CATEGORIAS.indexOf(a.nombre)
  const pb = ORDEN_CATEGORIAS.indexOf(b.nombre)

  return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a.nombre.localeCompare(b.nombre, 'es')
}))

const coincideBusqueda = (e: ElementoMenu, q: string) => !q || e.titulo.toLowerCase().includes(q) || (e.descripcion ?? '').toLowerCase().includes(q)

const categoriasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q && tipo.value === 'todos')
    return categoriasOrdenadas.value

  return categoriasOrdenadas.value
    .map(categoria => ({
      ...categoria,
      elementos: categoria.elementos.filter(e => (tipo.value === 'todos' || e.tipo === tipo.value) && coincideBusqueda(e, q)),
    }))
    .filter(categoria => categoria.elementos.length > 0)
})

/** Cuántos hay de cada tipo con la búsqueda vigente; solo se ofrecen los tipos que el usuario tiene. */
const conteos = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const n: Record<string, number> = { todos: 0, reporte: 0, tablero: 0, lote: 0 }
  for (const c of menu.categorias) {
    for (const e of c.elementos) {
      if (coincideBusqueda(e, q)) {
        n.todos++
        n[e.tipo]++
      }
    }
  }

  return n
})

const tiposDisponibles = computed(() => TIPOS.filter(x => menu.categorias.some(c => c.elementos.some(e => e.tipo === x))))
const filtrosActivos = computed(() => (tipo.value !== 'todos' ? 1 : 0) + (busqueda.value.trim() ? 1 : 0))

function limpiarFiltros() {
  tipo.value = 'todos'
  busqueda.value = ''
}

const hayElementos = computed(() => menu.categorias.some(c => c.elementos.length > 0) || menu.documentos.length > 0)

const RUTAS: Record<ElementoMenu['tipo'], string> = { reporte: 'reportesVisor', tablero: 'reportesTablero', lote: 'reportesDocumentoLote' }
const ICONOS: Record<ElementoMenu['tipo'], string> = { reporte: 'tabler-table', tablero: 'tabler-layout-dashboard', lote: 'tabler-file-stack' }

function destino(elemento: ElementoMenu) {
  const nombre = RUTAS[elemento.tipo]

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
    <AsEncabezadoPagina
      :titulo="t('reportes.indice.titulo')"
      :descripcion="t('reportes.indice.descripcion')"
    />

    <AsBarraFiltros
      v-if="menu.cargado && hayElementos"
      class="mb-4"
      :activos="filtrosActivos"
      @limpiar="limpiarFiltros"
    >
      <template #inicio>
        <VChipGroup
          v-if="tiposDisponibles.length > 1"
          v-model="tipo"
          mandatory
          :aria-label="t('reportes.indice.filtroTipo')"
        >
          <VChip
            value="todos"
            filter
          >
            {{ t('reportes.indice.tipos.todos') }}&nbsp;·&nbsp;<span class="as-num">{{ conteos.todos }}</span>
          </VChip>
          <VChip
            v-for="x in tiposDisponibles"
            :key="x"
            :value="x"
            :prepend-icon="ICONOS[x]"
            filter
          >
            {{ t(`reportes.indice.tipos.${x}`) }}&nbsp;·&nbsp;<span class="as-num">{{ conteos[x] }}</span>
          </VChip>
        </VChipGroup>
      </template>
      <template #fin>
        <VTextField
          v-model="busqueda"
          :placeholder="t('reportes.indice.buscar')"
          :aria-label="t('reportes.indice.buscar')"
          prepend-inner-icon="tabler-search"
          clearable
          class="as-filtro--lg"
        />
      </template>
    </AsBarraFiltros>

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
                :prepend-icon="ICONOS[elemento.tipo]"
                :aria-label="`${t(`reportes.indice.tipo.${elemento.tipo}`)}: ${elemento.titulo}`"
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

      <AsEstado
        v-if="filtrosActivos && categoriasFiltradas.length === 0"
        tipo="vacio"
        :titulo="t('reportes.indice.sinResultados')"
        detalle=""
        icono="tabler-report-search"
      />

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
.indice-elemento {
  block-size: 100%;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
