<script setup lang="ts">
import AddEditRoleDialog from './components/AddEditRoleDialog.vue'
import girlUsingMobile from '@images/pages/girl-using-mobile.png'

interface SpecialPermission {
  name: string
  action: string
  label: string
  selected?: boolean
}

interface ModulePermission {
  module: string
  moduleLabel: string
  isSubModule: boolean
  parentModule: string | null
  crud: {
    read: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
  special: SpecialPermission[]
  subModules: ModulePermission[]
}

interface RoleDetails {
  id: string
  name: string
  permissions: ModulePermission[]
}

interface Roles {
  id: string
  name: string
  users: string[]
  permissions: ModulePermission[]
}

// 👉 Roles List
const roles = ref<Roles[]>([

])

const isRoleDialogVisible = ref(false)

const roleDetail = ref<RoleDetails>()

const isAddRoleDialogVisible = ref(false)

// Fetch roles desde el backend
const isLoadingRoles = ref(false)

const fetchRoles = async () => {
  try {
    const { data, error, isFetching } = await useApi<Roles[]>('/company/roles')
    roles.value = data.value ?? []
  }
  catch (error) {
    console.error('Error al obtener los roles:', error)
  }
  finally {
    isLoadingRoles.value = false
  }
}

fetchRoles()

const handleRolePermissions = (role: any) => {
  fetchRoles()
}

const editPermission = (value: Roles) => {
  console.log('Editing role - full value:', value)
  console.log('Editing role - name:', value.name)
  console.log('Editing role - permissions:', value.permissions)
  isRoleDialogVisible.value = true
  roleDetail.value = {
    id: value.id,
    name: value.name,
    permissions: value.permissions
  }
}
</script>

<template>
  <VProgressCircular
    v-if="isLoadingRoles"
    indeterminate
    color="primary"
  />
  <VRow>
    <!-- 👉 Roles -->
    <VCol
      v-for="item in roles"
      :key="item.name"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex align-center pb-4">
          <div class="text-body-1">
            Total {{ item.users.length }} {{ $t('users') }}
          </div>

          <VSpacer />

          <div class="v-avatar-group">
            <template
              v-for="(user, index) in item.users"
              :key="user"
            >
              <VAvatar
                v-if="item.users.length > 0 && item.users.length !== 4 && index < 3"
                size="40"
                :image="user"
              />

              <VAvatar
                v-if="item.users.length === 4"
                size="40"
                :image="user"
              />
            </template>
            <VAvatar
              v-if="item.users.length > 4"
              :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
            >
              <span>
                +{{ item.users.length - 3 }}
              </span>
            </VAvatar>
          </div>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h5 class="text-h5">
                {{ item.name }}
              </h5>
              <div class="d-flex align-center">
                <a
                  href="javascript:void(0)"
                  @click="editPermission(item)"
                >
                  {{ $t('edit') }}
                </a>
              </div>
            </div>
            <IconBtn>
              <VIcon
                icon="tabler-copy"
                class="text-high-emphasis"
              />
            </IconBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Add New Role -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="h-100"
        :ripple="false"
      >
        <VRow
          no-gutters
          class="h-100"
        >
          <VCol
            cols="5"
            class="d-flex flex-column justify-end align-center mt-5"
          >
            <img
              width="85"
              :src="girlUsingMobile"
            >
          </VCol>

          <VCol cols="7">
            <VCardText class="d-flex flex-column align-end justify-end gap-4">
              <VBtn
                size="small"
                @click="isAddRoleDialogVisible = true"
              >
                {{ $t('add_new_role') }}
              </VBtn>
              <div class="text-end">
                {{ $t('add_role_if_not_exist', { break: '' }) }}
              </div>
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
      <AddEditRoleDialog
        v-model:is-dialog-visible="isAddRoleDialogVisible"
        :role-permissions="undefined"
        @update:role-permissions="handleRolePermissions"
      />
    </VCol>
  </VRow>

  <AddEditRoleDialog
    v-model:is-dialog-visible="isRoleDialogVisible"
    :role-permissions="roleDetail"
    @update:role-permissions="handleRolePermissions"
  />
</template>
