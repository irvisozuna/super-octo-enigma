<template>
  <div v-if="currentSnackbar" :class="['alert-wrapper', currentSnackbar.positionClass]">
    <VAlert :type="currentSnackbar.color" :border="currentSnackbar.variant || 'left'" prominent closable dismissible
      @click:close="snackbarStore.closeSnackbar()">
      <div class="alert-content">
        <h6 class="alert-title">{{ currentSnackbar.title }}</h6>
        <p class="alert-message">{{ translatedMessage }}</p>
      </div>
    </VAlert>
  </div>
</template>

<script setup lang="ts">
import { useGlobalSnackbarStore } from "@/stores/globalSnackbarStore";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// Acceso al store de Snackbar
const snackbarStore = useGlobalSnackbarStore();
const { t } = useI18n();

const currentSnackbar = computed(() => {
  if (!snackbarStore.currentSnackbar) return null;

  // Mapeo de posiciones a clases CSS
  const positionMap: Record<string, string> = {
    top: "alert-top-center",
    "top end": "alert-top-end",
    "top start": "alert-top-start",
    bottom: "alert-bottom-center",
    "bottom end": "alert-bottom-end",
    "bottom start": "alert-bottom-start",
  };

  return {
    ...snackbarStore.currentSnackbar,
    positionClass:
      positionMap[snackbarStore.currentSnackbar.position] || "alert-top-center",
  };
});

// Traducción del mensaje usando i18n
const translatedMessage = computed(() => {
  if (!currentSnackbar.value) return "";
  const { messageKey, variables } = currentSnackbar.value.message;
  return t(messageKey, variables);
});

// Control de visibilidad del Alert
const visible = ref(false);

watch(currentSnackbar, (newValue) => {
  visible.value = !!newValue;
});
</script>

<style scoped>
.alert-wrapper {
  position: fixed;
  z-index: 9999;
  inline-size: 100%;
  max-inline-size: 600px;
  padding-block: 0;
  padding-inline: 16px;
}

/* Posiciones dinámicas */
.alert-top-center {
  inset-block-start: 20px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
}

.alert-top-end {
  inset-block-start: 20px;
  inset-inline-end: 20px;
}

.alert-top-start {
  inset-block-start: 20px;
  inset-inline-start: 20px;
}

.alert-bottom-center {
  inset-block-end: 20px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
}

.alert-bottom-end {
  inset-block-end: 20px;
  inset-inline-end: 20px;
}

.alert-bottom-start {
  inset-block-end: 20px;
  inset-inline-start: 20px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.alert-message {
  font-size: 14px;
  margin-block-start: 4px;
}
</style>
