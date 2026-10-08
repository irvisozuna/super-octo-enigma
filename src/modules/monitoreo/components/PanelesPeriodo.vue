<script setup lang="ts">
import { computed, onBeforeUnmount, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePanelesPeriodo } from '../composables/usePanelesPeriodo'
import type { EstadoTarifaFija } from '../types/paneles'
import { fechaCorta, horaCorta } from '../utils/tiempo'
import type { ColumnaTabla } from '@/components/as/tipos'
import { COLOR_TARIFA_FIJA } from '@/utils/estados'
import { entero, fechaHoraCorta, porcentaje } from '@/utils/formato'

/*
 * Paneles de la vista periodo (F2.8): refacturaciones (quién, cuántas, por qué; fuente llx_log_rebill de Aquasoft
 * Comercial, solo lectura) e indicador de facturación automática de tarifa fija por gerencia, con Excel.
 * Sobre AsTablaDatos y los tokens de estado del sistema de diseño.
 */
const props = defineProps<{
  periodo: number | null
  gerencia: number | null
  activo: boolean
}>()

const emit = defineEmits<{
  lectura: [contrato: number]
}>()

const { t } = useI18n()
const router = useRouter()
const p = usePanelesPeriodo(toRef(props, 'periodo'), toRef(props, 'gerencia'), toRef(props, 'activo'))

const maxQuien = computed(() => Math.max(1, ...(p.refacturaciones.value?.por_quien.map(q => q.n) ?? [1])))

type FilaGerencia = NonNullable<typeof p.tarifaFija.value>['gerencias'][number]

const columnasTarifa = computed<ColumnaTabla<FilaGerencia>[]>(() => [
  { clave: 'gerencia', titulo: t('monitoreo.paneles.gerencia'), formato: 'personalizado', ordenable: false, anchoMin: 120 },
  { clave: 'tarifa_fija', titulo: t('monitoreo.paneles.fija'), formato: 'entero', ancho: 60, ordenable: false },
  { clave: 'generadas', titulo: t('monitoreo.paneles.generadas'), formato: 'entero', ancho: 84, ordenable: false },
  { clave: 'leidas_campo', titulo: t('monitoreo.paneles.campo'), formato: 'entero', ancho: 64, ordenable: false },
  { clave: 'faltan', titulo: t('monitoreo.paneles.faltan'), formato: 'personalizado', alineacion: 'end', ancho: 64, ordenable: false },
  { clave: 'estado', titulo: t('monitoreo.paneles.estado'), formato: 'estado', ancho: 104, ordenable: false, colorEstado: v => COLOR_TARIFA_FIJA[v as EstadoTarifaFija] ?? 'secondary', textoEstado: v => t(`monitoreo.paneles.estados.${v}`) },
])

type FilaRefacturacion = NonNullable<typeof p.refacturaciones.value>['ultimas'][number]

const columnasUltimas = computed<ColumnaTabla<FilaRefacturacion>[]>(() => [
  { clave: 'fecha', titulo: t('monitoreo.paneles.ultimas'), formato: 'personalizado', ancho: 92, ordenable: false },
  { clave: 'cuenta', titulo: t('monitoreo.sector.cuenta'), formato: 'personalizado', ordenable: false },
  { clave: 'lectura_nueva', titulo: t('monitoreo.lectura.actual'), formato: 'personalizado', alineacion: 'end', ancho: 104, ordenable: false },
])

const ultimas = computed(() => p.refacturaciones.value?.ultimas.slice(0, 8) ?? [])

function verReporte() {
  router.push({ path: `/reportes/${p.refacturaciones.value?.reporte ?? 'refacturacion_por_lectura'}` })
}

onBeforeUnmount(() => p.detener())
</script>

<template>
  <VRow
    v-if="activo"
    class="mb-1"
  >
    <!-- Refacturaciones -->
    <VCol
      cols="12"
      lg="7"
    >
      <VCard
        class="as-tarjeta h-100 paneles"
        variant="flat"
      >
        <div class="paneles__encabezado">
          <div>
            <h2 class="paneles__titulo mb-0">
              <VIcon
                icon="tabler-receipt-refund"
                size="18"
                class="text-warning me-1"
              />
              {{ t('monitoreo.paneles.refacturaciones') }}
            </h2>
            <div
              v-if="p.refacturaciones.value"
              class="as-secundario as-num"
            >
              {{ t('monitoreo.paneles.refacturacionesDetalle', { n: entero(p.refacturaciones.value.total), l: entero(p.refacturaciones.value.por_lectura) }) }}
            </div>
          </div>
          <div class="d-flex flex-wrap gap-1">
            <VBtn
              size="small"
              variant="text"
              prepend-icon="tabler-file-spreadsheet"
              :loading="p.exportando.value === 'refacturaciones'"
              :disabled="!p.refacturaciones.value?.total"
              @click="p.exportar('refacturaciones')"
            >
              Excel
            </VBtn>
            <VBtn
              size="small"
              variant="text"
              prepend-icon="tabler-report"
              @click="verReporte"
            >
              {{ t('monitoreo.paneles.reporte') }}
            </VBtn>
          </div>
        </div>
        <VProgressLinear
          v-if="p.cargando.value"
          indeterminate
          height="2"
        />
        <div class="paneles__cuerpo">
          <AsEstado
            v-if="p.error.value && !p.datos.value"
            tipo="error"
            compacto
            :error="p.error.value"
          />
          <AsEstado
            v-else-if="!p.refacturaciones.value"
            tipo="cargando"
            esqueleto="texto"
            :filas="4"
          />
          <AsEstado
            v-else-if="!p.refacturaciones.value.total"
            tipo="vacio"
            compacto
            icono="tabler-receipt-off"
            :titulo="p.refacturaciones.value.fuente.startsWith('Sin acceso') ? p.refacturaciones.value.fuente : t('monitoreo.paneles.sinRefacturaciones')"
            detalle=""
          />
          <VRow
            v-else
            dense
          >
            <VCol
              cols="12"
              md="5"
            >
              <div class="as-etiqueta mb-1">
                {{ t('monitoreo.paneles.porQuien') }}
              </div>
              <div
                v-for="q in p.refacturaciones.value.por_quien.slice(0, 6)"
                :key="q.usuario"
                class="mb-1"
              >
                <div class="d-flex justify-space-between text-body-2">
                  <span class="text-truncate">{{ q.usuario }}</span>
                  <span class="text-no-wrap ms-2 as-num">{{ entero(q.n) }} · {{ porcentaje(q.pct) }}</span>
                </div>
                <VProgressLinear
                  :model-value="100 * q.n / maxQuien"
                  height="4"
                  rounded
                  color="warning"
                />
              </div>
              <div class="as-etiqueta mt-3 mb-1">
                {{ t('monitoreo.paneles.porMotivo') }}
              </div>
              <div class="d-flex flex-wrap gap-1">
                <VChip
                  v-for="m in p.refacturaciones.value.por_motivo.slice(0, 8)"
                  :key="m.motivo"
                  size="x-small"
                  label
                  variant="tonal"
                >
                  {{ m.motivo }} · <span class="as-num ms-1">{{ entero(m.n) }}</span>
                </VChip>
              </div>
            </VCol>
            <VCol
              cols="12"
              md="7"
            >
              <AsTablaDatos
                sin-tarjeta
                densidad="densa"
                :columnas="columnasUltimas"
                :filas="ultimas"
                clave-fila="id"
                :por-pagina="-1"
                ocultar-pie
                class="paneles__tabla"
              >
                <template #celda-fecha="{ fila }">
                  <span class="as-secundario as-num text-no-wrap">{{ fechaHoraCorta(fila.fecha) }}</span>
                </template>
                <template #celda-cuenta="{ fila }">
                  <a
                    href="#"
                    class="text-primary text-decoration-none font-weight-medium as-num"
                    @click.prevent="emit('lectura', fila.contrato_id)"
                  >{{ fila.cuenta ?? fila.contrato_id }}</a>
                  <div class="as-secundario text-truncate paneles__motivo">
                    {{ fila.motivo }} · {{ fila.quien }}
                  </div>
                </template>
                <template #celda-lectura_nueva="{ fila }">
                  <span class="as-num text-no-wrap">{{ fila.lectura_previa ?? '—' }} → {{ fila.lectura_nueva ?? '—' }}</span>
                </template>
              </AsTablaDatos>
            </VCol>
          </VRow>
          <div
            v-if="p.refacturaciones.value?.total"
            class="text-caption text-medium-emphasis mt-2"
          >
            {{ t('monitoreo.paneles.definicionRefacturacion') }}
          </div>
        </div>
      </VCard>
    </VCol>

    <!-- Tarifa fija -->
    <VCol
      cols="12"
      lg="5"
    >
      <VCard
        class="as-tarjeta h-100 paneles"
        variant="flat"
      >
        <div class="paneles__encabezado">
          <div>
            <h2 class="paneles__titulo mb-0">
              <VIcon
                icon="tabler-droplet-dollar"
                size="18"
                class="text-info me-1"
              />
              {{ t('monitoreo.paneles.tarifaFija') }}
            </h2>
            <div
              v-if="p.tarifaFija.value"
              class="as-secundario as-num"
            >
              {{ t('monitoreo.paneles.tarifaFijaDetalle', { pct: p.tarifaFija.value.totales.pct ?? '—', f: entero(p.tarifaFija.value.totales.tarifa_fija), dia: p.tarifaFija.value.dia_limite }) }}
            </div>
          </div>
          <VBtn
            size="small"
            variant="text"
            prepend-icon="tabler-file-spreadsheet"
            :loading="p.exportando.value === 'tarifa-fija'"
            :disabled="!p.tarifaFija.value?.gerencias.length"
            @click="p.exportar('tarifa-fija')"
          >
            Excel
          </VBtn>
        </div>
        <div class="paneles__cuerpo">
          <AsEstado
            v-if="!p.tarifaFija.value"
            tipo="cargando"
            esqueleto="tabla"
            :filas="4"
          />
          <template v-else>
            <AsTablaDatos
              sin-tarjeta
              densidad="densa"
              :columnas="columnasTarifa"
              :filas="p.tarifaFija.value.gerencias"
              clave-fila="gerencia_id"
              :por-pagina="-1"
              ocultar-pie
              class="paneles__tabla"
            >
              <template #celda-gerencia="{ fila }">
                <div>{{ fila.gerencia }}</div>
                <div
                  v-if="fila.generadas_desde"
                  class="as-secundario as-num"
                >
                  {{ t('monitoreo.paneles.generadasEl', { fecha: fechaCorta(fila.generadas_desde), hora: horaCorta(fila.generadas_desde) }) }}
                </div>
              </template>
              <template #celda-faltan="{ fila }">
                <span
                  class="as-num"
                  :class="{ 'text-error font-weight-medium': fila.faltan > 0 && fila.estado === 'faltante' }"
                >{{ entero(fila.faltan) }}</span>
                <VIcon
                  v-if="fila.alerta_r12"
                  icon="tabler-alert-triangle"
                  color="error"
                  size="14"
                  class="ms-1"
                  :title="t('monitoreo.paneles.alertaR12')"
                />
              </template>
            </AsTablaDatos>
            <div class="text-caption text-medium-emphasis mt-2">
              {{ p.tarifaFija.value.definicion }}
            </div>
          </template>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.paneles {
  display: flex;
  flex-direction: column;
}

.paneles__encabezado {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-3) var(--as-sp-2);
  padding-inline: var(--as-sp-4);
}

.paneles__titulo {
  display: flex;
  align-items: center;
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-semi);
  line-height: 1.4;
}

.paneles__cuerpo {
  flex: 1 1 auto;
  padding-block: 0 var(--as-sp-4);
  padding-inline: var(--as-sp-4);
}

.paneles__motivo {
  max-inline-size: 24ch;
}

.paneles__tabla {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
}
</style>
