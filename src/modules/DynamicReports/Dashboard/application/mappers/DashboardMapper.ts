import { Dashboard } from '../../domain/entities/Dashboard'
import type { DashboardCreateDto, DashboardListDto, DashboardResponseDto, DashboardUpdateDto } from '../dtos/DashboardDtos'
import { UniqueEntityID } from '../../../shared/domain/base/UniqueEntityID'

export class DashboardMapper {
  /**
   * Convierte una entidad Dashboard a DTO de respuesta
   */
  public static toDto(dashboard: Dashboard): DashboardResponseDto {
    return {
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      slug: dashboard.slug,
      layout: dashboard.layout,
      widgets: dashboard.widgets,
      theme: dashboard.theme,
      is_public: dashboard.is_public,
      is_shared: dashboard.is_shared,
      is_favorite: dashboard.is_favorite,
      category_id: dashboard.category_id,
      category: dashboard.category,
      refresh_config: dashboard.refresh_config,
      permissions: dashboard.permissions,
      global_filters: dashboard.global_filters,
      actions: dashboard.actions,
      export_config: dashboard.export_config,
      share_config: dashboard.share_config,
      metadata: dashboard.metadata,
      tags: dashboard.tags,
      view_count: dashboard.view_count,
      last_viewed_at: dashboard.last_viewed_at?.toISOString(),
      created_by: dashboard.created_by,
      updated_by: dashboard.updated_by,
      created_at: dashboard.created_at?.toISOString(),
      updated_at: dashboard.updated_at?.toISOString(),
    }
  }

  /**
   * Convierte una entidad Dashboard a DTO de lista
   */
  public static toListDto(dashboard: Dashboard): DashboardListDto {
    return {
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      slug: dashboard.slug,
      is_public: dashboard.is_public,
      is_shared: dashboard.is_shared,
      is_favorite: dashboard.is_favorite,
      category_id: dashboard.category_id,
      category: dashboard.category,
      widget_count: dashboard.widgets?.length || 0,
      tags: dashboard.tags,
      view_count: dashboard.view_count,
      last_viewed_at: dashboard.last_viewed_at?.toISOString(),
      created_by: dashboard.created_by,
      created_at: dashboard.created_at?.toISOString(),
      updated_at: dashboard.updated_at?.toISOString(),
    }
  }

  /**
   * Convierte datos del API a entidad de dominio
   */
  public static toDomain(raw: any): Dashboard {
    const dashboardOrError = Dashboard.create(
      {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        slug: raw.slug,
        layout: raw.layout,
        widgets: raw.widgets || [],
        theme: raw.theme,
        is_public: raw.is_public,
        is_shared: raw.is_shared,
        is_favorite: raw.is_favorite,
        category_id: raw.category_id,
        category: raw.category,
        refresh_config: raw.refresh_config,
        permissions: raw.permissions || [],
        global_filters: raw.global_filters || [],
        actions: raw.actions || [],
        export_config: raw.export_config,
        share_config: raw.share_config,
        metadata: raw.metadata || {},
        tags: raw.tags || [],
        view_count: raw.view_count || 0,
        last_viewed_at: raw.last_viewed_at ? new Date(raw.last_viewed_at) : undefined,
        created_by: raw.created_by,
        updated_by: raw.updated_by,
        createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
        updatedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(),
      },
      new UniqueEntityID(raw.id),
    )

    return dashboardOrError.isSuccess ? dashboardOrError.getValue() : null
  }

  /**
   * Convierte DTO de creación a props para entidad
   */
  public static fromCreateDto(dto: DashboardCreateDto): any {
    return {
      name: dto.name,
      description: dto.description,
      layout: dto.layout,
      widgets: dto.widgets || [],
      theme: dto.theme,
      is_public: dto.is_public !== undefined ? dto.is_public : false,
      category_id: dto.category_id,
      refresh_config: dto.refresh_config,
      permissions: dto.permissions || [],
      global_filters: dto.global_filters || [],
      actions: dto.actions || [],
      export_config: dto.export_config,
      share_config: dto.share_config,
      metadata: dto.metadata || {},
      tags: dto.tags || [],
    }
  }

  /**
   * Convierte DTO de actualización a props para entidad
   */
  public static fromUpdateDto(dto: DashboardUpdateDto): Partial<any> {
    const props: any = {}

    if (dto.name !== undefined)
      props.name = dto.name
    if (dto.description !== undefined)
      props.description = dto.description
    if (dto.slug !== undefined)
      props.slug = dto.slug
    if (dto.layout !== undefined)
      props.layout = dto.layout
    if (dto.widgets !== undefined)
      props.widgets = dto.widgets
    if (dto.theme !== undefined)
      props.theme = dto.theme
    if (dto.is_public !== undefined)
      props.is_public = dto.is_public
    if (dto.is_shared !== undefined)
      props.is_shared = dto.is_shared
    if (dto.is_favorite !== undefined)
      props.is_favorite = dto.is_favorite
    if (dto.category_id !== undefined)
      props.category_id = dto.category_id
    if (dto.refresh_config !== undefined)
      props.refresh_config = dto.refresh_config
    if (dto.permissions !== undefined)
      props.permissions = dto.permissions
    if (dto.global_filters !== undefined)
      props.global_filters = dto.global_filters
    if (dto.actions !== undefined)
      props.actions = dto.actions
    if (dto.export_config !== undefined)
      props.export_config = dto.export_config
    if (dto.share_config !== undefined)
      props.share_config = dto.share_config
    if (dto.metadata !== undefined)
      props.metadata = dto.metadata
    if (dto.tags !== undefined)
      props.tags = dto.tags

    return props
  }

  /**
   * Convierte entidad a objeto para persistencia
   */
  public static toPersistence(dashboard: Dashboard): any {
    return {
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
      slug: dashboard.slug,
      layout: dashboard.layout,
      widgets: dashboard.widgets,
      theme: dashboard.theme,
      is_public: dashboard.is_public,
      is_shared: dashboard.is_shared,
      is_favorite: dashboard.is_favorite,
      category_id: dashboard.category_id,
      refresh_config: dashboard.refresh_config,
      permissions: dashboard.permissions,
      global_filters: dashboard.global_filters,
      actions: dashboard.actions,
      export_config: dashboard.export_config,
      share_config: dashboard.share_config,
      metadata: dashboard.metadata,
      tags: dashboard.tags,
      view_count: dashboard.view_count,
      last_viewed_at: dashboard.last_viewed_at,
      created_by: dashboard.created_by,
      updated_by: dashboard.updated_by,
      created_at: dashboard.created_at,
      updated_at: dashboard.updated_at,
    }
  }

  /**
   * Convierte múltiples entidades a DTOs de lista
   */
  public static toListDtoArray(dashboards: Dashboard[]): DashboardListDto[] {
    return dashboards.map(dashboard => this.toListDto(dashboard))
  }

  /**
   * Convierte múltiples datos del API a entidades
   */
  public static toDomainArray(rawArray: any[]): Dashboard[] {
    return rawArray
      .map(raw => this.toDomain(raw))
      .filter(Boolean) as Dashboard[]
  }
}
