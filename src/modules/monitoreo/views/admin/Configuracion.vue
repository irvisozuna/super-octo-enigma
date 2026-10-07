<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { guardarConfiguracion, obtenerConfiguracion } from '../../services/monitoreoApi'
import { useAlcanceStore } from '../../stores/alcanceStore'
import type { RespuestaConfiguracion } from '../../types/api'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Umbrales del motor de alertas y parámetros del monitor (F2.2): valor global o por gerencia, con el origen de cada
 * valor efectivo. Un cambio surte efecto en el siguiente ciclo del motor sin despliegue.
 */
const { t } = useI18n()
const alcance = useAlcanceStore()

const datos = ref<RespuestaConfiguracion | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const guardando = ref<string | null>(null)
const mensaje = ref<string | null>(null)
const errorGuardado = ref<ErrorReporte | null>(null)
const gerencia = ref<number | null>(null)
const borrador = ref<Record<string, string>>({})

const REGLAS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13']

const GRUPOS: { clave: 'sectores' | 'lecturistas' | 'lecturas' | 'otros'; claves: string[] }[] = [
  { clave: 'sectores', claves: ['sin_iniciar_hora', 'avance_alerta_h', 'avance_alerta_pct', 'terminado_pct'] },
  { clave: 'lecturistas', claves: ['pausa_min', 'silencio_min', 'atoradas_h', 'bateria_pct', 'distancia_m', 'lecturista_pct_lejos_alerta', 'meta_diaria'] },
  { clave: 'lecturas', claves: ['consumo_alto_factor', 'consumo_bajo_factor', 'anomalias_accion_inmediata', 'sobrescritas_alta_n', 'tarifa_fija_dia'] },
  { clave: 'otros', claves: ['silenciar_h', 'quiosco_rotacion_s', 'resumen_hora'] },
]

const opcionesAmbito = computed(() => [{ value: null, title: t('monitoreo.configuracion.global') }, ...alcance.gerencias.map(g => ({ value: g.id, title: g.label }))])

/** Valor efectivo para el ámbito elegido y de dónde sale. */
function efectivo(clave: string): { valor: unknown; origen: 'default' | 'global' | 'gerencia' } {
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
    mensaje.value = t('monitoreo.configuracion.guardado', { clave })
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
  <div>
    <div class="mb-4">
      <h4 class="text-h4 mb-1">
        {{ t('monitoreo.configuracion.titulo') }}
      </h4>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ t('monitoreo.configuracion.descripcion') }}
      </p>
    </div>

    <EstadoError
      v-if="error && !datos"
      class="mb-4"
      :error="error"
      @reintentar="cargar"
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
    <VAlert
      v-if="mensaje"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="mensaje = null"
    >
      {{ mensaje }}
    </VAlert>

    <VCard v-if="datos">
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <VSelect
          v-model="gerencia"
          :items="opcionesAmbito"
          :label="t('monitoreo.configuracion.ambito')"
          density="compact"
          variant="outlined"
          hide-details
          class="configuracion__ambito"
          @update:model-value="borrador = {}"
        />
        <span
          v-if="jornadaTexto"
          class="text-caption text-medium-emphasis"
        >
          {{ jornadaTexto }}
        </span>
      </VCardText>
      <VDivider />
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />

      <VCardText>
        <h6 class="text-subtitle-1 mb-1">
          {{ t('monitoreo.configuracion.reglas') }}
        </h6>
        <p class="text-caption text-medium-emphasis mb-2">
          {{ t('monitoreo.configuracion.reglasDetalle') }}
        </p>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <VChip
            v-for="r in REGLAS"
            :key="r"
            label
            filter
            :model-value="reglasActivas.includes(r)"
            :color="reglasActivas.includes(r) ? 'primary' : undefined"
            :disabled="!datos.puede_editar || guardando === 'reglas_apagadas'"
            @update:model-value="(v: boolean | null) => alternarRegla(r, v)"
          >
            {{ r }}
          </VChip>
        </div>

        <template
          v-for="g in GRUPOS"
          :key="g.clave"
        >
          <h6 class="text-subtitle-1 mt-4 mb-2">
            {{ t(`monitoreo.configuracion.grupos.${g.clave}`) }}
          </h6>
          <VTable density="compact">
            <thead>
              <tr>
                <th>{{ t('monitoreo.configuracion.parametro') }}</th>
                <th style="inline-size: 260px;">
                  {{ t('monitoreo.configuracion.valor') }}
                </th>
                <th style="inline-size: 150px;">
                  {{ t('monitoreo.configuracion.origen') }}
                </th>
                <th style="inline-size: 260px;" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="clave in g.claves.filter(c => c in datos!.tipos)"
                :key="clave"
              >
                <td>
                  <div>{{ t(`monitoreo.configuracion.claves.${clave}`) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ clave }} · {{ datos.tipos[clave] }}
                  </div>
                </td>
                <td>
                  <VTextField
                    :model-value="texto(clave)"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!datos.puede_editar"
                    @update:model-value="(v: string) => borrador[clave] = v"
                    @keyup.enter="cambiado(clave) && guardar(clave, aValor(clave, texto(clave)))"
                  />
                </td>
                <td>
                  <VChip
                    size="x-small"
                    label
                    variant="tonal"
                    :color="efectivo(clave).origen === 'gerencia' ? 'primary' : efectivo(clave).origen === 'global' ? 'secondary' : undefined"
                  >
                    {{ t(`monitoreo.configuracion.origen${efectivo(clave).origen.charAt(0).toUpperCase()}${efectivo(clave).origen.slice(1)}`) }}
                  </VChip>
                </td>
                <td class="text-end text-no-wrap">
                  <VBtn
                    v-if="datos.puede_editar"
                    size="small"
                    color="primary"
                    variant="tonal"
                    class="text-none"
                    :disabled="!cambiado(clave)"
                    :loading="guardando === clave"
                    @click="guardar(clave, aValor(clave, texto(clave)))"
                  >
                    {{ t('monitoreo.configuracion.guardar') }}
                  </VBtn>
                  <VBtn
                    v-if="datos.puede_editar && ((gerencia !== null && efectivo(clave).origen === 'gerencia') || (gerencia === null && efectivo(clave).origen === 'global'))"
                    size="small"
                    variant="text"
                    class="text-none ms-1"
                    :loading="guardando === clave"
                    @click="guardar(clave, null)"
                  >
                    {{ t('monitoreo.configuracion.quitar') }}
                  </VBtn>
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.configuracion__ambito {
  max-inline-size: 320px;
  min-inline-size: 220px;
}
</style>
