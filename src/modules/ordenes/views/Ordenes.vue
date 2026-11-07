<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOrdenes } from '../composables/useOrdenes'
import type { Orden } from '../types/ordenes'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { can } from '@layouts/plugins/casl'
import { fechaHoraCorta } from '@/utils/formato'

/*
 * Órdenes de trabajo del núcleo, de todos los tipos. Las de tipos con módulo dueño (cobranza) se capturan allá; las demás,
 * como la revisión de padrón (XEL1-660), se cierran aquí con nota.
 */
const { t } = useI18n()
const notificar = useNotificacion()
const o = useOrdenes()
const cuenta = ref('')
const cierre = ref<Orden | null>(null)
const estadoCierre = ref<string | null>(null)
const observacion = ref('')
const puedeOperar = computed(() => can('operate', 'ordenes-operar'))
const opcionesCierre = computed(() => o.estadosDeCierre(cierre.value?.tipo.codigo ?? null).map(s => ({ value: s.codigo, title: s.nombre })))

function abrirCierre(f: Orden) {
  cierre.value = f
  estadoCierre.value = null
  observacion.value = ''
  o.errorCierre.value = null
}

async function confirmarCierre() {
  if (cierre.value && estadoCierre.value && await o.cerrar(cierre.value, estadoCierre.value, observacion.value)) {
    cierre.value = null
    notificar.exito(t('ordenes.ordenes.cerrada_ok'))
  }
}

const tipos = computed(() => o.tipos.value.map(x => ({ value: x.codigo, title: x.nombre })))
const estados = computed(() => (o.tipos.value.find(x => x.codigo === o.filtros.tipo)?.estados ?? []).map(s => ({ value: s.codigo, title: s.nombre })))
const activos = computed(() => [o.filtros.tipo, o.filtros.estado, o.filtros.cuenta, o.filtros.abiertas].filter(v => v !== null && v !== '').length)

const columnas: ColumnaTabla<Orden>[] = [
  { clave: 'tipo.nombre', titulo: t('ordenes.ordenes.tipo'), formato: 'texto', ancho: 200 },
  { clave: 'cuenta', titulo: t('ordenes.ordenes.cuenta'), formato: 'personalizado', ancho: 120 },
  { clave: 'estado', titulo: t('ordenes.ordenes.estado'), formato: 'personalizado', ancho: 200 },
  { clave: 'agente.nombre', titulo: t('ordenes.ordenes.agente'), formato: 'texto', anchoMin: 200 },
  { clave: 'abierta_en', titulo: t('ordenes.ordenes.abierta'), formato: 'personalizado', ancho: 160 },
  { clave: 'cerrada_en', titulo: t('ordenes.ordenes.cerrada'), formato: 'personalizado', ancho: 160 },
  { clave: 'acciones', titulo: '', formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 110 },
]

function limpiar() {
  cuenta.value = ''
  o.aplicar({ tipo: null, estado: null, agente: null, cuenta: '', abiertas: null })
}

onMounted(() => o.iniciar())
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('ordenes.ordenes.titulo')"
      :descripcion="t('ordenes.ordenes.descripcion')"
    />
    <AsBarraFiltros
      class="mb-3"
      :activos="activos"
      @limpiar="limpiar"
    >
      <VSelect
        :model-value="o.filtros.tipo"
        :items="tipos"
        :label="t('ordenes.ordenes.tipo')"
        clearable
        class="as-filtro--md"
        @update:model-value="(v: string | null) => o.aplicar({ tipo: v })"
      />
      <VSelect
        :model-value="o.filtros.estado"
        :items="estados"
        :label="t('ordenes.ordenes.estado')"
        :disabled="!o.filtros.tipo"
        clearable
        class="as-filtro--md"
        @update:model-value="(v: string | null) => o.aplicar({ estado: v })"
      />
      <VTextField
        v-model="cuenta"
        :label="t('ordenes.ordenes.cuenta')"
        prepend-inner-icon="tabler-search"
        clearable
        class="as-filtro--sm"
        @keyup.enter="o.aplicar({ cuenta })"
        @click:clear="o.aplicar({ cuenta: '' })"
      />
      <VSwitch
        :model-value="o.filtros.abiertas === true"
        :label="t('ordenes.ordenes.abiertas')"
        hide-details
        density="compact"
        @update:model-value="(v: boolean | null) => o.aplicar({ abiertas: v ? true : null })"
      />
    </AsBarraFiltros>
    <AsTablaDatos
      :columnas="columnas"
      :filas="o.filas.value"
      clave-fila="id"
      densidad="media"
      :cargando="o.cargando.value"
      :error="o.error.value"
      :paginacion="{ pagina: o.paginacion.value.pagina, porPagina: o.paginacion.value.por_pagina, total: o.paginacion.value.total }"
      :vacio-titulo="t('ordenes.ordenes.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-clipboard-list"
      @update:pagina="(p: number) => o.cargar(p)"
      @reintentar="o.cargar()"
    >
      <template #celda-cuenta="{ fila }">
        <span class="as-num">{{ fila.cuenta ?? '—' }}</span>
      </template>
      <template #celda-estado="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="fila.cerrada_en ? 'secondary' : 'warning'"
        >
          {{ fila.estado.nombre ?? '—' }}
        </VChip>
        <div
          v-if="fila.datos?.motivo_nombre"
          class="as-secundario mt-1"
        >
          {{ fila.datos.motivo_nombre }}<span v-if="fila.datos.notificacion"> · {{ t('ordenes.ordenes.notificacion', { ref: fila.datos.notificacion }) }}</span>
        </div>
        <div
          v-if="fila.datos?.domicilio?.length"
          class="as-secundario text-truncate"
          :title="fila.datos.domicilio.join('; ')"
        >
          {{ fila.datos.domicilio.join('; ') }}
        </div>
        <div
          v-if="fila.observacion"
          class="as-secundario mt-1 text-truncate"
          :title="fila.observacion"
        >
          {{ fila.observacion }}
        </div>
      </template>
      <template #celda-acciones="{ fila }">
        <VBtn
          v-if="puedeOperar && !fila.cerrada_en && o.estadosDeCierre(fila.tipo.codigo).length"
          size="small"
          variant="text"
          @click="abrirCierre(fila)"
        >
          {{ t('ordenes.ordenes.cerrar') }}
        </VBtn>
      </template>
      <template #celda-abierta_en="{ fila }">
        <span class="as-num">{{ fechaHoraCorta(fila.abierta_en) }}</span>
      </template>
      <template #celda-cerrada_en="{ fila }">
        <span class="as-num">{{ fechaHoraCorta(fila.cerrada_en) }}</span>
      </template>
    </AsTablaDatos>

    <AsDialogo
      :abierto="cierre !== null"
      :titulo="cierre ? t('ordenes.ordenes.cerrarTitulo', { cuenta: cierre.cuenta ?? cierre.contrato ?? '—' }) : ''"
      tamano="sm"
      :cargando="o.cerrando.value"
      :texto-confirmar="t('ordenes.ordenes.cerrar')"
      :desactivar-confirmar="!estadoCierre || !observacion.trim()"
      @update:abierto="(v: boolean) => { if (!v) cierre = null }"
      @confirmar="confirmarCierre"
    >
      <VAlert
        v-if="o.errorCierre.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ o.errorCierre.value.mensaje }}
      </VAlert>
      <VSelect
        v-model="estadoCierre"
        :items="opcionesCierre"
        :label="t('ordenes.ordenes.estadoCierre')"
        class="mb-3"
      />
      <VTextarea
        v-model="observacion"
        :label="t('ordenes.ordenes.observacion')"
        rows="2"
        auto-grow
        maxlength="1000"
      />
    </AsDialogo>
  </div>
</template>
