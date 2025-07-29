<template>
  <div class="dashboardmonitorentity-list">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">DashboardMonitorEntity List</h1>
      <router-link
        :to="{ name: 'DashboardMonitorEntityCreate' }"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create DashboardMonitorEntity
      </router-link>
    </div>

    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="dashboardmonitorentity in dashboardmonitorentitys" :key="dashboardmonitorentity.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ dashboardmonitorentity.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ dashboardmonitorentity.status }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(dashboardmonitorentity.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <router-link
                :to="{ name: 'DashboardMonitorEntityDetail', params: { id: dashboardmonitorentity.id } }"
                class="text-blue-600 hover:text-blue-900 mr-4"
              >
                View
              </router-link>
              <router-link
                :to="{ name: 'DashboardMonitorEntityEdit', params: { id: dashboardmonitorentity.id } }"
                class="text-green-600 hover:text-green-900"
              >
                Edit
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDashboardMonitorEntityStore } from '../stores/dashboardmonitorentityStore'
import { formatDate } from '@/shared/utils/dateUtils'

const dashboardmonitorentityStore = useDashboardMonitorEntityStore()
const dashboardmonitorentitys = ref([])

onMounted(async () => {
  await loadDashboardMonitorEntitys()
})

const loadDashboardMonitorEntitys = async () => {
  try {
    dashboardmonitorentitys.value = await dashboardmonitorentityStore.getAll()
  } catch (error) {
    console.error('Error loading dashboardmonitorentitys:', error)
  }
}
</script>