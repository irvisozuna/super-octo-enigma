<script setup lang="ts">
import { ref, watch } from 'vue'
import { VBtn, VCard, VCardActions, VCardText, VCardTitle, VDialog, VSpacer, VTextField } from 'vuetify/components'

const props = defineProps({
  modelValue: Boolean,
  column: {
    type: Object,
    required: false,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const alias = ref('')

watch(
  () => props.column,
  col => {
    if (col)
      alias.value = col.alias || ''
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function save() {
  emit('save', {
    ...props.column,
    alias: alias.value,
  })
  emit('update:modelValue', false)
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="400"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle>Editar columna</VCardTitle>
      <VCardText>
        <VTextField
          v-model="alias"
          label="Alias"
          class="mb-3"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          @click="close"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          @click="save"
        >
          Guardar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
