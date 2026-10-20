<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ColumnaDef } from '../../types/reporte'
import { ejemploRazon } from '../../utils/ayuda'
import ExplicacionColumnaCuerpo from './ExplicacionColumnaCuerpo.vue'

/*
 * Explicación de las columnas de un reporte: qué es, de dónde sale y cómo se calcula, y en los porcentajes el
 * ejemplo con los totales de la consulta. Con una columna la muestra directa; con varias ("Cómo se calcula"), en
 * paneles, abierto el de `enfocada` si se indica.
 */
const props = withDefaults(defineProps<{
  abierto: boolean
  columnas: ColumnaDef[]

  /** Todas las columnas del reporte, para nombrar los operandos del ejemplo */
  todas: ColumnaDef[]
  totales?: Record<string, number | string> | null
  enfocada?: string | null
}>(), { totales: null, enfocada: null })

const emit = defineEmits<{ 'update:abierto': [valor: boolean] }>()

const { t } = useI18n()

const conAyuda = computed(() => props.columnas.filter(c => c.ayuda))
const una = computed(() => conAyuda.value.length === 1 ? conAyuda.value[0] : null)
const titulo = computed(() => una.value?.etiqueta ?? t('reportes.ayuda.tituloTodas'))
const panelesAbiertos = computed(() => props.enfocada ? [props.enfocada] : [])

function ejemplo(columna: ColumnaDef) {
  return ejemploRazon(columna, props.todas, props.totales)
}
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="titulo"
    :subtitulo="una ? undefined : t('reportes.ayuda.subtituloTodas')"
    tamano="md"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <template v-if="una">
      <ExplicacionColumnaCuerpo
        :columna="una"
        :ejemplo="ejemplo(una)"
      />
    </template>
    <VExpansionPanels
      v-else
      :model-value="panelesAbiertos"
      multiple
      variant="accordion"
    >
      <VExpansionPanel
        v-for="columna in conAyuda"
        :key="columna.columna"
        :value="columna.columna"
      >
        <VExpansionPanelTitle>
          <div>
            <div class="font-weight-medium">
              {{ columna.etiqueta }}
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ columna.ayuda?.resumen }}
            </div>
          </div>
        </VExpansionPanelTitle>
        <VExpansionPanelText>
          <ExplicacionColumnaCuerpo
            :columna="columna"
            :ejemplo="ejemplo(columna)"
            sin-resumen
          />
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>
  </AsDialogo>
</template>
