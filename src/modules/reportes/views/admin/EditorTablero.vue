<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import WidgetEditorDialogo from '../../components/admin/WidgetEditorDialogo.vue'
import EstadoError from '../../components/comunes/EstadoError.vue'
import { useMenuReportes } from '../../composables/useMenuReportes'
import { normalizarError } from '../../services/errores'
import type { ErrorReporte } from '../../services/errores'
import { actualizarTablero, crearTablero, listarCategorias, listarFuentes, listarTablerosAdmin } from '../../services/reportesApi'
import type { DefinicionTablero, DefinicionWidget, FuenteResumen } from '../../types/admin'
import { clavear } from '../../utils/texto'

const props = defineProps<{
  clave?: string
}>()

const { t } = useI18n()
const router = useRouter()
const menuReportes = useMenuReportes()

const fuentes = ref<FuenteResumen[]>([])
const categorias = ref<string[]>([])
const cargando = ref(false)
const guardando = ref(false)
const error = ref<ErrorReporte | null>(null)
const dialogo = ref(false)
const widgetEnEdicion = ref<DefinicionWidget | null>(null)
const indiceEnEdicion = ref<number | null>(null)

const def = ref<DefinicionTablero>({ key: '', name: '', description: '', category: null, filters: [], widgets: [], order: 0 })
const claveEditada = ref(false)
const esEdicion = computed(() => !!props.clave)

const ICONOS: Record<string, string> = { kpi: 'tabler-123', pie: 'tabler-chart-donut', bar: 'tabler-chart-bar', line: 'tabler-chart-line', table: 'tabler-table' }

/** Filtros que puede compartir el tablero: los que enlaza alguna fuente de sus widgets. */
const filtrosDisponibles = computed(() => {
  const claves = new Set<string>()
  for (const w of def.value.widgets) {
    for (const f of fuentes.value.find(s => s.key === w.source)?.filters ?? [])
      claves.add(f.filter)
  }

  return [...claves]
})

const filtrosSeleccionados = computed({
  get: () => def.value.filters.map(f => f.filter),
  set: (claves: string[]) => {
    def.value.filters = claves.map(c => def.value.filters.find(f => f.filter === c) ?? { filter: c })
  },
})

const claveValida = computed(() => /^[a-z][a-z0-9_]{1,78}$/.test(def.value.key ?? ''))
const valido = computed(() => def.value.name.trim().length > 0 && claveValida.value && def.value.widgets.length > 0)

const detalleErrores = computed(() => {
  const campos = error.value?.campos as Record<string, unknown> | undefined
  const detalle = campos?.definicion

  return Array.isArray(detalle) ? detalle.map(String) : typeof detalle === 'string' ? [detalle] : []
})

function alCambiarNombre(nombre: string) {
  if (!esEdicion.value && !claveEditada.value)
    def.value.key = clavear(nombre, 't')
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    const [f, c] = await Promise.all([listarFuentes(), listarCategorias()])

    fuentes.value = f
    categorias.value = c
    if (props.clave) {
      const existente = (await listarTablerosAdmin()).find(d => d.key === props.clave)
      if (!existente)
        throw new Error(t('reportes.errores.NO_ENCONTRADO'))
      def.value = {
        key: existente.key,
        name: existente.name,
        description: existente.description ?? '',
        category: existente.category ?? null,
        filters: existente.filters ?? [],
        widgets: existente.widgets ?? [],
        order: existente.order ?? 0,
      }
      claveEditada.value = true
    }
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

function nuevoWidget() {
  widgetEnEdicion.value = null
  indiceEnEdicion.value = null
  dialogo.value = true
}

function editarWidget(indice: number) {
  widgetEnEdicion.value = def.value.widgets[indice]
  indiceEnEdicion.value = indice
  dialogo.value = true
}

function guardarWidget(widget: DefinicionWidget) {
  if (indiceEnEdicion.value === null)
    def.value.widgets.push(widget)
  else
    def.value.widgets.splice(indiceEnEdicion.value, 1, widget)

  // quita filtros que ya ninguna fuente enlaza
  def.value.filters = def.value.filters.filter(f => filtrosDisponibles.value.includes(f.filter))
}

function quitarWidget(indice: number) {
  def.value.widgets.splice(indice, 1)
  def.value.filters = def.value.filters.filter(f => filtrosDisponibles.value.includes(f.filter))
}

async function guardar() {
  if (!valido.value)
    return
  guardando.value = true
  error.value = null
  try {
    const payload: DefinicionTablero = {
      ...def.value,
      description: def.value.description?.trim() || null,
      widgets: def.value.widgets.map((w, i) => ({ ...w, sort_order: (i + 1) * 10 })),
    }

    const guardado = esEdicion.value ? await actualizarTablero(props.clave!, payload) : await crearTablero(payload)

    menuReportes.recargar().catch(() => undefined)
    await router.push({ name: 'reportesAdminTableros', query: { guardado: guardado.key } })
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <RouterLink
          :to="{ name: 'reportesAdminTableros' }"
          class="text-body-2 d-inline-flex align-center gap-1 mb-1"
        >
          <VIcon
            icon="tabler-arrow-left"
            size="16"
          />
          {{ t('reportes.admin.tableros.volver') }}
        </RouterLink>
        <h4 class="text-h4 mb-1">
          {{ esEdicion ? t('reportes.admin.tableros.editar') : t('reportes.admin.tableros.nuevo') }}
        </h4>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          v-if="esEdicion"
          variant="tonal"
          :to="{ name: 'reportesTablero', params: { clave: props.clave } }"
          prepend-icon="tabler-eye"
        >
          {{ t('reportes.admin.comunes.ver') }}
        </VBtn>
        <VBtn
          color="primary"
          :loading="guardando"
          :disabled="!valido"
          prepend-icon="tabler-device-floppy"
          @click="guardar"
        >
          {{ t('reportes.admin.comunes.guardar') }}
        </VBtn>
      </div>
    </div>

    <VProgressLinear
      v-if="cargando"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-if="error"
      class="mb-4"
      :error="error"
      mostrar-detalle
      @reintentar="cargar"
    >
      <ul
        v-if="detalleErrores.length"
        class="mt-2 ps-4"
      >
        <li
          v-for="(mensaje, i) in detalleErrores"
          :key="i"
        >
          {{ mensaje }}
        </li>
      </ul>
    </EstadoError>

    <VRow v-if="!cargando">
      <VCol
        cols="12"
        lg="4"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>{{ t('reportes.admin.comunes.datosGenerales') }}</VCardTitle>
          </VCardItem>
          <VCardText class="d-flex flex-column gap-4">
            <AppTextField
              v-model="def.name"
              :label="t('reportes.admin.comunes.nombre')"
              @update:model-value="alCambiarNombre"
            />
            <AppTextField
              v-model="def.key"
              :label="t('reportes.admin.comunes.clave')"
              :disabled="esEdicion"
              :error-messages="def.key && !claveValida ? t('reportes.admin.comunes.claveInvalida') : undefined"
              @update:model-value="claveEditada = true"
            />
            <AppCombobox
              v-model="def.category"
              :items="categorias"
              :label="t('reportes.admin.comunes.categoria')"
              clearable
            />
            <AppTextarea
              v-model="def.description"
              :label="t('reportes.admin.comunes.descripcion')"
              rows="3"
              auto-grow
            />
            <AppAutocomplete
              v-model="filtrosSeleccionados"
              :items="filtrosDisponibles"
              :label="t('reportes.admin.tableros.filtros')"
              :hint="t('reportes.admin.tableros.filtrosAyuda')"
              persistent-hint
              multiple
              chips
              closable-chips
              :disabled="filtrosDisponibles.length === 0"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        lg="8"
      >
        <VCard>
          <VCardItem>
            <VCardTitle>{{ t('reportes.admin.tableros.widgets') }}</VCardTitle>
            <template #append>
              <VBtn
                size="small"
                prepend-icon="tabler-plus"
                @click="nuevoWidget"
              >
                {{ t('reportes.admin.tableros.agregarWidget') }}
              </VBtn>
            </template>
          </VCardItem>
          <VCardText>
            <p
              v-if="def.widgets.length === 0"
              class="text-medium-emphasis text-center py-8 mb-0"
            >
              {{ t('reportes.admin.tableros.sinWidgets') }}
            </p>
            <Draggable
              v-else
              v-model="def.widgets"
              item-key="key"
              handle=".widget-asa"
              class="d-flex flex-wrap gap-3"
            >
              <template #item="{ element, index }">
                <VCard
                  variant="tonal"
                  class="widget-item"
                  :style="{ flexBasis: `calc(${(element.width / 12) * 100}% - 12px)` }"
                >
                  <VCardText class="d-flex align-center gap-2 py-3">
                    <VIcon
                      icon="tabler-grip-vertical"
                      class="widget-asa cursor-move"
                    />
                    <VIcon :icon="ICONOS[element.type]" />
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="font-weight-medium text-truncate">
                        {{ element.title }}
                      </div>
                      <div class="text-caption text-medium-emphasis text-truncate">
                        {{ t(`reportes.admin.tableros.tipos.${element.type}`) }} · {{ element.source }} · {{ t(`reportes.admin.tableros.anchos.${element.width}`) }}
                      </div>
                    </div>
                    <VBtn
                      icon="tabler-pencil"
                      size="small"
                      variant="text"
                      @click="editarWidget(index)"
                    />
                    <VBtn
                      icon="tabler-trash"
                      size="small"
                      variant="text"
                      color="error"
                      @click="quitarWidget(index)"
                    />
                  </VCardText>
                </VCard>
              </template>
            </Draggable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <WidgetEditorDialogo
      v-model="dialogo"
      :widget="widgetEnEdicion"
      :fuentes="fuentes"
      :claves-usadas="def.widgets.map(w => w.key)"
      @guardar="guardarWidget"
    />
  </div>
</template>

<style scoped>
.widget-item {
  flex-grow: 1;
  min-inline-size: 240px;
}
</style>
