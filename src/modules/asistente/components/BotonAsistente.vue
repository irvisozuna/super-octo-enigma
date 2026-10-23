<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAsistenteStore } from '../stores/asistenteStore'
import { useAbility } from '@/plugins/casl/composables/useAbility'

/* Botón del navbar que abre el panel del asistente. Solo con `use asistente` y fuera de la pantalla completa. */
const store = useAsistenteStore()
const ability = useAbility()
const route = useRoute()
const { t } = useI18n()

const visible = computed(() => ability.can('use', 'asistente') && route.name !== 'asistente')
</script>

<template>
  <IconBtn
    v-if="visible"
    :aria-label="t('asistente.abrirPanel')"
    :title="t('asistente.abrirPanel')"
    @click="store.panelAbierto = !store.panelAbierto"
  >
    <VIcon
      icon="tabler-sparkles"
      size="24"
    />
  </IconBtn>
</template>
