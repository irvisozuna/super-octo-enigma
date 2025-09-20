import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/apiService'
import type { 
  Fine, 
  FineListResponse, 
  FineDetailResponse, 
  FineListParams, 
  FineFilters,
  FineStats 
} from '../types/fine'

export const useFineStore = defineStore('fine', () => {
  // State
  const list = ref<Fine[]>([])
  const currentItem = ref<Fine | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const itemsPerPage = ref(15)
  const filters = ref<FineFilters>({})
  const sortBy = ref<string[]>(['issued_at'])
  const sortDesc = ref<boolean[]>([true])

  // Computed
  const hasItems = computed(() => list.value.length > 0)
  const totalPages = computed(() => Math.ceil(total.value / itemsPerPage.value))
  const currentPage = computed(() => page.value)

  // Stats computed
  const stats = computed<FineStats>(() => {
    const fines = list.value
    
    return {
      total: fines.length,
      unpaid: fines.filter(f => f.status === 'ISSUED' || f.status === 'OVERDUE').length,
      paid: fines.filter(f => f.status === 'PAID').length,
      overdue: fines.filter(f => f.status === 'OVERDUE').length,
      total_amount: fines.reduce((sum, f) => sum + f.total_amount, 0),
      unpaid_amount: fines
        .filter(f => f.status === 'ISSUED' || f.status === 'OVERDUE')
        .reduce((sum, f) => sum + f.remaining_amount, 0),
      by_subject_type: {
        concession: fines.filter(f => f.subject_type === 'concession').length,
        concession_holder: fines.filter(f => f.subject_type === 'concession_holder').length,
        driver: fines.filter(f => f.subject_type === 'driver').length,
      },
      by_status: {
        DRAFT: fines.filter(f => f.status === 'DRAFT').length,
        ISSUED: fines.filter(f => f.status === 'ISSUED').length,
        PAID: fines.filter(f => f.status === 'PAID').length,
        CANCELLED: fines.filter(f => f.status === 'CANCELLED').length,
        OVERDUE: fines.filter(f => f.status === 'OVERDUE').length,
        APPEALED: fines.filter(f => f.status === 'APPEALED').length,
      }
    }
  })

  // Actions
  const fetchList = async (concessionId: string, params?: Partial<FineListParams>) => {
    if (!concessionId) {
      console.error('Concession ID is required to fetch fines')
      return
    }

    loading.value = true
    
    try {
      const queryParams: FineListParams = {
        per_page: itemsPerPage.value,
        page: page.value,
        sort_by: sortBy.value[0] as any,
        sort_order: sortDesc.value[0] ? 'desc' : 'asc',
        include_computed: ['subject_type', 'formatted_amount', 'status_label', 'formatted_location'],
        include_relations: ['vehicle', 'concession_holder', 'violation_type'],
        ...filters.value,
        ...params
      }

      // Construir query string
      const queryString = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryString.append(`${key}[]`, String(v)))
          } else {
            queryString.append(key, String(value))
          }
        }
      })

      const response = await ApiService.get<FineListResponse>(
        `/transport/fines/concession/${concessionId}?${queryString.toString()}`
      )

      list.value = response.data || []
      total.value = response.meta?.total || 0
      page.value = response.meta?.current_page || 1

      console.log('✅ Fines loaded:', {
        count: list.value.length,
        total: total.value,
        page: page.value,
        concessionId
      })

    } catch (error) {
      console.error('❌ Error fetching fines:', error)
      list.value = []
      total.value = 0
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (fineId: string) => {
    loading.value = true
    
    try {
      const response = await ApiService.get<FineDetailResponse>(
        `/transport/fines/${fineId}?include_computed[]=subject_type&include_computed[]=formatted_amount&include_computed[]=status_label&include_computed[]=formatted_location&include_relations[]=vehicle&include_relations[]=concession_holder&include_relations[]=violation_type&include_relations[]=payments&include_relations[]=photos`
      )

      currentItem.value = response.data
      
      console.log('✅ Fine detail loaded:', {
        id: fineId,
        status: response.data?.status,
        amount: response.data?.formatted_amount
      })

      return response.data
    } catch (error) {
      console.error('❌ Error fetching fine detail:', error)
      currentItem.value = null
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateFilters = (newFilters: Partial<FineFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {}
  }

  const setPage = (newPage: number) => {
    page.value = newPage
  }

  const setItemsPerPage = (newItemsPerPage: number) => {
    itemsPerPage.value = newItemsPerPage
  }

  const setSorting = (newSortBy: string[], newSortDesc: boolean[]) => {
    sortBy.value = newSortBy
    sortDesc.value = newSortDesc
  }

  const reset = () => {
    list.value = []
    currentItem.value = null
    total.value = 0
    page.value = 1
    itemsPerPage.value = 15
    filters.value = {}
    sortBy.value = ['issued_at']
    sortDesc.value = [true]
    loading.value = false
  }

  return {
    // State
    list,
    currentItem,
    loading,
    total,
    page,
    itemsPerPage,
    filters,
    sortBy,
    sortDesc,
    
    // Computed
    hasItems,
    totalPages,
    currentPage,
    stats,
    
    // Actions
    fetchList,
    fetchById,
    updateFilters,
    clearFilters,
    setPage,
    setItemsPerPage,
    setSorting,
    reset
  }
})
