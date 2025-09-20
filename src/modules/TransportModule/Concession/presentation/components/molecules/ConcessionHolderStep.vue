<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConcessionHolderStore } from '../../../../ConcessionHolder/presentation/stores/concessionholderStore'
import ConcessionHolderCreateDialogMolecule from '../../../../ConcessionHolder/presentation/components/molecules/ConcessionHolderCreateDialogMolecule.vue'
import { useAppManager } from '@/composables/useAppManager'

// Props
interface Props {
  modelValue: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  validate: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()
const { openDialog } = useAppManager()
const concessionHolderStore = useConcessionHolderStore()

// State
const loadingHolders = ref(false)
const selectedHolderId = ref(props.modelValue)

// Computed
const concessionHolders = computed(() =>
  concessionHolderStore.items.map(holder => ({
    ...holder,
    display_name: `${holder.fullName} (${holder.holderType})`,
    full_name: holder.fullName,
    holder_type: holder.holderType,
    identification_number: holder.identificationNumber,
    id: holder.id,
  }))
)

const selectedHolder = computed(() => {
  return concessionHolders.value.find(holder => holder.id === selectedHolderId.value)
})

const isValid = computed(() => {
  return !!selectedHolderId.value
})

// Methods
const openCreateHolderDialog = () => {
  openDialog(
    ConcessionHolderCreateDialogMolecule,
    { title: 'Crear Nuevo Titular' },
    { width: '800px', persistent: true }
  ).then(result => {
    if (result === 'submit') {
      // Refresh the holders list and select the new holder
      concessionHolderStore.fetchList().then(() => {
        // Find the newly created holder (assume it's the last one)
        const newHolder = concessionHolderStore.items[concessionHolderStore.items.length - 1]
        if (newHolder) {
          selectedHolderId.value = newHolder.id
        }
      })
    }
  })
}

const clearSelection = () => {
  selectedHolderId.value = ''
}

// Watchers
watch(selectedHolderId, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(isValid, (newValue) => {
  emit('validate', newValue)
}, { immediate: true })

// Initialize
onMounted(async () => {
  loadingHolders.value = true
  try {
    await concessionHolderStore.fetchList()
  } catch (error) {
    console.error('Error loading concession holders:', error)
  } finally {
    loadingHolders.value = false
  }
})
</script>

<template>
  <div class="concession-holder-step">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-h5 mb-2">
        <VIcon
          icon="tabler-user"
          size="20"
          class="me-2"
          color="primary"
        />
        Seleccionar Titular de la Concesión
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Elige el titular responsable de esta concesión o crea uno nuevo si no existe en el sistema.
      </p>
    </div>

    <!-- Selection Section -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle>
        <VIcon
          icon="tabler-search"
          class="me-2"
        />
        Buscar Titular Existente
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol cols="12">
            <div class="d-flex gap-3 align-end">
              <VAutocomplete
                v-model="selectedHolderId"
                label="Titular de la Concesión *"
                :items="concessionHolders"
                item-title="display_name"
                item-value="id"
                :loading="loadingHolders"
                placeholder="Buscar por nombre, RFC o CURP..."
                clearable
                required
                class="flex-grow-1"
                prepend-inner-icon="tabler-user-search"
                :rules="[v => !!v || 'Debe seleccionar un titular']"
              >
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VAvatar
                        size="40"
                        color="primary"
                        variant="tonal"
                      >
                        <VIcon>
                          {{ item.raw.holder_type === 'NATURAL' ? 'tabler-user' : 'tabler-building' }}
                        </VIcon>
                      </VAvatar>
                    </template>
                    <VListItemTitle>{{ item.raw.full_name }}</VListItemTitle>
                    <VListItemSubtitle>
                      {{ item.raw.holder_type === 'NATURAL' ? 'Persona Física' : 'Persona Moral' }} •
                      {{ item.raw.identification_number }}
                    </VListItemSubtitle>
                  </VListItem>
                </template>
              </VAutocomplete>

              <VBtn
                v-if="selectedHolderId"
                color="warning"
                variant="outlined"
                icon
                @click="clearSelection"
              >
                <VIcon>tabler-x</VIcon>
                <VTooltip activator="parent">
                  Limpiar selección
                </VTooltip>
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Selected Holder Preview -->
    <VCard
      v-if="selectedHolder"
      variant="outlined"
      color="success"
      class="mb-6"
    >
      <VCardTitle class="text-success">
        <VIcon
          icon="tabler-check-circle"
          class="me-2"
        />
        Titular Seleccionado
      </VCardTitle>
      <VCardText>
        <div class="d-flex align-center">
          <VAvatar
            size="64"
            color="success"
            variant="tonal"
            class="me-4"
          >
            <VIcon size="32">
              {{ selectedHolder.holder_type === 'NATURAL' ? 'tabler-user' : 'tabler-building' }}
            </VIcon>
          </VAvatar>
          <div class="flex-grow-1">
            <h3 class="text-h6 mb-1">
              {{ selectedHolder.full_name }}
            </h3>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <VChip
                size="small"
                color="info"
                variant="tonal"
              >
                {{ selectedHolder.holder_type === 'NATURAL' ? 'Persona Física' : 'Persona Moral' }}
              </VChip>
              <VChip
                size="small"
                color="primary"
                variant="tonal"
              >
                {{ selectedHolder.identification_number }}
              </VChip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0">
              ID: {{ selectedHolder.id }}
            </p>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Create New Holder -->
    <!-- <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle>
        <VIcon
          icon="tabler-user-plus"
          class="me-2"
        />
        ¿No encuentras el titular?
      </VCardTitle>
      <VCardText>
        <p class="text-body-2 mb-4">
          Si el titular no existe en el sistema, puedes crear uno nuevo.
        </p>
        <VBtn
          color="primary"
          variant="outlined"
          size="large"
          @click="openCreateHolderDialog"
        >
          <VIcon start>
            tabler-user-plus
          </VIcon>
          Crear Nuevo Titular
        </VBtn>
      </VCardText>
    </VCard> -->

    <!-- Validation Status -->
    <VAlert
      v-if="!isValid"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle>Selección Requerida</VAlertTitle>
      Debes seleccionar un titular para poder continuar con el siguiente paso.
    </VAlert>

    <VAlert
      v-else
      type="success"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle>¡Perfecto!</VAlertTitle>
      Has seleccionado un titular válido. Puedes continuar al siguiente paso.
    </VAlert>
  </div>
</template>

<style scoped>
.concession-holder-step {
  max-inline-size: 800px;
}
</style>
