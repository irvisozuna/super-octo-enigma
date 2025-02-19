<script setup lang="ts">
import { useNotification } from '@/helpers/notificationHelper'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const contractStore = useContractStore()
const { closeDialog } = useAppManager()
const aquasoft = useCookie('userAquasoft').value

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
]

// Función que se ejecuta al enviar el formulario
async function onSubmit() {
  // Validar que si no tiene el aquasoft, no se pueda crear la nota que diga que cierre sesion y vuelva abrir
  if (!aquasoft) {
    showError(t('error_creating_note'))

    return
  }

  try {
    const noteData = {
      subject: note.value.subject,
      content: note.value.content,
      account: contractStore.item?.id_account,
      user_id: aquasoft.id,
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
  closeDialog('cancel')
}

// Opcional: Cierra el diálogo cuando se termine la animación y resuelve la promesa
watch(internalDialog, val => {
  if (!val) {
    // Aquí se podría hacer una limpieza o resolver la promesa, según tu sistema.
  }
})
</script>

<template>
  <DialogCloseBtn @click="closeDialog" />
  <VCard>
    <VCardTitle>{{ t('add_note') }}</VCardTitle>
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
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
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
