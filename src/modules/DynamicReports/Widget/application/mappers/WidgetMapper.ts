import { Widget } from '../../domain/entities/Widget'
import type { WidgetResponseDto, WidgetListDto, WidgetCreateDto, WidgetUpdateDto } from '../dtos/WidgetDtos'
import { UniqueEntityID } from '../../../shared/domain/base/UniqueEntityID'

export class WidgetMapper {
  /**
   * Convierte una entidad Widget a DTO de respuesta
   */
  public static toDto(widget: Widget): WidgetResponseDto {
    return {
      id: widget.id,
      name: widget.name,
      description: widget.description,
      type: widget.type,
      data_source_id: widget.data_source_id,
      data_source_name: widget.data_source_name,
      query_config: widget.query_config,
      display_config: widget.display_config,
      refresh_interval: widget.refresh_interval,
      cache_enabled: widget.cache_enabled,
      cache_ttl: widget.cache_ttl,
      filters: widget.filters,
      transformations: widget.transformations,
      is_active: widget.is_active,
      created_by: widget.created_by,
      updated_by: widget.updated_by,
      created_at: widget.created_at?.toISOString(),
      updated_at: widget.updated_at?.toISOString(),
    }
  }

  /**
   * Convierte una entidad Widget a DTO de lista
   */
  public static toListDto(widget: Widget): WidgetListDto {
    return {
      id: widget.id,
      name: widget.name,
      description: widget.description,
      type: widget.type,
      data_source_id: widget.data_source_id,
      data_source_name: widget.data_source_name,
      is_active: widget.is_active,
      created_at: widget.created_at?.toISOString(),
      updated_at: widget.updated_at?.toISOString(),
    }
  }

  /**
   * Convierte datos del API a entidad de dominio
   */
  public static toDomain(raw: any): Widget {
    const widgetOrError = Widget.create(
      {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        type: raw.type,
        data_source_id: raw.data_source_id,
        data_source_name: raw.data_source_name,
        query_config: raw.query_config,
        display_config: raw.display_config,
        refresh_interval: raw.refresh_interval,
        cache_enabled: raw.cache_enabled,
        cache_ttl: raw.cache_ttl,
        filters: raw.filters || [],
        transformations: raw.transformations || [],
        is_active: raw.is_active,
        created_by: raw.created_by,
        updated_by: raw.updated_by,
        createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
        updatedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(),
      },
      new UniqueEntityID(raw.id),
    )

    return widgetOrError.isSuccess ? widgetOrError.getValue() : null
  }

  /**
   * Convierte DTO de creación a props para entidad
   */
  public static fromCreateDto(dto: WidgetCreateDto): any {
    return {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      data_source_id: dto.data_source_id,
      query_config: dto.query_config,
      display_config: dto.display_config,
      refresh_interval: dto.refresh_interval,
      cache_enabled: dto.cache_enabled,
      cache_ttl: dto.cache_ttl,
      filters: dto.filters || [],
      transformations: dto.transformations || [],
      is_active: dto.is_active !== undefined ? dto.is_active : true,
    }
  }

  /**
   * Convierte DTO de actualización a props para entidad
   */
  public static fromUpdateDto(dto: WidgetUpdateDto): Partial<any> {
    const props: any = {}

    if (dto.name !== undefined)
      props.name = dto.name
    if (dto.description !== undefined)
      props.description = dto.description
    if (dto.type !== undefined)
      props.type = dto.type
    if (dto.data_source_id !== undefined)
      props.data_source_id = dto.data_source_id
    if (dto.query_config !== undefined)
      props.query_config = dto.query_config
    if (dto.display_config !== undefined)
      props.display_config = dto.display_config
    if (dto.refresh_interval !== undefined)
      props.refresh_interval = dto.refresh_interval
    if (dto.cache_enabled !== undefined)
      props.cache_enabled = dto.cache_enabled
    if (dto.cache_ttl !== undefined)
      props.cache_ttl = dto.cache_ttl
    if (dto.filters !== undefined)
      props.filters = dto.filters
    if (dto.transformations !== undefined)
      props.transformations = dto.transformations
    if (dto.is_active !== undefined)
      props.is_active = dto.is_active

    return props
  }

  /**
   * Convierte entidad a objeto para persistencia
   */
  public static toPersistence(widget: Widget): any {
    return {
      id: widget.id,
      name: widget.name,
      description: widget.description,
      type: widget.type,
      data_source_id: widget.data_source_id,
      query_config: widget.query_config,
      display_config: widget.display_config,
      refresh_interval: widget.refresh_interval,
      cache_enabled: widget.cache_enabled,
      cache_ttl: widget.cache_ttl,
      filters: widget.filters,
      transformations: widget.transformations,
      is_active: widget.is_active,
      created_by: widget.created_by,
      updated_by: widget.updated_by,
      created_at: widget.created_at,
      updated_at: widget.updated_at,
    }
  }

  /**
   * Convierte múltiples entidades a DTOs de lista
   */
  public static toListDtoArray(widgets: Widget[]): WidgetListDto[] {
    return widgets.map(widget => this.toListDto(widget))
  }

  /**
   * Convierte múltiples datos del API a entidades
   */
  public static toDomainArray(rawArray: any[]): Widget[] {
    return rawArray
      .map(raw => this.toDomain(raw))
      .filter(Boolean) as Widget[]
  }
}
