<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/* Mensaje completo de una nota u orden de trabajo (el contenido llega en HTML desde Aquasoft Comercial). */
defineProps<{
  abierto: boolean
  titulo?: string
  html: string
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="titulo ?? t('support.lista.mensaje')"
    tamano="md"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <!-- eslint-disable vue/no-v-html -- contenido ya saneado por Aquasoft Comercial -->
    <div
      class="mensaje-dialogo text-body-1"
      v-html="html"
    />
    <!-- eslint-enable vue/no-v-html -->
  </AsDialogo>
</template>

<style scoped>
.mensaje-dialogo {
  overflow-wrap: anywhere;
}

.mensaje-dialogo :deep(p:last-child) {
  margin-block-end: 0;
}
</style>
