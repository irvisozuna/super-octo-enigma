<script setup lang="ts">
import { UserProfileMenuItem } from '@/types/types';
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';

const router = useRouter()
const ability = useAbility()
const { isAdmin } = useCurrentUser();

// TODO: Get type from backend
const userData = useCookie<any>('userData')

const logout = async () => {
  // Remove "accessToken" from cookie
  useCookie('accessToken').value = null

  // Remove "userData" from cookie
  userData.value = null

  // Redirect to login page
  await router.push('/login')

  // ℹ️ We had to remove abilities in then block because if we don't nav menu items mutation is visible while redirecting user to login page
  // Remove "userAbilities" from cookie
  useCookie('userAbilityRules').value = null

  // Reset ability to initial ability
  ability.update([])
}

const userProfileList: UserProfileMenuItem[] = [
  { type: 'divider' },
  { type: 'navItem', icon: 'tabler-user', title: 'Profile', to: { name: 'profile-account-settings-tab', params: { tab: 'account' } } },
  { type: 'navItem', icon: 'tabler-settings', title: 'Settings', to: { name: 'pages-account-settings-tab', params: { tab: 'account' } }, onlyAdmin: true },
  { type: 'navItem', icon: 'tabler-file-dollar', title: 'Billing Plan', to: { name: 'pages-account-settings-tab', params: { tab: 'billing-plans' } }, badgeProps: { color: 'error', content: '4' }, onlyAdmin: true },
  { type: 'divider' },
  { type: 'navItem', icon: 'tabler-currency-dollar', title: 'Pricing', to: { name: 'pages-pricing' }, onlyAdmin: true },
  { type: 'navItem', icon: 'tabler-question-mark', title: 'FAQ', to: { name: 'pages-faq' } },
]

const filteredUserProfileList = computed(() => {
  const visibleItems = userProfileList.filter(item => {
    // Filtra elementos según el rol
    if (item.onlyAdmin && !isAdmin.value) return false;
    return true;
  });

  // Remueve divisores innecesarios
  return visibleItems.filter((item, index) => {
    const prev = visibleItems[index - 1];
    const next = visibleItems[index + 1];
    if (item.type === 'divider' && (!prev || prev.type === 'divider' || !next || next.type === 'divider')) {
      return false;
    }
    return true;
  });
});
</script>

<template>
  <VBadge v-if="userData" dot bordered location="bottom right" offset-x="1" offset-y="2" color="success">
    <VAvatar size="38" class="cursor-pointer" :color="!(userData && userData.avatar) ? 'primary' : undefined"
      :variant="!(userData && userData.avatar) ? 'tonal' : undefined">
      <VImg v-if="userData && userData.avatar" :src="userData.avatar" />
      <VIcon v-else icon="tabler-user" />

      <!-- SECTION Menu -->
      <VMenu activator="parent" width="240" location="bottom end" offset="12px">
        <VList>
          <VListItem>
            <div class="d-flex gap-2 align-center">
              <VListItemAction>
                <VBadge dot location="bottom right" offset-x="3" offset-y="3" color="success" bordered>
                  <VAvatar :color="!(userData && userData.avatar) ? 'primary' : undefined"
                    :variant="!(userData && userData.avatar) ? 'tonal' : undefined">
                    <VImg v-if="userData && userData.avatar" :src="userData.avatar" />
                    <VIcon v-else icon="tabler-user" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>

              <div>
                <h6 class="text-h6 font-weight-medium">
                  {{ userData.name || userData.username }}
                </h6>
                <VListItemSubtitle class="text-capitalize text-disabled">
                  {{ userData.roles[0].name }}
                </VListItemSubtitle>
              </div>
            </div>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template v-for="item in filteredUserProfileList" :key="item.title || item.type">
              <VListItem v-if="item.type === 'navItem'" :to="item.to">
                <template #prepend>
                  <VIcon :icon="item.icon" size="22" />
                </template>

                <VListItemTitle>{{ $t(item.title || '') }}</VListItemTitle>

                <template v-if="item.badgeProps" #append>
                  <VBadge rounded="sm" class="me-3" v-bind="item.badgeProps" />
                </template>
              </VListItem>

              <VDivider v-else class="my-2" />
            </template>

            <div class="px-4 py-2">
              <VBtn block size="small" color="error" append-icon="tabler-logout" @click="logout">
                {{ $t('Logout') }}
              </VBtn>
            </div>
          </PerfectScrollbar>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
