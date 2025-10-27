<template>
  <VCard class="ma-4">
    <VCardTitle>
      <VIcon icon="tabler-bug" class="me-2" />
      Debug de Permisos
    </VCardTitle>
    <VCardText>
      <VRow>
        <VCol cols="12" md="6">
          <h6>Permisos del Usuario:</h6>
          <VList density="compact">
            <VListItem
              v-for="(permission, index) in userPermissions"
              :key="index"
              class="text-caption"
            >
              <VListItemTitle>
                {{ permission.action }} - {{ permission.subject }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCol>
        <VCol cols="12" md="6">
          <h6>Pruebas de Permisos:</h6>
          <VList density="compact">
            <VListItem>
              <VListItemTitle>
                Clientes (read): 
                <VChip 
                  :color="can('read', 'Client') ? 'success' : 'error'"
                  size="small"
                >
                  {{ can('read', 'Client') ? 'SÍ' : 'NO' }}
                </VChip>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                Clientes (create): 
                <VChip 
                  :color="can('create', 'Client') ? 'success' : 'error'"
                  size="small"
                >
                  {{ can('create', 'Client') ? 'SÍ' : 'NO' }}
                </VChip>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                Empleados (read): 
                <VChip 
                  :color="can('read', 'Employee') ? 'success' : 'error'"
                  size="small"
                >
                  {{ can('read', 'Employee') ? 'SÍ' : 'NO' }}
                </VChip>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                Empleados (create): 
                <VChip 
                  :color="can('create', 'Employee') ? 'success' : 'error'"
                  size="small"
                >
                  {{ can('create', 'Employee') ? 'SÍ' : 'NO' }}
                </VChip>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAbility } from '@casl/vue'

const { can } = useAbility()

// Simular los permisos del usuario (en producción vendrían del backend)
const userPermissions = [
  { action: 'read', subject: 'Client' },
  { action: 'create', subject: 'Client' },
  { action: 'update', subject: 'Client' },
  { action: 'delete', subject: 'Client' },
  { action: 'suspend', subject: 'Client' },
  { action: 'blacklist', subject: 'Client' },
  { action: 'read', subject: 'Employee' },
  { action: 'create', subject: 'Employee' },
  { action: 'update', subject: 'Employee' },
  { action: 'delete', subject: 'Employee' },
  { action: 'suspend', subject: 'Employee' },
  { action: 'reactivate', subject: 'Employee' },
  { action: 'terminate', subject: 'Employee' },
  { action: 'read', subject: 'Profile' },
]
</script>
