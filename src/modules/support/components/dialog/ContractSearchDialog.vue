<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/*
 * Búsqueda avanzada de contratos: texto libre (cuenta, nombre, medidor, RFC, dirección) y filtros por columna con
 * operador, paginada en el servidor. Elegir una fila carga el contrato en la ficha.
 */
type TipoColumna = 'text' | 'currency'
type Operador = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greater' | 'less' | 'range'

interface Filtro {
  column: string
  operator: Operador
  value: string
  value2: string
}

const props = defineProps<{ abierto: boolean }>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'seleccionado': []
}>()

const { t } = useI18n()
const notificar = useNotificacion()
const store = useContractStore()

const COLUMNAS: { clave: string; etiqueta: string; tipo: TipoColumna }[] = [
  { clave: 'account', etiqueta: 'cuenta', tipo: 'text' },
  { clave: 'clave_loc', etiqueta: 'clave', tipo: 'text' },
  { clave: 'measurer', etiqueta: 'medidor', tipo: 'text' },
  { clave: 'nameuser', etiqueta: 'nombre', tipo: 'text' },
  { clave: 'address', etiqueta: 'direccion', tipo: 'text' },
  { clave: 'neighborhood', etiqueta: 'colonia', tipo: 'text' },
  { clave: 'total_debt', etiqueta: 'adeudo', tipo: 'currency' },
]

const OPERADORES: Record<TipoColumna, Operador[]> = {
  text: ['contains', 'equals', 'startsWith', 'endsWith'],
  currency: ['equals', 'greater', 'less', 'range'],
}

const filas = ref<Record<string, unknown>[]>([])
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const pagina = ref(1)
const porPagina = 10
const total = ref(0)
const busqueda = ref('')
const filtros = ref<Filtro[]>([])
const mostrarFiltros = ref(false)
const columna = ref('')
const operador = ref<Operador | ''>('')
const valor = ref('')
const valor2 = ref('')
const eligiendo = ref<string | null>(null)
let peticion = 0
let temporizador: ReturnType<typeof setTimeout> | null = null

const etiquetaColumna = (clave: string) => t(`support.busqueda.columnas.${COLUMNAS.find(c => c.clave === clave)?.etiqueta ?? clave}`)
const etiquetaOperador = (op: string) => t(`support.busqueda.operadores.${op}`)
const tipoColumna = (clave: string): TipoColumna => COLUMNAS.find(c => c.clave === clave)?.tipo ?? 'text'

const opcionesColumna = computed(() => COLUMNAS.map(c => ({ value: c.clave, title: etiquetaColumna(c.clave) })))
const opcionesOperador = computed(() => (columna.value ? OPERADORES[tipoColumna(columna.value)].map(op => ({ value: op, title: etiquetaOperador(op) })) : []))
const esNumerica = computed(() => tipoColumna(columna.value) === 'currency')
const filtroValido = computed(() => !!columna.value && !!operador.value && !!valor.value.trim() && (operador.value !== 'range' || !!valor2.value.trim()))
const paginacion = computed(() => ({ pagina: pagina.value, porPagina, total: total.value }))

const columnas = computed<ColumnaTabla[]>(() => [
  { clave: 'account', titulo: etiquetaColumna('account'), formato: 'texto', ancho: 110 },
  { clave: 'clave_loc', titulo: etiquetaColumna('clave_loc'), formato: 'texto', ancho: 120 },
  { clave: 'measurer', titulo: etiquetaColumna('measurer'), formato: 'texto', ancho: 120 },
  { clave: 'nameuser', titulo: etiquetaColumna('nameuser'), formato: 'texto', truncar: true, anchoMin: 200 },
  { clave: 'address', titulo: etiquetaColumna('address'), formato: 'texto', truncar: true, anchoMin: 200 },
  { clave: 'neighborhood', titulo: etiquetaColumna('neighborhood'), formato: 'texto', truncar: true, ancho: 160 },
  { clave: 'total_debt', titulo: etiquetaColumna('total_debt'), formato: 'moneda', ancho: 130 },
  { clave: 'acciones', titulo: t('support.busqueda.columnas.acciones'), formato: 'personalizado', alineacion: 'end', ancho: 130 },
].map(c => ({ ...c, ordenable: false })))

function descripcionFiltro(f: Filtro): string {
  return `${etiquetaColumna(f.column)}: ${etiquetaOperador(f.operator).toLowerCase()} ${f.value}${f.operator === 'range' ? ` – ${f.value2}` : ''}`
}

async function cargar() {
  const n = ++peticion

  cargando.value = true
  error.value = null
  try {
    const parametros = {
      limit: porPagina,
      page: pagina.value,
      search: busqueda.value.trim(),
      filters: JSON.stringify(filtros.value.map(f => ({ field: f.column, operator: f.operator, value: f.value, value2: f.operator === 'range' ? f.value2 : undefined }))),
    }

    const r = await store.getContracts(parametros)
    if (n !== peticion)
      return
    const base = (pagina.value - 1) * porPagina

    filas.value = ((r?.data ?? []) as Record<string, unknown>[]).map((f, i) => ({ ...f, _k: base + i }))
    total.value = r?.pagination?.total ?? filas.value.length
  }
  catch (e) {
    if (n === peticion)
      error.value = normalizarError(e)
  }
  finally {
    if (n === peticion)
      cargando.value = false
  }
}

function desdeElInicio() {
  pagina.value = 1
  cargar()
}

function agregarFiltro() {
  if (!filtroValido.value || !operador.value)
    return
  filtros.value.push({ column: columna.value, operator: operador.value, value: valor.value.trim(), value2: valor2.value.trim() })
  columna.value = ''
  operador.value = ''
  valor.value = ''
  valor2.value = ''
  desdeElInicio()
}

function quitarFiltro(i: number) {
  filtros.value.splice(i, 1)
  desdeElInicio()
}

function limpiar() {
  filtros.value = []
  busqueda.value = ''
  desdeElInicio()
}

async function elegir(fila: Record<string, unknown>) {
  const cuenta = String(fila.account ?? '')
  if (!cuenta)
    return
  eligiendo.value = cuenta
  try {
    await store.getContract(cuenta)
    emit('seleccionado')
    emit('update:abierto', false)
  }
  catch (e) {
    notificar.error(e)
  }
  finally {
    eligiendo.value = null
  }
}

watch(busqueda, () => {
  if (temporizador)
    clearTimeout(temporizador)
  temporizador = setTimeout(desdeElInicio, 350)
})

watch(columna, () => {
  operador.value = ''
  valor.value = ''
  valor2.value = ''
})

watch(() => props.abierto, v => {
  if (v) {
    busqueda.value = ''
    filtros.value = []
    mostrarFiltros.value = false
    desdeElInicio()
  }
})
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.busqueda.titulo')"
    :subtitulo="t('support.busqueda.descripcion')"
    tamano="xl"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <AsBarraFiltros
      sin-tarjeta
      class="mb-3"
      :activos="filtros.length"
      @limpiar="limpiar"
    >
      <template #inicio>
        <VTextField
          v-model="busqueda"
          clearable
          autofocus
          prepend-inner-icon="tabler-search"
          :placeholder="t('support.busqueda.general')"
          :aria-label="t('support.busqueda.general')"
          class="as-filtro--lg busqueda__texto"
        />
      </template>
      <VBtn
        variant="text"
        size="small"
        :prepend-icon="mostrarFiltros ? 'tabler-chevron-up' : 'tabler-filter'"
        @click="mostrarFiltros = !mostrarFiltros"
      >
        {{ mostrarFiltros ? t('support.busqueda.menosFiltros') : t('support.busqueda.masFiltros') }}
      </VBtn>
    </AsBarraFiltros>

    <VExpandTransition>
      <VForm
        v-if="mostrarFiltros"
        class="busqueda__constructor mb-3"
        @submit.prevent="agregarFiltro"
      >
        <VSelect
          v-model="columna"
          :items="opcionesColumna"
          :label="t('support.busqueda.columna')"
          :aria-label="t('support.busqueda.columna')"
          density="compact"
          variant="outlined"
          hide-details
          class="busqueda__campo"
        />
        <VSelect
          v-model="operador"
          :items="opcionesOperador"
          :label="t('support.busqueda.operador')"
          :aria-label="t('support.busqueda.operador')"
          density="compact"
          variant="outlined"
          hide-details
          :disabled="!columna"
          class="busqueda__campo"
        />
        <VTextField
          v-model="valor"
          :label="operador === 'range' ? t('support.busqueda.desde') : t('support.busqueda.valor')"
          :aria-label="operador === 'range' ? t('support.busqueda.desde') : t('support.busqueda.valor')"
          :type="esNumerica ? 'number' : 'text'"
          density="compact"
          variant="outlined"
          hide-details
          :disabled="!operador"
          class="busqueda__campo"
        />
        <VTextField
          v-if="operador === 'range'"
          v-model="valor2"
          :label="t('support.busqueda.hasta')"
          :aria-label="t('support.busqueda.hasta')"
          :type="esNumerica ? 'number' : 'text'"
          density="compact"
          variant="outlined"
          hide-details
          class="busqueda__campo"
        />
        <AsBtnSecundario
          type="submit"
          prepend-icon="tabler-plus"
          :disabled="!filtroValido"
        >
          {{ t('support.busqueda.agregarFiltro') }}
        </AsBtnSecundario>
      </VForm>
    </VExpandTransition>

    <div
      v-if="filtros.length"
      class="d-flex flex-wrap gap-2 mb-3"
    >
      <VChip
        v-for="(f, i) in filtros"
        :key="`${f.column}-${i}`"
        label
        size="small"
        variant="tonal"
        color="primary"
        closable
        :close-label="t('support.busqueda.quitarFiltro', { filtro: etiquetaColumna(f.column) })"
        @click:close="quitarFiltro(i)"
      >
        {{ descripcionFiltro(f) }}
      </VChip>
    </div>

    <AsTablaDatos
      :columnas="columnas"
      :filas="filas"
      clave-fila="_k"
      densidad="media"
      :cargando="cargando"
      :error="error"
      :paginacion="paginacion"
      clic-fila
      :vacio-titulo="t('support.busqueda.sinResultados')"
      vacio-detalle=""
      vacio-icono="tabler-user-search"
      class="busqueda__tabla"
      @update:pagina="(p: number) => { pagina = p; cargar() }"
      @reintentar="cargar"
      @fila="elegir"
    >
      <template #celda-acciones="{ fila }">
        <VBtn
          size="small"
          variant="tonal"
          color="primary"
          :loading="eligiendo === String(fila.account)"
          @click.stop="elegir(fila)"
        >
          {{ t('support.busqueda.seleccionar') }}
        </VBtn>
      </template>
    </AsTablaDatos>
  </AsDialogo>
</template>

<style scoped>
.busqueda__texto {
  min-inline-size: var(--as-ancho-filtro-lg);
}

.busqueda__constructor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: var(--as-sp-3);
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface-variant));
  gap: var(--as-sp-2);
}

.busqueda__campo {
  flex: 1 1 var(--as-ancho-filtro-sm);
  max-inline-size: var(--as-ancho-filtro-md);
}

.busqueda__tabla :deep(.as-tabla__td--truncar) {
  max-inline-size: var(--as-ancho-filtro-lg);
}
</style>
