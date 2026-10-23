<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'
import CompositorPregunta from './CompositorPregunta.vue'
import ListaMensajes from './ListaMensajes.vue'
import AsPanelLateral from '@/components/as/AsPanelLateral.vue'

/* Chat en el panel lateral, disponible desde cualquier pantalla con el botón del navbar. */
const store = useAsistenteStore()
const { panelAbierto, titulo, enviando } = storeToRefs(store)
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const enPantallaCompleta = computed(() => route.name === 'asistente')

watch(panelAbierto, abierto => {
  if (abierto)
    void store.cargarEstado()
})

// En la pantalla completa el chat ya está a la vista
watch(enPantallaCompleta, si => {
  if (si)
    panelAbierto.value = false
})

function pantallaCompleta() {
  panelAbierto.value = false
  void router.push({ name: 'asistente' })
}
</script>

<template>
  <AsPanelLateral
    v-model:abierto="panelAbierto"
    :titulo="titulo || t('asistente.titulo')"
    :sobrelinea="t('asistente.sobrelinea')"
    tamano="lg"
  >
    <template #acciones>
      <VBtn
        icon="tabler-plus"
        variant="text"
        size="small"
        :disabled="enviando"
        :aria-label="t('asistente.nueva')"
        :title="t('asistente.nueva')"
        @click="store.nueva()"
      />
      <VBtn
        icon="tabler-arrows-maximize"
        variant="text"
        size="small"
        :aria-label="t('asistente.pantallaCompleta')"
        :title="t('asistente.pantallaCompleta')"
        @click="pantallaCompleta"
      />
    </template>
    <ListaMensajes />
    <template #pie>
      <CompositorPregunta />
    </template>
  </AsPanelLateral>
</template>
