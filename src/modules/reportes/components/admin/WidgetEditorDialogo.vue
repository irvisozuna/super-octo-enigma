<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DefinicionWidget, FuenteResumen } from '../../types/admin'
import type { AnchoWidget, TipoWidget } from '../../types/tablero'
import type { FormatoColumna } from '../../types/reporte'
import { clavear } from '../../utils/texto'

const props = defineProps<{
  modelValue: boolean
  widget: DefinicionWidget | null
  fuentes: FuenteResumen[]
  clavesUsadas: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [abierto: boolean]
  'guardar': [widget: DefinicionWidget]
}>()

const { t } = useI18n()

const TIPOS: { value: TipoWidget; icono: string }[] = [
  { value: 'kpi', icono: 'tabler-123' },
  { value: 'pie', icono: 'tabler-chart-donut' },
  { value: 'bar', icono: 'tabler-chart-bar' },
  { value: 'line', icono: 'tabler-chart-line' },
  { value: 'table', icono: 'tabler-table' },
]

const AGREGACIONES = ['sum', 'count', 'avg', 'min', 'max'] as const
const FORMATOS_NUMERICOS: FormatoColumna[] = ['entero', 'decimal', 'moneda', 'porcentaje']
const FORMATOS: FormatoColumna[] = ['texto', 'entero', 'decimal', 'moneda', 'porcentaje', 'fecha', 'fechaHora', 'booleano', 'periodo']
const ANCHOS: AnchoWidget[] = [3, 4, 6, 12]
const ORDENES = ['metric_desc', 'metric_asc', 'dimension_asc', 'dimension_desc'] as const
const NUMERICOS = new Set(['integer', 'decimal', 'int', 'float', 'number'])

interface ConfigWidget {
  metric?: { column?: string; agg?: (typeof AGREGACIONES)[number]; format?: FormatoColumna; label?: string | null }
  dimension?: { column?: string; label?: string | null; order?: string[] }
  series?: { column?: string } | null
  limit?: number
  sort?: (typeof ORDENES)[number] | { column?: string; dir?: 'asc' | 'desc' } | null
  group_by?: string[]
  columns?: Record<string, unknown>[]
}

interface ColumnaTabla {
  column: string
  incluir: boolean
  label: string
  format: FormatoColumna
  agg: string | null
}

const tipo = ref<TipoWidget>('kpi')
const titulo = ref('')
const clave = ref('')
const claveEditada = ref(false)
const fuente = ref<string | null>(null)
const ancho = ref<AnchoWidget>(6)

const metricaColumna = ref<string | null>(null)
const metricaAgg = ref<(typeof AGREGACIONES)[number]>('sum')
const metricaFormato = ref<FormatoColumna>('decimal')
const metricaEtiqueta = ref('')
const dimensionColumna = ref<string | null>(null)
const dimensionEtiqueta = ref('')
const dimensionOrden = ref('')
const serieColumna = ref<string | null>(null)
const limite = ref<number | null>(null)
const orden = ref<(typeof ORDENES)[number]>('metric_desc')
const agruparPor = ref<string[]>([])
const columnasTabla = ref<ColumnaTabla[]>([])
const ordenTablaColumna = ref<string | null>(null)
const ordenTablaDir = ref<'asc' | 'desc'>('desc')

const fuentesAgregadas = computed(() => props.fuentes.filter(f => f.mode === 'materialize'))
const fuenteDef = computed(() => props.fuentes.find(f => f.key === fuente.value) ?? null)
const columnas = computed(() => fuenteDef.value?.columns.map(c => c.name) ?? [])
const columnasNumericas = computed(() => (fuenteDef.value?.columns ?? []).filter(c => NUMERICOS.has(String(c.type ?? ''))).map(c => c.name))
const esGrafica = computed(() => tipo.value === 'pie' || tipo.value === 'bar' || tipo.value === 'line')

const claveValida = computed(() => /^[a-z][a-z0-9_]{1,78}$/.test(clave.value) && !props.clavesUsadas.filter(k => k !== props.widget?.key).includes(clave.value))

const valido = computed(() => {
  if (!titulo.value.trim() || !fuente.value || !claveValida.value)
    return false
  if (tipo.value === 'kpi')
    return !!metricaColumna.value
  if (esGrafica.value)
    return !!metricaColumna.value && !!dimensionColumna.value
  if (tipo.value === 'table')
    return columnasTabla.value.some(c => c.incluir)

  return false
})

function reiniciarColumnasTabla(conservar: Record<string, unknown>[] = []) {
  const previas = new Map(conservar.map(c => [String(c.column), c]))

  columnasTabla.value = columnas.value.map(nombre => {
    const previa = previas.get(nombre)
    const numerica = columnasNumericas.value.includes(nombre)

    return {
      column: nombre,
      incluir: !!previa,
      label: String(previa?.label ?? nombre),
      format: (previa?.format as FormatoColumna | undefined) ?? (numerica ? 'decimal' : 'texto'),
      agg: (previa?.agg as string | null | undefined) ?? (numerica ? 'sum' : null),
    }
  })
}

function cargar(widget: DefinicionWidget | null) {
  tipo.value = widget?.type ?? 'kpi'
  titulo.value = widget?.title ?? ''
  clave.value = widget?.key ?? ''
  claveEditada.value = !!widget
  fuente.value = widget?.source ?? fuentesAgregadas.value[0]?.key ?? null
  ancho.value = widget?.width ?? (widget?.type === 'kpi' ? 3 : 6)

  const c = (widget?.config ?? {}) as ConfigWidget

  metricaColumna.value = c.metric?.column ?? null
  metricaAgg.value = c.metric?.agg ?? 'sum'
  metricaFormato.value = c.metric?.format ?? 'decimal'
  metricaEtiqueta.value = c.metric?.label ?? ''
  dimensionColumna.value = c.dimension?.column ?? null
  dimensionEtiqueta.value = c.dimension?.label ?? ''
  dimensionOrden.value = Array.isArray(c.dimension?.order) ? c.dimension.order.join(', ') : ''
  serieColumna.value = c.series?.column ?? null
  limite.value = c.limit ? Number(c.limit) : null
  orden.value = typeof c.sort === 'string' ? c.sort : 'metric_desc'
  agruparPor.value = Array.isArray(c.group_by) ? c.group_by : []
  ordenTablaColumna.value = c.sort && typeof c.sort === 'object' ? c.sort.column ?? null : null
  ordenTablaDir.value = c.sort && typeof c.sort === 'object' ? c.sort.dir ?? 'desc' : 'desc'
  reiniciarColumnasTabla(Array.isArray(c.columns) ? c.columns : [])
}

watch(() => props.modelValue, abierto => {
  if (abierto)
    cargar(props.widget)
})

watch(titulo, nuevo => {
  if (!claveEditada.value)
    clave.value = clavear(nuevo, 'w')
})

watch(fuente, (nuevo, anterior) => {
  if (anterior !== undefined && nuevo !== anterior) {
    metricaColumna.value = null
    dimensionColumna.value = null
    serieColumna.value = null
    agruparPor.value = []
    ordenTablaColumna.value = null
    reiniciarColumnasTabla()
  }
})

watch(tipo, nuevo => {
  if (nuevo === 'kpi' && ancho.value > 4)
    ancho.value = 3
  if (nuevo === 'table')
    ancho.value = 12
})

function construir(): DefinicionWidget {
  const metric = { column: metricaColumna.value ?? '', agg: metricaAgg.value, format: metricaFormato.value, label: metricaEtiqueta.value.trim() || null }
  let config: Record<string, unknown>

  if (tipo.value === 'kpi') {
    config = { metric }
  }
  else if (esGrafica.value) {
    const ordenLista = dimensionOrden.value.split(',').map(s => s.trim()).filter(Boolean)

    config = {
      dimension: { column: dimensionColumna.value, label: dimensionEtiqueta.value.trim() || null, order: ordenLista },
      metric,
      series: serieColumna.value ? { column: serieColumna.value } : null,
      limit: limite.value ?? 0,
      sort: orden.value,
    }
  }
  else {
    config = {
      group_by: agruparPor.value,
      columns: columnasTabla.value.filter(c => c.incluir).map(c => ({ column: c.column, label: c.label.trim() || c.column, format: c.format, agg: agruparPor.value.includes(c.column) ? null : c.agg })),
      sort: ordenTablaColumna.value ? { column: ordenTablaColumna.value, dir: ordenTablaDir.value } : null,
      limit: limite.value ?? 50,
    }
  }

  return {
    key: clave.value,
    type: tipo.value,
    title: titulo.value.trim(),
    source: fuente.value ?? '',
    width: ancho.value,
    sort_order: props.widget?.sort_order,
    config,
  }
}

function guardar() {
  if (!valido.value)
    return
  emit('guardar', construir())
  emit('update:modelValue', false)
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="860"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardItem>
        <VCardTitle>{{ widget ? t('reportes.admin.tableros.editarWidget') : t('reportes.admin.tableros.nuevoWidget') }}</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <VBtnToggle
              v-model="tipo"
              mandatory
              divided
              color="primary"
              variant="outlined"
              density="comfortable"
            >
              <VBtn
                v-for="opcion in TIPOS"
                :key="opcion.value"
                :value="opcion.value"
                :prepend-icon="opcion.icono"
              >
                {{ t(`reportes.admin.tableros.tipos.${opcion.value}`) }}
              </VBtn>
            </VBtnToggle>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="titulo"
              :label="t('reportes.admin.tableros.tituloWidget')"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <AppTextField
              v-model="clave"
              :label="t('reportes.admin.comunes.clave')"
              :error-messages="clave && !claveValida ? t('reportes.admin.comunes.claveInvalida') : undefined"
              @update:model-value="claveEditada = true"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <AppSelect
              v-model="ancho"
              :items="ANCHOS.map(a => ({ title: t(`reportes.admin.tableros.anchos.${a}`), value: a }))"
              :label="t('reportes.admin.tableros.ancho')"
            />
          </VCol>

          <VCol cols="12">
            <AppAutocomplete
              v-model="fuente"
              :items="fuentesAgregadas"
              item-title="name"
              item-value="key"
              :label="t('reportes.admin.comunes.fuente')"
              :hint="fuenteDef?.description ?? ''"
              persistent-hint
            />
          </VCol>

          <template v-if="tipo === 'kpi' || esGrafica">
            <VCol
              v-if="esGrafica"
              cols="12"
              md="6"
            >
              <AppAutocomplete
                v-model="dimensionColumna"
                :items="columnas"
                :label="t('reportes.admin.tableros.dimension')"
              />
            </VCol>
            <VCol
              v-if="esGrafica"
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="dimensionEtiqueta"
                :label="t('reportes.admin.tableros.dimensionEtiqueta')"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <AppAutocomplete
                v-model="metricaColumna"
                :items="columnasNumericas.length ? columnasNumericas : columnas"
                :label="t('reportes.admin.tableros.metrica')"
              />
            </VCol>
            <VCol
              cols="12"
              md="2"
            >
              <AppSelect
                v-model="metricaAgg"
                :items="AGREGACIONES.map(a => ({ title: t(`reportes.admin.tableros.agregaciones.${a}`), value: a }))"
                :label="t('reportes.admin.tableros.agregacion')"
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <AppSelect
                v-model="metricaFormato"
                :items="FORMATOS_NUMERICOS.map(f => ({ title: t(`reportes.admin.comunes.formatos.${f}`), value: f }))"
                :label="t('reportes.admin.comunes.formato')"
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <AppTextField
                v-model="metricaEtiqueta"
                :label="t('reportes.admin.tableros.metricaEtiqueta')"
              />
            </VCol>
          </template>

          <template v-if="esGrafica">
            <VCol
              cols="12"
              md="4"
            >
              <AppAutocomplete
                v-model="serieColumna"
                :items="columnas"
                :label="t('reportes.admin.tableros.serie')"
                clearable
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <AppSelect
                v-model="orden"
                :items="ORDENES.map(o => ({ title: t(`reportes.admin.tableros.ordenes.${o}`), value: o }))"
                :label="t('reportes.admin.tableros.orden')"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <AppTextField
                v-model.number="limite"
                type="number"
                min="0"
                :label="t('reportes.admin.tableros.limite')"
                :hint="t('reportes.admin.tableros.limiteAyuda')"
                persistent-hint
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="dimensionOrden"
                :label="t('reportes.admin.tableros.dimensionOrden')"
                :hint="t('reportes.admin.tableros.dimensionOrdenAyuda')"
                persistent-hint
              />
            </VCol>
          </template>

          <template v-if="tipo === 'table'">
            <VCol
              cols="12"
              md="6"
            >
              <AppAutocomplete
                v-model="agruparPor"
                :items="columnas"
                :label="t('reportes.admin.tableros.agruparPor')"
                multiple
                chips
                closable-chips
                clearable
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <AppAutocomplete
                v-model="ordenTablaColumna"
                :items="columnasTabla.filter(c => c.incluir).map(c => c.column)"
                :label="t('reportes.admin.tableros.orden')"
                clearable
              />
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <AppSelect
                v-model="ordenTablaDir"
                :items="[{ title: t('reportes.admin.comunes.descendente'), value: 'desc' }, { title: t('reportes.admin.comunes.ascendente'), value: 'asc' }]"
                :label="t('reportes.admin.comunes.direccion')"
              />
            </VCol>
            <VCol cols="12">
              <VTable density="compact">
                <thead>
                  <tr>
                    <th>{{ t('reportes.admin.comunes.incluir') }}</th>
                    <th>{{ t('reportes.admin.comunes.columna') }}</th>
                    <th>{{ t('reportes.admin.comunes.etiqueta') }}</th>
                    <th>{{ t('reportes.admin.comunes.formato') }}</th>
                    <th>{{ t('reportes.admin.tableros.agregacion') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="col in columnasTabla"
                    :key="col.column"
                  >
                    <td>
                      <VCheckbox
                        v-model="col.incluir"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td class="text-no-wrap">
                      {{ col.column }}
                    </td>
                    <td>
                      <AppTextField
                        v-model="col.label"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <AppSelect
                        v-model="col.format"
                        :items="FORMATOS.map(f => ({ title: t(`reportes.admin.comunes.formatos.${f}`), value: f }))"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <AppSelect
                        v-model="col.agg"
                        :items="[{ title: '—', value: null }, ...AGREGACIONES.map(a => ({ title: t(`reportes.admin.tableros.agregaciones.${a}`), value: a }))]"
                        :disabled="agruparPor.includes(col.column)"
                        density="compact"
                        hide-details
                      />
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <AppTextField
                v-model.number="limite"
                type="number"
                min="1"
                :label="t('reportes.admin.tableros.limiteFilas')"
              />
            </VCol>
          </template>
        </VRow>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('reportes.exportar.cancelar') }}
        </VBtn>
        <VBtn
          color="primary"
          :disabled="!valido"
          @click="guardar"
        >
          {{ t('reportes.admin.comunes.aceptar') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
