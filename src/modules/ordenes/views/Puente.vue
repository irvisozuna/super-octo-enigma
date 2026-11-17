<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePuente } from '../composables/useOrdenes'
import type { ConteoPuente, EntradaPuente } from '../types/ordenes'
import type { ColumnaTabla } from '@/components/as/tipos'
import { fechaHoraCorta } from '@/utils/formato'

/* Estado del puente hacia Aquasoft Comercial, de solo lectura, para Sistemas. */
const { t, te } = useI18n()
const p = usePuente()

const COLOR: Record<ConteoPuente['estado'], string> = { pending: 'warning', processing: 'info', done: 'success', failed: 'error' }
const conteos = computed(() => (p.datos.value?.conteos ?? []).map(c => ({ ...c, id: `${c.operacion}|${c.estado}` })))

// La clave lleva punto (ticket.create): en el archivo de textos va con guion bajo
const operacion = (o: string) => {
  const clave = `ordenes.puente.operaciones.${o.replace(/\./g, '_')}`

  return te(clave) ? t(clave) : o
}

const columnasConteo: ColumnaTabla<ConteoPuente>[] = [
  { clave: 'operacion', titulo: t('ordenes.puente.operacion'), formato: 'personalizado', anchoMin: 180 },
  { clave: 'estado', titulo: t('ordenes.puente.estado'), formato: 'personalizado', ancho: 160 },
  { clave: 'n', titulo: t('ordenes.puente.cuantas'), formato: 'entero', ancho: 120 },
  { clave: 'ultima', titulo: t('ordenes.puente.ultima'), formato: 'personalizado', ancho: 180 },
]

const columnasPendientes: ColumnaTabla<EntradaPuente>[] = [
  { clave: 'operacion', titulo: t('ordenes.puente.operacion'), formato: 'personalizado', ancho: 160 },
  { clave: 'estado', titulo: t('ordenes.puente.estado'), formato: 'personalizado', ancho: 140 },
  { clave: 'intentos', titulo: t('ordenes.puente.intentos'), formato: 'entero', ancho: 100 },
  { clave: 'error', titulo: t('ordenes.puente.error'), formato: 'texto', truncar: true, anchoMin: 260 },
  { clave: 'actualizada', titulo: t('ordenes.puente.ultima'), formato: 'personalizado', ancho: 170 },
]

onMounted(() => p.cargar())
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('ordenes.puente.titulo')"
      :descripcion="t('ordenes.puente.descripcion')"
    >
      <template #acciones>
        <AsBtnSecundario
          prepend-icon="tabler-refresh"
          :loading="p.cargando.value"
          @click="p.cargar()"
        >
          {{ t('ordenes.puente.actualizar') }}
        </AsBtnSecundario>
      </template>
    </AsEncabezadoPagina>
    <AsEstado
      v-if="p.error.value && !p.datos.value"
      tipo="error"
      :error="p.error.value"
      @reintentar="p.cargar()"
    />
    <template v-else>
      <VAlert
        v-if="p.datos.value"
        :type="p.datos.value.tickets_activos ? 'success' : 'warning'"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ p.datos.value.tickets_activos ? t('ordenes.puente.activo') : t('ordenes.puente.apagado') }}
      </VAlert>
      <AsTablaDatos
        :columnas="columnasConteo"
        :filas="conteos"
        clave-fila="id"
        densidad="media"
        :cargando="p.cargando.value && !p.datos.value"
        :por-pagina="-1"
        ocultar-pie
        class="mb-4"
        :vacio-titulo="t('ordenes.puente.sinPendientes')"
        vacio-detalle=""
      >
        <template #celda-operacion="{ fila }">
          {{ operacion(fila.operacion) }}
        </template>
        <template #celda-estado="{ fila }">
          <VChip
            size="small"
            label
            variant="tonal"
            :color="COLOR[fila.estado as ConteoPuente['estado']]"
          >
            {{ t(`ordenes.puente.estados.${fila.estado}`) }}
          </VChip>
        </template>
        <template #celda-ultima="{ fila }">
          <span class="as-num">{{ fechaHoraCorta(fila.ultima) }}</span>
        </template>
      </AsTablaDatos>
      <AsTablaDatos
        :titulo="t('ordenes.puente.pendientes')"
        :columnas="columnasPendientes"
        :filas="p.datos.value?.pendientes ?? []"
        clave-fila="id"
        densidad="media"
        :cargando="p.cargando.value && !p.datos.value"
        :vacio-titulo="t('ordenes.puente.sinPendientes')"
        vacio-detalle=""
        vacio-icono="tabler-circle-check"
      >
        <template #celda-operacion="{ fila }">
          {{ operacion(fila.operacion) }}
        </template>
        <template #celda-estado="{ fila }">
          <VChip
            size="small"
            label
            variant="tonal"
            :color="COLOR[fila.estado as ConteoPuente['estado']]"
          >
            {{ t(`ordenes.puente.estados.${fila.estado}`) }}
          </VChip>
        </template>
        <template #celda-actualizada="{ fila }">
          <span class="as-num">{{ fechaHoraCorta(fila.actualizada) }}</span>
        </template>
      </AsTablaDatos>
    </template>
  </div>
</template>
