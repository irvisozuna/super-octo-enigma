<!-- // src/modules/users/users.vue -->
<template>
  <WidgetCard :widgetData="widgets" v-if="widgets.length > 0" />
  <UserList/>
</template>
<script setup lang="ts">
import UserList from './components/UserList.vue';
const widgets = [
  { title: 'Users', value: 1200, icon: 'tabler-user' },
  { title: 'Sales', value: '$24,000', icon: 'tabler-cash' },
  { title: 'Orders', value: 320, icon: 'tabler-shopping-cart' },
  { title: 'Revenue', value: '$1,200', icon: 'tabler-chart-line' },
];
</script>
