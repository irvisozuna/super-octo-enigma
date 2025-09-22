<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConcessionWizard from '../components/organisms/ConcessionWizard.vue'

// Router and i18n
const router = useRouter()
const { t } = useI18n()

// Methods
const handleWizardSubmit = (data: any) => {
  console.log('Concession created successfully:', data)

  // The wizard handles the redirect
}

const handleWizardCancel = () => {
  console.log('Concession creation cancelled')

  // The wizard handles the redirect
}
</script>

<template>
  <div class="concession-create">
    <ConcessionWizard
      @submit="handleWizardSubmit"
      @cancel="handleWizardCancel"
    />
  </div>
</template>

<style scoped>
.concession-create {
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>
