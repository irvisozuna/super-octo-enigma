<script setup lang="ts">
import ProjectForm from './ProjectForm.vue'
import { useAppManager } from '@/composables/useAppManager'

const { closeDialog } = useAppManager()

const handleSubmit = () => {
  closeDialog('submit')
}
</script>

<template>
  <ProjectForm
    :is-editing="false"
    :show-close-button="true"
    @submit="handleSubmit"
    @cancel="closeDialog"
  />
</template>
