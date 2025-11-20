import { AggregateRoot } from '../../../shared/domain/base/AggregateRoot'
import type { UniqueEntityID } from '../../../shared/domain/base/UniqueEntityID'
import { Result } from '../../../shared/domain/base/Result'
import { Guard } from '../../../shared/domain/base/Guard'
import { WidgetId } from '../valueObjects/WidgetId'
import { WidgetCreated } from '../events/WidgetCreated'
import { WidgetUpdated } from '../events/WidgetUpdated'
import { WidgetDeleted } from '../events/WidgetDeleted'
import type { WidgetTypeEnum } from '../enums/WidgetTypeEnum'
import type {
  DisplayConfig,
  QueryConfig,
  DataTransformation,
  WidgetFilter,
} from '../types/WidgetTypes'

export interface WidgetProps {
  id?: string
  name: string
  description?: string
  type: WidgetTypeEnum
  data_source_id: string
  data_source_name?: string
  query_config: QueryConfig
  display_config: DisplayConfig
  refresh_interval?: number
  cache_enabled?: boolean
  cache_ttl?: number
  filters?: WidgetFilter[]
  transformations?: DataTransformation[]
  is_active?: boolean
  created_by?: string
  updated_by?: string
  created_at?: Date
  updated_at?: Date
  createdAt?: Date
  updatedAt?: Date
}

export class Widget extends AggregateRoot<WidgetProps> {
  private constructor(props: WidgetProps, id?: UniqueEntityID) {
    super(props, id)
  }

  get widgetId(): WidgetId {
    return WidgetId.create(this.id)
  }

  public static create(props: WidgetProps, id?: UniqueEntityID): Result<Widget> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.name, argumentName: 'name' },
      { argument: props.type, argumentName: 'type' },
      { argument: props.data_source_id, argumentName: 'data_source_id' },
      { argument: props.query_config, argumentName: 'query_config' },
      { argument: props.display_config, argumentName: 'display_config' },
    ])

    if (!guardResult.succeeded)
      return Result.fail<Widget>(guardResult.message)

    const defaultProps: WidgetProps = {
      ...props,
      is_active: props.is_active !== undefined ? props.is_active : true,
      cache_enabled: props.cache_enabled !== undefined ? props.cache_enabled : true,
      cache_ttl: props.cache_ttl || 300,
      refresh_interval: props.refresh_interval || 0,
      filters: props.filters || [],
      transformations: props.transformations || [],
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    }

    const widget = new Widget(defaultProps, id)

    const isNew = !id
    if (isNew)
      widget.addDomainEvent(new WidgetCreated(widget))

    return Result.ok<Widget>(widget)
  }

  public update(props: Partial<WidgetProps>): Result<void> {
    const guardResult = Guard.againstNullOrUndefined(props, 'props')

    if (!guardResult.succeeded)
      return Result.fail<void>(guardResult.message)

    this.props.updatedAt = new Date()
    Object.assign(this.props, props)

    this.addDomainEvent(new WidgetUpdated(this))

    return Result.ok<void>()
  }

  public delete(): Result<void> {
    this.addDomainEvent(new WidgetDeleted(this))

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

  get type(): WidgetTypeEnum {
    return this.props.type
  }

  get data_source_id(): string {
    return this.props.data_source_id
  }

  get data_source_name(): string {
    return this.props.data_source_name
  }

  get query_config(): QueryConfig {
    return this.props.query_config
  }

  get display_config(): DisplayConfig {
    return this.props.display_config
  }

  get refresh_interval(): number {
    return this.props.refresh_interval
  }

  get cache_enabled(): boolean {
    return this.props.cache_enabled
  }

  get cache_ttl(): number {
    return this.props.cache_ttl
  }

  get filters(): WidgetFilter[] {
    return this.props.filters
  }

  get transformations(): DataTransformation[] {
    return this.props.transformations
  }

  get is_active(): boolean {
    return this.props.is_active
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
  public enableCache(ttl: number): Result<void> {
    this.props.cache_enabled = true
    this.props.cache_ttl = ttl
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public disableCache(): Result<void> {
    this.props.cache_enabled = false
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public setRefreshInterval(interval: number): Result<void> {
    if (interval < 0)
      return Result.fail<void>('Refresh interval must be positive')

    this.props.refresh_interval = interval
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public addFilter(filter: WidgetFilter): Result<void> {
    this.props.filters.push(filter)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public removeFilter(filterId: string): Result<void> {
    this.props.filters = this.props.filters.filter(f => f.id !== filterId)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public updateQueryConfig(config: Partial<QueryConfig>): Result<void> {
    Object.assign(this.props.query_config, config)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }

  public updateDisplayConfig(config: Partial<DisplayConfig>): Result<void> {
    Object.assign(this.props.display_config, config)
    this.props.updatedAt = new Date()

    return Result.ok<void>()
  }
}
