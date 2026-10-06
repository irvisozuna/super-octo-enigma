<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import EstadoError from '../../components/comunes/EstadoError.vue'
import TablaReporte from '../../components/tabla/TablaReporte.vue'
import { useMenuReportes } from '../../composables/useMenuReportes'
import { normalizarError } from '../../services/errores'
import type { ErrorReporte } from '../../services/errores'
import { actualizarReporte, crearReporte, listarCategorias, listarFuentes, listarReportesAdmin, previsualizarReporte } from '../../services/reportesApi'
import type { DefinicionReporte, FuenteResumen } from '../../types/admin'
import type { FormatoExportacion } from '../../types/exportacion'
import type { ColumnaDef, FormatoColumna, ResultadoConsulta } from '../../types/reporte'
import { clavear } from '../../utils/texto'

const props = defineProps<{
  clave?: string
}>()

const { t } = useI18n()
const router = useRouter()
const menuReportes = useMenuReportes()

const FORMATOS: FormatoColumna[] = ['texto', 'entero', 'decimal', 'moneda', 'porcentaje', 'fecha', 'fechaHora', 'booleano', 'periodo']
const FORMATOS_EXPORT: FormatoExportacion[] = ['xlsx', 'csv', 'pdf']
const NUMERICOS = new Set(['integer', 'decimal', 'int', 'float', 'number'])

interface ColumnaEditable {
  column: string
  tipo: string
  incluir: boolean
  label: string
  format: FormatoColumna
  total: boolean
}

interface FiltroEditable {
  filter: string
  bind: string
  incluir: boolean
  required: boolean
  hidden: boolean
}

const fuentes = ref<FuenteResumen[]>([])
const categorias = ref<string[]>([])
const cargando = ref(false)
const guardando = ref(false)
const previsualizando = ref(false)
const error = ref<ErrorReporte | null>(null)
const errorPrevia = ref<ErrorReporte | null>(null)
const previa = ref<ResultadoConsulta | null>(null)

const nombre = ref('')
const claveReporte = ref('')
const claveEditada = ref(false)
const descripcion = ref('')
const categoria = ref<string | null>(null)
const fuente = ref<string | null>(null)
const columnas = ref<ColumnaEditable[]>([])
const filtros = ref<FiltroEditable[]>([])
const ordenColumna = ref<string | null>(null)
const ordenDir = ref<'asc' | 'desc'>('asc')
const formatosExport = ref<FormatoExportacion[]>(['xlsx', 'csv', 'pdf'])
const porPagina = ref<number | null>(null)
const orden = ref(0)

const esEdicion = computed(() => !!props.clave)
const fuenteDef = computed(() => fuentes.value.find(f => f.key === fuente.value) ?? null)
const columnasIncluidas = computed(() => columnas.value.filter(c => c.incluir))
const claveValida = computed(() => /^[a-z][a-z0-9_]{1,78}$/.test(claveReporte.value))
const valido = computed(() => nombre.value.trim().length > 0 && claveValida.value && !!fuente.value && columnasIncluidas.value.length > 0)

const detalleErrores = computed(() => {
  const campos = error.value?.campos as Record<string, unknown> | undefined
  const detalle = campos?.definicion

  return Array.isArray(detalle) ? detalle.map(String) : typeof detalle === 'string' ? [detalle] : []
})

const columnasPrevia = computed<ColumnaDef[]>(() => columnasIncluidas.value.map(c => ({
  columna: c.column,
  etiqueta: c.label.trim() || c.column,
  tipo: (c.tipo || 'string') as ColumnaDef['tipo'],
  formato: c.format,
  alineacion: NUMERICOS.has(c.tipo) ? 'end' : 'start',
  visible: true,
  total: c.total,
})))

function alCambiarNombre(valor: string) {
  if (!esEdicion.value && !claveEditada.value)
    claveReporte.value = clavear(valor, 'r')
}

function prepararFuente(def: FuenteResumen, existente?: DefinicionReporte) {
  const previasCol = new Map((existente?.columns ?? []).map(c => [c.column, c]))
  const previasFil = new Map((existente?.filters ?? []).map(f => [f.filter, f]))

  columnas.value = def.columns.map(c => {
    const anterior = previasCol.get(c.name)
    const tipo = String(c.type ?? 'string')

    return {
      column: c.name,
      tipo,
      incluir: existente ? !!anterior : !c.name.endsWith('_ID'),
      label: String(anterior?.label ?? c.label ?? c.name),
      format: anterior?.format ?? (tipo === 'decimal' ? 'decimal' : tipo === 'integer' ? 'entero' : tipo === 'date' ? 'fecha' : tipo === 'datetime' ? 'fechaHora' : 'texto'),
      total: !!anterior?.total,
    }
  })

  // columnas en el orden del reporte existente, las demás al final
  if (existente?.columns?.length) {
    const posicion = new Map(existente.columns.map((c, i) => [c.column, i]))

    columnas.value.sort((a, b) => (posicion.get(a.column) ?? 999) - (posicion.get(b.column) ?? 999))
  }
  filtros.value = def.filters.map(f => {
    const anterior = previasFil.get(f.filter)

    return { filter: f.filter, bind: f.bind, incluir: existente ? !!anterior : true, required: !!anterior?.required, hidden: !!anterior?.hidden }
  })
  ordenColumna.value = existente?.default_order?.[0]?.column ?? null
  ordenDir.value = existente?.default_order?.[0]?.dir ?? 'asc'
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    const [f, c] = await Promise.all([listarFuentes(), listarCategorias()])

    fuentes.value = f
    categorias.value = c
    if (props.clave) {
      const existente = (await listarReportesAdmin()).find(r => r.key === props.clave)
      if (!existente)
        throw new Error(t('reportes.errores.NO_ENCONTRADO'))
      nombre.value = existente.name
      claveReporte.value = existente.key
      claveEditada.value = true
      descripcion.value = existente.description ?? ''
      categoria.value = existente.category ?? null
      fuente.value = existente.source
      formatosExport.value = existente.export_formats ?? []
      porPagina.value = (existente.settings?.per_page as number | undefined) ?? null
      orden.value = existente.order ?? 0

      const def = f.find(s => s.key === existente.source)
      if (def)
        prepararFuente(def, existente)
    }
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

watch(fuente, (nuevo, anterior) => {
  if (anterior === undefined || nuevo === anterior || cargando.value)
    return
  previa.value = null

  const def = fuentes.value.find(s => s.key === nuevo)
  if (def)
    prepararFuente(def)
})

function construir(): DefinicionReporte {
  return {
    key: claveReporte.value,
    name: nombre.value.trim(),
    description: descripcion.value.trim() || null,
    source: fuente.value ?? '',
    category: categoria.value?.trim() || null,
    columns: columnasIncluidas.value.map(c => ({ column: c.column, label: c.label.trim() || c.column, format: c.format, total: c.total && NUMERICOS.has(c.tipo) })),
    filters: filtros.value.filter(f => f.incluir).map(f => ({ filter: f.filter, required: f.required || undefined, hidden: f.hidden || undefined })),
    default_order: ordenColumna.value ? [{ column: ordenColumna.value, dir: ordenDir.value }] : [],
    export_formats: formatosExport.value,
    settings: porPagina.value ? { per_page: porPagina.value } : null,
    order: orden.value,
  }
}

async function previsualizar() {
  if (!valido.value)
    return
  previsualizando.value = true
  errorPrevia.value = null
  try {
    previa.value = await previsualizarReporte(construir(), {})
  }
  catch (e) {
    errorPrevia.value = normalizarError(e)
  }
  finally {
    previsualizando.value = false
  }
}

async function guardar() {
  if (!valido.value)
    return
  guardando.value = true
  error.value = null
  try {
    const guardado = esEdicion.value ? await actualizarReporte(props.clave!, construir()) : await crearReporte(construir())

    menuReportes.recargar().catch(() => undefined)
    await router.push({ name: 'reportesAdminReportes', query: { guardado: guardado.key } })
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
          :to="{ name: 'reportesAdminReportes' }"
          class="text-body-2 d-inline-flex align-center gap-1 mb-1"
        >
          <VIcon
            icon="tabler-arrow-left"
            size="16"
          />
          {{ t('reportes.admin.reportes.volver') }}
        </RouterLink>
        <h4 class="text-h4 mb-1">
          {{ esEdicion ? t('reportes.admin.reportes.editar') : t('reportes.admin.reportes.nuevo') }}
        </h4>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          variant="tonal"
          :loading="previsualizando"
          :disabled="!valido"
          prepend-icon="tabler-eye"
          @click="previsualizar"
        >
          {{ t('reportes.admin.reportes.previsualizar') }}
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
        <VCard class="mb-4">
          <VCardItem>
            <VCardTitle>{{ t('reportes.admin.comunes.datosGenerales') }}</VCardTitle>
          </VCardItem>
          <VCardText class="d-flex flex-column gap-4">
            <AppTextField
              v-model="nombre"
              :label="t('reportes.admin.comunes.nombre')"
              @update:model-value="alCambiarNombre"
            />
            <AppTextField
              v-model="claveReporte"
              :label="t('reportes.admin.comunes.clave')"
              :disabled="esEdicion"
              :error-messages="claveReporte && !claveValida ? t('reportes.admin.comunes.claveInvalida') : undefined"
              @update:model-value="claveEditada = true"
            />
            <AppAutocomplete
              v-model="fuente"
              :items="fuentes"
              item-title="name"
              item-value="key"
              :label="t('reportes.admin.comunes.fuente')"
              :hint="fuenteDef?.description ?? ''"
              persistent-hint
            />
            <AppCombobox
              v-model="categoria"
              :items="categorias"
              :label="t('reportes.admin.comunes.categoria')"
              clearable
            />
            <AppTextarea
              v-model="descripcion"
              :label="t('reportes.admin.comunes.descripcion')"
              rows="3"
              auto-grow
            />
          </VCardText>
        </VCard>

        <VCard class="mb-4">
          <VCardItem>
            <VCardTitle>{{ t('reportes.admin.reportes.filtros') }}</VCardTitle>
          </VCardItem>
          <VCardText>
            <p
              v-if="filtros.length === 0"
              class="text-medium-emphasis mb-0"
            >
              {{ t('reportes.admin.reportes.sinFiltros') }}
            </p>
            <div
              v-for="f in filtros"
              :key="f.filter"
              class="d-flex align-center gap-3 py-1"
            >
              <VCheckbox
                v-model="f.incluir"
                :label="f.filter"
                density="compact"
                hide-details
                class="flex-grow-1"
              />
              <VCheckbox
                v-model="f.required"
                :label="t('reportes.admin.reportes.obligatorio')"
                :disabled="!f.incluir"
                density="compact"
                hide-details
              />
              <VCheckbox
                v-model="f.hidden"
                :label="t('reportes.admin.reportes.oculto')"
                :disabled="!f.incluir"
                density="compact"
                hide-details
              />
            </div>
          </VCardText>
        </VCard>

        <VCard>
          <VCardItem>
            <VCardTitle>{{ t('reportes.admin.reportes.presentacion') }}</VCardTitle>
          </VCardItem>
          <VCardText class="d-flex flex-column gap-4">
            <div class="d-flex gap-2">
              <AppAutocomplete
                v-model="ordenColumna"
                :items="columnasIncluidas.map(c => c.column)"
                :label="t('reportes.admin.reportes.ordenDefault')"
                clearable
                class="flex-grow-1"
              />
              <AppSelect
                v-model="ordenDir"
                :items="[{ title: t('reportes.admin.comunes.ascendente'), value: 'asc' }, { title: t('reportes.admin.comunes.descendente'), value: 'desc' }]"
                :label="t('reportes.admin.comunes.direccion')"
                style="max-inline-size: 150px;"
              />
            </div>
            <div>
              <div class="text-body-2 mb-1">
                {{ t('reportes.admin.reportes.formatosExport') }}
              </div>
              <div class="d-flex gap-4">
                <VCheckbox
                  v-for="formato in FORMATOS_EXPORT"
                  :key="formato"
                  v-model="formatosExport"
                  :value="formato"
                  :label="formato.toUpperCase()"
                  density="compact"
                  hide-details
                />
              </div>
            </div>
            <AppTextField
              v-model.number="porPagina"
              type="number"
              min="10"
              max="500"
              :label="t('reportes.admin.reportes.porPagina')"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        lg="8"
      >
        <VCard class="mb-4">
          <VCardItem>
            <VCardTitle>{{ t('reportes.admin.reportes.columnas') }}</VCardTitle>
            <VCardSubtitle>{{ t('reportes.admin.reportes.columnasAyuda') }}</VCardSubtitle>
          </VCardItem>
          <VCardText class="pa-0">
            <p
              v-if="columnas.length === 0"
              class="text-medium-emphasis text-center py-8 mb-0"
            >
              {{ t('reportes.admin.reportes.eligeFuente') }}
            </p>
            <VTable
              v-else
              density="compact"
            >
              <thead>
                <tr>
                  <th style="inline-size: 32px;" />
                  <th>{{ t('reportes.admin.comunes.incluir') }}</th>
                  <th>{{ t('reportes.admin.comunes.columna') }}</th>
                  <th>{{ t('reportes.admin.comunes.etiqueta') }}</th>
                  <th>{{ t('reportes.admin.comunes.formato') }}</th>
                  <th>{{ t('reportes.admin.reportes.total') }}</th>
                </tr>
              </thead>
              <Draggable
                v-model="columnas"
                item-key="column"
                handle=".columna-asa"
                tag="tbody"
              >
                <template #item="{ element }">
                  <tr>
                    <td>
                      <VIcon
                        icon="tabler-grip-vertical"
                        size="18"
                        class="columna-asa cursor-move"
                      />
                    </td>
                    <td>
                      <VCheckbox
                        v-model="element.incluir"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td class="text-no-wrap">
                      <span class="font-weight-medium">{{ element.column }}</span>
                      <span class="text-caption text-medium-emphasis ms-1">{{ element.tipo }}</span>
                    </td>
                    <td>
                      <AppTextField
                        v-model="element.label"
                        density="compact"
                        hide-details
                        :disabled="!element.incluir"
                      />
                    </td>
                    <td>
                      <AppSelect
                        v-model="element.format"
                        :items="FORMATOS.map(f => ({ title: t(`reportes.admin.comunes.formatos.${f}`), value: f }))"
                        density="compact"
                        hide-details
                        :disabled="!element.incluir"
                      />
                    </td>
                    <td>
                      <VCheckbox
                        v-model="element.total"
                        density="compact"
                        hide-details
                        :disabled="!element.incluir || !NUMERICOS.has(element.tipo)"
                      />
                    </td>
                  </tr>
                </template>
              </Draggable>
            </VTable>
          </VCardText>
        </VCard>

        <VCard v-if="previa || errorPrevia || previsualizando">
          <VCardItem>
            <VCardTitle>{{ t('reportes.admin.reportes.vistaPrevia') }}</VCardTitle>
            <VCardSubtitle v-if="previa">
              {{ t('reportes.admin.reportes.vistaPreviaDetalle', { n: previa.total_filas }) }}
            </VCardSubtitle>
          </VCardItem>
          <EstadoError
            v-if="errorPrevia"
            class="ma-4"
            :error="errorPrevia"
            mostrar-detalle
            @reintentar="previsualizar"
          />
          <TablaReporte
            v-else-if="previa"
            :columnas="columnasPrevia"
            :filas="previa.filas"
            :total-filas="previa.total_filas"
            :totales="previa.totales"
            :pagina="1"
            :por-pagina="previa.filas.length || 10"
            :orden="[]"
            :cargando="previsualizando"
            compacta
          />
          <VProgressLinear
            v-else
            indeterminate
          />
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
