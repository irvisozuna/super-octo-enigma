<script setup lang="ts">
import type { RebillingItem } from '../../types/RebillingItem'

interface Props {
  isDialogVisible: boolean
  rebillingData: RebillingItem[]
}

const props = defineProps<Props>()
const emit = defineEmits(['update:isDialogVisible'])

const dialogModelValueUpdate = (val: boolean) => {
  emit('update:isDialogVisible', val)
}
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    max-width="800"
    @update:model-value="dialogModelValueUpdate"
  >
    <VCard>
      <VCardTitle class="text-h5 pa-6">
        Detalle de Refacturación
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <VRow>
          <VCol
            v-for="(item, index) in props.rebillingData"
            :key="item.rowid"
            cols="12"
          >
            <VCard
              variant="outlined"
              class="mb-4"
            >
              <VCardText>
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h6">
                    Refacturación #{{ index + 1 }}
                  </div>
                  <VChip
                    color="warning"
                    size="small"
                  >
                    {{ item.type_log }}
                  </VChip>
                </div>

                <VRow>
                  <!-- Antes -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-subtitle-1 font-weight-medium mb-2">
                      Valores Anteriores
                    </div>
                    <VList density="compact">
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-droplet"
                            color="primary"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Consumo: {{ item.old_intake }} m³</VListItemTitle>
                      </VListItem>
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-calculator"
                            color="primary"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Lectura Anterior: {{ item.old_past_intake }} m³</VListItemTitle>
                      </VListItem>
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-calculator"
                            color="primary"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Lectura Actual: {{ item.old_hydrometer }}</VListItemTitle>
                      </VListItem>
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-currency-dollar"
                            color="primary"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Costo: {{ $formatCurrency(item.old_cost) }}</VListItemTitle>
                      </VListItem>
                    </VList>
                  </VCol>

                  <!-- Después -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-subtitle-1 font-weight-medium mb-2">
                      Valores Nuevos
                    </div>
                    <VList density="compact">
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-droplet"
                            color="success"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Consumo: {{ item.new_intake }} m³</VListItemTitle>
                      </VListItem>
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-calculator"
                            color="success"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Lectura Anterior: {{ item.new_past_intake }} m³</VListItemTitle>
                      </VListItem>
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-calculator"
                            color="success"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Lectura Actual: {{ item.new_hydrometer }} m³</VListItemTitle>
                      </VListItem>
                      <VListItem>
                        <template #prepend>
                          <VIcon
                            icon="tabler-currency-dollar"
                            color="success"
                            class="me-2"
                          />
                        </template>
                        <VListItemTitle>Costo: {{ $formatCurrency(item.new_cost) }}</VListItemTitle>
                      </VListItem>
                    </VList>
                  </VCol>

                  <!-- Información adicional -->
                  <VCol cols="12">
                    <VDivider class="my-4" />
                    <div class="d-flex flex-column gap-2">
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-calendar"
                          color="primary"
                          class="me-2"
                        />
                        <span class="text-body-2">
                          Fecha de refacturación: {{ new Date(item.date_creation).toLocaleString() }}
                        </span>
                      </div>
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-user"
                          color="primary"
                          class="me-2"
                        />
                        <span class="text-body-2">
                          Creado por: {{ item.created_by_name }}
                        </span>
                      </div>
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-message"
                          color="primary"
                          class="me-2"
                        />
                        <span class="text-body-2">
                          Comentarios: {{ item.comments }}
                        </span>
                      </div>
                    </div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-6">
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          @click="dialogModelValueUpdate(false)"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
