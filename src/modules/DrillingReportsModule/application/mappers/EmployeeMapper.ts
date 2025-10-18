import type { Employee } from '../../domain/entities/EmployeeEntity'
import type { EmployeeCreateDto, EmployeeDto, EmployeeUpdateDto } from '../dtos/EmployeeDtos'

export class EmployeeMapper {
  static toDto(employee: Employee): EmployeeDto {
    return {
      id: employee.id,
      employee_number: employee.employee_number,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      hire_date: employee.hire_date,
      status: employee.status,
      skills: employee.skills,
      certifications: employee.certifications,
      created_at: employee.created_at,
      updated_at: employee.updated_at,
    }
  }

  static toEntity(employeeDto: EmployeeDto): Employee {
    return {
      id: employeeDto.id,
      employee_number: employeeDto.employee_number,
      first_name: employeeDto.first_name,
      last_name: employeeDto.last_name,
      email: employeeDto.email,
      phone: employeeDto.phone,
      position: employeeDto.position,
      department: employeeDto.department,
      hire_date: employeeDto.hire_date,
      status: employeeDto.status,
      skills: employeeDto.skills,
      certifications: employeeDto.certifications,
      created_at: employeeDto.created_at,
      updated_at: employeeDto.updated_at,
    }
  }

  static createDtoToEntity(createDto: EmployeeCreateDto): Omit<Employee, 'id' | 'created_at' | 'updated_at'> {
    return {
      employee_number: createDto.employee_number,
      first_name: createDto.first_name,
      last_name: createDto.last_name,
      email: createDto.email,
      phone: createDto.phone,
      position: createDto.position,
      department: createDto.department,
      hire_date: createDto.hire_date,
      status: 'active', // Default status
      skills: createDto.skills,
      certifications: createDto.certifications || [],
    }
  }

  static updateDtoToEntity(updateDto: EmployeeUpdateDto): Partial<Employee> {
    return {
      ...(updateDto.employee_number && { employee_number: updateDto.employee_number }),
      ...(updateDto.first_name && { first_name: updateDto.first_name }),
      ...(updateDto.last_name && { last_name: updateDto.last_name }),
      ...(updateDto.email && { email: updateDto.email }),
      ...(updateDto.phone && { phone: updateDto.phone }),
      ...(updateDto.position && { position: updateDto.position }),
      ...(updateDto.department && { department: updateDto.department }),
      ...(updateDto.hire_date && { hire_date: updateDto.hire_date }),
      ...(updateDto.status && { status: updateDto.status }),
      ...(updateDto.skills && { skills: updateDto.skills }),
      ...(updateDto.certifications && { certifications: updateDto.certifications }),
    }
  }
}
