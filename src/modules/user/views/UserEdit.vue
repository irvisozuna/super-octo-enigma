<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { defineProps, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppManager } from '@/composables/useAppManager'
import { useUserValidation } from '@/modules/user/composables/useUserValidation'
import { useUserStore } from '@/modules/user/stores/userStore'

// Recibimos el usuario a editar
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()
const { closeDialog } = useAppManager()
const userStore = useUserStore()

const userTitle = 'user'
const roleOptions = ref<any[]>([])
const showPassword = ref(false)

// Obtenemos el schema para edición
const { userEditValidation } = useUserValidation()

// Configuramos el formulario con vee-validate
// Cargamos datos iniciales desde props.item
const { handleSubmit, errors } = useForm({
  validationSchema: userEditValidation,
  initialValues: {
    name: props.item.name || '',
    email: props.item.email || '',
    password: '', // Dejar vacío en edición (no obligatorio)
    roles: Array.isArray(props.item.roles) ? props.item.roles : [], // Aseguramos array
  },
})

// Campos vinculados
const { value: name } = useField('name')
const { value: email } = useField('email')
const { value: password } = useField('password')
const { value: roles } = useField('roles')

// Cerrar el diálogo
function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result)
}

// Manejar click del botón guardar
async function handleSaveClick() {
  console.log('=== handleSaveClick called ===')
  console.log('Current form values:', { name: name.value, email: email.value, password: password.value, roles: roles.value })
  
  // Validación manual simple
  if (!name.value || !email.value) {
    console.log('Validation failed: name and email are required')
    return
  }
  
  if (roles.value && roles.value.length === 0) {
    console.log('Validation failed: at least one role is required')
    return
  }
  
  // Llamar directamente a onFormSubmit
  try {
    console.log('Calling onFormSubmit directly...')
    await onFormSubmit({
      name: name.value,
      email: email.value,
      password: password.value,
      roles: roles.value
    })
  } catch (error) {
    console.error('Error in handleSaveClick:', error)
  }
}

// Enviar el formulario
async function onFormSubmit(values: any) {
  console.log('=== onFormSubmit called ===')
  console.log('Form values:', values)
  console.log('Props item:', props.item)
  
  try {
    // Asumiendo que tu store espera (id, data)
    // Si tu API necesita userId, asegúrate de tenerlo en props.item
    if (!props.item.id) {
      console.warn('No ID found in props.item, cannot update.')
      return
    }

    // Preparar los datos para enviar a la API
    const updateData: any = {
      name: values.name,
      email: values.email,
      roles: values.roles || [],
    }

    // Solo incluir password si se proporcionó
    if (values.password && values.password.trim() !== '') {
      updateData.password = values.password
    }

    console.log('Sending update data:', updateData)
    console.log('Calling userStore.updateItem with ID:', props.item.id)
    
    await userStore.updateItem(props.item.id, updateData)
    console.log('Update successful, closing dialog')
    close('submit')
  }
  catch (error) {
    console.error('Error al editar el usuario:', error)
  }
}
</script>

<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Título -->
      <h4 class="text-h4 text-center mb-2">
        {{ t('editModule', { moduleName: userTitle }) }}
      </h4>
      <p class="text-body-1 text-center mb-6">
        {{ t('editItemDescription') }}
      </p>
      <VForm
        class="mt-6"
        @submit.prevent="handleSubmit(onFormSubmit)"
      >
        <VRow>
          <VCol cols="12">
            <!-- first_name -->
            <AppTextField
              v-model="name"
              :label="t('fullName')"
              :placeholder="t('placeholderFullName')"
              :error="!!errors.name"
              :error-messages="errors.name ? [errors.name] : []"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <!-- email -->
            <AppTextField
              v-model="email"
              :label="t('email')"
              :placeholder="t('placeholderEmail')"
              :error="!!errors.email"
              :error-messages="errors.email ? [errors.email] : []"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <!-- password (opcional en edición) -->
            <AppTextField
              v-model="password"
              :label="t('password')"
              :placeholder="t('placeholderPassword')"
              :append-inner-icon="showPassword ? 'tabler-eye-off' : 'tabler-eye'"
              :type="showPassword ? 'text' : 'password'"
              :error="!!errors.password"
              :error-messages="errors.password ? [errors.password] : []"
              @click:append-inner="showPassword = !showPassword"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <!-- role -->
            <ApiDataSource
              api-path="company/roles?onlykeyvalue=true"
              @loaded="(response) => roleOptions = response"
            >
              <template #default="{ loading }">
                <VSelect
                  v-model="roles"
                  :items="roleOptions"
                  item-title="name"
                  item-value="id"
                  :label="t('roles')"
                  variant="outlined"
                  dense
                  clearable
                  chips
                  multiple
                  closable-chips
                  :loading="loading"
                  :disabled="loading"
                  :error="!!errors.roles"
                  :error-messages="errors.roles ? [errors.roles] : []"
                >
                  <template
                    v-if="loading"
                    #prepend-item
                  >
                    <span class="text-secondary text-caption">Loading roles...</span>
                  </template>
                </VSelect>
              </template>
            </ApiDataSource>
          </VCol>

          <VCol
            cols="12"
            class="d-flex flex-wrap justify-center gap-4"
          >
            <VBtn @click="handleSaveClick">
              {{ t('save') }}
            </VBtn>
            <VBtn
              color="secondary"
              variant="tonal"
              @click="close"
            >
              {{ t('cancel') }}
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>

