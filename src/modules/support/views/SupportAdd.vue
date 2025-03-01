<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Título -->
      <h4 class="text-h4 text-center mb-2">{{ t('addModule', { moduleName: supportTitle }) }}</h4>
      <p class="text-body-1 text-center mb-6">{{ t('addItemDescription') }}</p>

      <!-- Formulario -->
      <VForm class="mt-6" :onSubmit="handleSubmit(onFormSubmit)">
        <VRow>
          <VCol cols="12" md="6">
            <!-- first_name -->
            <AppTextField v-model="first_name" :label="t('firstName')" :placeholder="t('placeholderFirstName')"
              :error="!!errors.first_name" :error-messages="errors.first_name ? [errors.first_name] : []" />
          </VCol>

          <VCol cols="12" md="6">
            <!-- last_name -->
            <AppTextField v-model="last_name" :label="t('lastName')" :placeholder="t('placeholderLastName')"
              :error="!!errors.last_name" :error-messages="errors.last_name ? [errors.last_name] : []" />
          </VCol>

          <VCol cols="12" md="6">
            <!-- email -->
            <AppTextField v-model="email" :label="t('email')" :placeholder="t('placeholderEmail')"
              :error="!!errors.email" :error-messages="errors.email ? [errors.email] : []" />
          </VCol>

          <VCol cols="12" md="6">
            <!-- password -->
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
                <VSelect v-model="role" :items="roleOptions" item-title="name" item-value="id" label="Select Role"
                  variant="outlined" dense clearable chips multiple closable-chips :loading="loading"
                  :disabled="loading" :error="!!errors.role" :error-messages="errors.role ? [errors.role] : []">
                  <template #prepend-item v-if="loading">
                    <span class="text-secondary text-caption">{{$t('loading')}}...</span>
                  </template>
                </VSelect>
              </template>
            </api-data-source>
          </VCol>

          <VCol cols="12" class="d-flex flex-wrap justify-center gap-4">
            <VBtn type="submit">{{ t('save') }}</VBtn>
            <VBtn color="secondary" variant="tonal" @click="close">{{ t('cancel') }}</VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { useAppManager } from '@/composables/useAppManager';
import { useSupportValidation } from '@/modules/support/composables/useSupportValidation';
import { useSupportStore } from '@/modules/support/stores/supportStore';
import { useField, useForm } from 'vee-validate';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { closeDialog } = useAppManager();
const supportStore = useSupportStore();

const supportTitle = t('support');
const roleOptions = ref([]);
const showPassword = ref(false);

// Obtenemos el schema
const { supportCreateValidation } = useSupportValidation();

// Configuramos el formulario con Vee Validate
const { handleSubmit, errors } = useForm({
  validationSchema: supportCreateValidation,
  initialValues: {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: [], // array vacío si tu select es multiple
  },
});

// Campos
const { value: first_name } = useField('first_name');
const { value: last_name } = useField('last_name');
const { value: email } = useField('email');
const { value: password } = useField('password');
const { value: role } = useField('role');

function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result);
}

async function onFormSubmit(values: any) {
  try {
    await supportStore.createItem(values);
    close('submit');
  } catch (error) {
    console.error('Error al guardar :', error);
  }
}
</script>
