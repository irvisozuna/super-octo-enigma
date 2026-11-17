<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEvidencia } from '../composables/useEvidencia'
import type { Evidencia, TipoEvidencia } from '../types/cartera'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'
import { fechaHoraCorta } from '@/utils/formato'

/* Evidencia de la notificación dentro de su ficha (XEL1-661): miniaturas, subir fotos o PDF y borrar con permiso. */
const props = defineProps<{ aviso: string }>()

const { t } = useI18n()
const dialogo = useDialogo()
const notificar = useNotificacion()
const ev = useEvidencia()
const tipo = ref<TipoEvidencia>('acta')

/** La foto abierta en grande dentro de la ficha; los PDF se siguen abriendo en otra pestaña. */
const visor = ref<Evidencia | null>(null)

function ver(e: Evidencia) {
  if (e.mime.startsWith('image/') && ev.miniaturas.value[e.id])
    visor.value = e
  else
    ev.abrir(e)
}
const archivos = ref<File[]>([])
const TIPOS: TipoEvidencia[] = ['acta', 'fachada', 'toma', 'otro']

async function subir() {
  const n = await ev.subir(tipo.value, archivos.value)
  if (n) {
    archivos.value = []
    notificar.exito(t('cartera.evidencia.subidas', { n }))
  }
}

async function borrar(e: Evidencia) {
  if (await dialogo.confirmarEliminar(t('cartera.evidencia.borrarTitulo'), t('cartera.evidencia.borrarDetalle')) && await ev.borrar(e.id))
    notificar.exito(t('cartera.evidencia.borrada'))
}

watch(() => props.aviso, id => {
  if (id)
    ev.cargar(id)
}, { immediate: true })
onBeforeUnmount(() => ev.liberar())
</script>

<template>
  <section>
    <h3 class="as-seccion">
      {{ t('cartera.evidencia.titulo') }}
    </h3>
    <VAlert
      v-if="ev.error.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="ev.error.value = null"
    >
      {{ ev.error.value.mensaje }}
    </VAlert>
    <p
      v-if="ev.datos.value && !ev.datos.value.evidencias.length"
      class="as-secundario"
    >
      {{ t('cartera.evidencia.sinEvidencia') }}
    </p>
    <div
      v-else
      class="evidencia__rejilla mb-3"
    >
      <div
        v-for="e in ev.datos.value?.evidencias ?? []"
        :key="e.id"
        class="evidencia__item"
      >
        <button
          type="button"
          class="evidencia__vista"
          :aria-label="`${t('cartera.evidencia.abrir')} ${t(`cartera.evidencia.tipos.${e.tipo}`)}`"
          @click="ver(e)"
        >
          <img
            v-if="ev.miniaturas.value[e.id]"
            :src="ev.miniaturas.value[e.id]"
            alt=""
          >
          <VIcon
            v-else
            :icon="e.mime === 'application/pdf' ? 'tabler-file-type-pdf' : 'tabler-photo'"
            size="32"
          />
        </button>
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="as-valor">
              {{ t(`cartera.evidencia.tipos.${e.tipo}`) }}
            </div>
            <div class="as-secundario as-num d-flex align-center gap-1">
              {{ fechaHoraCorta(e.tomada_en ?? e.subida_en) }}
              <VIcon
                v-if="e.lat != null && e.lng != null"
                icon="tabler-map-pin"
                size="14"
                :aria-label="t('cartera.evidencia.conUbicacion')"
              />
            </div>
          </div>
          <VBtn
            v-if="ev.datos.value?.puede_borrar"
            icon="tabler-trash"
            size="x-small"
            variant="text"
            color="error"
            :aria-label="t('cartera.evidencia.borrarTitulo')"
            @click="borrar(e)"
          />
        </div>
      </div>
    </div>
    <div
      v-if="ev.datos.value?.puede_subir"
      class="d-flex flex-wrap align-center gap-2"
    >
      <VSelect
        v-model="tipo"
        :items="TIPOS.map(x => ({ value: x, title: t(`cartera.evidencia.tipos.${x}`) }))"
        :label="t('cartera.evidencia.tipo')"
        density="compact"
        hide-details
        class="evidencia__tipo"
      />
      <VFileInput
        v-model="archivos"
        :label="t('cartera.evidencia.archivos')"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        chips
        density="compact"
        hide-details
        prepend-icon=""
        prepend-inner-icon="tabler-paperclip"
        class="evidencia__archivos"
      />
      <VBtn
        color="primary"
        variant="tonal"
        :loading="ev.subiendo.value"
        :disabled="!archivos.length"
        @click="subir"
      >
        {{ t('cartera.evidencia.subir') }}
      </VBtn>
    </div>
    <VDialog
      :model-value="visor !== null"
      max-width="960"
      @update:model-value="(v: boolean) => { if (!v) visor = null }"
    >
      <VCard v-if="visor">
        <VCardTitle class="d-flex align-center justify-space-between">
          {{ t(`cartera.evidencia.tipos.${visor.tipo}`) }}
          <VBtn
            icon="tabler-x"
            variant="text"
            size="small"
            :aria-label="t('cartera.evidencia.cerrar')"
            @click="visor = null"
          />
        </VCardTitle>
        <VCardText>
          <img
            :src="ev.miniaturas.value[visor.id]"
            :alt="t(`cartera.evidencia.tipos.${visor.tipo}`)"
            class="evidencia__grande"
          >
          <div class="as-secundario as-num mt-2">
            {{ visor.tomada_en ? t('cartera.evidencia.tomada', { fecha: fechaHoraCorta(visor.tomada_en) }) : t('cartera.evidencia.subidaEl', { fecha: fechaHoraCorta(visor.subida_en) }) }}
            <template v-if="visor.lat != null && visor.lng != null">
              · <a
                :href="`https://www.google.com/maps?q=${visor.lat},${visor.lng}`"
                target="_blank"
                rel="noopener noreferrer"
              >{{ t('cartera.evidencia.verMapa') }}</a>
            </template>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </section>
</template>

<style scoped>
.evidencia__grande {
  display: block;
  border-radius: var(--as-radio-md);
  margin-inline: auto;
  max-block-size: 70vh;
  max-inline-size: 100%;
}

.evidencia__rejilla {
  display: grid;
  gap: var(--as-sp-3);
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.evidencia__vista {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  border: var(--as-borde);
  border-radius: var(--as-radio, 8px);
  background: rgb(var(--v-theme-surface-variant, 245 245 245));
  block-size: 96px;
  cursor: pointer;
  inline-size: 100%;
}

.evidencia__vista img {
  block-size: 100%;
  inline-size: 100%;
  object-fit: cover;
}

.evidencia__tipo {
  max-inline-size: 180px;
}

.evidencia__archivos {
  flex: 1 1 220px;
}
</style>
