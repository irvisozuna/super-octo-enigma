<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm';

interface Permission {
  name: string
  read: boolean
  update: boolean
  create: boolean
  delete: boolean
}

interface Roles {
  id: string,
  name: string
  permissions: Permission[]
}

interface Props {
  rolePermissions?: Roles
  isDialogVisible: boolean
}
interface Emit {
  (e: 'update:isDialogVisible', value: boolean): void
  (e: 'update:rolePermissions', value: Roles): void
}

const props = withDefaults(defineProps<Props>(), {
  rolePermissions: () => ({
    name: '',
    permissions: [],
  }),
})

const emit = defineEmits<Emit>()


// 👉 Permission List
const permissions = ref<Permission[]>([])

// Fetch roles desde el backend
const fetchRoles = async () => {
  try {
    const { data, error, isFetching } = await useApi<Permission[]>('/company/permissions');
    permissions.value = data.value ?? [];
  } catch (error) {
    console.error('Error al obtener los roles:', error);
  }
};
fetchRoles();

const isSelectAll = ref(false)
const role = ref('')
const refPermissionForm = ref<VForm>()

const checkedCount = computed(() => {
  let counter = 0

  permissions.value.forEach(permission => {
    Object.entries(permission).forEach(([key, value]) => {
      if (key !== 'name' && value)
        counter++
    })
  })

  return counter
})

const isIndeterminate = computed(() => checkedCount.value > 0 && checkedCount.value < (permissions.value.length * 4))

// select all
watch(isSelectAll, val => {
  permissions.value = permissions.value.map(permission => ({
    ...permission,
    read: val,
    update: val,
    create: val,
    delete: val,
  }))
})

// if Indeterminate is false, then set isSelectAll to false
watch(isIndeterminate, () => {
  if (!isIndeterminate.value)
    isSelectAll.value = false
})

// if all permissions are checked, then set isSelectAll to true
watch(permissions, () => {
  if (checkedCount.value === (permissions.value.length * 4))
    isSelectAll.value = true
}, { deep: true })

// if rolePermissions is not empty, then set permissions
watch(props, () => {
  if (props.rolePermissions && props.rolePermissions.permissions.length) {
    role.value = props.rolePermissions.name
    permissions.value = permissions.value.map(permission => {
      const rolePermission = props.rolePermissions?.permissions.find(item => item.name === permission.name)

      if (rolePermission) {
        return {
          ...permission,
          ...rolePermission,
        }
      }

      return permission
    })
  }
})

const onSubmit = async () => {
  const rolePermissions = {
    id: props.rolePermissions.id,
    name: role.value,
    permissions: permissions.value,
  }
  try {

    const METHOD = props.rolePermissions.name ? 'PUT' : 'POST'
    // Realiza la solicitud al backend
    const response = await $api('/company/roles', {
      method: METHOD,
      body: rolePermissions,
    });



    // Emitir el evento para cerrar el diálogo y limpiar el formulario
    emit('update:isDialogVisible', false);
    emit('update:rolePermissions', rolePermissions)
    isSelectAll.value = false;
    refPermissionForm.value?.reset();

    // Mensaje de éxito o acciones adicionales
    console.log('Role created successfully!');
  } catch (err) {
    console.error('Error inesperado al crear el rol:', err);
  }

}

const onReset = () => {
  emit('update:isDialogVisible', false)
  isSelectAll.value = false
  refPermissionForm.value?.reset()
}
</script>

<template>
  <VDialog :width="$vuetify.display.smAndDown ? 'auto' : 900" :model-value="props.isDialogVisible"
    @update:model-value="onReset">
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="onReset" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <!-- 👉 Title -->
        <h4 class="text-h4 text-center mb-2">
          {{ props.rolePermissions.name ? 'Edit' : 'Add New' }} Role
        </h4>
        <p class="text-body-1 text-center mb-6">
          Set Role Permissions
        </p>

        <!-- 👉 Form -->
        <VForm ref="refPermissionForm">
          <!-- 👉 Role name -->
          <AppTextField v-model="role" label="Role Name" placeholder="Enter Role Name" :disabled="role === 'admin'" />

          <h5 class="text-h5 my-6">
            Role Permissions
          </h5>

          <!-- 👉 Role Permissions -->

          <VTable class="permission-table text-no-wrap mb-6">
            <!-- 👉 Admin  -->
            <tr>
              <td>
                <h6 class="text-h6">
                  {{ $t('administrator access') }}
                </h6>
              </td>
              <td colspan="4">
                <div class="d-flex justify-end">
                  <VCheckbox v-model="isSelectAll" v-model:indeterminate="isIndeterminate" label="Select All"
                    :disabled="role === 'admin'" />
                </div>
              </td>
            </tr>

            <!-- 👉 Other permission loop -->
            <template v-for="permission in permissions" :key="permission.name">
              <tr>
                <td>
                  <h6 class="text-h6">
                    {{ $t(permission.name) }}
                  </h6>
                </td>
                <td>
                  <div class="d-flex justify-end">
                    <VCheckbox :disabled="role === 'admin'" v-model="permission.create" :label="$t('create')" />
                  </div>
                </td>
                <td>
                  <div class="d-flex justify-end">
                    <VCheckbox :disabled="role === 'admin'" v-model="permission.read" :label="$t('read')" />
                  </div>
                </td>
                <td>
                  <div class="d-flex justify-end">
                    <VCheckbox :disabled="role === 'admin'" v-model="permission.update" :label="$t('update')" />
                  </div>
                </td>

                <td>
                  <div class="d-flex justify-end">
                    <VCheckbox :disabled="role === 'admin'" v-model="permission.delete" :label="$t('delete')" />
                  </div>
                </td>
              </tr>
            </template>
          </VTable>

          <!-- 👉 Actions button -->
          <div class="d-flex align-center justify-center gap-4" v-if="role !== 'admin'">
            <VBtn @click="onSubmit">
              {{ $t('save') }}
            </VBtn>

            <VBtn color="secondary" variant="tonal" @click="onReset">
              {{ $t('cancel') }}
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.permission-table {
  td {
    border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-block: 0.5rem;

    .v-checkbox {
      min-inline-size: 4.75rem;
    }

    &:not(:first-child) {
      padding-inline: 0.5rem;
    }

    .v-label {
      white-space: nowrap;
    }
  }
}
</style>
