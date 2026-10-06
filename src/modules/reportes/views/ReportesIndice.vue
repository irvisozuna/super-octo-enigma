<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import EstadoError from '../components/comunes/EstadoError.vue'
import EstadoVacio from '../components/comunes/EstadoVacio.vue'
import { normalizarError } from '../services/errores'
import type { ErrorReporte } from '../services/errores'
import { obtenerMenu } from '../services/reportesApi'
import type { CategoriaMenu, DocumentoMenu, ElementoMenu } from '../types/api'

const { t } = useI18n()
const router = useRouter()

const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const categorias = ref<CategoriaMenu[]>([])
const documentos = ref<DocumentoMenu[]>([])
const busqueda = ref('')

let controlador: AbortController | null = null

async function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  cargando.value = true
  error.value = null

  try {
    const respuesta = await obtenerMenu({ signal: controlador.signal })

    categorias.value = respuesta.categorias
    documentos.value = respuesta.documentos
  }
  catch (e) {
    const normalizado = normalizarError(e)
    if (normalizado.codigo !== 'CANCELADO')
      error.value = normalizado
  }
  finally {
    cargando.value = false
  }
}

const categoriasFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q)
    return categorias.value

  return categorias.value
    .map(categoria => ({
      ...categoria,
      elementos: categoria.elementos.filter(e => e.titulo.toLowerCase().includes(q) || (e.descripcion ?? '').toLowerCase().includes(q)),
    }))
    .filter(categoria => categoria.elementos.length > 0)
})

const hayElementos = computed(() => categorias.value.some(c => c.elementos.length > 0) || documentos.value.length > 0)

// Las rutas del visor y de tableros llegan en fases posteriores: mientras no existan, el elemento no navega
function destino(elemento: ElementoMenu) {
  const nombre = elemento.tipo === 'tablero' ? 'tablerosVista' : 'reportesVisor'

  return router.hasRoute(nombre) ? { name: nombre, params: { clave: elemento.key } } : undefined
}

onMounted(cargar)
onScopeDispose(() => controlador?.abort())
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

    <VProgressLinear
      v-if="cargando"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-else-if="error"
      :error="error"
      @reintentar="cargar"
    />

    <EstadoVacio
      v-else-if="!hayElementos"
      :titulo="t('reportes.indice.vacioTitulo')"
      :detalle="t('reportes.indice.vacioDetalle')"
    />

    <template v-else>
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
        v-if="documentos.length"
        class="mt-6"
      >
        <VCardItem>
          <VCardTitle>{{ t('reportes.indice.documentos') }}</VCardTitle>
          <VCardSubtitle>{{ t('reportes.indice.documentosDetalle') }}</VCardSubtitle>
        </VCardItem>
        <VCardText class="d-flex flex-wrap gap-2">
          <VChip
            v-for="documento in documentos"
            :key="documento.key"
            prepend-icon="tabler-file-text"
            label
          >
            {{ documento.titulo }}
          </VChip>
        </VCardText>
      </VCard>
    </template>
  </div>
</template>

<style scoped>
.indice-busqueda {
  inline-size: 100%;
  max-inline-size: 320px;
}
</style>
