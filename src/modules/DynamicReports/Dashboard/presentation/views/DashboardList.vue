<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '../composables/useDashboard'

const router = useRouter()

const {
  items,
  favorites,
  recent,
  loading,
  error,
  page,
  itemsPerPage,
  total,
  fetchDashboards,
  fetchFavorites,
  fetchRecent,
  toggleFavorite,
  deleteDashboard,
  setPage,
  setFilters,
} = useDashboard()

const search = ref('')
const selectedCategory = ref<string | null>(null)
const viewMode = ref<'grid' | 'list'>('grid')

// Filtros
const filteredItems = computed(() => {
  let filtered = items.value

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.props.name.toLowerCase().includes(searchLower)
      || item.props.description?.toLowerCase().includes(searchLower),
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(item =>
      item.props.category === selectedCategory.value,
    )
  }

  return filtered
})

onMounted(async () => {
  await Promise.all([
    fetchDashboards(),
    fetchFavorites(),
    fetchRecent(5),
  ])
})

function handleCreate() {
  router.push('/dashboards/builder/new')
}

function handleView(id: string) {
  router.push(`/dashboards/${id}`)
}

function handleEdit(id: string) {
  router.push(`/dashboards/builder/${id}`)
}

async function handleToggleFavorite(id: string) {
  await toggleFavorite(id)
  await fetchFavorites()
}

async function handleDelete(id: string) {
  if (confirm('¿Estás seguro de eliminar este dashboard?')) {
    await deleteDashboard(id)
    await fetchDashboards()
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="dashboard-list">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          Dashboards
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Gestiona y visualiza tus dashboards personalizados
        </p>
      </div>

      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        @click="handleCreate"
      >
        Nuevo Dashboard
      </VBtn>
    </div>

    <!-- Recent & Favorites -->
    <VRow v-if="recent.length > 0 || favorites.length > 0">
      <!-- Recent -->
      <VCol
        v-if="recent.length > 0"
        cols="12"
        md="6"
      >
        <h3 class="text-h6 mb-3">
          Recientes
        </h3>
        <VList density="compact">
          <VListItem
            v-for="item in recent"
            :key="item.id.toString()"
            @click="handleView(item.id.toString())"
          >
            <template #prepend>
              <VIcon icon="tabler-layout-dashboard" />
            </template>
            <VListItemTitle>{{ item.props.name }}</VListItemTitle>
            <VListItemSubtitle>{{ formatDate(item.props.updatedAt) }}</VListItemSubtitle>
          </VListItem>
        </VList>
      </VCol>

      <!-- Favorites -->
      <VCol
        v-if="favorites.length > 0"
        cols="12"
        md="6"
      >
        <h3 class="text-h6 mb-3">
          Favoritos
        </h3>
        <VList density="compact">
          <VListItem
            v-for="item in favorites"
            :key="item.id.toString()"
            @click="handleView(item.id.toString())"
          >
            <template #prepend>
              <VIcon
                icon="tabler-star-filled"
                color="warning"
              />
            </template>
            <VListItemTitle>{{ item.props.name }}</VListItemTitle>
            <VListItemSubtitle>{{ formatDate(item.props.updatedAt) }}</VListItemSubtitle>
          </VListItem>
        </VList>
      </VCol>
    </VRow>

    <VDivider
      v-if="recent.length > 0 || favorites.length > 0"
      class="my-6"
    />

    <!-- Filters & Search -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="search"
          placeholder="Buscar dashboards..."
          prepend-inner-icon="tabler-search"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VSelect
          v-model="selectedCategory"
          :items="[]"
          placeholder="Categoría"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        md="2"
      >
        <VBtnToggle
          v-model="viewMode"
          mandatory
          density="compact"
          class="w-100"
        >
          <VBtn
            value="grid"
            icon="tabler-layout-grid"
          />
          <VBtn
            value="list"
            icon="tabler-list"
          />
        </VBtnToggle>
      </VCol>
    </VRow>

    <!-- Error -->
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ error }}
    </VAlert>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <!-- Grid View -->
    <VRow v-else-if="viewMode === 'grid'">
      <VCol
        v-for="item in filteredItems"
        :key="item.id.toString()"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-3">
              <VIcon
                icon="tabler-layout-dashboard"
                size="32"
                color="primary"
              />
              <VBtn
                :icon="item.props.isFavorite ? 'tabler-star-filled' : 'tabler-star'"
                :color="item.props.isFavorite ? 'warning' : 'default'"
                variant="text"
                size="small"
                @click.stop="handleToggleFavorite(item.id.toString())"
              />
            </div>

            <h3 class="text-h6 mb-2">
              {{ item.props.name }}
            </h3>

            <p class="text-caption text-medium-emphasis mb-4">
              {{ item.props.description || 'Sin descripción' }}
            </p>

            <div class="d-flex align-center text-caption text-disabled mb-4">
              <VIcon
                icon="tabler-clock"
                size="16"
                class="me-1"
              />
              {{ formatDate(item.props.updatedAt) }}
            </div>

            <div class="d-flex gap-2">
              <VBtn
                size="small"
                variant="tonal"
                color="primary"
                block
                @click="handleView(item.id.toString())"
              >
                Ver
              </VBtn>
              <VBtn
                size="small"
                variant="outlined"
                icon="tabler-edit"
                @click="handleEdit(item.id.toString())"
              />
              <VBtn
                size="small"
                variant="outlined"
                icon="tabler-trash"
                color="error"
                @click="handleDelete(item.id.toString())"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Empty State -->
      <VCol
        v-if="filteredItems.length === 0"
        cols="12"
      >
        <VCard>
          <VCardText class="text-center py-12">
            <VIcon
              icon="tabler-layout-dashboard"
              size="64"
              color="disabled"
            />
            <p class="text-h6 mt-4">
              No hay dashboards
            </p>
            <p class="text-body-2 text-medium-emphasis">
              Crea tu primer dashboard para comenzar
            </p>
            <VBtn
              color="primary"
              class="mt-4"
              @click="handleCreate"
            >
              Crear Dashboard
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- List View -->
    <VCard v-else-if="viewMode === 'list'">
      <VDataTable
        :items="filteredItems"
        :loading="loading"
        :headers="[
          { title: 'Nombre', key: 'props.name' },
          { title: 'Descripción', key: 'props.description' },
          { title: 'Actualizado', key: 'props.updatedAt' },
          { title: 'Acciones', key: 'actions', sortable: false },
        ]"
      >
        <template #item.props.updatedAt="{ item }">
          {{ formatDate(item.props.updatedAt) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon="tabler-eye"
              size="small"
              variant="text"
              @click="handleView(item.id.toString())"
            />
            <VBtn
              icon="tabler-edit"
              size="small"
              variant="text"
              @click="handleEdit(item.id.toString())"
            />
            <VBtn
              :icon="item.props.isFavorite ? 'tabler-star-filled' : 'tabler-star'"
              :color="item.props.isFavorite ? 'warning' : 'default'"
              size="small"
              variant="text"
              @click="handleToggleFavorite(item.id.toString())"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click="handleDelete(item.id.toString())"
            />
          </div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.dashboard-list {
  padding: 24px;
}
</style>
