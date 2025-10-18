<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useEmployees } from '../composables/useEmployees'
import {
  getEmployeeDepartmentColor,
  getEmployeeDepartmentLabel,
  getEmployeeFullName,
  getEmployeeInitials,
  getEmployeePositionLabel,
} from '../../shared/utils/EmployeeUtils'

interface Props {
  modelValue?: string
  rules?: any[]
  errorMessages?: string[]
  required?: boolean
  department?: string
  position?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'employeeSelected', employee: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rules: () => [],
  errorMessages: () => [],
  required: false,
  department: '',
  position: '',
})

const emit = defineEmits<Emits>()

const { employees, loading, fetchEmployees } = useEmployees()

const selectedEmployee = ref<string>(props.modelValue)

const employeeOptions = computed(() => {
  let filteredEmployees = employees.value

  if (props.department)
    filteredEmployees = filteredEmployees.filter(emp => emp.department === props.department)

  if (props.position)
    filteredEmployees = filteredEmployees.filter(emp => emp.position === props.position)

  return filteredEmployees.map(employee => ({
    ...employee,
    id: employee.id,
    displayName: getEmployeeFullName(employee),
    position: employee.position,
    department: employee.department,
  }))
})

const rules = computed(() => {
  const baseRules = [...props.rules]
  if (props.required)
    baseRules.push((value: string) => !!value || 'Debe seleccionar un empleado')

  return baseRules
})

const handleEmployeeChange = (value: string) => {
  selectedEmployee.value = value
  emit('update:modelValue', value)

  if (value) {
    const employee = employees.value.find(e => e.id === value)
    if (employee)
      emit('employeeSelected', employee)
  }
}

onMounted(() => {
  if (employees.value.length === 0)
    fetchEmployees()
})

watch(() => props.modelValue, newValue => {
  selectedEmployee.value = newValue
})
</script>

<template>
  <div class="employee-selector">
    <VSelect
      v-model="selectedEmployee"
      :items="employeeOptions"
      :label="$t('DrillingReportsModule.employees.title')"
      :placeholder="$t('DrillingReportsModule.employees.selectEmployee')"
      :loading="loading"
      :error-messages="errorMessages"
      :rules="rules"
      item-title="displayName"
      item-value="id"
      clearable
      @update:model-value="handleEmployeeChange"
    >
      <template #item="{ props, item }">
        <VListItem v-bind="props">
          <template #prepend>
            <VAvatar
              size="small"
              :color="getEmployeeDepartmentColor(item.raw.department)"
            >
              {{ getEmployeeInitials(item.raw) }}
            </VAvatar>
          </template>
          <VListItemTitle>{{ getEmployeeFullName(item.raw) }}</VListItemTitle>
          <VListItemSubtitle>
            {{ getEmployeePositionLabel(item.raw.position) }} - {{ getEmployeeDepartmentLabel(item.raw.department) }}
          </VListItemSubtitle>
        </VListItem>
      </template>

      <template #selection="{ item }">
        <div class="d-flex align-center">
          <VAvatar
            size="small"
            :color="getEmployeeDepartmentColor(item.raw.department)"
            class="me-2"
          >
            {{ getEmployeeInitials(item.raw) }}
          </VAvatar>
          <span>{{ getEmployeeFullName(item.raw) }}</span>
        </div>
      </template>
    </VSelect>
  </div>
</template>

<style scoped>
.employee-selector {
  inline-size: 100%;
}
</style>
