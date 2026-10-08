<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/* Fotos de evidencia de una lectura (medidor, casa, recibo) por contrato y periodo, con ampliación. */
interface ImagenLectura {
  tipo: string
  imagenUrl: string
  fecha: string
}

const props = defineProps<{
  abierto: boolean
  contrato: string
  periodo: string
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
}>()

const { t } = useI18n()
const store = useContractStore()
const imagenes = ref<ImagenLectura[]>([])
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const actual = ref(0)
const ampliada = ref<ImagenLectura | null>(null)

async function cargar() {
  if (!props.contrato || !props.periodo)
    return
  cargando.value = true
  error.value = null
  try {
    const r = await store.getContractImages(props.contrato, props.periodo)
    if (r?.success === false)
      throw new Error(r.message || t('support.evidencia.error'))
    imagenes.value = r?.data ?? []
    actual.value = 0
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

watch([() => props.abierto, () => props.contrato, () => props.periodo], ([abierto]) => {
  if (abierto) {
    cargar()
  }
  else {
    imagenes.value = []
    error.value = null
    ampliada.value = null
  }
}, { immediate: true })
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.evidencia.titulo')"
    :subtitulo="`${contrato} · ${periodo}`"
    tamano="md"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <AsEstado
      v-if="cargando"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="1"
    />
    <AsEstado
      v-else-if="error"
      tipo="error"
      :error="error"
      :detalle="t('support.evidencia.error')"
      @reintentar="cargar"
    />
    <AsEstado
      v-else-if="!imagenes.length"
      tipo="vacio"
      :titulo="t('support.evidencia.sinImagenes')"
      detalle=""
      icono="tabler-photo-off"
    />
    <VCarousel
      v-else
      v-model="actual"
      :show-arrows="imagenes.length > 1"
      hide-delimiter-background
      height="420"
      class="evidencia__carrusel"
    >
      <VCarouselItem
        v-for="(imagen, i) in imagenes"
        :key="i"
      >
        <figure class="evidencia__figura ma-0">
          <figcaption class="as-secundario text-center mb-2">
            {{ imagen.tipo }} · {{ imagen.fecha }}
          </figcaption>
          <button
            type="button"
            class="evidencia__ampliar"
            :title="t('support.evidencia.ampliar')"
            :aria-label="t('support.evidencia.ampliar')"
            @click="ampliada = imagen"
          >
            <VImg
              :src="imagen.imagenUrl"
              :alt="`${imagen.tipo} · ${imagen.fecha}`"
              height="360"
              class="evidencia__imagen"
            />
          </button>
        </figure>
      </VCarouselItem>
    </VCarousel>
  </AsDialogo>

  <!-- Imagen ampliada -->
  <VDialog
    :model-value="!!ampliada"
    max-width="90vw"
    @update:model-value="(v: boolean) => { if (!v) ampliada = null }"
  >
    <div
      v-if="ampliada"
      class="evidencia__zoom"
    >
      <VBtn
        icon="tabler-x"
        variant="elevated"
        color="surface"
        size="small"
        class="evidencia__cerrar"
        :title="t('support.evidencia.cerrarZoom')"
        :aria-label="t('support.evidencia.cerrarZoom')"
        @click="ampliada = null"
      />
      <VImg
        :src="ampliada.imagenUrl"
        :alt="`${ampliada.tipo} · ${ampliada.fecha}`"
        max-height="85vh"
        class="evidencia__imagen-zoom"
        @click="ampliada = null"
      />
    </div>
  </VDialog>
</template>

<style scoped>
.evidencia__carrusel {
  border-radius: var(--as-radio-md);
}

.evidencia__ampliar {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  inline-size: 100%;
}

.evidencia__imagen,
.evidencia__imagen-zoom {
  border-radius: var(--as-radio-md);
}

.evidencia__zoom {
  position: relative;
  padding: var(--as-sp-2);
  border-radius: var(--as-radio-lg);
  background: rgba(var(--v-theme-on-surface), 0.92);
}

.evidencia__imagen-zoom {
  cursor: zoom-out;
}

.evidencia__cerrar {
  position: absolute;
  z-index: 1;
  inset-block-start: var(--as-sp-3);
  inset-inline-end: var(--as-sp-3);
}
</style>
