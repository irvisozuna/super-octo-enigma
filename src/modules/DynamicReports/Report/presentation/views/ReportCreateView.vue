<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ReportWizard from '../components/organisms/ReportWizard.vue'

const { t } = useI18n()
const router = useRouter()

const handleSubmit = (data: any) => {
  console.log('Report created:', data)

  // El wizard ya maneja la redirección a /reports
}

const handleCancel = () => {
  router.push('/reports')
}
</script>

<template>
  <div>
    <VCard class="pa-6">
      <VCardTitle class="text-h4 font-weight-bold mb-2">
        {{ $t('DynamicReports.report.create.title') }}
      </VCardTitle>
      <VCardText class="text-body-1 text-medium-emphasis">
        {{ $t('DynamicReports.report.create.description') }}
      </VCardText>
    </VCard>

    <VCard class="mt-6">
      <ReportWizard
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </VCard>
  </div>
</template>
