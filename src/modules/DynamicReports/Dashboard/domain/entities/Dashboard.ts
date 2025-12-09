import { AggregateRoot } from '../../../shared/domain/base/AggregateRoot'
import type { UniqueEntityID } from '../../../shared/domain/base/UniqueEntityID'
import { Result } from '../../../shared/domain/base/Result'
import { Guard } from '../../../shared/domain/base/Guard'
import { DashboardId } from '../valueObjects/DashboardId'
import { DashboardCreated } from '../events/DashboardCreated'
import { DashboardUpdated } from '../events/DashboardUpdated'
import { DashboardDeleted } from '../events/DashboardDeleted'
import { WidgetAdded } from '../events/WidgetAdded'
import { WidgetRemoved } from '../events/WidgetRemoved'
import type {
  AutoRefreshConfig,
  DashboardAction,
  DashboardCategory,
  DashboardExportConfig,
  DashboardGlobalFilter,
  DashboardLayout,
  DashboardPermission,
  DashboardShareConfig,
  DashboardTheme,
} from '../types/DashboardTypes'
import type { WidgetInstanceConfig } from '../../../Widget/domain/types/WidgetTypes'

export interface DashboardProps {
  id?: string
  name: string
  description?: string
  slug?: string
  layout: DashboardLayout
  widgets: WidgetInstanceConfig[]
  theme?: DashboardTheme
  is_public?: boolean
  is_shared?: boolean
  is_favorite?: boolean
  category_id?: string
  category?: DashboardCategory
  refresh_config?: AutoRefreshConfig
  permissions?: DashboardPermission[]
  global_filters?: DashboardGlobalFilter[]
  actions?: DashboardAction[]
  export_config?: DashboardExportConfig
  share_config?: DashboardShareConfig
  metadata?: Record<string, any>
  tags?: string[]
  view_count?: number
  last_viewed_at?: Date
  created_by?: string
  updated_by?: string
  created_at?: Date
  updated_at?: Date
  createdAt?: Date
  updatedAt?: Date
}

export class Dashboard extends AggregateRoot<DashboardProps> {
  private constructor(props: DashboardProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get dashboardId(): DashboardId {
    return DashboardId.create(this.id)
  }

  public static create(props: DashboardProps, id?: UniqueEntityID): Result<Dashboard> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.layout, argumentName: 'layout' },
    ])

    if (!guardResult.succeeded)
      return Result.fail<Dashboard>(guardResult.message)

    const defaultProps: DashboardProps = {
      ...props,
      widgets: props.widgets || [],
      is_public: props.is_public !== undefined ? props.is_public : false,
      is_shared: props.is_shared !== undefined ? props.is_shared : false,
      is_favorite: props.is_favorite !== undefined ? props.is_favorite : false,
      permissions: props.permissions || [],
      global_filters: props.global_filters || [],
      actions: props.actions || [],
      tags: props.tags || [],
      view_count: props.view_count || 0,
      metadata: props.metadata || {},
      slug: props.slug || props.name.toLowerCase().replace(/\s+/g, '-'),
      theme: props.theme || {
        mode: 'auto',
      },
      refresh_config: props.refresh_config || {
        enabled: false,
        interval: 60,
      },
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    }

    const dashboard = new Dashboard(defaultProps, id)

    const isNew = !id
    if (isNew)
      dashboard.addDomainEvent(new DashboardCreated(dashboard))

    return Result.ok<Dashboard>(dashboard)
  }

  public update(props: Partial<DashboardProps>): Result<void> {
    const guardResult = Guard.againstNullOrUndefined(props, 'props')

    if (!guardResult.succeeded)
      return Result.fail<void>(guardResult.message)

    this.props.updatedAt = new Date()
    Object.assign(this.props, props)

    this.addDomainEvent(new DashboardUpdated(this))

    return Result.ok<void>()
  }

  public delete(): Result<void> {
    this.addDomainEvent(new DashboardDeleted(this))

    return Result.ok<void>()
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string {
    return this.props.description
  }

  get slug(): string {
    return this.props.slug
  }

  get layout(): DashboardLayout {
    return this.props.layout
  }

  get widgets(): WidgetInstanceConfig[] {
    return this.props.widgets
  }

  get theme(): DashboardTheme {
    return this.props.theme
  }

  get is_public(): boolean {
    return this.props.is_public
  }

  get is_shared(): boolean {
    return this.props.is_shared
  }

  get is_favorite(): boolean {
    return this.props.is_favorite
  }

  get category_id(): string {
    return this.props.category_id
  }

  get category(): DashboardCategory {
    return this.props.category
  }

  get refresh_config(): AutoRefreshConfig {
    return this.props.refresh_config
  }

  get permissions(): DashboardPermission[] {
    return this.props.permissions
  }

  get global_filters(): DashboardGlobalFilter[] {
    return this.props.global_filters
  }

  get actions(): DashboardAction[] {
    return this.props.actions
  }

  get export_config(): DashboardExportConfig {
    return this.props.export_config
  }

  get share_config(): DashboardShareConfig {
    return this.props.share_config
  }

  get metadata(): Record<string, any> {
    return this.props.metadata
  }

  get tags(): string[] {
    return this.props.tags
  }

  get view_count(): number {
    return this.props.view_count
  }

  get last_viewed_at(): Date {
    return this.props.last_viewed_at
  }

  get created_by(): string {
    return this.props.created_by
  }

  get updated_by(): string {
    return this.props.updated_by
  }

  get created_at(): Date {
    return this.props.created_at
  }

  get updated_at(): Date {
    return this.props.updated_at
  }

  // Business Methods
  public addWidget(widget: WidgetInstanceConfig): Result<void> {
    // Validar que no haya solapamiento de posiciones
    const hasOverlap = this.checkPositionOverlap(widget.position)
    if (hasOverlap)
      return Result.fail<void>('Widget position overlaps with existing widget')

    this.props.widgets.push(widget)
    this.props.updatedAt = new Date()
    this.addDomainEvent(new WidgetAdded(this, widget))

    return Result.ok<void>()
  }

  public removeWidget(widgetId: string): Result<void> {
    const widgetIndex = this.props.widgets.findIndex(w => w.id === widgetId)

    if (widgetIndex === -1)
      return Result.fail<void>('Widget not found in dashboard')

    const removedWidget = this.props.widgets[widgetIndex]

    this.props.widgets.splice(widgetIndex, 1)
    this.props.updatedAt = new Date()
    this.addDomainEvent(new WidgetRemoved(this, removedWidget))

    return Result.ok<void>()
  }

  public updateWidgetPosition(widgetId: string, position: WidgetInstanceConfig['position']): Result<void> {
    const widget = this.props.widgets.find(w => w.id === widgetId)

    if (!widget)
      return Result.fail<void>('Widget not found in dashboard')

    widget.position = position
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public updateWidgetConfig(widgetId: string, config: Partial<WidgetInstanceConfig['config']>): Result<void> {
    const widget = this.props.widgets.find(w => w.id === widgetId)

    if (!widget)
      return Result.fail<void>('Widget not found in dashboard')

    Object.assign(widget.config, config)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public toggleFavorite(): Result<void> {
    this.props.is_favorite = !this.props.is_favorite
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public incrementViewCount(): Result<void> {
    this.props.view_count = (this.props.view_count || 0) + 1
    this.props.last_viewed_at = new Date()

    return Result.ok<void>()
  }

  public addGlobalFilter(filter: DashboardGlobalFilter): Result<void> {
    this.props.global_filters.push(filter)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public removeGlobalFilter(filterId: string): Result<void> {
    this.props.global_filters = this.props.global_filters.filter(f => f.id !== filterId)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public enableAutoRefresh(interval: number): Result<void> {
    if (interval < 5)
      return Result.fail<void>('Refresh interval must be at least 5 seconds')

    this.props.refresh_config = {
      enabled: true,
      interval,
    }
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public disableAutoRefresh(): Result<void> {
    this.props.refresh_config.enabled = false
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  // Helper methods
  private checkPositionOverlap(newPosition: WidgetInstanceConfig['position']): boolean {
    return this.props.widgets.some(widget => {
      const pos = widget.position

      // Check if rectangles overlap
      return !(
        newPosition.x >= pos.x + pos.w
        || newPosition.x + newPosition.w <= pos.x
        || newPosition.y >= pos.y + pos.h
        || newPosition.y + newPosition.h <= pos.y
      )
    })
  }

  public clone(newName: string): Result<Dashboard> {
    const clonedProps: DashboardProps = {
      ...this.props,
      id: undefined, // New ID will be generated
      name: newName,
      slug: newName.toLowerCase().replace(/\s+/g, '-'),
      view_count: 0,
      is_favorite: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    return Dashboard.create(clonedProps)
  }
}
