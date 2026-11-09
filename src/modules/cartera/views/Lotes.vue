<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useLotes } from '../composables/useLotes'
import type { EstadoDocumento, Lote } from '../types/cartera'
import type { ColumnaTabla } from '@/components/as/tipos'
import { can } from '@layouts/plugins/casl'
import { entero, fechaHoraCorta } from '@/utils/formato'

/** Capturadas de las del lote, de 0 a 100. */
const avance = (f: Lote) => f.avance?.total ? Math.round(f.avance.capturadas / f.avance.total * 100) : 0

/* Lotes generados, el más reciente primero; cada uno abre su detalle con el PDF y las notificaciones. */
const { t } = useI18n()
const router = useRouter()
const l = useLotes()

const COLOR_DOCUMENTO: Record<Exclude<EstadoDocumento, null>, string> = { listo: 'success', pendiente: 'warning', generando: 'info', error: 'error' }
const textoDocumento = (d: EstadoDocumento) => d ? t(`cartera.lotes.documento${d.charAt(0).toUpperCase()}${d.slice(1)}`) : '—'

const columnas: ColumnaTabla<Lote>[] = [
  { clave: 'ref', titulo: t('cartera.comun.lote'), formato: 'personalizado', ancho: 140 },
  { clave: 'generado_en', titulo: t('cartera.lotes.generado'), formato: 'personalizado', ancho: 170 },
  { clave: 'notificador', titulo: t('cartera.comun.notificador'), formato: 'texto', anchoMin: 200 },
  { clave: 'cuentas', titulo: t('cartera.lotes.cuentas'), formato: 'entero', ancho: 100 },
  { clave: 'avance', titulo: t('cartera.lotes.avance'), formato: 'personalizado', ancho: 220, ordenable: false },
  { clave: 'documento', titulo: t('cartera.lotes.documento'), formato: 'personalizado', ancho: 140 },
]

onMounted(() => l.cargar(1))
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('cartera.lotes.titulo')"
      :descripcion="t('cartera.lotes.descripcion')"
    >
      <template #acciones>
        <AsBtnPrimario
          v-if="can('operate', 'cartera-operar')"
          prepend-icon="tabler-file-plus"
          :to="{ name: 'carteraNotificar' }"
        >
          {{ t('cartera.lotes.nuevo') }}
        </AsBtnPrimario>
      </template>
    </AsEncabezadoPagina>

    <AsTablaDatos
      :columnas="columnas"
      :filas="l.lotes.value"
      clave-fila="id"
      :cargando="l.cargando.value"
      :error="l.error.value"
      :paginacion="{ pagina: l.paginacion.value.pagina, porPagina: l.paginacion.value.por_pagina, total: l.paginacion.value.total }"
      clic-fila
      :vacio-titulo="t('cartera.lotes.sinLotes')"
      vacio-detalle=""
      vacio-icono="tabler-files"
      @fila="(f: Record<string, unknown>) => router.push({ name: 'carteraLote', params: { id: String(f.id) } })"
      @update:pagina="(p: number) => l.cargar(p)"
      @reintentar="l.cargar()"
    >
      <template #celda-ref="{ fila }">
        <span class="as-num">{{ fila.ref ?? '—' }}</span>
      </template>
      <template #celda-generado_en="{ fila }">
        <span class="as-num">{{ fechaHoraCorta(fila.generado_en) }}</span>
      </template>
      <!-- Avance (XEL1-680): capturadas de las del lote y cuántas se entregaron -->
      <template #celda-avance="{ fila }">
        <div
          v-if="fila.avance"
          class="lotes__avance"
        >
          <VProgressLinear
            :model-value="avance(fila)"
            :color="avance(fila) === 100 ? 'success' : 'primary'"
            height="6"
            rounded
            :aria-label="t('cartera.lotes.avanceA11y', { capturadas: fila.avance.capturadas, total: fila.avance.total })"
          />
          <div class="as-secundario as-num mt-1">
            {{ t('cartera.lotes.avanceTexto', { capturadas: entero(fila.avance.capturadas), total: entero(fila.avance.total), entregadas: entero(fila.avance.entregadas) }) }}
          </div>
        </div>
      </template>
      <template #celda-documento="{ fila }">
        <VChip
          v-if="fila.documento"
          size="small"
          label
          variant="tonal"
          :color="COLOR_DOCUMENTO[fila.documento as Exclude<EstadoDocumento, null>]"
        >
          {{ textoDocumento(fila.documento) }}
        </VChip>
        <span v-else>—</span>
      </template>
    </AsTablaDatos>
  </div>
</template>

<style scoped>
.lotes__avance {
  min-inline-size: 10rem;
}
</style>
