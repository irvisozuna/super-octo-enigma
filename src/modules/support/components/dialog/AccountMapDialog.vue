<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import { coordenadaValida } from '@/components/as/mapa'
import { decimal } from '@/utils/formato'

/* Ubicación de la toma del contrato sobre el mapa compartido (MapLibre); sin coordenada válida muestra el estado vacío. */
defineProps<{ abierto: boolean }>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
}>()

const { t } = useI18n()
const store = useContractStore()

const contrato = computed(() => store.item)
const lat = computed(() => Number(contrato.value?.latitude))
const lng = computed(() => Number(contrato.value?.longitude))
const valida = computed(() => coordenadaValida(lat.value, lng.value))
const etiqueta = computed(() => [contrato.value?.account, contrato.value?.nameuser].filter(Boolean).join(' · '))
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.mapa.titulo')"
    :subtitulo="contrato?.address ?? undefined"
    tamano="lg"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <AsMapaUbicacion
      :lat="lat"
      :lng="lng"
      :altura="460"
      :etiqueta="etiqueta"
    />
    <dl class="as-datos mt-4 mb-0">
      <div class="as-dato">
        <dt class="as-etiqueta">
          {{ t('support.ficha.cuenta') }}
        </dt>
        <dd class="as-valor as-num mb-0">
          {{ contrato?.account ?? '—' }}
        </dd>
      </div>
      <div class="as-dato">
        <dt class="as-etiqueta">
          {{ t('support.ficha.sector') }}
        </dt>
        <dd class="as-valor mb-0">
          {{ contrato?.sector || '—' }}
        </dd>
      </div>
      <div class="as-dato">
        <dt class="as-etiqueta">
          {{ t('support.mapa.coordenadas') }}
        </dt>
        <dd class="as-valor as-num mb-0">
          {{ valida ? `${decimal(lat, 6)}, ${decimal(lng, 6)}` : '—' }}
        </dd>
      </div>
    </dl>

    <template
      v-if="contrato?.id_sector"
      #acciones-inicio
    >
      <AsBtnTerciario
        prepend-icon="tabler-map-pin"
        :to="{ name: 'monitoreoInicio', query: { sector: String(contrato.id_sector) } }"
      >
        {{ t('support.mapa.verMonitor') }}
      </AsBtnTerciario>
    </template>
  </AsDialogo>
</template>
