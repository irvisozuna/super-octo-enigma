<script setup lang="ts">
import EquipmentForm from './EquipmentForm.vue'
import { useAppManager } from '@/composables/useAppManager'

const { closeDialog } = useAppManager()

const handleSubmit = () => {
  closeDialog('submit')
}
</script>

<template>
  <EquipmentForm
    :is-editing="false"
    :show-close-button="true"
    @submit="handleSubmit"
    @cancel="closeDialog"
  />
</template>
