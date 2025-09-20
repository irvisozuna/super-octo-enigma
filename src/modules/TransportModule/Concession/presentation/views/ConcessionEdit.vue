<script setup lang="ts">
import { useRoute } from 'vue-router'
import ConcessionWizard from '../components/organisms/ConcessionWizard.vue'

// Get the concession ID from route params
const route = useRoute()
const concessionId = route.params.id as string
</script>

<template>
  <div class="concession-edit">
    <!-- Use the wizard component with concession ID for edit mode -->
    <ConcessionWizard :concession-id="concessionId" />
  </div>
</template>

<style scoped>
.concession-edit {
  padding: 0; /* Remove padding since wizard handles its own layout */
}
</style>