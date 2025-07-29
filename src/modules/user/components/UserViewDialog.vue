<script setup lang="ts">
import { ref } from 'vue'
import { useAppManager } from '@/composables/useAppManager'

const item = ref(null)
const { closeDialog } = useAppManager()

function close() {
  closeDialog()
}

defineExpose({ open })
</script>

<template>
  <VCard>
    <VCardTitle>User Details</VCardTitle>
    <VCardText>
      <p><strong>Name:</strong> {{ item?.name }}</p>
      <p><strong>Email:</strong> {{ item?.email }}</p>
      <p><strong>Role:</strong> {{ item?.role }}</p>
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn
        color="primary"
        @click="close"
      >
        Close
      </VBtn>
    </VCardActions>
  </VCard>
</template>
