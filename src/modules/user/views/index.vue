<template>
  <api-data-source api-path="profiles/get_data_widget" @loaded="(response) => widgets = response">
    <template v-slot="{ loading }">
      <WidgetCard :widgetData="widgets" v-if="widgets.length > 0" />
    </template>
  </api-data-source>
  <UserList />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UserList from './UserList.vue';

const widgets = ref([]);
</script>
