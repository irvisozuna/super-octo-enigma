<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VDataTable, VDataTableServer, VDataTableVirtual } from 'vuetify/components/VDataTable'
import AsEstado from './AsEstado.vue'
import type { ColumnaTabla, DensidadTabla, OrdenTabla, PaginacionTabla } from './tipos'
import type { ErrorReporte } from '@/services/errores'
import { decimal, esNumerico, porFormato, porcentaje } from '@/utils/formato'

/*
 * Tabla de datos del sistema de diseño, sobre VDataTable / VDataTableVirtual / VDataTableServer:
 *  - columnas tipadas: formato (entero, decimal, moneda, porcentaje, fecha, fechaHora, hora, estado…), alineación
 *    automática (cifras a la derecha con dígitos tabulares), truncado con título, descripción en el encabezado;
 *  - densidad 44 / 40 / 36 px, encabezado legible y fijo, desplazamiento horizontal con sombra y aviso;
 *  - estados integrados: cargando (esqueleto), vacío, error con reintentar;
 *  - selección de fila, clic de fila, totales y paginación del lado del cliente o del servidor.
 * Las celdas se pueden sustituir con el slot `celda-<clave>` ({ fila, valor, texto }).
 */
type Fila = Record<string, any>

const props = withDefaults(defineProps<{
  columnas: ColumnaTabla<any>[]
  filas?: Fila[]
  claveFila?: string
  densidad?: DensidadTabla
  cargando?: boolean
  error?: ErrorReporte | null
  titulo?: string
  subtitulo?: string

  /** Sin tarjeta alrededor (cuando ya va dentro de una). */
  sinTarjeta?: boolean

  /** Con altura: encabezado fijo y cuerpo desplazable. */
  altura?: number | string

  /** Filas virtualizadas (miles de filas sin paginar). Requiere altura. */
  virtual?: boolean
  orden?: OrdenTabla
  seleccionada?: string | number | null
  clicFila?: boolean

  /** Paginación del lado del servidor; sin ella, pagina en el cliente con `porPagina`. */
  paginacion?: PaginacionTabla | null

  /** Filas por página en el cliente; -1 muestra todas. */
  porPagina?: number
  totales?: Fila | null
  vacioTitulo?: string
  vacioDetalle?: string
  vacioIcono?: string
  busqueda?: string
  placeholderBusqueda?: string
  ocultarPie?: boolean
  mostrarDetalleError?: boolean
}>(), { filas: () => [], claveFila: 'id', densidad: 'estandar', porPagina: 25, paginacion: null })

const emit = defineEmits<{
  'fila': [fila: Fila]
  'update:orden': [orden: OrdenTabla]
  'update:pagina': [pagina: number]
  'update:busqueda': [texto: string]
  'reintentar': []
}>()

const { t, n } = useI18n()
const raiz = ref<HTMLElement | { $el: HTMLElement } | null>(null)

/** La raíz puede ser una VCard (instancia) o un div: siempre devuelve el elemento. */
function elementoRaiz(): HTMLElement | null {
  const r = raiz.value

  return r ? ('$el' in r ? r.$el : r) : null
}
const desborda = ref(false)
const paginaCliente = ref(1)
let observador: ResizeObserver | null = null

function esNumerica(col: ColumnaTabla): boolean {
  return col.formato !== undefined && col.formato !== 'estado' && col.formato !== 'personalizado' && esNumerico(col.formato)
}

const headers = computed(() => props.columnas.map(col => {
  const numerica = esNumerica(col)
  const align = col.alineacion ?? (numerica ? 'end' : 'start')

  return {
    title: col.titulo,
    key: col.clave,
    sortable: col.ordenable ?? true,
    align: align as 'start' | 'center' | 'end',
    width: col.ancho,
    minWidth: col.anchoMin ? `${col.anchoMin}px` : undefined,
    nowrap: true,
    headerProps: { class: ['as-tabla__th', numerica && 'as-tabla__th--num'].filter(Boolean).join(' '), title: col.descripcion },
    cellProps: { class: ['as-tabla__td', numerica && 'as-num', col.truncar && 'as-tabla__td--truncar'].filter(Boolean).join(' ') },
  }
}))

const componente = computed(() => (props.paginacion ? VDataTableServer : props.virtual ? VDataTableVirtual : VDataTable))
const total = computed(() => props.paginacion?.total ?? props.filas.length)
const porPaginaEfectivo = computed(() => props.paginacion?.porPagina ?? props.porPagina)
const paginas = computed(() => (porPaginaEfectivo.value > 0 ? Math.max(1, Math.ceil(total.value / porPaginaEfectivo.value)) : 1))
const pagina = computed(() => props.paginacion?.pagina ?? paginaCliente.value)
const conPaginacion = computed(() => !props.virtual && paginas.value > 1)
const vacia = computed(() => !props.cargando && !props.error && props.filas.length === 0)

const propsTabla = computed(() => {
  const base: Record<string, unknown> = {
    headers: headers.value,
    items: props.filas,
    itemValue: props.claveFila,
    density: 'compact',
    hover: true,
    loading: props.cargando && props.filas.length > 0,
    sortBy: props.orden,
    fixedHeader: props.altura !== undefined,
    height: props.altura,
    class: 'as-tabla__nativa',
    rowProps: ({ item }: { item: Fila }) => ({
      class: {
        'as-tabla__fila--activa': props.seleccionada !== null && props.seleccionada !== undefined && item[props.claveFila] === props.seleccionada,
        'as-tabla__fila--clic': props.clicFila,
      },
    }),
  }

  if (props.paginacion)
    Object.assign(base, { itemsLength: props.paginacion.total, page: props.paginacion.pagina, itemsPerPage: props.paginacion.porPagina, hideDefaultFooter: true })

  else if (!props.virtual)
    Object.assign(base, { itemsPerPage: props.porPagina, page: paginaCliente.value, hideDefaultFooter: true })

  return base
})

function valorDe(fila: Fila, clave: string): unknown {
  return clave.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Fila)[k] : undefined), fila)
}

function textoCelda(col: ColumnaTabla, valor: unknown, fila: Fila): string {
  if (col.formato === 'estado')
    return col.textoEstado ? col.textoEstado(valor, fila) : String(valor ?? '—')
  if (col.formato === 'personalizado')
    return valor === null || valor === undefined ? '—' : String(valor)
  if (col.formato === 'decimal' && col.decimales !== undefined)
    return decimal(valor, col.decimales)
  if (col.formato === 'porcentaje' && col.decimales !== undefined)
    return porcentaje(valor, col.decimales)

  return porFormato(valor, col.formato ?? 'texto')
}

function colorEstado(col: ColumnaTabla, valor: unknown, fila: Fila): string {
  return col.colorEstado ? col.colorEstado(valor, fila) : 'secondary'
}

function alClicFila(_e: Event, { item }: { item: Fila }) {
  if (props.clicFila)
    emit('fila', item)
}

function cambiarPagina(p: number) {
  if (props.paginacion)
    emit('update:pagina', p)
  else
    paginaCliente.value = p
}

function medirDesborde() {
  const envoltura = elementoRaiz()?.querySelector('.v-table__wrapper')

  desborda.value = !!envoltura && envoltura.scrollWidth > envoltura.clientWidth + 2
}

onMounted(() => {
  const envoltura = elementoRaiz()?.querySelector('.v-table__wrapper')
  if (envoltura && 'ResizeObserver' in window) {
    observador = new ResizeObserver(medirDesborde)
    observador.observe(envoltura)
  }
  medirDesborde()
})

watch(() => [props.filas, props.columnas], () => nextTick(medirDesborde), { deep: false })
watch(() => props.filas.length, () => {
  if (!props.paginacion && paginaCliente.value > paginas.value)
    paginaCliente.value = 1
})

onBeforeUnmount(() => observador?.disconnect())

const textoFilas = computed(() => (total.value === 1 ? t('as.tabla.fila') : t('as.tabla.filas', { n: n(total.value) })))
</script>

<template>
  <component
    :is="sinTarjeta ? 'div' : 'VCard'"
    ref="raiz"
    class="as-tabla"
    :class="[`as-tabla--${densidad}`, { 'as-tarjeta': !sinTarjeta, 'as-tabla--desborda': desborda }]"
    v-bind="sinTarjeta ? {} : { variant: 'flat' }"
  >
    <div
      v-if="titulo || $slots.encabezado || $slots['encabezado-acciones'] || busqueda !== undefined"
      class="as-tabla__encabezado"
    >
      <div class="as-tabla__titulos">
        <slot name="encabezado">
          <h2
            v-if="titulo"
            class="as-tabla__titulo mb-0"
          >
            {{ titulo }}
            <span class="as-tabla__conteo as-num text-medium-emphasis">{{ n(total) }}</span>
          </h2>
          <div
            v-if="subtitulo"
            class="text-caption text-medium-emphasis"
          >
            {{ subtitulo }}
          </div>
        </slot>
      </div>
      <div class="d-flex flex-wrap align-center gap-2">
        <VTextField
          v-if="busqueda !== undefined"
          :model-value="busqueda"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="tabler-search"
          :placeholder="placeholderBusqueda ?? t('as.tabla.buscar')"
          class="as-tabla__buscar"
          @update:model-value="(v: string | null) => emit('update:busqueda', v ?? '')"
        />
        <slot name="encabezado-acciones" />
      </div>
    </div>

    <AsEstado
      v-if="error && filas.length === 0"
      tipo="error"
      :error="error"
      :mostrar-detalle="mostrarDetalleError"
      class="ma-4"
      @reintentar="emit('reintentar')"
    />
    <AsEstado
      v-else-if="cargando && filas.length === 0"
      tipo="cargando"
      :filas="5"
    />
    <AsEstado
      v-else-if="vacia"
      tipo="vacio"
      :titulo="vacioTitulo"
      :detalle="vacioDetalle"
      :icono="vacioIcono"
    >
      <template
        v-if="$slots['vacio-acciones']"
        #acciones
      >
        <slot name="vacio-acciones" />
      </template>
    </AsEstado>

    <component
      :is="componente"
      v-else
      v-bind="propsTabla"
      @update:sort-by="(v: OrdenTabla) => emit('update:orden', v)"
      @click:row="alClicFila"
    >
      <template
        v-for="col in columnas"
        :key="col.clave"
        #[`item.${col.clave}`]="{ item, value }"
      >
        <slot
          :name="`celda-${col.clave}`"
          :fila="item"
          :valor="value ?? valorDe(item, col.clave)"
          :texto="textoCelda(col, value ?? valorDe(item, col.clave), item)"
        >
          <VChip
            v-if="col.formato === 'estado'"
            label
            size="small"
            variant="tonal"
            :color="colorEstado(col, value ?? valorDe(item, col.clave), item)"
          >
            {{ textoCelda(col, value ?? valorDe(item, col.clave), item) }}
          </VChip>
          <span
            v-else-if="col.truncar"
            class="as-tabla__truncado d-block text-truncate"
            :title="textoCelda(col, value ?? valorDe(item, col.clave), item)"
          >{{ textoCelda(col, value ?? valorDe(item, col.clave), item) }}</span>
          <template v-else>
            {{ textoCelda(col, value ?? valorDe(item, col.clave), item) }}
          </template>
        </slot>
      </template>

      <template
        v-if="totales"
        #body.append
      >
        <tr class="as-tabla__totales">
          <td
            v-for="(col, i) in columnas"
            :key="col.clave"
            :class="[esNumerica(col) ? 'text-end as-num' : '', `v-data-table-column--align-${col.alineacion ?? (esNumerica(col) ? 'end' : 'start')}`]"
          >
            <template v-if="i === 0 && totales[col.clave] === undefined">
              {{ t('as.tabla.totales') }}
            </template>
            <template v-else-if="totales[col.clave] !== undefined">
              {{ textoCelda(col, totales[col.clave], totales) }}
            </template>
          </td>
        </tr>
      </template>

      <template #loading>
        <AsEstado
          tipo="cargando"
          :filas="5"
        />
      </template>
    </component>

    <div
      v-if="!ocultarPie && !vacia && !(error && filas.length === 0)"
      class="as-tabla__pie"
    >
      <div class="d-flex flex-wrap align-center gap-3 text-caption text-medium-emphasis">
        <span class="as-num">{{ textoFilas }}</span>
        <span
          v-if="desborda"
          class="d-inline-flex align-center gap-1"
        >
          <VIcon
            icon="tabler-arrows-horizontal"
            size="14"
          />{{ t('as.tabla.desplazar') }}
        </span>
        <slot name="pie" />
      </div>
      <VPagination
        v-if="conPaginacion"
        :model-value="pagina"
        :length="paginas"
        density="compact"
        variant="text"
        :total-visible="7"
        @update:model-value="cambiarPagina"
      />
    </div>
  </component>
</template>

<style scoped>
.as-tabla {
  display: flex;
  overflow: hidden;
  flex-direction: column;
}

.as-tabla__encabezado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-sp-2) var(--as-sp-3);
  padding-block: var(--as-sp-3) var(--as-sp-2);
  padding-inline: var(--as-sp-4);
}

.as-tabla__titulos {
  min-inline-size: 0;
}

.as-tabla__titulo {
  display: flex;
  align-items: baseline;
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-semi);
  gap: var(--as-sp-2);
  line-height: 1.4;
}

.as-tabla__conteo {
  font-size: var(--as-fs-sm);
  font-weight: var(--as-peso-normal);
}

.as-tabla__buscar {
  inline-size: var(--as-ancho-filtro-lg);
  max-inline-size: 100%;
}

/* Densidad: la fila y el encabezado se controlan con las variables de Vuetify */
.as-tabla--estandar :deep(.v-table) {
  --v-table-header-height: 40px;
  --v-table-row-height: var(--as-fila);
}

.as-tabla--media :deep(.v-table) {
  --v-table-header-height: 36px;
  --v-table-row-height: var(--as-fila-media);
}

.as-tabla--densa :deep(.v-table) {
  --v-table-header-height: 32px;
  --v-table-row-height: var(--as-fila-densa);

  font-size: var(--as-fs-sm);
}

.as-tabla :deep(.v-table) {
  font-size: var(--as-fs-base);
}

/* Encabezado legible: 12 px, semibold, mayúsculas con poco tracking, una sola línea */
.as-tabla :deep(th) {
  background: rgb(var(--v-theme-surface-tabla-cabecera));
  border-block-end: var(--as-borde);
  color: rgb(var(--v-theme-on-surface-tabla-cabecera));
  font-size: var(--as-fs-xs);
  font-weight: var(--as-peso-semi);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.as-tabla :deep(th .v-data-table-header__content) {
  gap: var(--as-sp-1);
}

.as-tabla :deep(th.v-data-table-column--align-end .v-data-table-header__content) {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.as-tabla :deep(td),
.as-tabla :deep(th) {
  padding-inline: var(--as-sp-3);
}

.as-tabla :deep(td:first-child),
.as-tabla :deep(th:first-child) {
  padding-inline-start: var(--as-sp-4);
}

.as-tabla :deep(td:last-child),
.as-tabla :deep(th:last-child) {
  padding-inline-end: var(--as-sp-4);
}

.as-tabla :deep(td) {
  border-block-end: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.as-tabla :deep(tbody tr:last-child td) {
  border-block-end: 0;
}

.as-tabla :deep(.as-tabla__fila--clic) {
  cursor: pointer;
}

.as-tabla :deep(.as-tabla__fila--activa td) {
  background: rgb(var(--v-theme-surface-resaltada));
}

.as-tabla__truncado {
  max-inline-size: 100%;
}

.as-tabla :deep(.as-tabla__td--truncar) {
  max-inline-size: 320px;
}

.as-tabla :deep(.as-tabla__totales td) {
  background: rgb(var(--v-theme-surface-variant));
  border-block-start: var(--as-borde);
  font-weight: var(--as-peso-semi);
}

/* Desplazamiento horizontal: sombras en los bordes que avisan que hay más columnas */
.as-tabla :deep(.v-table__wrapper) {
  overflow: auto;
  background:
    linear-gradient(to right, rgb(var(--v-theme-surface)) 30%, rgba(var(--v-theme-surface), 0)),
    linear-gradient(to left, rgb(var(--v-theme-surface)) 30%, rgba(var(--v-theme-surface), 0)) 100% 0,
    radial-gradient(farthest-side at 0 50%, rgba(var(--v-shadow-key-umbra-color), 0.16), transparent),
    radial-gradient(farthest-side at 100% 50%, rgba(var(--v-shadow-key-umbra-color), 0.16), transparent) 100% 0;
  background-attachment: local, local, scroll, scroll;
  background-repeat: no-repeat;
  background-size: 40px 100%, 40px 100%, 12px 100%, 12px 100%;
}

.as-tabla__pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  border-block-start: var(--as-borde);
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-4);
}
</style>
