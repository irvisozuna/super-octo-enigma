<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotification } from '@/helpers/notificationHelper'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { useAppManager } from '@/composables/useAppManager'

const props = defineProps<{
  isMandatory?: boolean
}>()

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const contractStore = useContractStore()
const { closeDialog } = useAppManager()
const { aquasoft_id, name } = useCookie('userData').value

// Computed para determinar si el usuario es admin
const isAdmin = computed(() => name === 'admin')

// Estado interno del diálogo
const internalDialog = ref(true)

// Objeto para la nota
const note = ref({
  subject: '',
  content: '',
})

// Agregar las opciones para el tipo de nota
const noteTypes = [
  { value: 'info', text: t('general_info_query') },
  { value: 'balance', text: t('balance_clarification') },
  { value: 'adjustment', text: t('adjustment_request') },
  { value: 'agreement', text: t('agreements') },
  { value: 'complaint', text: t('complaints_comments') },
  { value: 'leak', text: t('leak_report') },
  { value: 'work_order', text: t('work_order') },
  { value: 'debt_letter', text: t('no_debt_letter') },
  { value: 'error_reading', text: t('error_reading') },
  { value: 'multas', text: t('multas') },
]

// Función que se ejecuta al enviar el formulario
async function onSubmit() {
  // Validar que si no tiene el aquasoft, no se pueda crear la nota que diga que cierre sesion y vuelva abrir
  if (!aquasoft_id) {
    showError(t('error_creating_note'))

    return
  }

  try {
    const noteData = {
      subject: note.value.subject,
      content: note.value.content,
      account: contractStore.item?.id_account,
      user_id: aquasoft_id,
    }

    await contractStore.createNote(noteData, '/notes')
    showSuccess(t('note_created_successfully'))
    closeDialog('submit')
  }
  catch (error) {
    showError(t('error_creating_note'))
    console.error('Error al crear la nota:', error)
  }
}

// Función para cancelar y cerrar el diálogo
function onCancel() {
  if (props.isMandatory && !isAdmin.value) {
    showError(t('note_required'))

    return
  }
  closeDialog('cancel')
}

// Opcional: Cierra el diálogo cuando se termine la animación y resuelve la promesa
watch(internalDialog, val => {
  if (!val && props.isMandatory && !isAdmin.value)
    internalDialog.value = true // Forzar a mantener el diálogo abierto
})
</script>

<template>
  <DialogCloseBtn
    v-if="!isMandatory || isAdmin"
    @click="closeDialog"
  />
  <VCard>
    <VCardTitle>
      {{ t('add_note') }}
      <span
        v-if="isMandatory && !isAdmin"
        class="text-error"
      >*</span>
    </VCardTitle>
    <VForm @submit.prevent="onSubmit">
      <VCardText>
        <VSelect
          v-model="note.subject"
          :items="noteTypes"
          item-title="text"
          item-value="value"
          :label="t('subject')"
          required
          class="mb-4"
        />
        <VTextarea
          v-model="note.content"
          :label="t('content')"
          required
          rows="4"
        />
        <div
          v-if="isMandatory && !isAdmin"
          class="text-caption text-error mt-2"
        >
          {{ t('note_required_message') }}
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          v-if="!isMandatory || isAdmin"
          color="secondary"
          variant="text"
          @click="onCancel"
        >
          {{ t('cancel') }}
        </VBtn>
        <VBtn
          color="primary"
          type="submit"
        >
          {{ t('save') }}
        </VBtn>
      </VCardActions>
    </VForm>
  </VCard>
</template>
