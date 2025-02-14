<template>
  <VDialog v-if="dialogState.show" v-model="dialogState.show" :width="dialogState.options?.width"
    :fullscreen="dialogState.options?.fullscreen" :persistent="dialogState.options?.persistent"
    :scrollable="dialogState.options?.scrollable" :hide-overlay="dialogState.options?.hideOverlay"
    :transition="dialogState.options?.transition" :class="getThemeClass(dialogState.options?.theme)">
    <component :is="dialogState.options?.component" v-bind="dialogState.options?.props" />
    <template #actions>
      <VBtn v-for="(action, index) in dialogState.options?.actions || []" :key="index"
        :color="action.color || 'primary'" @click="action.action">
        {{ action.label }}
      </VBtn>
    </template>
  </VDialog>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/appStore';
import { DialogOptions } from '@/types/types';
import { computed } from 'vue';

const appStore = useAppStore();
const dialogState = computed(() => appStore.dialogState);

function getThemeClass(theme: DialogOptions['theme']): string {
  return theme === 'dark' ? 'dark-dialog' : '';
}
</script>

<style>
.dark-dialog {
  background-color: #121212;
  color: #fff;
}
</style>
