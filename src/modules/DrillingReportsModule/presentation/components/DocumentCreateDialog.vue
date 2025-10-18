<script setup lang="ts">
import DocumentForm from './DocumentForm.vue'
import { useAppManager } from '@/composables/useAppManager'

const { closeDialog } = useAppManager()

const handleSubmit = () => {
  closeDialog('submit')
}
</script>

<template>
  <DocumentForm
    :is-editing="false"
    :show-close-button="true"
    @submit="handleSubmit"
    @cancel="closeDialog"
  />
</template>
