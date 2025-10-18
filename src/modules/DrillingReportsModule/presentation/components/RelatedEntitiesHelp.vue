<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'contactSupport', method: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const handleContactSupport = (method: string) => {
  emit('contactSupport', method)
}

onMounted(() => {
  // Load help content from API or store
})
</script>

<template>
  <div class="related-entities-help">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-help-circle"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.help') }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <!-- Quick Start -->
          <VCol
            cols="12"
            md="6"
          >
            <VCard
              variant="outlined"
              class="h-100"
            >
              <VCardTitle class="text-h6">
                <VIcon
                  icon="mdi-rocket-launch"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.quickStart') }}
              </VCardTitle>
              <VCardText>
                <VList density="compact">
                  <VListItem>
                    <VListItemTitle>{{ $t('DrillingReportsModule.help.createProject') }}</VListItemTitle>
                    <VListItemSubtitle>{{ $t('DrillingReportsModule.help.createProjectDescription') }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle>{{ $t('DrillingReportsModule.help.addWells') }}</VListItemTitle>
                    <VListItemSubtitle>{{ $t('DrillingReportsModule.help.addWellsDescription') }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle>{{ $t('DrillingReportsModule.help.assignTools') }}</VListItemTitle>
                    <VListItemSubtitle>{{ $t('DrillingReportsModule.help.assignToolsDescription') }}</VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Features -->
          <VCol
            cols="12"
            md="6"
          >
            <VCard
              variant="outlined"
              class="h-100"
            >
              <VCardTitle class="text-h6">
                <VIcon
                  icon="mdi-star"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.features') }}
              </VCardTitle>
              <VCardText>
                <VList density="compact">
                  <VListItem>
                    <VListItemTitle>{{ $t('DrillingReportsModule.help.realTimeTracking') }}</VListItemTitle>
                    <VListItemSubtitle>{{ $t('DrillingReportsModule.help.realTimeTrackingDescription') }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle>{{ $t('DrillingReportsModule.help.automatedReports') }}</VListItemTitle>
                    <VListItemSubtitle>{{ $t('DrillingReportsModule.help.automatedReportsDescription') }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle>{{ $t('DrillingReportsModule.help.dataExport') }}</VListItemTitle>
                    <VListItemSubtitle>{{ $t('DrillingReportsModule.help.dataExportDescription') }}</VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCardText>
            </VCard>
          </VCol>

          <!-- FAQ -->
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="text-h6">
                <VIcon
                  icon="mdi-help"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.frequentlyAskedQuestions') }}
              </VCardTitle>
              <VCardText>
                <VExpansionPanels>
                  <VExpansionPanel>
                    <VExpansionPanelTitle>
                      {{ $t('DrillingReportsModule.help.faq1') }}
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      {{ $t('DrillingReportsModule.help.faq1Answer') }}
                    </VExpansionPanelText>
                  </VExpansionPanel>

                  <VExpansionPanel>
                    <VExpansionPanelTitle>
                      {{ $t('DrillingReportsModule.help.faq2') }}
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      {{ $t('DrillingReportsModule.help.faq2Answer') }}
                    </VExpansionPanelText>
                  </VExpansionPanel>

                  <VExpansionPanel>
                    <VExpansionPanelTitle>
                      {{ $t('DrillingReportsModule.help.faq3') }}
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      {{ $t('DrillingReportsModule.help.faq3Answer') }}
                    </VExpansionPanelText>
                  </VExpansionPanel>

                  <VExpansionPanel>
                    <VExpansionPanelTitle>
                      {{ $t('DrillingReportsModule.help.faq4') }}
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      {{ $t('DrillingReportsModule.help.faq4Answer') }}
                    </VExpansionPanelText>
                  </VExpansionPanel>

                  <VExpansionPanel>
                    <VExpansionPanelTitle>
                      {{ $t('DrillingReportsModule.help.faq5') }}
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      {{ $t('DrillingReportsModule.help.faq5Answer') }}
                    </VExpansionPanelText>
                  </VExpansionPanel>
                </VExpansionPanels>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Contact Support -->
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="text-h6">
                <VIcon
                  icon="mdi-headset"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.contactSupport') }}
              </VCardTitle>
              <VCardText>
                <VRow>
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VCard
                      variant="tonal"
                      color="primary"
                    >
                      <VCardText class="text-center">
                        <VIcon
                          icon="mdi-email"
                          size="48"
                          class="mb-4"
                        />
                        <div class="text-h6 mb-2">
                          {{ $t('DrillingReportsModule.common.email') }}
                        </div>
                        <div class="text-body-2">
                          support@drillingreports.com
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VCard
                      variant="tonal"
                      color="success"
                    >
                      <VCardText class="text-center">
                        <VIcon
                          icon="mdi-phone"
                          size="48"
                          class="mb-4"
                        />
                        <div class="text-h6 mb-2">
                          {{ $t('DrillingReportsModule.common.phone') }}
                        </div>
                        <div class="text-body-2">
                          +1 (555) 123-4567
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VCard
                      variant="tonal"
                      color="info"
                    >
                      <VCardText class="text-center">
                        <VIcon
                          icon="mdi-chat"
                          size="48"
                          class="mb-4"
                        />
                        <div class="text-h6 mb-2">
                          {{ $t('DrillingReportsModule.common.chat') }}
                        </div>
                        <div class="text-body-2">
                          {{ $t('DrillingReportsModule.common.available24x7') }}
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.related-entities-help {
  inline-size: 100%;
}
</style>
