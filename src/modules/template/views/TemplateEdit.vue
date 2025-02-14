<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Título -->
      <h4 class="text-h4 text-center mb-2">
        {{ t('editModule', { moduleName: templateTitle }) }}
      </h4>
      <p class="text-body-1 text-center mb-6">
        {{ t('editItemDescription') }}
      </p>
      <VForm class="mt-6" :onSubmit="handleSubmit(onFormSubmit)">
        <VRow>
          <VCol cols="12">
            <!-- first_name -->
            <AppTextField v-model="name" :label="t('fullName')" :placeholder="t('placeholderFullName')"
              :error="!!errors.name" :error-messages="errors.name ? [errors.name] : []" />
          </VCol>

          <VCol cols="12" md="6">
            <!-- email -->
            <AppTextField v-model="email" :label="t('email')" :placeholder="t('placeholderEmail')"
              :error="!!errors.email" :error-messages="errors.email ? [errors.email] : []" />
          </VCol>

          <VCol cols="12" md="6">
            <!-- password (opcional en edición) -->
            <AppTextField v-model="password" :label="t('password')" :placeholder="t('placeholderPassword')"
              :append-inner-icon="showPassword ? 'tabler-eye-off' : 'tabler-eye'"
              :type="showPassword ? 'text' : 'password'" :error="!!errors.password"
              :error-messages="errors.password ? [errors.password] : []"
              @click:append-inner="showPassword = !showPassword" />

          </VCol>

          <VCol cols="12" md="6">
            <!-- role -->
            <api-data-source api-path="company/roles?onlykeyvalue=true" @loaded="(response) => roleOptions = response">
              <template v-slot="{ loading }">
                <VSelect v-model="roles" :items="roleOptions" item-title="name" item-value="id" label="Select Role"
                  variant="outlined" dense clearable chips multiple closable-chips :loading="loading"
                  :disabled="loading" :error="!!errors.roles" :error-messages="errors.roles ? [errors.roles] : []">
                  <template #prepend-item v-if="loading">
                    <span class="text-secondary text-caption">Loading roles...</span>
                  </template>
                </VSelect>
              </template>
            </api-data-source>
          </VCol>

          <VCol cols="12" class="d-flex flex-wrap justify-center gap-4">
            <VBtn type="submit">{{ t('save') }}</VBtn>
            <VBtn color="secondary" variant="tonal" @click="close">
              {{ t('cancel') }}
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { useAppManager } from '@/composables/useAppManager';
import { useTemplateValidation } from '@/modules/template/composables/useTemplateValidation';
import { useTemplateStore } from '@/modules/template/stores/templateStore';
import { useField, useForm } from 'vee-validate';
import { defineProps, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// Recibimos el usuario a editar
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
const { closeDialog } = useAppManager();
const templateStore = useTemplateStore();

const templateTitle = 'template';
const roleOptions = ref<any[]>([]);
const showPassword = ref(false);

// Obtenemos el schema para edición
const { templateEditValidation } = useTemplateValidation();

// Configuramos el formulario con vee-validate
// Cargamos datos iniciales desde props.item
const { handleSubmit, errors } = useForm({
  validationSchema: templateEditValidation,
  initialValues: {
    name: props.item.name || '',
    email: props.item.email || '',
    password: '', // Dejar vacío en edición (no obligatorio)
    roles: Array.isArray(props.item.roles) ? props.item.roles : [], // Aseguramos array
  },
});

// Campos vinculados
const { value: name } = useField('name');
const { value: email } = useField('email');
const { value: password } = useField('password');
const { value: roles } = useField('roles');

// Cerrar el diálogo
function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result);
}

// Enviar el formulario
async function onFormSubmit(values: any) {
  console.log('Form values:', values);
  try {
    // Asumiendo que tu store espera (id, data)
    // Si tu API necesita templateId, asegúrate de tenerlo en props.item
    if (!props.item.id) {
      console.warn('No ID found in props.item, cannot update.');
      return;
    }

    await templateStore.updateItem(props.item.id, values);
    close('submit');
  } catch (error) {
    console.error('Error al editar:', error);
  }
}
</script>
