<script setup lang="ts">
import ToolForm from './ToolForm.vue'
import { useAppManager } from '@/composables/useAppManager'

const { closeDialog } = useAppManager()

const handleSubmit = () => {
  closeDialog('submit')
}
</script>

<template>
  <ToolForm
    :is-editing="false"
    :show-close-button="true"
    @submit="handleSubmit"
    @cancel="closeDialog"
  />
</template>
