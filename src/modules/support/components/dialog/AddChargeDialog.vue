<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { decimal, moneda } from '@/utils/formato'

/*
 * Cargos adicionales al contrato: se arma una lista (servicio, precio sin IVA, cantidad) y se guarda de una vez en
 * Aquasoft Comercial por la API. El total de cada línea incluye el IVA del servicio.
 */
interface Servicio {
  rowid: string | number
  name: string
  tva_tx: number
  price: number
}

interface Cargo {
  _k: number
  id: string | number
  name: string
  tva_tx: number
  price: number
  quantity: number
  total: number
}

const props = defineProps<{ abierto: boolean }>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'guardado': []
}>()

const { t } = useI18n()
const notificar = useNotificacion()
const store = useContractStore()
const { aquasoft_id: usuarioAquasoft } = (useCookie('userData').value ?? {}) as { aquasoft_id?: string }

const servicios = ref<Servicio[]>([])
const servicio = ref<Servicio | null>(null)
const iva = ref(16)
const precio = ref('')
const cantidad = ref(1)
const cargos = ref<Cargo[]>([])
const guardando = ref(false)
let secuencia = 0

const columnas = computed<ColumnaTabla<Cargo>[]>(() => [
  { clave: 'name', titulo: t('support.cargo.servicio'), formato: 'texto', ordenable: false },
  { clave: 'tva_tx', titulo: t('support.cargo.iva'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 80 },
  { clave: 'price', titulo: t('support.cargo.precio'), formato: 'moneda', ordenable: false, ancho: 140 },
  { clave: 'quantity', titulo: t('support.cargo.cantidad'), formato: 'entero', ordenable: false, ancho: 100 },
  { clave: 'total', titulo: t('support.cargo.total'), formato: 'moneda', ordenable: false, ancho: 140 },
  { clave: 'acciones', titulo: '', formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 64 },
])

const totales = computed(() => (cargos.value.length
  ? { quantity: cargos.value.reduce((s, c) => s + c.quantity, 0), total: cargos.value.reduce((s, c) => s + c.total, 0) }
  : null))

const lineaValida = computed(() => !!servicio.value && Number.parseFloat(String(precio.value).replace(',', '.')) >= 0 && Number.parseInt(String(cantidad.value), 10) > 0)

function limpiarLinea() {
  servicio.value = null
  iva.value = 16
  precio.value = ''
  cantidad.value = 1
}

function alElegirServicio(s: Servicio | null) {
  if (!s) {
    limpiarLinea()

    return
  }
  iva.value = s.tva_tx ?? 16
  precio.value = s.price?.toString() ?? ''
}

function agregar() {
  if (!servicio.value || !lineaValida.value)
    return
  const base = Number.parseFloat(String(precio.value).replace(',', '.')) || 0
  const n = Number.parseInt(String(cantidad.value), 10)
  const tasa = (iva.value ?? 16) / 100

  cargos.value.push({ _k: ++secuencia, id: servicio.value.rowid, name: servicio.value.name || '—', tva_tx: iva.value ?? 16, price: base, quantity: n, total: base * (1 + tasa) * n })
  limpiarLinea()
}

function quitar(c: Cargo) {
  cargos.value = cargos.value.filter(x => x._k !== c._k)
}

async function guardar() {
  if (!cargos.value.length) {
    notificar.aviso(t('support.cargo.sinCargos'))

    return
  }
  if (!usuarioAquasoft) {
    notificar.error(t('support.cargo.sinSesion'))

    return
  }
  guardando.value = true
  try {
    const respuesta = await store.createItem({
      charges: cargos.value.map(({ _k: _, ...c }) => c),
      account: store.item?.account,
      token: useCookie('dolibarrToken').value,
      user_id: usuarioAquasoft,
    } as never, '/charges')

    notificar.exito((respuesta as { message?: string })?.message || t('support.cargo.guardados'))
    emit('update:abierto', false)
    emit('guardado')
  }
  catch (e) {
    notificar.error(e, t('support.cargo.errorGuardar'))
  }
  finally {
    guardando.value = false
  }
}

watch(() => props.abierto, v => {
  if (v) {
    cargos.value = []
    limpiarLinea()
  }
})
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.cargo.titulo')"
    :subtitulo="store.item ? `${store.item.account} · ${store.item.nameuser}` : undefined"
    tamano="lg"
    :cargando="guardando"
    :texto-confirmar="t('save')"
    :desactivar-confirmar="!cargos.length"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
    @confirmar="guardar"
  >
    <VForm
      class="cargo__linea"
      @submit.prevent="agregar"
    >
      <ApiDataSource
        api-path="supports/getServices"
        @loaded="(r: Servicio[]) => { servicios = r }"
      >
        <template #default="{ loading }">
          <VAutocomplete
            v-model="servicio"
            :items="servicios"
            item-title="name"
            item-value="rowid"
            :label="t('support.cargo.servicio')"
            :aria-label="t('support.cargo.servicio')"
            density="compact"
            hide-details
            return-object
            clearable
            :loading="loading"
            class="cargo__servicio"
            @update:model-value="alElegirServicio"
          />
        </template>
      </ApiDataSource>
      <VTextField
        :model-value="`${decimal(iva, 0)} %`"
        :label="t('support.cargo.iva')"
        :aria-label="t('support.cargo.iva')"
        density="compact"
        hide-details
        readonly
        class="cargo__corto"
      />
      <VTextField
        v-model="precio"
        :label="t('support.cargo.precio')"
        :aria-label="t('support.cargo.precio')"
        density="compact"
        hide-details
        inputmode="decimal"
        prefix="$"
        class="cargo__medio"
      />
      <VTextField
        v-model="cantidad"
        :label="t('support.cargo.cantidad')"
        :aria-label="t('support.cargo.cantidad')"
        type="number"
        min="1"
        density="compact"
        hide-details
        class="cargo__corto"
      />
      <AsBtnSecundario
        type="submit"
        prepend-icon="tabler-plus"
        :disabled="!lineaValida"
      >
        {{ t('support.cargo.agregar') }}
      </AsBtnSecundario>
    </VForm>

    <AsTablaDatos
      sin-tarjeta
      ocultar-pie
      densidad="media"
      :columnas="columnas"
      :filas="cargos"
      clave-fila="_k"
      :por-pagina="-1"
      :totales="totales"
      :vacio-titulo="t('support.cargo.listaVacia')"
      vacio-detalle=""
      vacio-icono="tabler-receipt-2"
      class="mt-4 cargo__tabla"
    >
      <template #celda-tva_tx="{ fila }">
        <span class="as-num">{{ decimal(fila.tva_tx, 0) }} %</span>
      </template>
      <template #celda-acciones="{ fila }">
        <VBtn
          icon="tabler-trash"
          size="small"
          variant="text"
          color="error"
          :title="t('support.cargo.quitar')"
          :aria-label="t('support.cargo.quitar')"
          @click="quitar(fila as Cargo)"
        />
      </template>
    </AsTablaDatos>
    <p
      v-if="totales"
      class="as-secundario text-end mt-2 mb-0 as-num"
    >
      {{ t('support.cargo.totales') }}: {{ moneda(totales.total) }}
    </p>
  </AsDialogo>
</template>

<style scoped>
.cargo__linea {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-2);
}

.cargo__servicio {
  flex: 1 1 var(--as-ancho-filtro-lg);
  min-inline-size: var(--as-ancho-filtro-md);
}

.cargo__medio {
  flex: 0 1 var(--as-ancho-filtro-sm);
}

.cargo__corto {
  flex: 0 1 calc(var(--as-ancho-filtro-sm) * 0.7);
}

.cargo__tabla {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
}
</style>
