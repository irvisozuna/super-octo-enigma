<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConcessionHolderStore } from '../stores/concessionholderStore'
import ConcessionHolderEditDialogMolecule from '../components/molecules/ConcessionHolderEditDialogMolecule.vue'
import ConcessionHolderDeleteDialogMolecule from '../components/molecules/ConcessionHolderDeleteDialogMolecule.vue'
import ConcessionHolderOverviewTab from '../components/organisms/ConcessionHolderOverviewTab.vue'
import ConcessionHolderConcessionsTab from '../components/organisms/ConcessionHolderConcessionsTab.vue'
import ConcessionHolderFinesTab from '../components/organisms/ConcessionHolderFinesTab.vue'
import ConcessionHolderDocumentsTab from '../components/organisms/ConcessionHolderDocumentsTab.vue'
import ConcessionHolderHistoryTab from '../components/organisms/ConcessionHolderHistoryTab.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const concessionHolderStore = useConcessionHolderStore()

const holder = computed(() => concessionHolderStore.currentItem)
const loading = computed(() => concessionHolderStore.loading)
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const activeTab = ref(0)

const holderId = computed(() => route.params.id as string)

// Tab configuration
const tabs = ref([
  {
    title: t('TransportModule.concession_holder.sections.basic_info'),
    icon: 'tabler-user-circle',
    component: ConcessionHolderOverviewTab,
  },
  {
    title: 'Concesiones',
    icon: 'tabler-license',
    component: ConcessionHolderConcessionsTab,
  },
  {
    title: 'Multas',
    icon: 'tabler-alert-triangle',
    component: ConcessionHolderFinesTab,
  },
  {
    title: 'Documentos',
    icon: 'tabler-files',
    component: ConcessionHolderDocumentsTab,
  },
  {
    title: 'Historial',
    icon: 'tabler-history',
    component: ConcessionHolderHistoryTab,
  },
])

async function loadHolderDetail() {
  try {
    await concessionHolderStore.fetchById(holderId.value)
  }
  catch (error) {
    console.error('Error loading concession holder:', error)
  }
}

function openEditDialog() {
  editDialogVisible.value = true
}

function openDeleteDialog() {
  deleteDialogVisible.value = true
}

function handleEditSuccess() {
  editDialogVisible.value = false
  loadHolderDetail()
}

function handleDeleteSuccess() {
  deleteDialogVisible.value = false
  router.push({ name: 'concessionHoldersList' })
}

onMounted(() => {
  if (holderId.value)
    loadHolderDetail()
  else
    router.push({ name: 'concessionHoldersList' })
})
</script>

<template>
  <div class="concession-holder-detail">
    <!-- Header Information -->
    <VRow>
      <VCol>
        <VCard>
          <VCardTitle>
            <VSheet class="d-flex mb-6">
              <VSheet class="ma-2 pa-2 me-auto">
                <VBtn
                  icon
                  variant="text"
                  :to="{ name: 'concessionHoldersList' }"
                  class="me-4"
                >
                  <VIcon>tabler-arrow-left</VIcon>
                </VBtn>
                <span class="text-h6">{{ t('TransportModule.concession_holder.fields.holder_number') }}:</span>
                <span class="text-h6 ms-2">
                  <VChip color="primary">CH-{{ holder?.local_id?.toString().padStart(4, '0') || '0000' }}</VChip>
                </span>
                <span class="text-h6 ms-4">{{ t('TransportModule.concession_holder.fields.full_name') }}:</span>
                <span class="text-h6 ms-2">
                  <VChip color="primary">{{ holder?.fullName || 'Cargando...' }}</VChip>
                </span>
              </VSheet>
              <VSheet class="ma-2 pa-2">
                <VChip :color="holder?.isVerified ? 'success' : 'warning'">
                  {{ holder?.isVerified ? 'Verificado' : 'Sin Verificar' }}
                </VChip>
              </VSheet>
            </VSheet>
          </VCardTitle>
          <VCardText>
            <VRow>
              <!-- Información del concesionario -->
              <VCol align-self="end">
                <div>
                  <span class="text-h6 font-weight-500">
                    <VIcon
                      icon="tabler-user"
                      class="me-2"
                    />{{ t('TransportModule.concession_holder.fields.holder_type') }}:
                  </span>
                  {{ t(`TransportModule.concession_holder.types.${holder?.holderType || 'individual'}`) }}
                </div>
                <div class="d-flex flex-wrap mt-2">
                  <span
                    v-if="holder?.curp"
                    class="flex-1-1-100"
                  >
                    <span class="text-h6 font-weight-500">
                      <VIcon
                        icon="tabler-id-badge"
                        class="me-2"
                      />CURP:
                    </span>
                    {{ holder?.curp }}
                  </span>
                  <span
                    v-if="holder?.rfc"
                    class="flex-1-0"
                  >
                    <span class="text-h6 font-weight-500">RFC:</span>
                    {{ holder?.rfc }}
                  </span>
                  <span
                    v-if="holder?.legalRepresentative"
                    class="flex-1-0"
                  >
                    <span class="text-h6 font-weight-500">
                      <VIcon
                        icon="tabler-user-check"
                        class="me-2"
                      />{{ t('TransportModule.concession_holder.fields.legal_representative') }}:
                    </span>
                    {{ holder?.legalRepresentative }}
                  </span>
                </div>
              </VCol>

              <!-- Action Buttons -->
              <VCol align-self="end">
                <VRow>
                  <VCol class="d-flex flex-wrap ga-3">
                    <VBtn
                      v-if="holder?.phone"
                      variant="outlined"
                      :href="`tel:${holder.phone}`"
                    >
                      <VIcon
                        icon="tabler-phone"
                        class="me-2"
                      />
                      {{ holder.phone }}
                    </VBtn>
                    <VBtn
                      v-if="holder?.email"
                      variant="outlined"
                      :href="`mailto:${holder.email}`"
                    >
                      <VIcon
                        icon="tabler-mail"
                        class="me-2"
                      />
                      {{ holder.email }}
                    </VBtn>
                    <VBtn
                      color="primary"
                      @click="openEditDialog"
                    >
                      <VIcon
                        icon="tabler-edit"
                        class="me-2"
                      />{{ t('TransportModule.common.edit') }}
                    </VBtn>
                    <VBtn
                      color="error"
                      variant="outlined"
                      prepend-icon="tabler-trash"
                      @click="openDeleteDialog"
                    >
                      {{ t('TransportModule.common.delete') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
      <p class="mt-4 text-medium-emphasis">
        {{ t('TransportModule.common.loading') }}
      </p>
    </div>

    <!-- Content with Tabs -->
    <template v-else-if="holder">
      <VRow>
        <VCol cols="12">
          <VCard>
            <VTabs v-model="activeTab">
              <VTab
                v-for="(tab, index) in tabs"
                :key="index"
              >
                <VIcon
                  :size="18"
                  :icon="tab.icon"
                  class="me-1"
                />
                {{ tab.title }}
              </VTab>
            </VTabs>
          </VCard>

          <VWindow
            v-model="activeTab"
            class="mt-4 disable-tab-transition"
            :touch="false"
          >
            <VWindowItem
              v-for="(tab, index) in tabs"
              :key="index"
            >
              <component
                :is="tab.component"
                :holder="holder"
              />
            </VWindowItem>
          </VWindow>
        </VCol>
      </VRow>
    </template>

    <!-- Error State -->
    <VAlert
      v-else
      type="error"
      variant="tonal"
      class="my-8"
    >
      Error al cargar los datos
    </VAlert>

    <!-- Dialogs -->
    <ConcessionHolderEditDialogMolecule
      :visible="editDialogVisible"
      :item="holder"
      @success="handleEditSuccess"
      @close="editDialogVisible = false"
    />

    <ConcessionHolderDeleteDialogMolecule
      v-model="deleteDialogVisible"
      :holder="holder"
      @success="handleDeleteSuccess"
      @cancel="deleteDialogVisible = false"
    />
  </div>
</template>

<style scoped>
/* Estilos para los tabs siguiendo el patrón de ContractDetails */
.concession-holder-detail .disable-tab-transition {
  transition: none;
}
</style>
