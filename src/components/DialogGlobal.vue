<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/appStore'
import type { DialogOptions } from '@/types/types'

const appStore = useAppStore()
const dialogState = computed(() => appStore.dialogState)

function getThemeClass(theme: DialogOptions['theme']): string {
  return theme === 'dark' ? 'dark-dialog' : ''
}
</script>

<template>
  <VDialog
    v-if="dialogState.show"
    v-model="dialogState.show"
    :width="dialogState.options?.width"
    :fullscreen="dialogState.options?.fullscreen"
    :persistent="dialogState.options?.persistent"
    :scrollable="dialogState.options?.scrollable"
    :hide-overlay="dialogState.options?.hideOverlay"
    :transition="dialogState.options?.transition"
    :class="getThemeClass(dialogState.options?.theme)"
  >
    <component
      :is="dialogState.options?.component"
      v-bind="dialogState.options?.props"
    />
    <template #actions>
      <VBtn
        v-for="(action, index) in dialogState.options?.actions || []"
        :key="index"
        :color="action.color || 'primary'"
        @click="action.action"
      >
        {{ action.label }}
      </VBtn>
    </template>
  </VDialog>
</template>

<style>
.dark-dialog {
  background-color: #121212;
  color: #fff;
}
</style>
