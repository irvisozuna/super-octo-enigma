<script setup lang="ts">
const props = defineProps({
  modelValue: { type: Object, required: true },
  dataSources: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'next', 'validate'])

const handleNext = () => {
  emit('validate')
  emit('next')
}
</script>

<template>
  <VForm @submit.prevent="handleNext">
    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VSelect
          v-model="modelValue.dataSourceId"
          :items="dataSources"
          item-title="name"
          item-value="id"
          :loading="loading"
          label="Data Source"
          required
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="modelValue.name"
          label="Nombre del Reporte"
          required
        />
      </VCol>
      <VCol cols="12">
        <VTextarea
          v-model="modelValue.description"
          label="Descripción"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VSwitch
          v-model="modelValue.isActive"
          label="Activo"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VSwitch
          v-model="modelValue.isPublic"
          label="Público"
        />
      </VCol>
    </VRow>
    <div class="d-flex justify-end mt-4">
      <VBtn
        color="primary"
        type="submit"
      >
        Siguiente
      </VBtn>
    </div>
  </VForm>
</template>
