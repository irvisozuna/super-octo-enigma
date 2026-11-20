<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSeguimiento } from '../composables/useSeguimiento'
import { obtenerCatalogos } from '../services/carteraApi'
import type { AccionRevisita, AccionSeguimiento, CandidataSeguimiento, OrdenSeguimiento, RevisitaSeguimiento } from '../types/cartera'
import { filtrarCandidatas, filtrarOrdenes, filtrarRevisitas, filtrosSeguimientoActivos, filtrosSeguimientoIniciales } from '../utils/seguimiento'
import type { OrdenSeguimientoBandeja } from '../utils/seguimiento'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { diaHoraCorta, entero, fecha, fechaHoraCorta, moneda } from '@/utils/formato'

/*
 * Seguimiento (XEL1-659): las notificaciones entregadas que no se pagaron y el siguiente paso con cada una. Las no
 * entregadas que siguen debiendo se vuelven a intentar en otro lote (XEL1-686). Las órdenes de seguimiento abiertas se
 * cierran aquí mismo como atendidas o canceladas.
 */
const { t } = useI18n()
const notificar = useNotificacion()
const s = useSeguimiento()
const vista = ref<'sin_pago' | 'revisitar' | 'ordenes'>('sin_pago')
const notificadores = ref<{ value: string; title: string }[]>([])

const accion = ref<AccionSeguimiento | AccionRevisita | null>(null)
const motivo = ref('')
const notificador = ref<string | null>(null)
const cierre = ref<{ orden: OrdenSeguimiento; estado: 'atendida' | 'cancelada' } | null>(null)
const nota = ref('')

const puedeOperar = computed(() => s.datos.value?.puede_operar ?? false)

// Buscador, filtros y orden (XEL1-682): la bandeja llega completa y se filtra aquí
const filtros = reactive(filtrosSeguimientoIniciales())
const visibles = computed(() => filtrarCandidatas(s.candidatas.value, filtros))
const revisitasVisibles = computed(() => filtrarRevisitas(s.revisitas.value, filtros))
const ordenesVisibles = computed(() => filtrarOrdenes(s.ordenes.value, filtros.texto))
const activos = computed(() => filtrosSeguimientoActivos(filtros))
const unicos = (valores: (string | null)[]) => [...new Set(valores.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b))

/** La lista de la pestaña: las opciones de los filtros salen de ella. */
const listaActual = computed<(CandidataSeguimiento | RevisitaSeguimiento)[]>(() => vista.value === 'revisitar' ? s.revisitas.value : s.candidatas.value)
const opcionesNotificador = computed(() => unicos(listaActual.value.map(c => c.notificador)))

const opcionesResultado = computed(() => {
  const vistos = new Map<string, string>()

  listaActual.value.forEach(c => vistos.set(c.estado_codigo, c.estado))

  return [...vistos].map(([value, title]) => ({ value, title }))
})

const opcionesDias = [30, 60, 90, 180, 365].map(n => ({ value: n, title: t('cartera.seguimiento.diasMas', { n }) }))
const opcionesOrigen = computed(() => [{ value: 'atencion', title: t('cartera.comun.origenAtencion') }, { value: 'legado', title: t('cartera.comun.origenLegado') }])

const opcionesOrden: { value: OrdenSeguimientoBandeja; title: string }[] = [
  { value: 'dias', title: t('cartera.seguimiento.ordenDias') },
  { value: 'adeudo', title: t('cartera.seguimiento.ordenAdeudo') },
  { value: 'recientes', title: t('cartera.seguimiento.ordenRecientes') },
  { value: 'notificador', title: t('cartera.seguimiento.ordenNotificador') },
]

function limpiar() {
  Object.assign(filtros, { ...filtrosSeguimientoIniciales(), orden: filtros.orden })
}

/** «Marcar todas» marca solo las que se ven con los filtros. */
const todas = computed(() => visibles.value.length > 0 && visibles.value.every(c => s.seleccion.value.has(c.id)))
const todasRevisita = computed(() => revisitasVisibles.value.length > 0 && revisitasVisibles.value.every(r => s.seleccionRevisita.value.has(r.id)))

function marcarVisibles(marcar: boolean) {
  s.seleccion.value = marcar ? new Set([...s.seleccion.value, ...visibles.value.map(c => c.id)]) : new Set()
}

function marcarRevisitasVisibles(marcar: boolean) {
  s.seleccionRevisita.value = marcar ? new Set([...s.seleccionRevisita.value, ...revisitasVisibles.value.map(r => r.id)]) : new Set()
}

const NOMBRE_ACCION: Record<AccionSeguimiento | AccionRevisita, string> = {
  orden: 'cartera.seguimiento.orden',
  segunda: 'cartera.seguimiento.segunda',
  revisita: 'cartera.seguimiento.revisitar',
  descartada: 'cartera.seguimiento.descartar',
}

const listoAccion = computed(() => !!motivo.value.trim() && ((accion.value !== 'segunda' && accion.value !== 'revisita') || !!notificador.value))
const marcadasAccion = computed(() => vista.value === 'revisitar' ? s.seleccionRevisita.value.size : s.seleccion.value.size)

/** Revisitar no aplica si todas las marcadas agotaron intentos. */
// XEL1-774: la segunda notificación y la revisita crean un lote; se apagan junto con la generación
const generacionActiva = computed(() => s.datos.value?.generacion_activa === true)
const puedeRevisitar = computed(() => generacionActiva.value && s.seleccionRevisita.value.size > s.agotadasMarcadas.value)

const columnas: ColumnaTabla<CandidataSeguimiento>[] = [
  { clave: 'marca', titulo: '', formato: 'personalizado', ordenable: false, ancho: 48 },
  { clave: 'ref', titulo: t('cartera.comun.referencia'), formato: 'personalizado', ancho: 150 },
  { clave: 'cuenta', titulo: t('cartera.comun.cuenta'), formato: 'personalizado', anchoMin: 220 },
  { clave: 'notificador', titulo: t('cartera.comun.notificador'), formato: 'texto', truncar: true, anchoMin: 180 },
  { clave: 'entregada', titulo: t('cartera.seguimiento.entregada'), formato: 'personalizado', ancho: 150 },
  { clave: 'dias', titulo: t('cartera.seguimiento.dias'), formato: 'entero', ancho: 80 },
  { clave: 'adeudo_actual', titulo: t('cartera.seguimiento.adeudoActual'), formato: 'personalizado', ancho: 150 },
]

const columnasRevisita: ColumnaTabla<RevisitaSeguimiento>[] = [
  { clave: 'marca', titulo: '', formato: 'personalizado', ordenable: false, ancho: 48 },
  { clave: 'ref', titulo: t('cartera.comun.referencia'), formato: 'personalizado', ancho: 170 },
  { clave: 'cuenta', titulo: t('cartera.comun.cuenta'), formato: 'personalizado', anchoMin: 220 },
  { clave: 'notificador', titulo: t('cartera.comun.notificador'), formato: 'texto', truncar: true, anchoMin: 180 },
  { clave: 'intento_en', titulo: t('cartera.seguimiento.ultimoIntento'), formato: 'personalizado', ancho: 190 },
  { clave: 'adeudo_actual', titulo: t('cartera.seguimiento.adeudoActual'), formato: 'personalizado', ancho: 150 },
]

const columnasOrdenes: ColumnaTabla<OrdenSeguimiento>[] = [
  { clave: 'cuenta', titulo: t('cartera.comun.cuenta'), formato: 'personalizado', ancho: 130 },
  { clave: 'notificacion', titulo: t('cartera.comun.referencia'), formato: 'personalizado', ancho: 150, ordenable: false },
  { clave: 'motivo', titulo: t('cartera.seguimiento.motivo'), formato: 'texto', truncar: true, anchoMin: 220 },
  { clave: 'abierta_en', titulo: t('cartera.seguimiento.abierta'), formato: 'personalizado', ancho: 160 },
  { clave: 'acciones', titulo: '', formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 220 },
]

function abrirAccion(a: AccionSeguimiento | AccionRevisita) {
  accion.value = a
  motivo.value = ''
}

async function confirmarAccion() {
  if (!accion.value || !listoAccion.value)
    return

  const r = vista.value === 'revisitar'
    ? await s.aplicarRevisita(accion.value as AccionRevisita, motivo.value, notificador.value)
    : await s.aplicar(accion.value as AccionSeguimiento, motivo.value, notificador.value)

  if (!r)
    return
  accion.value = null
  notificar.exito(r.lote ? t('cartera.seguimiento.loteGenerado', { ref: r.lote.ref ?? '' }) : t('cartera.seguimiento.aplicadas', { n: r.aplicadas }))
  if (r.errores.length)
    notificar.aviso(r.errores.length === 1 ? r.errores[0].motivo : t('cartera.seguimiento.noAplicadas', { n: r.errores.length }))
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
          value="revisitar"
          filter
        >
          {{ t('cartera.seguimiento.porRevisitar') }} · <span class="as-num">{{ s.revisitas.value.length }}</span>
        </VChip>
        <VChip
          value="ordenes"
          filter
        >
          {{ t('cartera.seguimiento.enSeguimiento') }} · <span class="as-num">{{ s.ordenes.value.length }}</span>
        </VChip>
      </VChipGroup>

      <AsBarraFiltros
        class="mb-3"
        :activos="activos"
        @limpiar="limpiar"
      >
        <VTextField
          v-model="filtros.texto"
          :label="t('cartera.seguimiento.buscar')"
          prepend-inner-icon="tabler-search"
          clearable
          class="as-filtro--lg"
          @click:clear="filtros.texto = ''"
        />
        <template v-if="vista !== 'ordenes'">
          <VAutocomplete
            v-model="filtros.notificador"
            :items="opcionesNotificador"
            :label="t('cartera.comun.notificador')"
            clearable
            class="as-filtro--md"
          />
          <VSelect
            v-model="filtros.resultado"
            :items="opcionesResultado"
            :label="t('cartera.seguimiento.resultado')"
            clearable
            class="as-filtro--sm"
          />
          <VSelect
            v-if="vista === 'sin_pago'"
            v-model="filtros.diasMin"
            :items="opcionesDias"
            :label="t('cartera.seguimiento.diasDesde')"
            clearable
            class="as-filtro--sm"
          />
          <VTextField
            :model-value="filtros.adeudoMin ?? ''"
            type="number"
            min="0"
            :label="t('cartera.seguimiento.adeudoMin')"
            prefix="$"
            clearable
            class="as-filtro--sm"
            @update:model-value="(v: string | number | null) => filtros.adeudoMin = v === null || v === '' ? null : Math.max(0, Number(v))"
          />
          <VSelect
            v-model="filtros.origen"
            :items="opcionesOrigen"
            :label="t('cartera.notificaciones.origen')"
            clearable
            class="as-filtro--sm"
          />
          <VSelect
            v-model="filtros.orden"
            :items="opcionesOrden"
            :label="t('cartera.seguimiento.ordenar')"
            prepend-inner-icon="tabler-arrows-sort"
            class="as-filtro--md"
          />
        </template>
      </AsBarraFiltros>

      <p
        v-if="vista === 'revisitar' && s.datos.value"
        class="as-secundario mb-2"
      >
        {{ t('cartera.seguimiento.reglaRevisita', { n: s.datos.value.revisita_intentos }) }}
      </p>
      <p
        v-if="activos && vista !== 'ordenes'"
        class="as-secundario as-num mb-2"
      >
        {{ vista === 'sin_pago'
          ? t('cartera.seguimiento.seMuestran', { n: entero(visibles.length), total: entero(s.candidatas.value.length) })
          : t('cartera.seguimiento.seMuestran', { n: entero(revisitasVisibles.length), total: entero(s.revisitas.value.length) }) }}
      </p>

      <AsTablaDatos
        v-if="vista === 'sin_pago'"
        :columnas="puedeOperar ? columnas : columnas.slice(1)"
        :filas="visibles"
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
            :disabled="!visibles.length"
            density="compact"
            hide-details
            :label="activos ? t('cartera.seguimiento.marcarVisibles', { n: entero(visibles.length) }) : t('cartera.notificar.marcarTodas')"
            @update:model-value="(v: boolean | null) => marcarVisibles(!!v)"
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
          <div
            v-if="fila.titular"
            class="as-secundario text-truncate seguimiento__titular"
            :title="fila.titular"
          >
            {{ fila.titular }}
          </div>
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
        v-else-if="vista === 'revisitar'"
        :columnas="puedeOperar ? columnasRevisita : columnasRevisita.slice(1)"
        :filas="revisitasVisibles"
        clave-fila="id"
        densidad="media"
        :cargando="s.cargando.value"
        :por-pagina="50"
        :vacio-titulo="t('cartera.seguimiento.sinRevisitas')"
        vacio-detalle=""
        vacio-icono="tabler-circle-check"
      >
        <template
          v-if="puedeOperar"
          #encabezado-acciones
        >
          <VCheckbox
            :model-value="todasRevisita"
            :indeterminate="!todasRevisita && s.seleccionRevisita.value.size > 0"
            :disabled="!revisitasVisibles.length"
            density="compact"
            hide-details
            :label="activos ? t('cartera.seguimiento.marcarVisibles', { n: entero(revisitasVisibles.length) }) : t('cartera.notificar.marcarTodas')"
            @update:model-value="(v: boolean | null) => marcarRevisitasVisibles(!!v)"
          />
        </template>
        <template #celda-marca="{ fila }">
          <VCheckboxBtn
            :model-value="s.seleccionRevisita.value.has(fila.id)"
            density="compact"
            :aria-label="fila.ref"
            @update:model-value="s.alternarRevisita(fila.id)"
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
          <div
            v-if="fila.titular"
            class="as-secundario text-truncate seguimiento__titular"
            :title="fila.titular"
          >
            {{ fila.titular }}
          </div>
        </template>
        <template #celda-intento_en="{ fila }">
          <span class="as-num">{{ diaHoraCorta(fila.intento_en) }}</span>
          <div>
            <VChip
              size="x-small"
              label
              variant="tonal"
              :color="fila.agotada ? 'error' : 'secondary'"
            >
              {{ fila.agotada
                ? t('cartera.seguimiento.agotada', { n: fila.intentos })
                : t('cartera.seguimiento.intentos', { n: fila.intentos, max: s.datos.value?.revisita_intentos ?? fila.intentos }) }}
            </VChip>
          </div>
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
        :filas="ordenesVisibles"
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
        <span>{{ t('cartera.seguimiento.marcadas', { n: s.seleccion.value.size, importe: moneda(s.totalMarcado.value) }, s.seleccion.value.size) }}</span>
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
            :disabled="!generacionActiva"
            :title="generacionActiva ? undefined : t('cartera.notificar.generacionApagada')"
            @click="abrirAccion('segunda')"
          >
            {{ t('cartera.seguimiento.segunda') }}
          </AsBtnPrimario>
        </div>
      </div>

      <div
        v-if="vista === 'revisitar' && s.seleccionRevisita.value.size"
        class="seguimiento__barra"
      >
        <span>
          {{ t('cartera.seguimiento.marcadas', { n: s.seleccionRevisita.value.size, importe: moneda(s.totalMarcadoRevisita.value) }, s.seleccionRevisita.value.size) }}
          <span
            v-if="s.agotadasMarcadas.value"
            class="as-secundario"
          > · {{ t('cartera.seguimiento.agotadasMarcadas', { n: s.agotadasMarcadas.value }, s.agotadasMarcadas.value) }}</span>
        </span>
        <div class="d-flex flex-wrap gap-2">
          <AsBtnSecundario
            prepend-icon="tabler-x"
            @click="abrirAccion('descartada')"
          >
            {{ t('cartera.seguimiento.descartar') }}
          </AsBtnSecundario>
          <AsBtnPrimario
            prepend-icon="tabler-repeat"
            :disabled="!puedeRevisitar"
            :title="generacionActiva ? undefined : t('cartera.notificar.generacionApagada')"
            @click="abrirAccion('revisita')"
          >
            {{ t('cartera.seguimiento.revisitar') }}
          </AsBtnPrimario>
        </div>
      </div>
    </template>

    <AsDialogo
      :abierto="accion !== null"
      :titulo="accion ? t('cartera.seguimiento.tituloAccion', { accion: t(NOMBRE_ACCION[accion]), n: marcadasAccion }) : ''"
      tamano="sm"
      :cargando="s.enviando.value"
      :texto-confirmar="accion ? t(NOMBRE_ACCION[accion]) : ''"
      :desactivar-confirmar="!listoAccion"
      @update:abierto="(v: boolean) => { if (!v) accion = null }"
      @confirmar="confirmarAccion"
    >
      <VSelect
        v-if="accion === 'segunda' || accion === 'revisita'"
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
.seguimiento__titular {
  max-inline-size: 22rem;
}

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

  /* Flota sobre la tabla al quedar fija abajo; sin sombra parecía un renglón más */
  box-shadow: var(--as-sombra-flotante);
  gap: var(--as-sp-3);
  inset-block-end: var(--as-sp-3);
  margin-block-start: var(--as-sp-3);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}
</style>
