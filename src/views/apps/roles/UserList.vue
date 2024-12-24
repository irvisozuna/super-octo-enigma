<script setup lang="ts">
import type { UserProperties } from '@db/apps/users/types';

// 👉 i18n
const { t: $t } = useI18n()

// 👉 Store
const searchQuery = ref('')
const selectedRole = ref()
const selectedPlan = ref()
const selectedStatus = ref()

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

// Update data table options
const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

// Headers
const headers = [
  { title: $t('user'), key: 'user' },
  { title: $t('role_name'), key: 'role' },
  { title: $t('status'), key: 'status' },
  { title: $t('actions'), key: 'actions', sortable: false },
]

// 👉 Fetching users
const usersData = ref({
  data: [],
  meta: { total: 0, current_page: 1, per_page: 15 },
})
const fetchUsers = async () => {
  try {
    const response = await $api('/users', {
      method: 'GET',
      params: {
        q: searchQuery.value,
        status: selectedStatus.value,
        plan: selectedPlan.value,
        role: selectedRole.value,
        itemsPerPage: itemsPerPage.value,
        page: page.value,
        sortBy: sortBy.value,
        orderBy: orderBy.value,
      },
    })
    console.log('Users:', response.data.data)
    if (response.data) {
      usersData.value = response.data.data // Extrae la estructura de usuarios
      usersMeta.value = response.data.meta // Meta información

    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
  }
}

// Almacena meta información para la tabla
const usersMeta = ref({
  total: 0,
  current_page: 1,
  per_page: 15,
})

// Computed para usuarios
const users = computed(() => usersData.value.data)
const totalUsers = computed(() => usersMeta.value.total)

// 👉 search filters
const roles = ref([])

// Fetch roles desde el backend
const fetchRoles = async () => {
  try {
    const response = await $api('/company/roles', { method: 'GET' })
    roles.value = response.map((role: { role: string; id: string }) => ({
      title: role.role,
      value: role.id,
    }))
  } catch (error) {
    console.error('Error al obtener roles:', error)
  }
}

// Llamadas iniciales
fetchUsers()
fetchRoles()



const resolveUserStatusVariant = (stat: string) => {
  const statLowerCase = stat.toLowerCase()
  if (statLowerCase === 'pending')
    return 'warning'
  if (statLowerCase === 'active')
    return 'success'
  if (statLowerCase === 'inactive')
    return 'secondary'

  return 'primary'
}

const isAddNewUserDrawerVisible = ref(false)

// 👉 Add new user
const addNewUser = async (userData: UserProperties) => {
  await $api('/company/users', {
    method: 'POST',
    body: userData,
  })

  // Refetch Users
  fetchUsers()
}

// 👉 Delete user
const deleteUser = async (id: number) => {
  await $api(`/users/${id}`, {
    method: 'DELETE',
  })

  // Refetch Users
  fetchUsers()
}
</script>

<template>
  <section>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4">
        <div class="d-flex gap-2 align-center">
          <p class="text-body-1 mb-0">
            Show
          </p>
          <AppSelect
            :model-value="itemsPerPage"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'All' },
            ]"
            style="inline-size: 5.5rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div>

        <VSpacer />

        <div class="d-flex align-center flex-wrap gap-4">
          <!-- 👉 Search  -->
          <AppTextField
            v-model="searchQuery"
            :placeholder="$t('search user')"
            style="inline-size: 15.625rem;"
          />

          <!-- 👉 Add user button -->
          <AppSelect
            v-model="selectedRole"
            :placeholder="$t('select role')"
            :items="roles"
            clearable
            clear-icon="tabler-x"
            style="inline-size: 10rem;"
          />
        </div>
      </VCardText>

      <VDivider />

      <!-- SECTION datatable -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items-per-page-options="[
          { value: 10, title: '10' },
          { value: 20, title: '20' },
          { value: 50, title: '50' },
          { value: -1, title: '$vuetify.dataFooter.itemsPerPageAll' },
        ]"
        :items="users"
        :items-length="totalUsers"
        :headers="headers"
        class="text-no-wrap"
        show-select
        @update:options="updateOptions"
      >
      
        <!-- User -->
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar
              size="34"
              :variant="!item.avatar ? 'tonal' : undefined"
            >
              <VImg
                v-if="item.avatar"
                :src="item.avatar"
              />
              <span v-else>{{ avatarText(item.fullName) }}</span>
            </VAvatar>
            <div class="d-flex flex-column">
              <h6 class="text-base">
                <RouterLink
                  :to="{ name: 'apps-user-view-id', params: { id: item.id } }"
                  class="font-weight-medium text-link"
                >
                  {{ item.fullName }}
                </RouterLink>
              </h6>
              <div class="text-sm">
                {{ item.email }}
              </div>
            </div>
          </div>
        </template>

        <!-- 👉 Role -->
        <!-- <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-2">
            <div class="text-capitalize text-high-emphasis text-body-1">
              {{ item.role }}
            </div>
          </div>
        </template> -->

        <!-- Plan -->
        <!-- <template #item.plan="{ item }">
          <div class="text-body-1 text-high-emphasis text-capitalize">
            {{ item.currentPlan }}
          </div>
        </template> -->

        <!-- Status -->
        <!-- <template #item.status="{ item }">
          <VChip
            :color="resolveUserStatusVariant(item.status)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.status }}
          </VChip>
        </template> -->

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="deleteUser(item.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>

          <IconBtn>
            <VIcon icon="tabler-eye" />
          </IconBtn>

          <VBtn
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem :to="{ name: 'apps-user-view-id', params: { id: item.id } }">
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>

                  <VListItemTitle>View</VListItemTitle>
                </VListItem>

                <VListItem link>
                  <template #prepend>
                    <VIcon icon="tabler-pencil" />
                  </template>
                  <VListItemTitle>Edit</VListItemTitle>
                </VListItem>

                <VListItem @click="deleteUser(item.id)">
                  <template #prepend>
                    <VIcon icon="tabler-trash" />
                  </template>
                  <VListItemTitle>Delete</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>
        </template>

        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalUsers"
          />
        </template>
      </VDataTableServer>
      <!-- SECTION -->
    </VCard>

    <!-- 👉 Add New User -->
    <AddNewUserDrawer
      v-model:isDrawerOpen="isAddNewUserDrawerVisible"
      @user-data="addNewUser"
    />
  </section>
</template>

<style lang="scss">
.text-capitalize {
  text-transform: capitalize;
}

.user-list-name:not(:hover) {
  color: rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity));
}
</style>
