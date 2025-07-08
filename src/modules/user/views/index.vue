<script setup lang="ts">
import { ref } from 'vue'
import UserList from './UserList.vue'

const widgets = ref([])
</script>

<template>
  <ApiDataSource
    api-path="profiles/get_data_widget"
    @loaded="(response) => widgets = response"
  >
    <template #default="{ loading }">
      <WidgetCard
        v-if="widgets.length > 0"
        :widget-data="widgets"
      />
    </template>
  </ApiDataSource>
  <UserList
    :title="$t('users_list')"
    :description="$t('users_list_description')"
  />
</template>
