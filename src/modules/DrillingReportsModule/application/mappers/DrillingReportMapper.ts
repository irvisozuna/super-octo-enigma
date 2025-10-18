/**
 * Drilling Report Mapper
 *
 * Maps between domain entities and DTOs
 */

import type { DrillingReportEntity } from '../../domain/entities/DrillingReportEntity'
import type {
  ActivityDto,
  CompleteReportDto,
  ConsumptionDto,
  CreateActivityDto,
  CreateConsumptionDto,
  CreateDrillingReportDto,
  CreateSignatureDto,
  CreateToolAssignmentDto,
  DrillingReportDetailDto,
  DrillingReportDto,
  DrillingReportListItemDto,
  RejectReportDto,
  SignatureDto,
  ToolAssignmentDto,
  UpdateDrillingReportDto,
} from '../dtos/DrillingReportDtos'

export class DrillingReportMapper {
  /**
   * Map entity to DTO
   */
  static toDto(entity: DrillingReportEntity): DrillingReportDto {
    return {
      id: entity.id,
      report_number: entity.report_number,
      report_date: entity.report_date,
      shift: entity.shift,
      status: entity.status,
      project_id: entity.project_id,
      well_id: entity.well_id,
      equipment_id: entity.equipment_id,
      operator_day_id: entity.operator_day_id,
      helper1_day_id: entity.helper1_day_id,
      helper2_day_id: entity.helper2_day_id,
      operator_night_id: entity.operator_night_id,
      helper1_night_id: entity.helper1_night_id,
      helper2_night_id: entity.helper2_night_id,
      horometer_start_day: entity.horometer_start_day,
      horometer_start_night: entity.horometer_start_night,
      horometer_end_day: entity.horometer_end_day,
      horometer_end_night: entity.horometer_end_night,
      rpm_pull_down: entity.rpm_pull_down,
      rpm_rotation: entity.rpm_rotation,
      observations: entity.observations,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by_id: entity.created_by_id,
    }
  }

  /**
   * Map entity to list item DTO
   */
  static toListItemDto(entity: DrillingReportEntity): DrillingReportListItemDto {
    return {
      id: entity.id,
      report_number: entity.report_number,
      report_date: entity.report_date,
      shift: entity.shift,
      status: entity.status,
      project: {
        id: entity.project?.id || entity.project_id,
        name: entity.project?.name || '',
        code: entity.project?.code || '',
      },
      well: {
        id: entity.well?.id || entity.well_id,
        name: entity.well?.name || '',
        well_number: entity.well?.well_number || '',
      },
      equipment: entity.equipment
        ? {
          id: entity.equipment.id,
          name: entity.equipment.name,
          serial_number: entity.equipment.serial_number,
        }
        : undefined,
      personnel: {
        operator_day: entity.personnel?.operator_day
          ? {
            id: entity.personnel.operator_day.id,
            name: entity.personnel.operator_day.name,
          }
          : undefined,
        helper1_day: entity.personnel?.helper1_day
          ? {
            id: entity.personnel.helper1_day.id,
            name: entity.personnel.helper1_day.name,
          }
          : undefined,
        helper2_day: entity.personnel?.helper2_day
          ? {
            id: entity.personnel.helper2_day.id,
            name: entity.personnel.helper2_day.name,
          }
          : undefined,
        operator_night: entity.personnel?.operator_night
          ? {
            id: entity.personnel.operator_night.id,
            name: entity.personnel.operator_night.name,
          }
          : undefined,
        helper1_night: entity.personnel?.helper1_night
          ? {
            id: entity.personnel.helper1_night.id,
            name: entity.personnel.helper1_night.name,
          }
          : undefined,
        helper2_night: entity.personnel?.helper2_night
          ? {
            id: entity.personnel.helper2_night.id,
            name: entity.personnel.helper2_night.name,
          }
          : undefined,
      },
      totals: entity.totals || { hours_worked: 0, meters_drilled: 0 },
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    }
  }

  /**
   * Map entity to detail DTO
   */
  static toDetailDto(entity: DrillingReportEntity): DrillingReportDetailDto {
    return {
      ...this.toDto(entity),
      project: entity.project!,
      well: entity.well!,
      equipment: entity.equipment,
      personnel: entity.personnel!,
      activities: entity.activities || [],
      consumptions: entity.consumptions || [],
      tool_assignments: entity.tool_assignments || [],
      signatures: entity.signatures || [],
      totals: entity.totals || { hours_worked: 0, meters_drilled: 0 },
    }
  }

  /**
   * Map create DTO to entity data
   */
  static fromCreateDto(dto: CreateDrillingReportDto): Partial<DrillingReportEntity> {
    return {
      project_id: dto.project_id,
      well_id: dto.well_id,
      report_date: dto.report_date,
      shift: dto.shift,
      equipment_id: dto.equipment_id,
      operator_day_id: dto.operator_day_id,
      helper1_day_id: dto.helper1_day_id,
      helper2_day_id: dto.helper2_day_id,
      operator_night_id: dto.operator_night_id,
      helper1_night_id: dto.helper1_night_id,
      helper2_night_id: dto.helper2_night_id,
      horometer_start_day: dto.horometer_start_day,
      horometer_start_night: dto.horometer_start_night,
      rpm_pull_down: dto.rpm_pull_down,
      rpm_rotation: dto.rpm_rotation,
      observations: dto.observations,
    }
  }

  /**
   * Map update DTO to entity data
   */
  static fromUpdateDto(dto: UpdateDrillingReportDto): Partial<DrillingReportEntity> {
    return {
      ...(dto.project_id && { project_id: dto.project_id }),
      ...(dto.well_id && { well_id: dto.well_id }),
      ...(dto.report_date && { report_date: dto.report_date }),
      ...(dto.shift && { shift: dto.shift }),
      ...(dto.equipment_id !== undefined && { equipment_id: dto.equipment_id }),
      ...(dto.operator_day_id !== undefined && { operator_day_id: dto.operator_day_id }),
      ...(dto.helper1_day_id !== undefined && { helper1_day_id: dto.helper1_day_id }),
      ...(dto.helper2_day_id !== undefined && { helper2_day_id: dto.helper2_day_id }),
      ...(dto.operator_night_id !== undefined && { operator_night_id: dto.operator_night_id }),
      ...(dto.helper1_night_id !== undefined && { helper1_night_id: dto.helper1_night_id }),
      ...(dto.helper2_night_id !== undefined && { helper2_night_id: dto.helper2_night_id }),
      ...(dto.horometer_start_day !== undefined && { horometer_start_day: dto.horometer_start_day }),
      ...(dto.horometer_start_night !== undefined && { horometer_start_night: dto.horometer_start_night }),
      ...(dto.rpm_pull_down !== undefined && { rpm_pull_down: dto.rpm_pull_down }),
      ...(dto.rpm_rotation !== undefined && { rpm_rotation: dto.rpm_rotation }),
      ...(dto.observations !== undefined && { observations: dto.observations }),
    }
  }

  /**
   * Map activity entity to DTO
   */
  static activityToDto(entity: any): ActivityDto {
    return {
      id: entity.id,
      activity_type: entity.activity_type,
      shift: entity.shift,
      hours: entity.hours,
      start_time: entity.start_time,
      end_time: entity.end_time,
      description: entity.description,
    }
  }

  /**
   * Map create activity DTO to entity data
   */
  static fromCreateActivityDto(dto: CreateActivityDto): any {
    return {
      activity_type: dto.activity_type,
      shift: dto.shift,
      hours: dto.hours,
      start_time: dto.start_time,
      end_time: dto.end_time,
      description: dto.description,
    }
  }

  /**
   * Map consumption entity to DTO
   */
  static consumptionToDto(entity: any): ConsumptionDto {
    return {
      id: entity.id,
      consumable_type: entity.consumable_type,
      shift: entity.shift,
      quantity: entity.quantity,
      unit: entity.unit,
    }
  }

  /**
   * Map create consumption DTO to entity data
   */
  static fromCreateConsumptionDto(dto: CreateConsumptionDto): any {
    return {
      consumable_type: dto.consumable_type,
      shift: dto.shift,
      quantity: dto.quantity,
      unit: dto.unit,
    }
  }

  /**
   * Map tool assignment entity to DTO
   */
  static toolAssignmentToDto(entity: any): ToolAssignmentDto {
    return {
      id: entity.id,
      tool_id: entity.tool_id,
      shift: entity.shift,
      tool_category: entity.tool_category,
      start_depth_meters: entity.start_depth_meters,
      end_depth_meters: entity.end_depth_meters,
      meters_drilled: entity.meters_drilled,
      wear_pattern: entity.wear_pattern,
      matrix: entity.matrix,
      assigned_at: entity.assigned_at,
      tool: entity.tool,
    }
  }

  /**
   * Map create tool assignment DTO to entity data
   */
  static fromCreateToolAssignmentDto(dto: CreateToolAssignmentDto): any {
    return {
      tool_id: dto.tool_id,
      shift: dto.shift,
      tool_category: dto.tool_category,
      start_depth_meters: dto.start_depth_meters,
      end_depth_meters: dto.end_depth_meters,
      wear_pattern: dto.wear_pattern,
      matrix: dto.matrix,
    }
  }

  /**
   * Map signature entity to DTO
   */
  static signatureToDto(entity: any): SignatureDto {
    return {
      id: entity.id,
      signature_type: entity.signature_type,
      signatory_name: entity.signatory_name,
      signatory_user_id: entity.signatory_user_id,
      signature_method: entity.signature_method,
      signature_data: entity.signature_data,
      signed_at: entity.signed_at,
    }
  }

  /**
   * Map create signature DTO to entity data
   */
  static fromCreateSignatureDto(dto: CreateSignatureDto): any {
    return {
      signature_type: dto.signature_type,
      signature_method: dto.signature_method,
      signature_data: dto.signature_data,
    }
  }

  /**
   * Map complete report DTO to entity data
   */
  static fromCompleteDto(dto: CompleteReportDto): any {
    return {
      horometer_end_day: dto.horometer_end_day,
      horometer_end_night: dto.horometer_end_night,
    }
  }

  /**
   * Map reject report DTO to entity data
   */
  static fromRejectDto(dto: RejectReportDto): any {
    return {
      reason: dto.reason,
    }
  }
}
