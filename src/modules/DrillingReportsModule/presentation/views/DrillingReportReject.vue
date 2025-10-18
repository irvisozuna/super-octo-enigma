<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDrillingReportStore } from '../stores/drillingReportStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const drillingReportStore = useDrillingReportStore()

const reportId = route.params.id as string
const rejecting = ref(false)

const rejectionForm = ref({
  reason: '',
  comments: '',
  notifyOperator: true,
  sendEmail: true,
})

const rejectionReasons = computed(() => [
  { title: t('DrillingReportsModule.common.incompleteInformation'), value: 'incomplete_information' },
  { title: t('DrillingReportsModule.common.incorrectData'), value: 'incorrect_data' },
  { title: t('DrillingReportsModule.common.missingSignatures'), value: 'missing_signatures' },
  { title: t('DrillingReportsModule.common.qualityIssues'), value: 'quality_issues' },
  { title: t('DrillingReportsModule.common.other'), value: 'other' },
])

const handleReject = async () => {
  rejecting.value = true
  try {
    await drillingReportStore.rejectReport(reportId, {
      reason: rejectionForm.value.reason,
      comments: rejectionForm.value.comments,
      notifyOperator: rejectionForm.value.notifyOperator,
      sendEmail: rejectionForm.value.sendEmail,
    })

    // Redirect to report detail
    router.push(`/drilling/reports/${reportId}`)
  }
  catch (error) {
    console.error('Error rejecting report:', error)
  }
  finally {
    rejecting.value = false
  }
}

const handleCancel = () => {
  router.push(`/drilling/reports/${reportId}`)
}

onMounted(async () => {
  try {
    await drillingReportStore.fetchReport(reportId)
  }
  catch (error) {
    console.error('Error loading report:', error)
  }
})
</script>

<template>
  <div class="drilling-report-reject">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-circle-x"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.rejectReport') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleReject">
          <VRow>
            <VCol cols="12">
              <VAlert
                type="warning"
                variant="tonal"
                class="mb-4"
              >
                <VIcon
                  icon="tabler-alert-circle"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.rejectReportWarning') }}
              </VAlert>
            </VCol>

            <VCol cols="12">
              <VSelect
                v-model="rejectionForm.reason"
                :items="rejectionReasons"
                :label="$t('DrillingReportsModule.common.rejectionReason')"
                :rules="[v => !!v || 'El motivo de rechazo es requerido']"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="rejectionForm.comments"
                :label="$t('DrillingReportsModule.common.rejectionComments')"
                :placeholder="$t('DrillingReportsModule.common.rejectionCommentsPlaceholder')"
                rows="4"
                :rules="[v => !!v || 'Los comentarios de rechazo son requeridos']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="rejectionForm.notifyOperator"
                :label="$t('DrillingReportsModule.common.notifyOperator')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="rejectionForm.sendEmail"
                :label="$t('DrillingReportsModule.common.sendEmailNotification')"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="grey"
          variant="text"
          @click="handleCancel"
        >
          {{ $t('DrillingReportsModule.common.cancel') }}
        </VBtn>
        <VBtn
          color="error"
          :loading="rejecting"
          @click="handleReject"
        >
          <VIcon
            icon="tabler-x"
            class="me-2"
          />
          {{ $t('DrillingReportsModule.common.reject') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </div>
</template>

<style scoped>
.drilling-report-reject {
  inline-size: 100%;
}
</style>
