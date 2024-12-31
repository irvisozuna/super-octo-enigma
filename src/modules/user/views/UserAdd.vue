<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Título -->
      <h4 class="text-h4 text-center mb-2">{{ t('addModule', { moduleName: userTitle }) }}</h4>
      <p class="text-body-1 text-center mb-6">{{ t('addItemDescription') }}</p>
      <!-- Formulario -->
      <VForm class="mt-6" @submit.prevent="onFormSubmit" v-model="valid">
        <VRow>
          <VCol cols="12" md="6">
            <AppTextField v-model="itemData.first_name" :label="t('firstName')" :placeholder="t('placeholderFirstName')"
              :rules="[rules.required]" />
          </VCol>
          <VCol cols="12" md="6">
            <AppTextField v-model="itemData.last_name" :label="t('lastName')" :placeholder="t('placeholderLastName')"
              :rules="[rules.required]" />
          </VCol>
          <VCol cols="12" md="6">
            <AppTextField v-model="itemData.email" :label="t('email')" :placeholder="t('placeholderEmail')"
              :rules="[rules.required, rules.email]" />
          </VCol>
          <VCol cols="12" md="6">
            <AppTextField v-model="itemData.password" :label="t('password')" :placeholder="t('placeholderPassword')"
              type="password" :rules="[rules.required]" />
          </VCol>
          <VCol cols="12" md="6">
            <api-data-source api-path="company/roles?onlykeyvalue=true" @loaded="(response) => roleOptions = response">
              <template v-slot="{ loading }">
                <VSelect v-model="itemData.role" :items="roleOptions" item-text="title" item-value="value"
                  label="Select Role" variant="outlined" dense clearable chips multiple closable-chips
                  :loading="loading" :disabled="loading">
                  <template #prepend-item v-if="loading">
                    <span class="text-secondary text-caption">Loading roles...</span>
                  </template>
                </VSelect>
              </template>
            </api-data-source>
          </VCol>
          <VCol cols="12" class="d-flex flex-wrap justify-center gap-4">
            <VBtn type="submit" :disabled="!valid">{{ t('save') }}</VBtn>
            <VBtn color="secondary" variant="tonal" @click="close">{{ t('cancel') }}</VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { useAppManager } from '@/composables/useAppManager';
import { useCrud } from '@/composables/useCrud';
import { useUserStore } from '@/modules/user/stores/userStore';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { closeDialog } = useAppManager();
const userStore = useUserStore();
const { createItem } = useCrud(userStore);

const userTitle = 'user'; // Nombre del módulo
const roleOptions = ref([]);

// Estado del formulario y datos del elemento
const valid = ref(false);
const itemData = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: ''
});

// Reglas de validación
const rules = {
  required: (v: string) => !!v || t('requiredField'),
  email: (v: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) || t('invalidEmail'),
};

// Watch para actualizar la validez del formulario
watch(itemData, (newValue) => {
  valid.value = Object.values(newValue).every(field => field !== '');
}, { deep: true });

// Método para cerrar el diálogo
function close() {
  closeDialog();
}

// Método para manejar el envío del formulario
async function onFormSubmit() {
  try {
    await createItem(itemData.value);
    console.log('Formulario enviado:', itemData.value);
    close();
  } catch (error) {
    console.error('Error al guardar el usuario:', error);
  }
}
</script>
