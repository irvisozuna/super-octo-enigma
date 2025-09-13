<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConcessionHolderEdit } from '../composables/useConcessionHolderEdit'

const router = useRouter()
const route = useRoute()
const holderId = route.params.id as string

// Usar el composable que maneja la lógica de negocio
const { holder, loading, error, loadHolder } = useConcessionHolderEdit()

// Variables ya definidas en el composable

const getStatusColor = (status: string) => {
  const colors = { ACTIVE: 'success', INACTIVE: 'warning', SUSPENDED: 'error' }

  return colors[status] || 'grey'
}

const loadHolderData = async () => {
  try {
    await loadHolder(holderId)
  }
  catch (err) {
    console.error('Error loading holder:', err)
  }
}

onMounted(() => loadHolderData())
</script>

<template>
  <div class="concession-holder-view">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              :to="{ name: 'concessionHoldersList' }"
              icon
              variant="text"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              Holder Details
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow v-if="loading">
        <VCol
          cols="12"
          class="text-center py-8"
        >
          <VProgressCircular
            size="64"
            indeterminate
          />
          <p class="mt-4">
            Loading holder details...
          </p>
        </VCol>
      </VRow>

      <VRow v-else-if="holder">
        <VCol cols="12">
          <VCard class="mb-4">
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="8"
                >
                  <div class="d-flex align-center mb-4">
                    <VAvatar
                      size="64"
                      color="primary"
                      class="mr-4"
                    >
                      <VIcon size="32">
                        tabler-user
                      </VIcon>
                    </VAvatar>
                    <div>
                      <h2 class="text-h5">
                        {{ holder.full_name }}
                      </h2>
                      <p class="text-body-2 text-medium-emphasis">
                        {{ holder.holder_type_label }} - {{ holder.curp || holder.rfc }}
                      </p>
                    </div>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                  class="text-md-right"
                >
                  <VChip
                    :color="getStatusColor(holder.verification_status)"
                    size="large"
                    class="mb-2"
                  >
                    <VIcon start>
                      tabler-circle-filled
                    </VIcon>
                    {{ holder.verification_status_label }}
                  </VChip>
                  <div class="mt-2">
                    <VBtn
                      color="primary"
                      variant="outlined"
                      :to="{ name: 'concessionHoldersEdit', params: { id: holderId } }"
                      class="mr-2"
                    >
                      <VIcon start>
                        tabler-edit
                      </VIcon> Edit
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-info-circle
                  </VIcon>
                  Personal Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Nombre Completo"
                        :model-value="holder.full_name"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Tipo de Titular"
                        :model-value="holder.holder_type_label"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="holder.company_name"
                      cols="12"
                    >
                      <VTextField
                        label="Nombre de Empresa"
                        :model-value="holder.company_name"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="CURP/RFC"
                        :model-value="holder.curp || holder.rfc"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-phone
                  </VIcon>
                  Contact Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Teléfono"
                        :model-value="holder.phone"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="holder.email"
                      cols="12"
                    >
                      <VTextField
                        label="Email"
                        :model-value="holder.email"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="holder.address"
                      cols="12"
                    >
                      <VTextField
                        label="Dirección"
                        :model-value="holder.address"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="holder.city"
                      cols="12"
                    >
                      <VTextField
                        label="Ciudad"
                        :model-value="holder.city"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow
            v-if="holder.notes"
            class="mt-4"
          >
            <VCol cols="12">
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-notes
                  </VIcon>
                  Notas
                </VCardTitle>
                <VCardText>
                  <VTextarea
                    :model-value="holder.notes"
                    readonly
                    variant="outlined"
                    rows="4"
                  />
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow class="mt-4">
            <VCol cols="12">
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-certificate
                  </VIcon>
                  Concesiones Activas ({{ holder.current_concessions_count || 0 }})
                </VCardTitle>
                <VCardText>
                  <div
                    v-if="!holder.current_concessions_count"
                    class="text-center py-4"
                  >
                    <VIcon
                      size="48"
                      color="grey"
                    >
                      tabler-certificate-off
                    </VIcon>
                    <p class="mt-2">
                      No hay concesiones activas
                    </p>
                  </div>
                  <VAlert
                    v-else
                    type="info"
                    variant="tonal"
                  >
                    Este titular tiene {{ holder.current_concessions_count }} concesión(es) activa(s)
                  </VAlert>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCol>
      </VRow>

      <VRow v-else>
        <VCol
          cols="12"
          class="text-center py-8"
        >
          <VIcon
            size="64"
            color="error"
          >
            tabler-alert-circle
          </VIcon>
          <h3 class="text-h6 mt-4">
            Holder Not Found
          </h3>
          <p class="text-body-2 mt-2">
            The concession holder doesn't exist or has been deleted.
          </p>
          <VBtn
            color="primary"
            class="mt-4"
            :to="{ name: 'concessionHoldersList' }"
          >
            Back to Holders
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<style scoped>
.concession-holder-view { padding: 20px; }
</style>
