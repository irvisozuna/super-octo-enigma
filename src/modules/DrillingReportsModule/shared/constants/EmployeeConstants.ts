export const EMPLOYEE_STATUS = [
  { value: 'active', label: 'Activo', color: '#10B981', bgColor: '#D1FAE5', icon: '✅' },
  { value: 'inactive', label: 'Inactivo', color: '#6B7280', bgColor: '#F3F4F6', icon: '⏸️' },
  { value: 'terminated', label: 'Terminado', color: '#EF4444', bgColor: '#FEE2E2', icon: '❌' },
]

export const EMPLOYEE_POSITIONS = [
  { value: 'operator', label: 'Operador', icon: '👨‍🔧', department: 'operations' },
  { value: 'assistant', label: 'Asistente', icon: '👨‍💼', department: 'operations' },
  { value: 'supervisor', label: 'Supervisor', icon: '👨‍💼', department: 'management' },
  { value: 'engineer', label: 'Ingeniero', icon: '👨‍🔬', department: 'engineering' },
  { value: 'technician', label: 'Técnico', icon: '👨‍🔧', department: 'technical' },
  { value: 'safety_officer', label: 'Oficial de Seguridad', icon: '🛡️', department: 'safety' },
  { value: 'geologist', label: 'Geólogo', icon: '🌍', department: 'geology' },
  { value: 'manager', label: 'Gerente', icon: '👨‍💼', department: 'management' },
]

export const EMPLOYEE_DEPARTMENTS = [
  { value: 'operations', label: 'Operaciones', icon: '⚡', color: '#3B82F6' },
  { value: 'engineering', label: 'Ingeniería', icon: '🔬', color: '#8B5CF6' },
  { value: 'safety', label: 'Seguridad', icon: '🛡️', color: '#10B981' },
  { value: 'geology', label: 'Geología', icon: '🌍', color: '#F59E0B' },
  { value: 'management', label: 'Gerencia', icon: '👨‍💼', color: '#EF4444' },
  { value: 'technical', label: 'Técnico', icon: '🔧', color: '#6B7280' },
  { value: 'quality', label: 'Calidad', icon: '✅', color: '#10B981' },
  { value: 'maintenance', label: 'Mantenimiento', icon: '🔧', color: '#F59E0B' },
]

export const EMPLOYEE_SKILLS = [
  { value: 'drilling', label: 'Perforación', category: 'technical', icon: '🔩' },
  { value: 'safety', label: 'Seguridad', category: 'safety', icon: '🛡️' },
  { value: 'maintenance', label: 'Mantenimiento', category: 'technical', icon: '🔧' },
  { value: 'geology', label: 'Geología', category: 'science', icon: '🌍' },
  { value: 'engineering', label: 'Ingeniería', category: 'technical', icon: '🔬' },
  { value: 'management', label: 'Gestión', category: 'management', icon: '👨‍💼' },
  { value: 'communication', label: 'Comunicación', category: 'soft', icon: '💬' },
  { value: 'leadership', label: 'Liderazgo', category: 'soft', icon: '👑' },
  { value: 'problem_solving', label: 'Resolución de Problemas', category: 'soft', icon: '🧩' },
  { value: 'teamwork', label: 'Trabajo en Equipo', category: 'soft', icon: '👥' },
]

export const EMPLOYEE_CERTIFICATIONS = [
  { value: 'hse', label: 'HSE (Salud, Seguridad y Medio Ambiente)', category: 'safety', icon: '🛡️' },
  { value: 'first_aid', label: 'Primeros Auxilios', category: 'safety', icon: '🚑' },
  { value: 'fire_safety', label: 'Seguridad contra Incendios', category: 'safety', icon: '🔥' },
  { value: 'confined_spaces', label: 'Espacios Confinados', category: 'safety', icon: '🏗️' },
  { value: 'working_at_height', label: 'Trabajo en Altura', category: 'safety', icon: '🏗️' },
  { value: 'crane_operation', label: 'Operación de Grúas', category: 'technical', icon: '🏗️' },
  { value: 'welding', label: 'Soldadura', category: 'technical', icon: '🔥' },
  { value: 'electrical', label: 'Eléctrico', category: 'technical', icon: '⚡' },
  { value: 'mechanical', label: 'Mecánico', category: 'technical', icon: '🔧' },
  { value: 'quality_control', label: 'Control de Calidad', category: 'quality', icon: '✅' },
]

export const EMPLOYEE_EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Principiante (0-2 años)', color: '#10B981', icon: '🌱' },
  { value: 'junior', label: 'Junior (2-5 años)', color: '#3B82F6', icon: '👶' },
  { value: 'mid', label: 'Intermedio (5-10 años)', color: '#F59E0B', icon: '👨' },
  { value: 'senior', label: 'Senior (10-15 años)', color: '#EF4444', icon: '👴' },
  { value: 'expert', label: 'Experto (15+ años)', color: '#7C2D12', icon: '🧙' },
]

export const EMPLOYEE_SHIFT_TYPES = [
  { value: 'day', label: 'Día', icon: '☀️', color: '#F59E0B' },
  { value: 'night', label: 'Noche', icon: '🌙', color: '#3B82F6' },
  { value: 'mixed', label: 'Mixto', icon: '🔄', color: '#8B5CF6' },
  { value: 'rotating', label: 'Rotativo', icon: '🔄', color: '#6B7280' },
]

export const EMPLOYEE_METRICS = {
  EXPERIENCE_LEVELS: EMPLOYEE_EXPERIENCE_LEVELS,
  AGE_RANGES: [
    { min: 18, max: 25, label: '18-25 años', color: '#10B981' },
    { min: 25, max: 35, label: '25-35 años', color: '#3B82F6' },
    { min: 35, max: 45, label: '35-45 años', color: '#F59E0B' },
    { min: 45, max: 55, label: '45-55 años', color: '#EF4444' },
    { min: 55, max: 65, label: '55-65 años', color: '#7C2D12' },
  ],
  SALARY_RANGES: [
    { min: 0, max: 30000, label: 'Menos de $30K', color: '#10B981' },
    { min: 30000, max: 50000, label: '$30K-$50K', color: '#3B82F6' },
    { min: 50000, max: 80000, label: '$50K-$80K', color: '#F59E0B' },
    { min: 80000, max: 120000, label: '$80K-$120K', color: '#EF4444' },
    { min: 120000, max: Number.POSITIVE_INFINITY, label: 'Más de $120K', color: '#7C2D12' },
  ],
}

export const EMPLOYEE_FILTERS = {
  STATUS: EMPLOYEE_STATUS,
  POSITION: EMPLOYEE_POSITIONS,
  DEPARTMENT: EMPLOYEE_DEPARTMENTS,
  SKILLS: EMPLOYEE_SKILLS,
  CERTIFICATIONS: EMPLOYEE_CERTIFICATIONS,
  EXPERIENCE_LEVEL: EMPLOYEE_METRICS.EXPERIENCE_LEVELS,
  AGE_RANGE: EMPLOYEE_METRICS.AGE_RANGES,
  SALARY_RANGE: EMPLOYEE_METRICS.SALARY_RANGES,
  SHIFT_TYPE: EMPLOYEE_SHIFT_TYPES,
}

export const EMPLOYEE_PERMISSIONS = {
  CREATE: 'employees.create',
  VIEW: 'employees.view',
  UPDATE: 'employees.update',
  DELETE: 'employees.delete',
  ASSIGN: 'employees.assign',
  CERTIFY: 'employees.certify',
  EVALUATE: 'employees.evaluate',
  EXPORT: 'employees.export',
}

export const EMPLOYEE_NOTIFICATIONS = {
  CREATED: 'employee_created',
  UPDATED: 'employee_updated',
  STATUS_CHANGED: 'employee_status_changed',
  CERTIFICATION_EXPIRING: 'employee_certification_expiring',
  CERTIFICATION_EXPIRED: 'employee_certification_expired',
  EVALUATION_DUE: 'employee_evaluation_due',
  BIRTHDAY: 'employee_birthday',
  ANNIVERSARY: 'employee_anniversary',
}
