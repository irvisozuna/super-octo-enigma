<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'

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

interface Roles {
  id: string
  name: string
  permissions: ModulePermission[]
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
const permissions = ref<ModulePermission[]>([])

// Fetch permissions desde el backend
const fetchPermissions = async () => {
  try {
    const { data, error, isFetching } = await useApi<ModulePermission[]>('/company/permissions')

    // Inicializar los permisos especiales con la propiedad selected
    permissions.value = (data.value ?? []).map(module => ({
      ...module,
      special: module.special.map(special => ({
        ...special,
        selected: special.selected ?? false,
      })),
      subModules: module.subModules.map(subModule => ({
        ...subModule,
        special: subModule.special.map(special => ({
          ...special,
          selected: special.selected ?? false,
        })),
      })),
    }))
  }
  catch (error) {
    console.error('Error al obtener los permisos:', error)
  }
}

fetchPermissions()

const isSelectAll = ref(false)
const role = ref('')
const refPermissionForm = ref<VForm>()

// Debug: Log when component mounts
onMounted(() => {
  console.log('AddEditRoleDialog mounted, initial props:', props.rolePermissions)
})

// Module expansion state
const expandedModules = ref<Set<string>>(new Set())
const expandedSubModules = ref<Set<string>>(new Set())
const expandAll = ref(false)

// Get only main modules (not submodules)
const mainModules = computed(() => {
  return permissions.value.filter(module => !module.isSubModule)
})

// Computed para contar permisos CRUD seleccionados
const checkedCrudCount = computed(() => {
  let counter = 0

  permissions.value.forEach(module => {
    Object.entries(module.crud).forEach(([key, value]) => {
      if (value)
        counter++
    })
  })

  return counter
})

// Computed para contar permisos especiales seleccionados
const checkedSpecialCount = computed(() => {
  let counter = 0

  permissions.value.forEach(module => {
    module.special.forEach(special => {
      if (special.selected)
        counter++
    })
  })

  return counter
})

const totalCrudPermissions = computed(() => permissions.value.length * 4)

const totalSpecialPermissions = computed(() =>
  permissions.value.reduce((total, module) => total + module.special.length, 0),
)

const isIndeterminate = computed(() =>
  checkedCrudCount.value > 0 && checkedCrudCount.value < totalCrudPermissions.value,
)

// Select all CRUD permissions
watch(isSelectAll, val => {
  permissions.value = permissions.value.map(module => ({
    ...module,
    crud: {
      read: val,
      create: val,
      update: val,
      delete: val,
    },
  }))
})

// Select all for specific module
const selectAllModule = (moduleIndex: number, value: boolean) => {
  const module = mainModules.value[moduleIndex]

  module.crud = {
    read: value,
    create: value,
    update: value,
    delete: value,
  }
}

// Select all for specific submodule
const selectAllSubModule = (moduleIndex: number, subModuleIndex: number, value: boolean) => {
  const module = mainModules.value[moduleIndex]

  module.subModules[subModuleIndex].crud = {
    read: value,
    create: value,
    update: value,
    delete: value,
  }
}

// Select all special permissions for specific module
const selectAllSpecialModule = (moduleIndex: number, value: boolean) => {
  const module = mainModules.value[moduleIndex]

  module.special = module.special.map(special => ({
    ...special,
    selected: value,
  }))
}

// Select all special permissions for specific submodule
const selectAllSpecialSubModule = (moduleIndex: number, subModuleIndex: number, value: boolean) => {
  const module = mainModules.value[moduleIndex]

  module.subModules[subModuleIndex].special = module.subModules[subModuleIndex].special.map(special => ({
    ...special,
    selected: value,
  }))
}

// Get module icon based on module name
const getModuleIcon = (moduleName: string) => {
  const iconMap: Record<string, string> = {
    concession: 'tabler-file-certificate',
    vehicle: 'tabler-car',
    concessionholder: 'tabler-user-check',
    concessionreport: 'tabler-chart-bar',
    concessionconfig: 'tabler-settings',
    concessionmodalities: 'tabler-list-check',
    concessionstatuses: 'tabler-status-change',
  }

  return iconMap[moduleName] || 'tabler-package'
}

// Get module status color
const getModuleStatusColor = (module: ModulePermission) => {
  const hasCrud = Object.values(module.crud).some(Boolean)
  const hasSpecial = module.special.some(special => special.selected)

  if (hasCrud && hasSpecial)
    return 'success'
  if (hasCrud || hasSpecial)
    return 'warning'

  return 'default'
}

// Get module status text
const getModuleStatusText = (module: ModulePermission) => {
  const hasCrud = Object.values(module.crud).some(Boolean)
  const hasSpecial = module.special.some(special => special.selected)

  if (hasCrud && hasSpecial)
    return 'Completo'
  if (hasCrud)
    return 'Básico'
  if (hasSpecial)
    return 'Especial'

  return 'Sin permisos'
}

// Toggle module expansion
const toggleModule = (moduleName: string) => {
  if (expandedModules.value.has(moduleName)) {
    expandedModules.value.delete(moduleName)

    // Also collapse all submodules when collapsing main module
    expandedSubModules.value.clear()
  }
  else {
    expandedModules.value.add(moduleName)
  }
}

// Toggle submodule expansion
const toggleSubModule = (subModuleName: string) => {
  if (expandedSubModules.value.has(subModuleName))
    expandedSubModules.value.delete(subModuleName)
  else
    expandedSubModules.value.add(subModuleName)
}

// Toggle all modules
const toggleAllModules = () => {
  if (expandAll.value) {
    expandedModules.value.clear()
    expandedSubModules.value.clear()
  }
  else {
    expandedModules.value = new Set(mainModules.value.map(module => module.module))

    // Expand all submodules too
    const allSubModules = mainModules.value.flatMap(module =>
      module.subModules.map(subModule => subModule.module),
    )

    expandedSubModules.value = new Set(allSubModules)
  }
  expandAll.value = !expandAll.value
}

// Check if module is expanded
const isModuleExpanded = (moduleName: string) => {
  return expandedModules.value.has(moduleName)
}

// Check if submodule is expanded
const isSubModuleExpanded = (subModuleName: string) => {
  return expandedSubModules.value.has(subModuleName)
}

// Check if all CRUD permissions are selected
watch(permissions, () => {
  if (checkedCrudCount.value === totalCrudPermissions.value)
    isSelectAll.value = true
  else
    isSelectAll.value = false
}, { deep: true })

// if Indeterminate is false, then set isSelectAll to false
watch(isIndeterminate, () => {
  if (!isIndeterminate.value)
    isSelectAll.value = false
})

// if rolePermissions is not empty, then set permissions
watch(() => props.rolePermissions, newRolePermissions => {
  console.log('Role permissions changed:', newRolePermissions)
  if (newRolePermissions && newRolePermissions.name) {
    role.value = newRolePermissions.name
    console.log('Setting role name:', newRolePermissions.name)
  }

  if (newRolePermissions && newRolePermissions.permissions && newRolePermissions.permissions.length) {
    console.log('Loading role permissions:', newRolePermissions)

    // Merge role permissions with template permissions
    permissions.value = permissions.value.map(templateModule => {
      const roleModule = newRolePermissions?.permissions.find(item => item.module === templateModule.module)

      if (roleModule) {
        // Merge main module permissions
        const mergedModule = {
          ...templateModule,
          crud: roleModule.crud,
          special: templateModule.special.map(templateSpecial => {
            const roleSpecial = roleModule.special.find(rs => rs.name === templateSpecial.name)

            return {
              ...templateSpecial,
              selected: roleSpecial ? roleSpecial.selected : false,
            }
          }),
          subModules: templateModule.subModules.map(templateSubModule => {
            const roleSubModule = roleModule.subModules.find(rsm => rsm.module === templateSubModule.module)
            if (roleSubModule) {
              return {
                ...templateSubModule,
                crud: roleSubModule.crud,
                special: templateSubModule.special.map(templateSubSpecial => {
                  const roleSubSpecial = roleSubModule.special.find(rss => rss.name === templateSubSpecial.name)

                  return {
                    ...templateSubSpecial,
                    selected: roleSubSpecial ? roleSubSpecial.selected : false,
                  }
                }),
              }
            }

            return templateSubModule
          }),
        }

        console.log('Merged module:', mergedModule.module, mergedModule)

        return mergedModule
      }

      return templateModule
    })
  }
}, { immediate: true })

// Watch for dialog visibility changes to reset form when opening
watch(() => props.isDialogVisible, isVisible => {
  if (isVisible) {
    console.log('Dialog opened, rolePermissions:', props.rolePermissions)
    if (props.rolePermissions && props.rolePermissions.name) {
      role.value = props.rolePermissions.name
      console.log('Setting role name on dialog open:', props.rolePermissions.name)
    }
  }
  else {
    // Reset form when closing
    role.value = ''
    expandedModules.value.clear()
    expandedSubModules.value.clear()
    expandAll.value = false
  }
})

const onSubmit = async () => {
  // Transform permissions to match the expected structure
  const transformedPermissions = permissions.value.map(module => ({
    module: module.module,
    moduleLabel: module.moduleLabel,
    isSubModule: module.isSubModule,
    parentModule: module.parentModule,
    crud: module.crud,
    special: module.special.map(special => ({
      name: special.name,
      action: special.action,
      label: special.label,
      selected: special.selected || false,
    })),
    subModules: module.subModules.map(subModule => ({
      module: subModule.module,
      moduleLabel: subModule.moduleLabel,
      isSubModule: subModule.isSubModule,
      parentModule: subModule.parentModule,
      crud: subModule.crud,
      special: subModule.special.map(special => ({
        name: special.name,
        action: special.action,
        label: special.label,
        selected: special.selected || false,
      })),
      subModules: [],
    })),
  }))

  const rolePermissions = {
    id: props.rolePermissions.id,
    name: role.value,
    permissions: transformedPermissions,
  }

  try {
    const METHOD = props.rolePermissions.name ? 'PUT' : 'POST'

    // Realiza la solicitud al backend
    const response = await $api('/company/roles', {
      method: METHOD,
      body: rolePermissions,
    })

    // Emitir el evento para cerrar el diálogo y limpiar el formulario
    emit('update:isDialogVisible', false)
    emit('update:rolePermissions', rolePermissions)
    isSelectAll.value = false
    refPermissionForm.value?.reset()

    // Mensaje de éxito o acciones adicionales
    console.log('Role created successfully!')
  }
  catch (err) {
    console.error('Error inesperado al crear el rol:', err)
  }
}

const onReset = () => {
  emit('update:isDialogVisible', false)
  isSelectAll.value = false
  refPermissionForm.value?.reset()
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="onReset"
  >
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="onReset" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <!-- 👉 Title -->
        <h4 class="text-h4 text-center mb-2">
          {{ props.rolePermissions?.name ? 'Edit' : 'Add New' }} Role
        </h4>
        <p class="text-body-1 text-center mb-6">
          Set Role Permissions
        </p>

        <!-- 👉 Form -->
        <VForm ref="refPermissionForm">
          <!-- 👉 Role name -->
          <AppTextField
            v-model="role"
            label="Role Name"
            placeholder="Enter Role Name"
            :disabled="role === 'admin'"
          />

          <h5 class="text-h5 my-6">
            Role Permissions
          </h5>

          <!-- 👉 Role Permissions -->
          <div class="permission-modules mb-6">
            <!-- 👉 Global Select All -->
            <VCard class="mb-6 global-select-card">
              <VCardText class="pa-4">
                <div class="d-flex justify-space-between align-center">
                  <div class="d-flex align-center gap-3">
                    <VIcon
                      icon="tabler-shield-check"
                      size="24"
                      color="primary"
                    />
                    <div>
                      <h6 class="text-h6 mb-1">
                        {{ $t('administrator access') }}
                      </h6>
                      <p class="text-caption text-medium-emphasis mb-0">
                        {{ $t('select_all_crud_description') }}
                      </p>
                    </div>
                  </div>
                  <VCheckbox
                    v-model="isSelectAll"
                    v-model:indeterminate="isIndeterminate"
                    :label="$t('select_all_crud')"
                    :disabled="role === 'admin'"
                    color="primary"
                    hide-details
                  />
                </div>
              </VCardText>
            </VCard>

            <!-- 👉 Expand/Collapse All -->
            <VCard class="mb-4 expand-controls-card">
              <VCardText class="pa-4">
                <div class="d-flex justify-space-between align-center">
                  <div class="d-flex align-center gap-3">
                    <VIcon
                      icon="tabler-layout-grid"
                      size="20"
                      color="primary"
                    />
                    <div>
                      <h6 class="text-h6 mb-1">
                        {{ $t('module_overview') }}
                      </h6>
                      <p class="text-caption text-medium-emphasis mb-0">
                        {{ $t('expand_collapse_description') }}
                      </p>
                    </div>
                  </div>
                  <VBtn
                    :color="expandAll ? 'primary' : 'default'"
                    :variant="expandAll ? 'flat' : 'outlined'"
                    @click="toggleAllModules"
                  >
                    <VIcon
                      :icon="expandAll ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                      class="me-2"
                    />
                    {{ expandAll ? $t('collapse_all') : $t('expand_all') }}
                  </VBtn>
                </div>
              </VCardText>
            </VCard>

            <!-- 👉 Module Permissions -->
            <template
              v-for="(module, moduleIndex) in mainModules"
              :key="module.module"
            >
              <VCard
                class="mb-4 module-card"
                elevation="1"
              >
                <!-- Module Header (Always Visible) -->
                <VCardText class="pa-4">
                  <div
                    class="module-header d-flex justify-space-between align-center cursor-pointer"
                    @click="toggleModule(module.module)"
                  >
                    <div class="d-flex align-center gap-3">
                      <VAvatar
                        size="40"
                        color="primary"
                        variant="tonal"
                      >
                        <VIcon
                          :icon="getModuleIcon(module.module)"
                          size="20"
                        />
                      </VAvatar>
                      <div>
                        <h6 class="text-h6 mb-1">
                          {{ module.moduleLabel }}
                        </h6>
                        <span class="text-caption text-medium-emphasis">
                          {{ module.module }}
                        </span>
                      </div>
                    </div>
                    <div class="d-flex align-center gap-3">
                      <VChip
                        :color="getModuleStatusColor(module)"
                        variant="tonal"
                        size="small"
                      >
                        {{ getModuleStatusText(module) }}
                      </VChip>
                      <VIcon
                        :icon="isModuleExpanded(module.module) ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                        size="20"
                        color="primary"
                      />
                    </div>
                  </div>
                </VCardText>

                <!-- Module Content (Expanded View) -->
                <VExpandTransition>
                  <div v-if="isModuleExpanded(module.module)">
                    <VDivider />
                    <VCardText class="pa-6">
                      <!-- Main Module Permissions -->
                      <div
                        v-if="module.special.length > 0 || Object.values(module.crud).some(Boolean)"
                        class="permission-section mb-6"
                      >
                        <h6 class="text-subtitle-1 font-weight-medium mb-4">
                          {{ $t('main_module_permissions') }}
                        </h6>

                        <!-- CRUD Permissions -->
                        <div class="mb-4">
                          <div class="d-flex justify-space-between align-center mb-3">
                            <h6 class="text-subtitle-2 font-weight-medium">
                              {{ $t('basic_permissions') }}
                            </h6>
                            <VCheckbox
                              :model-value="module.crud.read && module.crud.create && module.crud.update && module.crud.delete"
                              :indeterminate="(module.crud.read || module.crud.create || module.crud.update || module.crud.delete) && !(module.crud.read && module.crud.create && module.crud.update && module.crud.delete)"
                              :label="$t('select_all')"
                              :disabled="role === 'admin'"
                              color="primary"
                              density="compact"
                              @update:model-value="selectAllModule(moduleIndex, $event)"
                            />
                          </div>
                          <VRow class="permission-grid">
                            <VCol
                              v-for="(value, key) in module.crud"
                              :key="key"
                              cols="6"
                              sm="3"
                            >
                              <VCard
                                class="permission-item"
                                :class="[{ 'permission-selected': value }]"
                                :color="value ? 'primary' : 'default'"
                                variant="tonal"
                                flat
                              >
                                <VCardText class="pa-3 text-center">
                                  <VCheckbox
                                    v-model="module.crud[key]"
                                    :disabled="role === 'admin'"
                                    :label="$t(key)"
                                    color="primary"
                                    density="compact"
                                    hide-details
                                    class="permission-checkbox"
                                  />
                                </VCardText>
                              </VCard>
                            </VCol>
                          </VRow>
                        </div>

                        <!-- Special Permissions -->
                        <div v-if="module.special.length > 0">
                          <div class="d-flex justify-space-between align-center mb-3">
                            <h6 class="text-subtitle-2 font-weight-medium">
                              {{ $t('special_permissions') }}
                              <VChip
                                size="x-small"
                                color="secondary"
                                variant="tonal"
                                class="ml-2"
                              >
                                {{ module.special.length }}
                              </VChip>
                            </h6>
                            <VCheckbox
                              :model-value="module.special.every(special => special.selected)"
                              :indeterminate="module.special.some(special => special.selected) && !module.special.every(special => special.selected)"
                              :label="$t('select_all')"
                              :disabled="role === 'admin'"
                              color="primary"
                              density="compact"
                              @update:model-value="selectAllSpecialModule(moduleIndex, $event)"
                            />
                          </div>
                          <VRow class="special-permissions-grid">
                            <VCol
                              v-for="special in module.special"
                              :key="special.name"
                              cols="12"
                              sm="6"
                              lg="4"
                            >
                              <VCard
                                class="special-permission-item"
                                :class="[{ 'permission-selected': special.selected }]"
                                :color="special.selected ? 'primary' : 'default'"
                                variant="tonal"
                                flat
                              >
                                <VCardText class="pa-3">
                                  <VCheckbox
                                    v-model="special.selected"
                                    :disabled="role === 'admin'"
                                    :label="special.label"
                                    color="primary"
                                    density="compact"
                                    hide-details
                                    class="permission-checkbox"
                                  />
                                </VCardText>
                              </VCard>
                            </VCol>
                          </VRow>
                        </div>
                      </div>

                      <!-- Submodules -->
                      <div
                        v-if="module.subModules.length > 0"
                        class="submodules-section"
                      >
                        <h6 class="text-subtitle-1 font-weight-medium mb-4">
                          {{ $t('submodules') }}
                          <VChip
                            size="small"
                            color="info"
                            variant="tonal"
                            class="ml-2"
                          >
                            {{ module.subModules.length }}
                          </VChip>
                        </h6>

                        <template
                          v-for="(subModule, subModuleIndex) in module.subModules"
                          :key="subModule.module"
                        >
                          <VCard
                            class="mb-3 submodule-card"
                            elevation="0"
                            variant="outlined"
                          >
                            <!-- Submodule Header -->
                            <VCardText class="pa-4">
                              <div
                                class="submodule-header d-flex justify-space-between align-center cursor-pointer"
                                @click="toggleSubModule(subModule.module)"
                              >
                                <div class="d-flex align-center gap-3">
                                  <VAvatar
                                    size="32"
                                    color="secondary"
                                    variant="tonal"
                                  >
                                    <VIcon
                                      :icon="getModuleIcon(subModule.module)"
                                      size="16"
                                    />
                                  </VAvatar>
                                  <div>
                                    <h6 class="text-subtitle-2 mb-1">
                                      {{ subModule.moduleLabel }}
                                    </h6>
                                    <span class="text-caption text-medium-emphasis">
                                      {{ subModule.module }}
                                    </span>
                                  </div>
                                </div>
                                <div class="d-flex align-center gap-3">
                                  <VChip
                                    :color="getModuleStatusColor(subModule)"
                                    variant="tonal"
                                    size="x-small"
                                  >
                                    {{ getModuleStatusText(subModule) }}
                                  </VChip>
                                  <VIcon
                                    :icon="isSubModuleExpanded(subModule.module) ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                                    size="16"
                                    color="primary"
                                  />
                                </div>
                              </div>
                            </VCardText>

                            <!-- Submodule Content (Expanded View) -->
                            <VExpandTransition>
                              <div v-if="isSubModuleExpanded(subModule.module)">
                                <VDivider />
                                <VCardText class="pa-4">
                                  <!-- CRUD Permissions -->
                                  <div class="permission-section mb-4">
                                    <div class="d-flex justify-space-between align-center mb-3">
                                      <h6 class="text-subtitle-2 font-weight-medium">
                                        {{ $t('basic_permissions') }}
                                      </h6>
                                      <VCheckbox
                                        :model-value="subModule.crud.read && subModule.crud.create && subModule.crud.update && subModule.crud.delete"
                                        :indeterminate="(subModule.crud.read || subModule.crud.create || subModule.crud.update || subModule.crud.delete) && !(subModule.crud.read && subModule.crud.create && subModule.crud.update && subModule.crud.delete)"
                                        :label="$t('select_all')"
                                        :disabled="role === 'admin'"
                                        color="primary"
                                        density="compact"
                                        @update:model-value="selectAllSubModule(moduleIndex, subModuleIndex, $event)"
                                      />
                                    </div>
                                    <VRow class="permission-grid">
                                      <VCol
                                        v-for="(value, key) in subModule.crud"
                                        :key="key"
                                        cols="6"
                                        sm="3"
                                      >
                                        <VCard
                                          class="permission-item"
                                          :class="[{ 'permission-selected': value }]"
                                          :color="value ? 'primary' : 'default'"
                                          variant="tonal"
                                          flat
                                        >
                                          <VCardText class="pa-3 text-center">
                                            <VCheckbox
                                              v-model="subModule.crud[key]"
                                              :disabled="role === 'admin'"
                                              :label="$t(key)"
                                              color="primary"
                                              density="compact"
                                              hide-details
                                              class="permission-checkbox"
                                            />
                                          </VCardText>
                                        </VCard>
                                      </VCol>
                                    </VRow>
                                  </div>

                                  <!-- Special Permissions -->
                                  <div v-if="subModule.special.length > 0">
                                    <div class="d-flex justify-space-between align-center mb-3">
                                      <h6 class="text-subtitle-2 font-weight-medium">
                                        {{ $t('special_permissions') }}
                                        <VChip
                                          size="x-small"
                                          color="secondary"
                                          variant="tonal"
                                          class="ml-2"
                                        >
                                          {{ subModule.special.length }}
                                        </VChip>
                                      </h6>
                                      <VCheckbox
                                        :model-value="subModule.special.every(special => special.selected)"
                                        :indeterminate="subModule.special.some(special => special.selected) && !subModule.special.every(special => special.selected)"
                                        :label="$t('select_all')"
                                        :disabled="role === 'admin'"
                                        color="primary"
                                        density="compact"
                                        @update:model-value="selectAllSpecialSubModule(moduleIndex, subModuleIndex, $event)"
                                      />
                                    </div>
                                    <VRow class="special-permissions-grid">
                                      <VCol
                                        v-for="special in subModule.special"
                                        :key="special.name"
                                        cols="12"
                                        sm="6"
                                        lg="4"
                                      >
                                        <VCard
                                          class="special-permission-item"
                                          :class="[{ 'permission-selected': special.selected }]"
                                          :color="special.selected ? 'primary' : 'default'"
                                          variant="tonal"
                                          flat
                                        >
                                          <VCardText class="pa-3">
                                            <VCheckbox
                                              v-model="special.selected"
                                              :disabled="role === 'admin'"
                                              :label="special.label"
                                              color="primary"
                                              density="compact"
                                              hide-details
                                              class="permission-checkbox"
                                            />
                                          </VCardText>
                                        </VCard>
                                      </VCol>
                                    </VRow>
                                  </div>
                                </VCardText>
                              </div>
                            </VExpandTransition>
                          </VCard>
                        </template>
                      </div>
                    </VCardText>
                  </div>
                </VExpandTransition>
              </VCard>
            </template>
          </div>

          <!-- 👉 Actions button -->
          <div
            v-if="role !== 'admin'"
            class="d-flex align-center justify-center gap-4"
          >
            <VBtn @click="onSubmit">
              {{ $t('save') }}
            </VBtn>

            <VBtn
              color="secondary"
              variant="tonal"
              @click="onReset"
            >
              {{ $t('cancel') }}
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.permission-modules {
  // Global select card
  .global-select-card {
    border: 1px solid rgba(var(--v-theme-primary), 0.2);
    background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0.02) 100%);

    &:hover {
      box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
    }
  }

  // Module cards
  .module-card {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 10%);
      transform: translateY(-2px);
    }
  }

  // Expand controls card
  .expand-controls-card {
    border: 1px solid rgba(var(--v-theme-secondary), 0.2);
    background: linear-gradient(135deg, rgba(var(--v-theme-secondary), 0.05) 0%, rgba(var(--v-theme-secondary), 0.02) 100%);

    &:hover {
      box-shadow: 0 4px 12px rgba(var(--v-theme-secondary), 0.15);
    }
  }

  // Module header
  .module-header {
    transition: all 0.2s ease;

    &:hover {
      border-radius: 8px;
      background: rgba(var(--v-theme-primary), 0.02);
    }
  }

  .cursor-pointer {
    cursor: pointer;
  }

  // Submodules section
  .submodules-section {
    border-block-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-block-start: 1.5rem;
  }

  // Submodule cards
  .submodule-card {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background: rgba(var(--v-theme-surface), 0.5);

    &:hover {
      border-color: rgba(var(--v-theme-primary), 0.3);
      box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
    }
  }

  .submodule-header {
    transition: all 0.2s ease;

    &:hover {
      border-radius: 6px;
      background: rgba(var(--v-theme-primary), 0.02);
    }
  }

  // Permission sections
  .permission-section {
    .text-subtitle-1 {
      color: rgba(var(--v-theme-on-surface), 0.8);
      font-weight: 600;
    }
  }

  // Permission grid
  .permission-grid {
    gap: 0.75rem;
  }

  .permission-item {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(var(--v-theme-primary), 0.5);
      box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
    }

    &.permission-selected {
      border-color: rgba(var(--v-theme-primary), 0.8);
      background: rgba(var(--v-theme-primary), 0.05);
    }
  }

  // Special permissions grid
  .special-permissions-grid {
    gap: 0.75rem;
  }

  .special-permission-item {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    cursor: pointer;
    min-block-size: 60px;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(var(--v-theme-primary), 0.5);
      box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
    }

    &.permission-selected {
      border-color: rgba(var(--v-theme-primary), 0.8);
      background: rgba(var(--v-theme-primary), 0.05);
    }
  }

  // Checkbox styling
  .permission-checkbox {
    .v-label {
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.25rem;
    }
  }

  // Text styling
  .text-caption {
    font-size: 0.75rem;
    line-height: 1rem;
  }

  // Chip styling
  .v-chip {
    font-weight: 500;
  }
}
</style>
