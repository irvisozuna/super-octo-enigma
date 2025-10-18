<script setup lang="ts">
import WellForm from './WellForm.vue'
import { useAppManager } from '@/composables/useAppManager'

const { closeDialog } = useAppManager()

const handleSubmit = () => {
  closeDialog('submit')
}
</script>

<template>
  <WellForm
    :is-editing="false"
    :show-close-button="true"
    @submit="handleSubmit"
    @cancel="closeDialog"
  />
</template>
