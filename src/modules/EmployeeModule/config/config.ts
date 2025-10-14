/**
 * Employee Module Configuration
 */

export const EmployeeModuleConfig = {
  name: 'EmployeeModule',
  version: '1.0.0',
  description: 'Employee management module with DDD and Clean Architecture',

  // Feature flags
  features: {
    skills: true,
    certifications: true,
    employmentHistory: true,
    export: true,
    statistics: true,
  },

  // Default pagination
  pagination: {
    defaultPerPage: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // Validation rules
  validation: {
    employeeCode: {
      maxLength: 50,
      pattern: /^[A-Z0-9-]+$/,
    },
    name: {
      minLength: 2,
      maxLength: 100,
    },
    phone: {
      length: 10,
      pattern: /^\d{10}$/,
    },
    email: {
      pattern: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/,
    },
    minAge: 18,
    maxAge: 100,
  },

  // Date formats
  dateFormats: {
    display: 'DD/MM/YYYY',
    api: 'YYYY-MM-DD',
    datetime: 'DD/MM/YYYY HH:mm:ss',
  },

  // Status colors
  statusColors: {
    active: '#16A34A',
    inactive: '#6B7280',
    suspended: '#F97316',
    terminated: '#DC2626',
    vacation: '#2563EB',
  },

  // Position labels
  positionLabels: {
    operator: 'Operador',
    helper: 'Ayudante',
    manager: 'Gerente',
    supervisor: 'Supervisor',
    admin: 'Administrador',
  },

  // Employment type labels
  employmentTypeLabels: {
    full_time: 'Tiempo Completo',
    part_time: 'Medio Tiempo',
    contractor: 'Contratista',
    temporary: 'Temporal',
  },

  // Skill proficiency labels
  proficiencyLabels: {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto',
  },
}
