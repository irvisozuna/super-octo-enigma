<script setup lang="ts">
// import { UserList } from '@/modules/users';
import { UserList } from '@/modules/user';
import RoleCards from '@/views/roles/RoleCards.vue';
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        {{ $t('roles_list') }}
      </h4>
      <p class="text-body-1 mb-0">
        {{ $t('roles_list_description') }}
      </p>
    </VCol>

    <!-- 👉 Roles Cards -->
    <VCol cols="12">
      <RoleCards />
    </VCol>



    <VCol cols="12">
      <!-- 👉 User List  -->
      <UserList :title="$t('users_list')" :description="$t('users_list_description')" :extraFilters="{}" />
    </VCol>
  </VRow>
</template>
