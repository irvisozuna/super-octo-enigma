<template>
  <VCard>
    <VForm class="mt-6" :onSubmit="handleSubmit(onFormSubmit)">
    <VCardTitle class="headline">
      {{ $t('support.add_charge') }}
    </VCardTitle>
    <VCardText>

      <VRow>
        <!-- Select Entidad -->
        <VCol cols="12" md="4">
          <api-data-source api-path="supports/getSourceEntities?itemsPerPage=1000&page=1" @loaded="(response) => entitiesOptions = response">
              <template v-slot="{ loading }">
                <VSelect v-model="source_entity" :items="entitiesOptions" item-title="name" item-value="rowid" label="Entidad" 
                  variant="outlined" dense clearable chips  closable-chips :loading="loading"
                   :error="!!errors.source_entity" :error-messages="errors.source_entity ? [errors.source_entity] : []"
                  :disabled="loading" >
                  <template #prepend-item v-if="loading">
                    <span class="text-secondary text-caption">{{ $t('loading') }}...</span>
                  </template>
                </VSelect>
              </template>
            </api-data-source>
        </VCol>
        <!-- Select Tipo -->
        <VCol cols="12" md="4">
          <api-data-source api-path="supports/getTypeCodes?itemsPerPage=1000&page=1" @loaded="(response) => TypeCodeOptions = response">
              <template v-slot="{ loading }">
                <VSelect v-model="type_code" :items="TypeCodeOptions" item-title="name" item-value="rowid" label="Tipo" 
                  variant="outlined" dense clearable chips  closable-chips :loading="loading"
                  :error="!!errors.type_code" :error-messages="errors.type_code ? [errors.type_code] : []"
                  :disabled="loading" >
                  <template #prepend-item v-if="loading">
                    <span class="text-secondary text-caption">{{ $t('loading') }}...</span>
                  </template>
                </VSelect>
              </template>
            </api-data-source>

        </VCol>
        <!-- Select Prioridad -->
        <VCol cols="12" md="2">
          <VSelect
            v-model="severity_code"
            item-title="text" item-value="value" 
            :items="priorities"
            label="Prioridad"
            :error="!!errors.severity_code" :error-messages="errors.severity_code ? [errors.severity_code] : []" 
          />
        </VCol>
        <!-- Asignado a -->
        <VCol cols="12" md="4">
          <api-data-source api-path="supports/getUsers?itemsPerPage=100000&page=1" @loaded="(response) => usersOptions = response">
              <template v-slot="{ loading }">
                <v-autocomplete  v-model="fk_user_assign" :items="usersOptions" item-title="name" item-value="rowid" placeholder="Seleccione un usuario" label="Asignado a"
                  variant="outlined" dense clearable :loading="loading"
                  :error="!!errors.fk_user_assign" :error-messages="errors.fk_user_assign ? [errors.fk_user_assign] : []" 
                  :disabled="loading" >
                  <template #prepend-item v-if="loading">
                    <span class="text-secondary text-caption">{{ $t('loading') }}...</span>
                  </template>
                </v-autocomplete>
              </template>
            </api-data-source>
        </VCol>
        <!-- Área -->
        <VCol cols="12" md="6">
          <VTextField
            v-model="options_area"
            label="Área"
            placeholder="Capture el área"
            :error="!!errors.options_area" :error-messages="errors.options_area ? [errors.options_area] : []" 
          />
        </VCol>
        <!-- Departamento -->
        <VCol cols="12" md="4">
          <VTextField
            v-model="options_department"
            label="Departamento"
            placeholder="Departamento"
            :error="!!errors.options_department" :error-messages="errors.options_department ? [errors.options_department] : []" 
          />
        </VCol>
        <!-- Reportado por -->
        <VCol cols="12" md="5">
          <VTextField
            v-model="options_reported_by"
            label="Reportado por"
            placeholder="Reportado por"
            :error="!!errors.options_reported_by" :error-messages="errors.options_reported_by ? [errors.options_reported_by] : []"
          />
        </VCol>
        <!-- Teléfono -->
        <VCol cols="12" md="3">
          <VTextField
            v-model="options_phone"
            label="Teléfono"
            placeholder="Teléfono"
            :error="!!errors.options_phone" :error-messages="errors.options_phone ? [errors.options_phone] : []"
          />
        </VCol>
        <!-- Asunto -->
        <VCol cols="12">
          <VTextField
            v-model="subject"
            label="Asunto"
            :error="!!errors.subject" :error-messages="errors.subject ? [errors.subject] : []"
          />
        </VCol>
        <!-- Mensaje -->
        <VCol cols="12">
          <VAlert
            color="warning"
            variant="outlined"
          >
            Por favor describa precisamente el problema. Provea la mayor cantidad de información posible para permitirnos identificar su solicitud.
          </VAlert>
        </VCol>
        <VCol cols="12">
          <VTextarea
            v-model="message"
            label="Mensaje"
            :error="!!errors.message" :error-messages="errors.message ? [errors.message] : []"
          />
        </VCol>
        <!-- Observaciones -->
        <VCol cols="12">
          <VTextarea
            v-model="options_observations"
            label="Observaciones"
            :error="!!errors.options_observations" :error-messages="errors.options_observations ? [errors.options_observations] : []"
          />
        </VCol>
        <!-- Archivos adjuntos -->
        <VCol cols="12">
          <VFileInput
            v-model="files"
            label="Adjuntar archivo"
            multiple
            :error="!!errors.files" :error-messages="errors.files ? [errors.files] : []"
          />
        </VCol>
      </VRow>
    </VCardText>
    <VCardActions class="justify-end">
      <VBtn
         variant="flat"
        color="secondary"
        @click="closeDialog"
      >
        {{ $t('cancel') }}
      </VBtn>
      <VBtn
       variant="flat"
        color="primary"
        type="submit"
      >
        {{ $t('save') }}
      </VBtn>
    </VCardActions>
  </VForm>
  </VCard>
</template>

<script setup lang="ts">
import { useNotification } from '@/helpers/notificationHelper';
import { useField, useForm } from 'vee-validate';
import { ref } from 'vue';
import { useContractStore } from '../../stores/contractStore';
import { useWorkOrderValidation } from '../../validations/WorkOrderValidation';

const { closeDialog } = useAppManager();
const contractStore = useContractStore();
const { showSuccess, showError } = useNotification();
const workOrderValidation = useWorkOrderValidation();

const { handleSubmit, errors } = useForm({
  validationSchema: workOrderValidation,
  initialValues: {
    source_entity: null,
    type_code: null,
    severity_code: 'NORMAL',
    fk_user_assign: null,
    options_area: '',
    options_department: '',
    options_reported_by: null,
    options_phone: '',
    subject: '',
    message: '',
    options_observations: '',
    files: [] as File[],
  },
});

const { value: source_entity } = useField('source_entity');
const { value: type_code } = useField('type_code');
const { value: severity_code } = useField('severity_code');
const { value: fk_user_assign } = useField('fk_user_assign');
const { value: options_area } = useField('options_area');
const { value: options_department } = useField('options_department');
const { value: options_reported_by } = useField('options_reported_by');
const { value: options_phone } = useField('options_phone');
const { value: subject } = useField('subject');
const { value: message } = useField('message');
const { value: files } = useField('files');



// Opciones para los selects

const priorities = ref([
  { value: 'LOW', text: 'Bajo' },
  { value: 'NORMAL', text: 'Normal' },
  { value: 'HIGH', text: 'Alto' },
  { value: 'BLOCKING', text: 'Crítico' },
]);


// Función para enviar el formulario
const onFormSubmit = async (values: any) => {
  try {
    const token_dolibarr = useCookie('dolibarrToken').value;
    // 1. Crear un objeto FormData
    const formData = new FormData();

    // 2. Adjuntar los campos "simples" (string, number, etc.)
    formData.append('source_entity', values.source_entity ?? '');
    formData.append('type_code', values.type_code ?? '');
    formData.append('severity_code', values.severity_code ?? '');
    formData.append('fk_user_assign', values.fk_user_assign ?? '');
    formData.append('options_area', values.options_area ?? '');
    formData.append('options_department', values.options_department ?? '');
    formData.append('options_reported_by', values.options_reported_by ?? '');
    formData.append('options_phone', values.options_phone ?? '');
    formData.append('subject', values.subject ?? '');
    formData.append('message', values.message ?? '');
    formData.append('options_observations', values.options_observations ?? '');
    formData.append('token', token_dolibarr ?? '');
    formData.append('account', contractStore.item?.account ?? '');

    // 3. Adjuntar los archivos. 
    //    Ojo con el nombre del campo: en backend deben usar el mismo key (por ejemplo "files[]")
    if (values.files && values.files.length > 0) {
      values.files.forEach((file: File) => {
        formData.append('files[]', file);
      });
    }

    // 4. Enviar el FormData a la store
    const response = await contractStore.createItem(formData, '/workOrders'); 
    // (sin poner endpointSuffix si no lo necesitas, o pasándolo como 2do param)
    
    
    showSuccess(response.message);
    closeDialog();
  } catch (error) {
    showError('Error al crear la orden de trabajo');
    console.error(error);
  }
};
</script>
