<template>
  <div class="dashboardmonitorentity-form">
    <h2 class="text-xl font-bold mb-4">
      {{ isEdit ? 'Edit' : 'Create' }} DashboardMonitorEntity
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
        <select
          id="status"
          v-model="form.status"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="loading"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
        <button
          type="button"
          @click="$emit('cancel')"
          class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'

interface Props {
  dashboardmonitorentity?: DashboardMonitorEntity
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false
})

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const loading = ref(false)
const form = reactive({
  name: '',
  status: 'active'
})

watch(() => props.dashboardmonitorentity, (newDashboardMonitorEntity) => {
  if (newDashboardMonitorEntity) {
    Object.assign(form, newDashboardMonitorEntity)
  }
}, { immediate: true })

const handleSubmit = async () => {
  loading.value = true
  try {
    emit('submit', { ...form })
  } finally {
    loading.value = false
  }
}
</script>