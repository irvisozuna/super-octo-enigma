<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSeguimiento } from '../composables/useSeguimiento'
import { obtenerCatalogos } from '../services/carteraApi'
import type { AccionSeguimiento, CandidataSeguimiento, OrdenSeguimiento } from '../types/cartera'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { fecha, fechaHoraCorta, moneda } from '@/utils/formato'

/*
 * Seguimiento (XEL1-659): las notificaciones entregadas que no se pagaron y el siguiente paso con cada una. Las órdenes
 * de seguimiento abiertas se cierran aquí mismo como atendidas o canceladas.
 */
const { t } = useI18n()
const notificar = useNotificacion()
const s = useSeguimiento()
const vista = ref<'sin_pago' | 'ordenes'>('sin_pago')
const notificadores = ref<{ value: string; title: string }[]>([])

const accion = ref<AccionSeguimiento | null>(null)
const motivo = ref('')
const notificador = ref<string | null>(null)
const cierre = ref<{ orden: OrdenSeguimiento; estado: 'atendida' | 'cancelada' } | null>(null)
const nota = ref('')

const puedeOperar = computed(() => s.datos.value?.puede_operar ?? false)
const todas = computed(() => s.candidatas.value.length > 0 && s.seleccion.value.size === s.candidatas.value.length)
const NOMBRE_ACCION: Record<AccionSeguimiento, string> = { orden: 'cartera.seguimiento.orden', segunda: 'cartera.seguimiento.segunda', descartada: 'cartera.seguimiento.descartar' }
const listoAccion = computed(() => !!motivo.value.trim() && (accion.value !== 'segunda' || !!notificador.value))

const columnas: ColumnaTabla<CandidataSeguimiento>[] = [
  { clave: 'marca', titulo: '', formato: 'personalizado', ordenable: false, ancho: 48 },
  { clave: 'ref', titulo: t('cartera.comun.referencia'), formato: 'personalizado', ancho: 150 },
  { clave: 'cuenta', titulo: t('cartera.comun.cuenta'), formato: 'personalizado', ancho: 120 },
  { clave: 'notificador', titulo: t('cartera.comun.notificador'), formato: 'texto', truncar: true, anchoMin: 180 },
  { clave: 'entregada', titulo: t('cartera.seguimiento.entregada'), formato: 'personalizado', ancho: 150 },
  { clave: 'dias', titulo: t('cartera.seguimiento.dias'), formato: 'entero', ancho: 80 },
  { clave: 'adeudo_actual', titulo: t('cartera.seguimiento.adeudoActual'), formato: 'personalizado', ancho: 150 },
]

const columnasOrdenes: ColumnaTabla<OrdenSeguimiento>[] = [
  { clave: 'cuenta', titulo: t('cartera.comun.cuenta'), formato: 'personalizado', ancho: 130 },
  { clave: 'notificacion', titulo: t('cartera.comun.referencia'), formato: 'personalizado', ancho: 150, ordenable: false },
  { clave: 'motivo', titulo: t('cartera.seguimiento.motivo'), formato: 'texto', truncar: true, anchoMin: 220 },
  { clave: 'abierta_en', titulo: t('cartera.seguimiento.abierta'), formato: 'personalizado', ancho: 160 },
  { clave: 'acciones', titulo: '', formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 220 },
]

function abrirAccion(a: AccionSeguimiento) {
  accion.value = a
  motivo.value = ''
}

async function confirmarAccion() {
  if (!accion.value || !listoAccion.value)
    return
  const r = await s.aplicar(accion.value, motivo.value, notificador.value)
  if (!r)
    return
  accion.value = null
  notificar.exito(r.lote ? t('cartera.seguimiento.loteGenerado', { ref: r.lote.ref ?? '' }) : t('cartera.seguimiento.aplicadas', { n: r.aplicadas }))
  if (r.errores.length)
    notificar.aviso(t('cartera.seguimiento.noAplicadas', { n: r.errores.length }))
}

function abrirCierre(orden: OrdenSeguimiento, estado: 'atendida' | 'cancelada') {
  cierre.value = { orden, estado }
  nota.value = ''
}

async function confirmarCierre() {
  if (cierre.value && await s.cerrar(cierre.value.orden.id, cierre.value.estado, nota.value)) {
    cierre.value = null
    notificar.exito(t('cartera.seguimiento.cerrada'))
  }
}

onMounted(async () => {
  await s.cargar()

  const c = await obtenerCatalogos().catch(() => null)

  notificadores.value = (c?.notificadores ?? []).map(a => ({ value: a.id, title: a.nombre }))
})
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('cartera.seguimiento.titulo')"
      :descripcion="t('cartera.seguimiento.descripcion')"
    >
      <template
        v-if="s.datos.value"
        #contexto
      >
        <span class="as-secundario">{{ t('cartera.seguimiento.regla', { dias: s.datos.value.dias }) }}</span>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="s.error.value && !s.datos.value"
      tipo="error"
      :error="s.error.value"
      @reintentar="s.cargar()"
    />
    <template v-else>
      <VAlert
        v-if="s.datos.value && !puedeOperar"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ t('cartera.seguimiento.soloLectura') }}
      </VAlert>
      <VAlert
        v-if="s.errorAccion.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
        closable
        @click:close="s.errorAccion.value = null"
      >
        {{ s.errorAccion.value.mensaje }}
      </VAlert>

      <VChipGroup
        v-model="vista"
        mandatory
        class="mb-3"
      >
        <VChip
          value="sin_pago"
          filter
        >
          {{ t('cartera.seguimiento.sinPago') }} · <span class="as-num">{{ s.candidatas.value.length }}</span>
        </VChip>
        <VChip
          value="ordenes"
          filter
        >
          {{ t('cartera.seguimiento.enSeguimiento') }} · <span class="as-num">{{ s.ordenes.value.length }}</span>
        </VChip>
      </VChipGroup>

      <AsTablaDatos
        v-if="vista === 'sin_pago'"
        :columnas="puedeOperar ? columnas : columnas.slice(1)"
        :filas="s.candidatas.value"
        clave-fila="id"
        densidad="media"
        :cargando="s.cargando.value"
        :por-pagina="50"
        :vacio-titulo="t('cartera.seguimiento.sinCandidatas')"
        vacio-detalle=""
        vacio-icono="tabler-circle-check"
      >
        <template
          v-if="puedeOperar"
          #encabezado-acciones
        >
          <VCheckbox
            :model-value="todas"
            :indeterminate="!todas && s.seleccion.value.size > 0"
            :disabled="!s.candidatas.value.length"
            density="compact"
            hide-details
            :label="t('cartera.notificar.marcarTodas')"
            @update:model-value="(v: boolean | null) => s.marcarTodas(!!v)"
          />
        </template>
        <template #celda-marca="{ fila }">
          <VCheckboxBtn
            :model-value="s.seleccion.value.has(fila.id)"
            density="compact"
            :aria-label="fila.ref"
            @update:model-value="s.alternar(fila.id)"
          />
        </template>
        <template #celda-ref="{ fila }">
          <span class="as-num">{{ fila.ref }}</span>
          <div class="as-secundario">
            {{ fila.estado }}
          </div>
        </template>
        <template #celda-cuenta="{ fila }">
          <span class="as-num">{{ fila.cuenta ?? fila.contrato }}</span>
        </template>
        <template #celda-entregada="{ fila }">
          <span class="as-num">{{ fecha(fila.entregada) }}</span>
        </template>
        <template #celda-adeudo_actual="{ fila }">
          <span class="as-num">{{ moneda(fila.adeudo_actual) }}</span>
          <div class="as-secundario as-num">
            {{ t('cartera.seguimiento.adeudoNotificado', { importe: moneda(fila.adeudo_notificado) }) }}
          </div>
        </template>
      </AsTablaDatos>

      <AsTablaDatos
        v-else
        :columnas="columnasOrdenes"
        :filas="s.ordenes.value"
        clave-fila="id"
        densidad="media"
        :cargando="s.cargando.value"
        :vacio-titulo="t('cartera.seguimiento.sinOrdenes')"
        vacio-detalle=""
        vacio-icono="tabler-clipboard-check"
      >
        <template #celda-cuenta="{ fila }">
          <span class="as-num">{{ fila.cuenta ?? fila.contrato }}</span>
        </template>
        <template #celda-notificacion="{ fila }">
          <span class="as-num">{{ fila.notificacion.ref }}</span>
        </template>
        <template #celda-abierta_en="{ fila }">
          <span class="as-num">{{ fechaHoraCorta(fila.abierta_en) }}</span>
        </template>
        <template #celda-acciones="{ fila }">
          <div
            v-if="puedeOperar"
            class="d-flex justify-end gap-1"
          >
            <VBtn
              size="small"
              variant="text"
              color="success"
              @click="abrirCierre(fila, 'atendida')"
            >
              {{ t('cartera.seguimiento.atender') }}
            </VBtn>
            <VBtn
              size="small"
              variant="text"
              color="error"
              @click="abrirCierre(fila, 'cancelada')"
            >
              {{ t('cartera.seguimiento.cancelar') }}
            </VBtn>
          </div>
        </template>
      </AsTablaDatos>

      <div
        v-if="vista === 'sin_pago' && s.seleccion.value.size"
        class="seguimiento__barra"
      >
        <span>{{ t('cartera.seguimiento.marcadas', { n: s.seleccion.value.size, importe: moneda(s.totalMarcado.value) }) }}</span>
        <div class="d-flex flex-wrap gap-2">
          <AsBtnSecundario
            prepend-icon="tabler-x"
            @click="abrirAccion('descartada')"
          >
            {{ t('cartera.seguimiento.descartar') }}
          </AsBtnSecundario>
          <AsBtnSecundario
            prepend-icon="tabler-clipboard-plus"
            @click="abrirAccion('orden')"
          >
            {{ t('cartera.seguimiento.orden') }}
          </AsBtnSecundario>
          <AsBtnPrimario
            prepend-icon="tabler-file-plus"
            @click="abrirAccion('segunda')"
          >
            {{ t('cartera.seguimiento.segunda') }}
          </AsBtnPrimario>
        </div>
      </div>
    </template>

    <AsDialogo
      :abierto="accion !== null"
      :titulo="accion ? t('cartera.seguimiento.tituloAccion', { accion: t(NOMBRE_ACCION[accion]), n: s.seleccion.value.size }) : ''"
      tamano="sm"
      :cargando="s.enviando.value"
      :texto-confirmar="accion ? t(NOMBRE_ACCION[accion]) : ''"
      :desactivar-confirmar="!listoAccion"
      @update:abierto="(v: boolean) => { if (!v) accion = null }"
      @confirmar="confirmarAccion"
    >
      <VSelect
        v-if="accion === 'segunda'"
        v-model="notificador"
        :items="notificadores"
        :label="t('cartera.seguimiento.notificador')"
        class="mb-3"
      />
      <VTextarea
        v-model="motivo"
        :label="t('cartera.seguimiento.motivo')"
        :hint="t('cartera.seguimiento.motivoAyuda')"
        persistent-hint
        rows="2"
        auto-grow
        maxlength="1000"
      />
    </AsDialogo>

    <AsDialogo
      :abierto="cierre !== null"
      :titulo="cierre ? t('cartera.seguimiento.cerrarTitulo', { accion: cierre.estado === 'atendida' ? t('cartera.seguimiento.atender') : t('cartera.seguimiento.cancelar'), cuenta: cierre.orden.cuenta ?? cierre.orden.contrato }) : ''"
      tamano="sm"
      :cargando="s.enviando.value"
      :texto-confirmar="cierre?.estado === 'cancelada' ? t('cartera.seguimiento.cancelar') : t('cartera.seguimiento.atender')"
      :color-confirmar="cierre?.estado === 'cancelada' ? 'error' : 'primary'"
      :desactivar-confirmar="!nota.trim()"
      @update:abierto="(v: boolean) => { if (!v) cierre = null }"
      @confirmar="confirmarCierre"
    >
      <VTextarea
        v-model="nota"
        :label="t('cartera.seguimiento.nota')"
        rows="2"
        auto-grow
        maxlength="1000"
      />
    </AsDialogo>
  </div>
</template>

<style scoped>
.seguimiento__barra {
  position: sticky;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  border: var(--as-borde);
  border-radius: var(--as-radio, 8px);
  background: rgb(var(--v-theme-surface));
  gap: var(--as-sp-3);
  inset-block-end: var(--as-sp-3);
  margin-block-start: var(--as-sp-3);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}
</style>
