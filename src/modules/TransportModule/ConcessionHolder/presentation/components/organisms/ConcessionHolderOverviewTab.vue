<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ConcessionHolderEntity } from '../../../domain/entities/ConcessionHolderEntity'
import CardStatisticsVerticalSimple from '@/@core/components/CardStatisticsVerticalSimple.vue'

interface Props {
  holder: ConcessionHolderEntity
}

const props = defineProps<Props>()
const { t } = useI18n()

function formatDate(dateString: string) {
  if (!dateString)
    return '-'

  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="4"
    >
      <VRow>
        <VCol>
          <VCard>
            <VCardText>
              <VRow class="d-flex justify-center align-center">
                <VCol
                  cols="12"
                  sm="6"
                  md="4"
                  class="d-flex justify-center align-center"
                >
                  <div
                    class="border border-dashed d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-3"
                    style="aspect-ratio: 1; inline-size: 100%;"
                  >
                    <h6 class="text-base mb-0">
                      {{ holder.currentConcessions || 0 }}
                    </h6>
                    <h6 class="text-base text-center font-weight-light mb-0">
                      {{ t('TransportModule.concession_holder.fields.current_concessions') }}
                    </h6>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                  md="4"
                  class="d-flex justify-center align-center"
                >
                  <div
                    class="border border-dashed d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-3"
                    style="aspect-ratio: 1; inline-size: 100%;"
                  >
                    <h6 class="text-base mb-0">
                      {{ holder.maxAllowed || 3 }}
                    </h6>
                    <h6 class="text-base text-center font-weight-light mb-0">
                      {{ t('TransportModule.concession_holder.fields.max_allowed') }}
                    </h6>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  sm="12"
                  md="4"
                  class="d-flex justify-center align-center"
                >
                  <div
                    class="border border-dashed d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-3"
                    style="aspect-ratio: 1; inline-size: 100%;"
                  >
                    <h6 class="text-base mb-0">
                      {{ (holder.maxAllowed || 3) - (holder.currentConcessions || 0) }}
                    </h6>
                    <h6 class="text-base text-center font-weight-light mb-0">
                      {{ t('TransportModule.concession_holder.fields.available_slots') }}
                    </h6>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
      <VRow>
        <VCol
          cols="12"
          sm="6"
          md="6"
        >
          <CardStatisticsVerticalSimple
            title="Estado de Verificación"
            :color="holder.isVerified ? 'success' : 'warning'"
            icon="tabler-shield-check"
            :stats="holder.isVerified ? 'Verificado' : 'Pendiente'"
          />
        </VCol>
        <VCol
          cols="12"
          sm="6"
          md="6"
        >
          <CardStatisticsVerticalSimple
            title="Documentos"
            :color="holder.hasValidDocuments ? 'success' : 'warning'"
            icon="tabler-file-check"
            :stats="holder.hasValidDocuments ? 'Válidos' : 'Pendientes'"
          />
        </VCol>
      </VRow>
    </VCol>

    <VCol>
      <VCard class="pa-4">
        <VCardTitle class="text-h6">
          {{ t('TransportModule.concession_holder.fields.holder_information') }}
        </VCardTitle>
        <VCardText>
          <VList dense>
            <VListItem v-if="holder.holderType">
              <VIcon
                icon="tabler-user"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.holder_type') }}: {{ t(`TransportModule.concession_holder.types.${holder.holderType}`) }}
            </VListItem>
            <VListItem v-if="holder.curp">
              <VIcon
                icon="tabler-id-badge"
                class="me-2"
              />CURP: {{ holder.curp }}
            </VListItem>
            <VListItem v-if="holder.rfc">
              <VIcon
                icon="tabler-receipt-tax"
                class="me-2"
              />RFC: {{ holder.rfc }}
            </VListItem>
            <VListItem v-if="holder.identificationNumber">
              <VIcon
                icon="tabler-card-boards"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.identification_number') }}: {{ holder.identificationNumber }}
            </VListItem>
            <VListItem v-if="holder.legalRepresentative">
              <VIcon
                icon="tabler-user-check"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.legal_representative') }}: {{ holder.legalRepresentative }}
            </VListItem>
            <VListItem v-if="holder.phone">
              <VIcon
                icon="tabler-phone"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.phone') }}: {{ holder.phone }}
            </VListItem>
            <VListItem v-if="holder.email">
              <VIcon
                icon="tabler-mail"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.email') }}: {{ holder.email }}
            </VListItem>
            <VListItem v-if="holder.createdAt">
              <VIcon
                icon="tabler-calendar-plus"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.created_at') }}: {{ formatDate(holder.createdAt || '') }}
            </VListItem>
            <VListItem v-if="holder.updatedAt">
              <VIcon
                icon="tabler-calendar-event"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.updated_at') }}: {{ formatDate(holder.updatedAt || '') }}
            </VListItem>
            <VListItem v-if="holder.verifiedAt">
              <VIcon
                icon="tabler-calendar-check"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.verified_at') }}: {{ formatDate(holder.verifiedAt || '') }}
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VCol>
    <VCol
      cols="12"
      md="4"
    >
      <VCard class="pa-4">
        <VCardTitle class="text-h6">
          {{ t('TransportModule.concession_holder.sections.concessions_management') }}
        </VCardTitle>
        <VCardText>
          <VList dense>
            <VListItem>
              <VIcon
                icon="tabler-license"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.current_concessions') }}: {{ holder.currentConcessions || 0 }}
            </VListItem>
            <VListItem>
              <VIcon
                icon="tabler-check"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.max_allowed') }}: {{ holder.maxAllowed || 3 }}
            </VListItem>
            <VListItem>
              <VIcon
                icon="tabler-plus"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.available_slots') }}: {{ (holder.maxAllowed || 3) - (holder.currentConcessions || 0) }}
            </VListItem>
            <VListItem>
              <VIcon
                :icon="((holder.maxAllowed || 3) - (holder.currentConcessions || 0)) > 0 ? 'tabler-check' : 'tabler-x'"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.can_add_more') }}: {{ ((holder.maxAllowed || 3) - (holder.currentConcessions || 0)) > 0 ? 'Sí' : 'No' }}
            </VListItem>
          </VList>
        </VCardText>

        <VCardTitle class="text-h6 mt-4">
          {{ t('TransportModule.concession_holder.sections.verification') }}
        </VCardTitle>
        <VCardText>
          <VList dense>
            <VListItem>
              <VIcon
                icon="tabler-shield-check"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.verification_status') }}:
              <VChip
                size="small"
                :color="holder.isVerified ? 'success' : 'warning'"
              >
                {{ holder.isVerified ? 'Verificado' : 'Pendiente' }}
              </VChip>
            </VListItem>
            <VListItem>
              <VIcon
                icon="tabler-file-check"
                class="me-2"
              />{{ t('TransportModule.concession_holder.fields.has_valid_documents') }}:
              <VChip
                size="small"
                :color="holder.hasValidDocuments ? 'success' : 'error'"
              >
                {{ holder.hasValidDocuments ? 'Válidos' : 'Inválidos' }}
              </VChip>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
