<script setup lang="ts">
import { computed } from 'vue'
import AsDialogo from './AsDialogo.vue'
import { useDialogoStore } from '@/stores/dialogoStore'

/* Pinta la confirmación pedida con useDialogo(). Se monta una sola vez en App.vue. */
const store = useDialogoStore()
const peticion = computed(() => store.actual)
</script>

<template>
  <AsDialogo
    v-if="peticion"
    abierto
    :titulo="peticion.titulo"
    tamano="sm"
    variante="confirmar"
    :texto-confirmar="peticion.textoConfirmar"
    :texto-cancelar="peticion.textoCancelar"
    :color-confirmar="peticion.color ?? 'primary'"
    @confirmar="store.responder(true)"
    @cancelar="store.responder(false)"
  >
    <div class="d-flex align-start gap-3">
      <VIcon
        v-if="peticion.icono"
        :icon="peticion.icono"
        size="24"
        :color="peticion.color ?? 'primary'"
        class="mt-1 flex-shrink-0"
      />
      <p
        v-if="peticion.mensaje"
        class="text-body-1 mb-0"
      >
        {{ peticion.mensaje }}
      </p>
    </div>
  </AsDialogo>
</template>
