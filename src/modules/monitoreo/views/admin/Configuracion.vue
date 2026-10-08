<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { guardarConfiguracion, obtenerConfiguracion } from '../../services/monitoreoApi'
import { useAlcanceStore } from '../../stores/alcanceStore'
import type { RespuestaConfiguracion } from '../../types/api'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/*
 * Umbrales del motor de alertas y parámetros del monitor (F2.2): valor global o por gerencia, con el origen de cada
 * valor efectivo. Un cambio surte efecto en el siguiente ciclo del motor sin despliegue.
 * Sobre los componentes del sistema de diseño: encabezado, barra de ámbito, tablas por grupo y avisos globales.
 */
const { t } = useI18n()
const alcance = useAlcanceStore()
const notificar = useNotificacion()

const datos = ref<RespuestaConfiguracion | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const guardando = ref<string | null>(null)
const errorGuardado = ref<ErrorReporte | null>(null)
const gerencia = ref<number | null>(null)
const borrador = ref<Record<string, string>>({})

type Origen = 'default' | 'global' | 'gerencia'

interface FilaParametro {
  clave: string
  etiqueta: string
  tipo: string
  valor: unknown
  origen: Origen
}

const REGLAS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13']

const GRUPOS: { clave: 'sectores' | 'lecturistas' | 'lecturas' | 'otros'; claves: string[] }[] = [
  { clave: 'sectores', claves: ['sin_iniciar_hora', 'avance_alerta_h', 'avance_alerta_pct', 'terminado_pct'] },
  { clave: 'lecturistas', claves: ['pausa_min', 'silencio_min', 'atoradas_h', 'bateria_pct', 'distancia_m', 'lecturista_pct_lejos_alerta', 'meta_diaria'] },
  { clave: 'lecturas', claves: ['consumo_alto_factor', 'consumo_bajo_factor', 'anomalias_accion_inmediata', 'sobrescritas_alta_n', 'tarifa_fija_dia'] },
  { clave: 'otros', claves: ['correo_alta', 'escalamiento_activo', 'escalamiento_min', 'resumen_hora', 'silenciar_h', 'quiosco_rotacion_s'] },
]

const COLOR_ORIGEN: Record<Origen, string | undefined> = { gerencia: 'primary', global: 'info', default: undefined }

const opcionesAmbito = computed(() => [{ value: null, title: t('monitoreo.configuracion.global') }, ...alcance.gerencias.map(g => ({ value: g.id, title: g.label }))])

const columnas = computed<ColumnaTabla<FilaParametro>[]>(() => [
  { clave: 'etiqueta', titulo: t('monitoreo.configuracion.parametro'), formato: 'personalizado', ordenable: false },
  { clave: 'valor', titulo: t('monitoreo.configuracion.valor'), formato: 'personalizado', ordenable: false, ancho: 280 },
  { clave: 'origen', titulo: t('monitoreo.configuracion.origen'), formato: 'personalizado', ordenable: false, ancho: 170 },
  { clave: 'acciones', titulo: t('monitoreo.configuracion.acciones'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 270 },
])

/** Valor efectivo para el ámbito elegido y de dónde sale. */
function efectivo(clave: string): { valor: unknown; origen: Origen } {
  const d = datos.value
  if (!d)
    return { valor: null, origen: 'default' }
  const porGerencia = gerencia.value !== null ? d.por_gerencia[String(gerencia.value)] : undefined
  if (porGerencia && clave in porGerencia)
    return { valor: porGerencia[clave], origen: 'gerencia' }
  if (clave in d.global)
    return { valor: d.global[clave], origen: 'global' }

  return { valor: d.defaults[clave], origen: 'default' }
}

/** Filas de cada grupo: solo las claves que el servidor conoce, con su valor efectivo y su origen. */
const grupos = computed(() => {
  const d = datos.value
  if (!d)
    return []

  return GRUPOS.map(g => ({
    clave: g.clave,
    filas: g.claves.filter(c => c in d.tipos).map<FilaParametro>(clave => ({ clave, etiqueta: t(`monitoreo.configuracion.claves.${clave}`), tipo: d.tipos[clave], ...efectivo(clave) })),
  })).filter(g => g.filas.length)
})

function aTexto(v: unknown): string {
  if (v === null || v === undefined)
    return ''
  if (Array.isArray(v))
    return v.join(', ')
  if (typeof v === 'object')
    return JSON.stringify(v)

  return String(v)
}

function texto(clave: string): string {
  return borrador.value[clave] ?? aTexto(efectivo(clave).valor)
}

function cambiado(clave: string): boolean {
  return clave in borrador.value && borrador.value[clave] !== aTexto(efectivo(clave).valor)
}

/** Convierte el texto del campo al tipo que espera el servidor según `tipos`. */
function aValor(clave: string, entrada: string): unknown {
  const tipo = datos.value?.tipos[clave] ?? 'string'
  const limpio = entrada.trim()
  const lista = () => limpio.split(/[,\s]+/).filter(Boolean)
  if (tipo === 'int')
    return Number.parseInt(limpio, 10)
  if (tipo === 'float')
    return Number.parseFloat(limpio.replace(',', '.'))
  if (tipo === 'bool')
    return ['1', 'true', 'sí', 'si'].includes(limpio.toLowerCase())
  if (tipo === 'ints')
    return lista().map(x => Number.parseInt(x, 10))
  if (tipo === 'codes')
    return lista()

  return limpio
}

/** Se puede quitar la sobreescritura cuando el valor efectivo viene del ámbito que se está editando. */
function quitable(origen: Origen): boolean {
  return (gerencia.value !== null && origen === 'gerencia') || (gerencia.value === null && origen === 'global')
}

const jornadaTexto = computed(() => {
  const j = efectivo('jornada').valor as { inicio?: string; fin?: string; dias?: number[] } | null
  if (!j || !j.inicio)
    return ''
  const dias = (j.dias ?? []).map(d => ['L', 'M', 'X', 'J', 'V', 'S', 'D'][d - 1]).join(' ')

  return t('monitoreo.configuracion.jornada', { inicio: j.inicio, fin: j.fin, dias })
})

const reglasActivas = computed(() => {
  const apagadas = (efectivo('reglas_apagadas').valor as string[] | null) ?? []

  return REGLAS.filter(r => !apagadas.includes(r))
})

async function cargar() {
  cargando.value = true
  try {
    datos.value = await obtenerConfiguracion()
    error.value = null
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

async function guardar(clave: string, valor: unknown) {
  guardando.value = clave
  errorGuardado.value = null
  try {
    await guardarConfiguracion(clave, valor, gerencia.value)
    delete borrador.value[clave]
    notificar.exito(t('monitoreo.configuracion.guardado', { clave }))
    await cargar()
  }
  catch (e) {
    errorGuardado.value = normalizarError(e)
  }
  finally {
    guardando.value = null
  }
}

function alternarRegla(codigo: string, activa: boolean | null) {
  const apagadas = new Set((efectivo('reglas_apagadas').valor as string[] | null) ?? [])
  if (activa)
    apagadas.delete(codigo)
  else
    apagadas.add(codigo)
  guardar('reglas_apagadas', [...apagadas])
}

onMounted(async () => {
  if (!alcance.cargado)
    await alcance.cargar()
  await cargar()
})
</script>

<template>
  <div class="configuracion">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.configuracion.titulo')"
      :descripcion="t('monitoreo.configuracion.descripcion')"
    />

    <AsEstado
      v-if="error && !datos"
      tipo="error"
      class="mb-4"
      :error="error"
      @reintentar="cargar"
    />
    <AsEstado
      v-else-if="cargando && !datos"
      tipo="cargando"
      :filas="6"
    />
    <VAlert
      v-if="errorGuardado"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="errorGuardado = null"
    >
      {{ errorGuardado.mensaje }}
    </VAlert>

    <template v-if="datos">
      <AsBarraFiltros class="mb-3">
        <VSelect
          v-model="gerencia"
          :items="opcionesAmbito"
          :label="t('monitoreo.configuracion.ambito')"
          class="as-filtro--lg"
          @update:model-value="borrador = {}"
        />
        <template
          v-if="jornadaTexto"
          #fin
        >
          <span class="as-secundario as-num">{{ jornadaTexto }}</span>
        </template>
      </AsBarraFiltros>

      <VCard
        variant="flat"
        class="as-tarjeta configuracion__tarjeta"
        :loading="cargando"
      >
        <section class="configuracion__seccion">
          <h2 class="as-seccion">
            {{ t('monitoreo.configuracion.reglas') }}
          </h2>
          <p class="as-secundario mb-3">
            {{ t('monitoreo.configuracion.reglasDetalle') }}
          </p>
          <div
            class="d-flex flex-wrap gap-2"
            role="group"
            :aria-label="t('monitoreo.configuracion.reglas')"
          >
            <VChip
              v-for="r in REGLAS"
              :key="r"
              label
              filter
              size="small"
              class="as-num"
              :model-value="reglasActivas.includes(r)"
              :color="reglasActivas.includes(r) ? 'primary' : undefined"
              :disabled="!datos.puede_editar || guardando === 'reglas_apagadas'"
              @update:model-value="(v: boolean | null) => alternarRegla(r, v)"
            >
              {{ r }}
            </VChip>
          </div>
        </section>

        <section
          v-for="g in grupos"
          :key="g.clave"
          class="configuracion__seccion configuracion__seccion--tabla"
        >
          <h2 class="as-seccion">
            {{ t(`monitoreo.configuracion.grupos.${g.clave}`) }}
          </h2>
          <AsTablaDatos
            sin-tarjeta
            ocultar-pie
            densidad="media"
            :columnas="columnas"
            :filas="g.filas"
            clave-fila="clave"
            :por-pagina="-1"
            class="configuracion__tabla"
          >
            <template #celda-etiqueta="{ fila }">
              <div>{{ fila.etiqueta }}</div>
              <div class="as-secundario as-num">
                {{ fila.clave }} · {{ fila.tipo }}
              </div>
            </template>
            <template #celda-valor="{ fila }">
              <VTextField
                :model-value="texto(fila.clave)"
                density="compact"
                variant="outlined"
                hide-details
                :aria-label="fila.etiqueta"
                :disabled="!datos.puede_editar"
                @update:model-value="(v: string) => borrador[fila.clave] = v"
                @keyup.enter="cambiado(fila.clave) && guardar(fila.clave, aValor(fila.clave, texto(fila.clave)))"
              />
            </template>
            <template #celda-origen="{ fila }">
              <VChip
                size="small"
                label
                :variant="fila.origen === 'default' ? 'outlined' : 'tonal'"
                :color="COLOR_ORIGEN[fila.origen as Origen]"
              >
                {{ t(`monitoreo.configuracion.origen${fila.origen.charAt(0).toUpperCase()}${fila.origen.slice(1)}`) }}
              </VChip>
            </template>
            <template #celda-acciones="{ fila }">
              <div
                v-if="datos.puede_editar"
                class="d-flex align-center justify-end gap-1 text-no-wrap"
              >
                <VBtn
                  v-if="quitable(fila.origen as Origen)"
                  size="small"
                  variant="text"
                  :loading="guardando === fila.clave"
                  @click="guardar(fila.clave, null)"
                >
                  {{ t('monitoreo.configuracion.quitar') }}
                </VBtn>
                <VBtn
                  size="small"
                  color="primary"
                  variant="tonal"
                  :disabled="!cambiado(fila.clave)"
                  :loading="guardando === fila.clave"
                  @click="guardar(fila.clave, aValor(fila.clave, texto(fila.clave)))"
                >
                  {{ t('monitoreo.configuracion.guardar') }}
                </VBtn>
              </div>
            </template>
          </AsTablaDatos>
        </section>
      </VCard>
    </template>
  </div>
</template>

<style scoped>
.configuracion__seccion {
  padding-block: var(--as-sp-3) var(--as-sp-4);
  padding-inline: var(--as-sp-4);
}

.configuracion__seccion + .configuracion__seccion {
  border-block-start: var(--as-borde);
}

.configuracion__seccion--tabla {
  padding-block-end: 0;
  padding-inline: 0;
}

.configuracion__seccion--tabla .as-seccion {
  padding-inline: var(--as-sp-4);
}

.configuracion__tabla :deep(td) {
  padding-block: var(--as-sp-2);
  vertical-align: middle;
}
</style>
