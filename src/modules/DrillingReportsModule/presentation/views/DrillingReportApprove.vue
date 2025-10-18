<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDrillingReportStore } from '../stores/drillingReportStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const drillingReportStore = useDrillingReportStore()

const reportId = route.params.id as string
const approving = ref(false)

const approvalForm = ref({
  comments: '',
  notifyClient: true,
  sendEmail: true,
})

const handleApprove = async () => {
  approving.value = true
  try {
    await drillingReportStore.approveReport(reportId, {
      comments: approvalForm.value.comments,
      notifyClient: approvalForm.value.notifyClient,
      sendEmail: approvalForm.value.sendEmail,
    })

    // Redirect to report detail
    router.push(`/drilling/reports/${reportId}`)
  }
  catch (error) {
    console.error('Error approving report:', error)
  }
  finally {
    approving.value = false
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
  <div class="drilling-report-approve">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-circle-check"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.approveReport') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleApprove">
          <VRow>
            <VCol cols="12">
              <VAlert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                <VIcon
                  icon="tabler-info-circle"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.approveReportWarning') }}
              </VAlert>
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="approvalForm.comments"
                :label="$t('DrillingReportsModule.common.approvalComments')"
                :placeholder="$t('DrillingReportsModule.common.approvalCommentsPlaceholder')"
                rows="4"
                :rules="[v => !!v || 'Los comentarios de aprobación son requeridos']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="approvalForm.notifyClient"
                :label="$t('DrillingReportsModule.common.notifyClient')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="approvalForm.sendEmail"
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
          color="success"
          :loading="approving"
          @click="handleApprove"
        >
          <VIcon
            icon="tabler-check"
            class="me-2"
          />
          {{ $t('DrillingReportsModule.common.approve') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </div>
</template>

<style scoped>
.drilling-report-approve {
  inline-size: 100%;
}
</style>
