#!/usr/bin/env python3
"""
Enhanced DDD Module Generator for TypeScript/Vue
Generates complete, functional, plug-and-play modules following Domain-Driven Design principles
Version: 2.0.0
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import re


@dataclass
class EntityProperty:
    """Represents a property of an entity"""
    name: str
    type: str
    required: bool = False
    primary: bool = False
    generated: bool = False
    encrypted: bool = False
    default: Any = None
    values: List[str] = field(default_factory=list)
    
    def to_typescript_type(self) -> str:
        """Convert property type to TypeScript type"""
        type_map = {
            'string': 'string',
            'text': 'string',
            'uuid': 'string',
            'integer': 'number',
            'number': 'number',
            'boolean': 'boolean',
            'datetime': 'Date',
            'date': 'Date',
            'json': 'Record<string, any>',
            'enum': self._enum_type()
        }
        return type_map.get(self.type, 'any')
    
    def _enum_type(self) -> str:
        """Generate enum type string"""
        if self.values:
            return ' | '.join(f"'{v}'" for v in self.values)
        return 'string'
    
    def to_optional_suffix(self) -> str:
        """Return ? if property is optional"""
        return '?' if not self.required and not self.primary else ''


class ModuleGenerator:
    """Enhanced generator class for DDD modules"""
    
    def __init__(self, spec: Dict[str, Any]):
        self.spec = spec
        self.module_name = spec['moduleName']
        self.module_name_lower = self._to_camel_case(self.module_name)
        self.module_name_kebab = self._to_kebab_case(self.module_name)
        self.entities = spec.get('entities', {})
        self.relationships = spec.get('relationships', {})
        self.features = spec.get('features', {})
        self.stores = spec.get('stores', {})
        self.composables = spec.get('composables', {})
        self.permissions = spec.get('permissions', {})
        self.ui = spec.get('ui', {})
        self.routing = spec.get('routing', {})
        
    def _to_kebab_case(self, text: str) -> str:
        """Convert PascalCase to kebab-case"""
        result = []
        for i, char in enumerate(text):
            if char.isupper() and i > 0:
                result.append('-')
            result.append(char.lower())
        return ''.join(result)
    
    def _to_camel_case(self, text: str) -> str:
        """Convert to camelCase"""
        if not text:
            return ''
        return text[0].lower() + text[1:]
    
    def _to_snake_case(self, text: str) -> str:
        """Convert to snake_case"""
        result = []
        for i, char in enumerate(text):
            if char.isupper() and i > 0:
                result.append('_')
            result.append(char.lower())
        return ''.join(result)
    
    def _to_pascal_case(self, text: str) -> str:
        """Convert to PascalCase"""
        return ''.join(word.capitalize() for word in re.split('[-_]', text))
    
    def generate(self, output_dir: str):
        """Generate complete module structure"""
        # Crear el módulo directamente en src/modules/
        module_dir = Path(output_dir).parent / 'src' / 'modules' / self.module_name
        module_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n🚀 Generating {self.module_name} module...")
        print(f"   Output directory: {output_dir}")
        print(f"   Entities: {', '.join(self.entities.keys())}\n")
        
        # Create module directory structure
        self._create_module_directory_structure(module_dir)
        
        # Generate shared module infrastructure first
        print("📦 Generating shared infrastructure...")
        self._generate_shared_domain_base(module_dir)
        self._generate_module_types(module_dir)
        self._generate_shared_composables(module_dir)
        self._generate_shared_components(module_dir)
        
        # Generate entities
        entity_names = list(self.entities.keys())
        for entity_name, entity_spec in self.entities.items():
            print(f"\n📁 Generating {entity_name} entity...")
            entity_dir = module_dir / entity_name
            self._create_entity_directory_structure(entity_dir)
            self._generate_entity_files(entity_dir, entity_name, entity_spec)
            self._generate_entity_index(entity_dir, entity_name)
        
        # Generate module-level files
        print("\n🔧 Generating module configuration...")
        self._generate_module_routes(module_dir)
        self._generate_module_menu(module_dir)
        # self._generate_module_config(module_dir)  # TODO: Implement module config generation
        self._generate_module_container(module_dir)
        self._generate_shared_stores(module_dir)
        self._generate_indexed_db_config(module_dir)
        self._generate_module_index(module_dir, entity_names)
        self._generate_module_readme(module_dir)
        self._generate_auto_installer(module_dir)
        self._generate_module_locales(module_dir)
        
        print(f"\n✅ Module {self.module_name} generated successfully!")
        print(f"\n🚀 AUTO-INSTALLATION READY!")
        print(f"\n📦 Plug-and-Play Installation:")
        print(f"   1. Module created directly in src/modules/{self.module_name}/")
        print(f"   2. Auto-install in your main.ts:")
        print(f"      import {{ install{self.module_name}Module }} from './modules/{self.module_name}/installer'")
        print(f"      install{self.module_name}Module()")
        print(f"   3. Or use as a plugin:")
        print(f"      import {self.module_name}Module from './modules/{self.module_name}/installer'")
        print(f"      app.use({self.module_name}Module)")
        print(f"\n📚 Manual Installation (if needed):")
        print(f"   1. Review the generated code")
        print(f"   2. Add routes: import {{ {self.module_name}Routes }} from './modules/{self.module_name}/config/routes'")
        print(f"   3. Add menu: import {{ {self.module_name}Menu }} from './modules/{self.module_name}/config/menu'")
        print(f"   4. Configure API endpoints in services/endpoints.ts")
        print(f"   5. Add translations for the module")
        print(f"   6. Test the module functionality")
        print(f"\n🔧 Configuration:")
        print(f"   - Set VUE_APP_{self.module_name.upper()}_API_BASE_URL for API endpoint")
        print(f"   - Set VUE_APP_{self.module_name.upper()}_ENABLED to enable/disable module")
        print(f"\n📖 Check INSTALLATION.md for detailed instructions")

        # ... después de generar el módulo y mostrar los mensajes finales ...
        self._generate_auto_plugin(output_dir)

    def _create_module_directory_structure(self, module_dir: Path):
        """Create module-level directory structure"""
        directories = [
            'shared/domain',
            'shared/domain/base',
            'shared/domain/events',
            'shared/domain/exceptions',
            'shared/application',
            'shared/infrastructure',
            'shared/composables',
            'shared/stores',
            'shared/types',
            'shared/utils',
            'shared/constants',
            'shared/components/layout',
            'shared/components/common',
            'config',
            'tests/integration',
            'docs'
        ]
        for dir_path in directories:
            (module_dir / dir_path).mkdir(parents=True, exist_ok=True)

    def _create_entity_directory_structure(self, entity_dir: Path):
        """Create entity-level directory structure"""
        directories = [
            # Domain layer
            'domain/entities',
            'domain/valueObjects',
            'domain/events',
            'domain/exceptions',
            'domain/specifications',
            'domain/contracts/repositories',
            'domain/contracts/services',
            'domain/types',
            
            # Application layer
            'application/commands',
            'application/queries',
            'application/handlers',
            'application/dtos',
            'application/mappers',
            'application/services',
            'application/useCases',
            
            # Infrastructure layer
            'infrastructure/api/services',
            'infrastructure/api/transformers',
            'infrastructure/persistence/repositories',
            'infrastructure/persistence/models',
            
            # Presentation layer
            'presentation/views',
            'presentation/components/organisms',
            'presentation/components/molecules',
            'presentation/components/atoms',
            'presentation/composables',
            'presentation/stores',
            'presentation/validators',
            
            # Tests
            'tests/unit/domain',
            'tests/unit/application',
            'tests/integration',
        ]
        for dir_path in directories:
            (entity_dir / dir_path).mkdir(parents=True, exist_ok=True)

    def _write_file(self, file_path: Path, content: str):
        """Write content to file with proper formatting"""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Add file header based on extension
        if file_path.suffix == '.ts':
            header = f"// Generated by DDD Module Generator on {datetime.now().strftime('%Y-%m-%d')}\n\n"
            content = header + content
        elif file_path.suffix == '.vue':
            content = f"<!-- Generated by DDD Module Generator on {datetime.now().strftime('%Y-%m-%d')} -->\n" + content
        
        file_path.write_text(content, encoding='utf-8')
        print(f"  ✓ Generated: {file_path.relative_to(file_path.parent.parent.parent)}")

    # Métodos auxiliares
    def _get_ts_type(self, prop_config: Dict) -> str:
        """Get TypeScript type for property configuration"""
        prop = EntityProperty(
            name='',
            type=prop_config.get('type', 'string'),
            values=prop_config.get('values', [])
        )
        return prop.to_typescript_type()

    def _generate_guard_checks(self, properties: Dict) -> str:
        """Generate guard checks for required properties"""
        checks = []
        for prop_name, prop_config in properties.items():
            if prop_config.get('required') and not prop_config.get('generated'):
                checks.append(f"      {{ argument: props.{prop_name}, argumentName: '{prop_name}' }}")
        return ',\n'.join(checks)

    def _generate_business_methods(self, entity_name: str) -> str:
        """Generate business methods based on entity relationships"""
        methods = []
        relationships = self.relationships.get(entity_name, {})
        
        if 'hasMany' in relationships:
            for related in relationships['hasMany']:
                methods.append(f'''  add{related}(item: any): Result<void> {{
    // Business logic for adding {related}
    return Result.ok<void>()
  }}''')
        
        return '\n\n'.join(methods) if methods else '  // Add business methods here'

    def _generate_yup_schema(self, entity_spec: Dict, mode: str) -> str:
        """Generate Yup validation schema"""
        fields = []
        for prop_name, prop_config in entity_spec.get('properties', {}).items():
            if prop_config.get('generated') or prop_config.get('primary'):
                continue
            
            field_type = prop_config.get('type', 'string')
            required = prop_config.get('required', False) if mode == 'create' else False
            
            validations = []
            
            if field_type == 'string' or field_type == 'text':
                validations.append('yup.string()')
            elif field_type in ['integer', 'number']:
                validations.append('yup.number()')
            elif field_type == 'boolean':
                validations.append('yup.boolean()')
            elif field_type in ['datetime', 'date']:
                validations.append('yup.date()')
            elif field_type == 'enum' and prop_config.get('values'):
                validations.append(f"yup.string().oneOf({json.dumps(prop_config['values'])})")
            else:
                validations.append('yup.mixed()')
            
            if required:
                validations.append(f".required('{prop_name} is required')")
            
            fields.append(f"  {prop_name}: {''.join(validations)}")
        
        return ',\n'.join(fields)

    def _get_main_property(self, properties: Dict) -> str:
        """Get main display property for entity"""
        for prop in ['name', 'title', 'label', 'description']:
            if prop in properties:
                return prop
        for prop_name, prop_config in properties.items():
            if prop_config.get('type') == 'string' and not prop_config.get('generated'):
                return prop_name
        return 'id'

    def _generate_dashboard_cards(self) -> str:
        """Generate dashboard cards for entities"""
        cards = []
        for entity_name in self.entities.keys():
            cards.append(f'''      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span class="text-white font-medium">{entity_name[0]}</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  {entity_name}s
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  <router-link :to="{{ name: '{entity_name}List' }}" class="text-blue-600 hover:text-blue-900">
                    Manage {entity_name}s
                  </router-link>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>''')
        return '\n'.join(cards)

    def _generate_dto_mapping(self, entity_spec: Dict, entity_name: str) -> str:
        """Generate DTO mapping fields"""
        fields = []
        for prop_name in entity_spec.get('properties', {}).keys():
            if prop_name not in ['id', 'createdAt', 'updatedAt']:
                fields.append(f"      {prop_name}: {self._to_camel_case(entity_name)}.props.{prop_name},")
        return '\n'.join(fields)

    def _generate_domain_mapping(self, entity_spec: Dict) -> str:
        """Generate domain mapping fields"""
        fields = []
        for prop_name in entity_spec.get('properties', {}).keys():
            if prop_name not in ['id', 'createdAt', 'updatedAt']:
                fields.append(f"        {prop_name}: raw.{prop_name},")
        return '\n'.join(fields)

    def _generate_persistence_mapping(self, entity_spec: Dict, entity_name: str) -> str:
        """Generate persistence mapping fields"""
        fields = []
        for prop_name in entity_spec.get('properties', {}).keys():
            if prop_name not in ['id', 'createdAt', 'updatedAt']:
                fields.append(f"      {prop_name}: {self._to_camel_case(entity_name)}.props.{prop_name},")
        return '\n'.join(fields)

    def _generate_shared_domain_base(self, module_dir: Path):
        """Generate shared domain base classes"""
        
        # AggregateRoot base class
        aggregate_root_content = '''import { Entity } from './Entity'
import { DomainEvent } from './DomainEvent'
import { UniqueEntityID } from './UniqueEntityID'

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = []

  get id(): UniqueEntityID {
    return this._id
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
    this.markModified()
  }

  public clearEvents(): void {
    this._domainEvents = []
  }

  private markModified(): void {
    // Mark aggregate as modified
  }
}
'''
        self._write_file(module_dir / 'shared/domain/base/AggregateRoot.ts', aggregate_root_content)
        
        # Entity base class
        entity_content = '''import { UniqueEntityID } from './UniqueEntityID'

const isEntity = (v: any): v is Entity<any> => {
  return v instanceof Entity
}

export abstract class Entity<T> {
  protected readonly _id: UniqueEntityID
  public readonly props: T

  constructor(props: T, id?: UniqueEntityID) {
    this._id = id ? id : new UniqueEntityID()
    this.props = props
  }

  public equals(object?: Entity<T>): boolean {
    if (object == null || object == undefined) {
      return false
    }

    if (this === object) {
      return true
    }

    if (!isEntity(object)) {
      return false
    }

    return this._id.equals(object._id)
  }
}
'''
        self._write_file(module_dir / 'shared/domain/base/Entity.ts', entity_content)
        
        # ValueObject base class
        value_object_content = '''interface ValueObjectProps {
  [index: string]: any
}

export abstract class ValueObject<T extends ValueObjectProps> {
  public readonly props: T

  constructor(props: T) {
    this.props = Object.freeze(props)
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false
    }
    if (vo.props === undefined) {
      return false
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props)
  }
}
'''
        self._write_file(module_dir / 'shared/domain/base/ValueObject.ts', value_object_content)
        
        # Result class
        result_content = '''export class Result<T> {
  public isSuccess: boolean
  public isFailure: boolean
  public error: T | string
  private _value: T

  public constructor(isSuccess: boolean, error?: T | string, value?: T) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error')
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message')
    }

    this.isSuccess = isSuccess
    this.isFailure = !isSuccess
    this.error = error
    this._value = value

    Object.freeze(this)
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Can\'t get the value of an error result. Use \'errorValue\' instead.')
    }

    return this._value
  }

  public errorValue(): T {
    return this.error as T
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value)
  }

  public static fail<U>(error: any): Result<U> {
    return new Result<U>(false, error)
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (let result of results) {
      if (result.isFailure) return result
    }
    return Result.ok()
  }
}
'''
        self._write_file(module_dir / 'shared/domain/base/Result.ts', result_content)
        
        # UniqueEntityID
        unique_id_content = '''import { v4 as uuidv4 } from 'uuid'

export class UniqueEntityID {
  private value: string

  constructor(id?: string) {
    this.value = id ? id : uuidv4()
  }

  equals(id?: UniqueEntityID): boolean {
    if (id === null || id === undefined) {
      return false
    }
    if (!(id instanceof this.constructor)) {
      return false
    }
    return id.toValue() === this.value
  }

  toString(): string {
    return String(this.value)
  }

  toValue(): string {
    return this.value
  }
}
'''
        self._write_file(module_dir / 'shared/domain/base/UniqueEntityID.ts', unique_id_content)
        
        # DomainEvent base
        domain_event_content = '''export interface IDomainEvent {
  dateTimeOccurred: Date
  getAggregateId(): string
}

export abstract class DomainEvent implements IDomainEvent {
  public dateTimeOccurred: Date
  public aggregateId: string

  constructor(aggregateId: string) {
    this.dateTimeOccurred = new Date()
    this.aggregateId = aggregateId
  }

  getAggregateId(): string {
    return this.aggregateId
  }
}
'''
        self._write_file(module_dir / 'shared/domain/base/DomainEvent.ts', domain_event_content)
        
        # Guard utility
        guard_content = '''export interface IGuardResult {
  succeeded: boolean
  message?: string
}

export interface IGuardArgument {
  argument: any
  argumentName: string
}

export type GuardArgumentCollection = IGuardArgument[]

export class Guard {
  public static combine(guardResults: IGuardResult[]): IGuardResult {
    for (let result of guardResults) {
      if (result.succeeded === false) return result
    }

    return { succeeded: true }
  }

  public static againstNullOrUndefined(argument: any, argumentName: string): IGuardResult {
    if (argument === null || argument === undefined) {
      return { succeeded: false, message: `${argumentName} is null or undefined` }
    } else {
      return { succeeded: true }
    }
  }

  public static againstNullOrUndefinedBulk(args: GuardArgumentCollection): IGuardResult {
    for (let arg of args) {
      const result = this.againstNullOrUndefined(arg.argument, arg.argumentName)
      if (!result.succeeded) return result
    }

    return { succeeded: true }
  }

  public static againstAtLeast(numChars: number, text: string): IGuardResult {
    return text.length >= numChars
      ? { succeeded: true }
      : { succeeded: false, message: `Text is not at least ${numChars} chars.` }
  }

  public static againstAtMost(numChars: number, text: string): IGuardResult {
    return text.length <= numChars
      ? { succeeded: true }
      : { succeeded: false, message: `Text is greater than ${numChars} chars.` }
  }
}
'''
        self._write_file(module_dir / 'shared/domain/base/Guard.ts', guard_content)

    def _generate_entity_files(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate all files for a specific entity"""
        # Domain layer
        self._generate_entity_class(entity_dir, entity_name, entity_spec)
        self._generate_value_objects(entity_dir, entity_name, entity_spec)
        self._generate_repository_interface(entity_dir, entity_name)
        self._generate_domain_events(entity_dir, entity_name)
        self._generate_exceptions(entity_dir, entity_name)
        self._generate_specifications(entity_dir, entity_name)
        
        # Application layer
        self._generate_commands(entity_dir, entity_name, entity_spec)
        self._generate_queries(entity_dir, entity_name)
        self._generate_handlers(entity_dir, entity_name, entity_spec)
        self._generate_dtos(entity_dir, entity_name, entity_spec)
        self._generate_mapper(entity_dir, entity_name, entity_spec)
        self._generate_use_cases(entity_dir, entity_name)
        
        # Infrastructure layer
        self._generate_repository_impl(entity_dir, entity_name, entity_spec)
        self._generate_api_service(entity_dir, entity_name)
        self._generate_api_transformer(entity_dir, entity_name, entity_spec)
        
        # Presentation layer
        self._generate_views(entity_dir, entity_name)
        self._generate_components(entity_dir, entity_name, entity_spec)
        self._generate_store(entity_dir, entity_name, entity_spec)
        self._generate_composables(entity_dir, entity_name)
        self._generate_validators(entity_dir, entity_name, entity_spec)
        
        # Tests
        # self._generate_entity_tests(entity_dir, entity_name)  # TODO: Implement test generation

    def _generate_entity_class(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate domain entity class with proper DDD structure"""
        properties = entity_spec.get('properties', {})
        
        # Generate property interfaces
        props_lines = []
        for prop_name, prop_config in properties.items():
            prop = EntityProperty(
                name=prop_name,
                type=prop_config.get('type', 'string'),
                required=prop_config.get('required', False),
                values=prop_config.get('values', [])
            )
            props_lines.append(f"  {prop.name}{prop.to_optional_suffix()}: {prop.to_typescript_type()}")
        
        # Generate getter methods
        getter_lines = []
        for prop_name in properties.keys():
            getter_lines.append(f"  get {prop_name}(): {self._get_ts_type(properties[prop_name])} {{\n    return this.props.{prop_name}\n  }}")
        
        # Generate business methods based on relationships
        business_methods = self._generate_business_methods(entity_name)
        
        content = f'''import {{ AggregateRoot }} from '../../../shared/domain/base/AggregateRoot'
import {{ UniqueEntityID }} from '../../../shared/domain/base/UniqueEntityID'
import {{ Result }} from '../../../shared/domain/base/Result'
import {{ Guard }} from '../../../shared/domain/base/Guard'
import {{ {entity_name}Id }} from '../valueObjects/{entity_name}Id'
import {{ {entity_name}Created }} from '../events/{entity_name}Created'
import {{ {entity_name}Updated }} from '../events/{entity_name}Updated'
import {{ {entity_name}Deleted }} from '../events/{entity_name}Deleted'

export interface {entity_name}Props {{
{chr(10).join(props_lines)}
}}

export class {entity_name} extends AggregateRoot<{entity_name}Props> {{
  private constructor(props: {entity_name}Props, id?: UniqueEntityID) {{
    super(props, id)
  }}

  get {self._to_camel_case(entity_name)}Id(): {entity_name}Id {{
    return {entity_name}Id.create(this.id)
  }}

  public static create(props: {entity_name}Props, id?: UniqueEntityID): Result<{entity_name}> {{
    const guardResult = Guard.againstNullOrUndefinedBulk([
{self._generate_guard_checks(properties)}
    ])

    if (!guardResult.succeeded) {{
      return Result.fail<{entity_name}>(guardResult.message)
    }}

    const {self._to_camel_case(entity_name)} = new {entity_name}({{
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    }}, id)

    const isNew = !id
    if (isNew) {{
      {self._to_camel_case(entity_name)}.addDomainEvent(new {entity_name}Created({self._to_camel_case(entity_name)}))
    }}

    return Result.ok<{entity_name}>({self._to_camel_case(entity_name)})
  }}

  public update(props: Partial<{entity_name}Props>): Result<void> {{
    const guardResult = Guard.againstNullOrUndefined(props, 'props')
    
    if (!guardResult.succeeded) {{
      return Result.fail<void>(guardResult.message)
    }}

    this.props.updatedAt = new Date()
    Object.assign(this.props, props)
    
    this.addDomainEvent(new {entity_name}Updated(this))
    
    return Result.ok<void>()
  }}

  public delete(): Result<void> {{
    this.addDomainEvent(new {entity_name}Deleted(this))
    return Result.ok<void>()
  }}

  // Getters
{chr(10).join(getter_lines)}

  // Business Methods
{business_methods}
}}
'''
        
        self._write_file(
            entity_dir / 'domain' / 'entities' / f'{entity_name}.ts',
            content
        )

    def _generate_value_objects(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate value objects for entity"""
        # Generate ID value object
        id_content = f'''import {{ ValueObject }} from '../../../shared/domain/base/ValueObject'
import {{ Result }} from '../../../shared/domain/base/Result'
import {{ Guard }} from '../../../shared/domain/base/Guard'
import {{ UniqueEntityID }} from '../../../shared/domain/base/UniqueEntityID'

interface {entity_name}IdProps {{
  value: string
}}

export class {entity_name}Id extends ValueObject<{entity_name}IdProps> {{
  get value(): string {{
    return this.props.value
  }}

  private constructor(props: {entity_name}IdProps) {{
    super(props)
  }}

  public static create(id: UniqueEntityID | string): {entity_name}Id {{
    const idValue = id instanceof UniqueEntityID ? id.toString() : id
    return new {entity_name}Id({{ value: idValue }})
  }}

  public static createUnique(): {entity_name}Id {{
    return new {entity_name}Id({{ value: new UniqueEntityID().toString() }})
  }}
}}
'''
        self._write_file(
            entity_dir / 'domain' / 'valueObjects' / f'{entity_name}Id.ts',
            id_content
        )

    def _generate_repository_interface(self, entity_dir: Path, entity_name: str):
        """Generate repository interface with proper DDD patterns"""
        content = f'''import {{ {entity_name} }} from '../entities/{entity_name}'
import {{ {entity_name}Id }} from '../valueObjects/{entity_name}Id'

export interface {entity_name}Repository {{
  exists({self._to_camel_case(entity_name)}Id: {entity_name}Id): Promise<boolean>
  get{entity_name}ById({self._to_camel_case(entity_name)}Id: {entity_name}Id): Promise<{entity_name}>
  save({self._to_camel_case(entity_name)}: {entity_name}): Promise<void>
  delete({self._to_camel_case(entity_name)}Id: {entity_name}Id): Promise<void>
  getAll(): Promise<{entity_name}[]>
  getAllPaginated(page: number, limit: number): Promise<{{
    {self._to_camel_case(entity_name)}s: {entity_name}[]
    totalPages: number
    total: number
  }}>
}}
'''
        
        self._write_file(
            entity_dir / 'domain' / 'contracts' / 'repositories' / f'{entity_name}Repository.ts',
            content
        )

    def _generate_domain_events(self, entity_dir: Path, entity_name: str):
        """Generate domain events following DDD patterns"""
        events = {
            'Created': f'''import {{ DomainEvent }} from '../../../shared/domain/base/DomainEvent'
import {{ UniqueEntityID }} from '../../../shared/domain/base/UniqueEntityID'
import {{ {entity_name} }} from '../entities/{entity_name}'

export class {entity_name}Created extends DomainEvent {{
  public {self._to_camel_case(entity_name)}: {entity_name}

  constructor({self._to_camel_case(entity_name)}: {entity_name}) {{
    super({self._to_camel_case(entity_name)}.id.toString())
    this.{self._to_camel_case(entity_name)} = {self._to_camel_case(entity_name)}
  }}
}}
''',
            'Updated': f'''import {{ DomainEvent }} from '../../../shared/domain/base/DomainEvent'
import {{ UniqueEntityID }} from '../../../shared/domain/base/UniqueEntityID'
import {{ {entity_name} }} from '../entities/{entity_name}'

export class {entity_name}Updated extends DomainEvent {{
  public {self._to_camel_case(entity_name)}: {entity_name}

  constructor({self._to_camel_case(entity_name)}: {entity_name}) {{
    super({self._to_camel_case(entity_name)}.id.toString())
    this.{self._to_camel_case(entity_name)} = {self._to_camel_case(entity_name)}
  }}
}}
''',
            'Deleted': f'''import {{ DomainEvent }} from '../../../shared/domain/base/DomainEvent'
import {{ UniqueEntityID }} from '../../../shared/domain/base/UniqueEntityID'
import {{ {entity_name} }} from '../entities/{entity_name}'

export class {entity_name}Deleted extends DomainEvent {{
  public {self._to_camel_case(entity_name)}: {entity_name}

  constructor({self._to_camel_case(entity_name)}: {entity_name}) {{
    super({self._to_camel_case(entity_name)}.id.toString())
    this.{self._to_camel_case(entity_name)} = {self._to_camel_case(entity_name)}
  }}
}}
'''
        }
        
        for event_name, content in events.items():
            self._write_file(
                entity_dir / 'domain' / 'events' / f'{entity_name}{event_name}.ts',
                content
            )

    def _generate_exceptions(self, entity_dir: Path, entity_name: str):
        """Generate domain exceptions"""
        exceptions = {
            'NotFound': f'{entity_name} not found',
            'AlreadyExists': f'{entity_name} already exists',
            'ValidationError': f'{entity_name} validation failed'
        }
        
        for exception, message in exceptions.items():
            content = f'''export class {entity_name}{exception} extends Error {{
  constructor(message: string = '{message}') {{
    super(message)
    this.name = '{entity_name}{exception}'
  }}
}}
'''
            
            self._write_file(
                entity_dir / 'domain' / 'exceptions' / f'{entity_name}{exception}.ts',
                content
            )

    def _generate_specifications(self, entity_dir: Path, entity_name: str):
        """Generate specifications for business rules"""
        spec_content = f'''import {{ {entity_name} }} from '../entities/{entity_name}'

export interface Specification<T> {{
  isSatisfiedBy(candidate: T): boolean
}}

export class {entity_name}IsActiveSpecification implements Specification<{entity_name}> {{
  isSatisfiedBy({self._to_camel_case(entity_name)}: {entity_name}): boolean {{
    return {self._to_camel_case(entity_name)}.status === 'active'
  }}
}}
'''
        
        self._write_file(
            entity_dir / 'domain' / 'specifications' / f'{entity_name}Specifications.ts',
            spec_content
        )

    def _generate_commands(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate command classes with validation"""
        # Create Command
        create_props = []
        for prop_name, prop_config in entity_spec.get('properties', {}).items():
            if not prop_config.get('generated') and not prop_config.get('primary'):
                prop = EntityProperty(
                    name=prop_name,
                    type=prop_config.get('type', 'string'),
                    required=prop_config.get('required', False),
                    values=prop_config.get('values', [])
                )
                create_props.append(f"  {prop.name}{prop.to_optional_suffix()}: {prop.to_typescript_type()}")
        
        create_content = f'''export interface Create{entity_name}Command {{
{chr(10).join(create_props)}
}}
'''
        self._write_file(
            entity_dir / 'application' / 'commands' / f'Create{entity_name}Command.ts',
            create_content
        )
        
        # Update Command
        update_content = f'''export interface Update{entity_name}Command {{
  id: string
{chr(10).join(create_props)}
}}
'''
        self._write_file(
            entity_dir / 'application' / 'commands' / f'Update{entity_name}Command.ts',
            update_content
        )
        
        # Delete Command
        delete_content = f'''export interface Delete{entity_name}Command {{
  id: string
}}
'''
        self._write_file(
            entity_dir / 'application' / 'commands' / f'Delete{entity_name}Command.ts',
            delete_content
        )

    def _generate_queries(self, entity_dir: Path, entity_name: str):
        """Generate query classes"""
        # GetById Query
        get_by_id_content = f'''export interface Get{entity_name}ByIdQuery {{
  id: string
}}
'''
        self._write_file(
            entity_dir / 'application' / 'queries' / f'Get{entity_name}ByIdQuery.ts',
            get_by_id_content
        )
        
        # GetList Query
        get_list_content = f'''export interface Get{entity_name}ListQuery {{
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}}
'''
        self._write_file(
            entity_dir / 'application' / 'queries' / f'Get{entity_name}ListQuery.ts',
            get_list_content
        )

    def _generate_handlers(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate command and query handlers with proper DDD implementation"""
        
        # Create Handler
        create_handler_content = f'''import {{ Create{entity_name}Command }} from '../commands/Create{entity_name}Command'
import {{ {entity_name}Repository }} from '../../domain/contracts/repositories/{entity_name}Repository'
import {{ {entity_name} }} from '../../domain/entities/{entity_name}'
import {{ {entity_name}Mapper }} from '../mappers/{entity_name}Mapper'
import {{ Result }} from '../../../shared/domain/base/Result'
import {{ {entity_name}ResponseDto }} from '../dtos/{entity_name}Dtos'

export class Create{entity_name}Handler {{
  private {self._to_camel_case(entity_name)}Repository: {entity_name}Repository
  private mapper: {entity_name}Mapper

  constructor(
    {self._to_camel_case(entity_name)}Repository: {entity_name}Repository,
    mapper: {entity_name}Mapper
  ) {{
    this.{self._to_camel_case(entity_name)}Repository = {self._to_camel_case(entity_name)}Repository
    this.mapper = mapper
  }}

  async execute(command: Create{entity_name}Command): Promise<Result<{entity_name}ResponseDto>> {{
    try {{
      const {self._to_camel_case(entity_name)}OrError = {entity_name}.create({{
        ...command,
        createdAt: new Date(),
        updatedAt: new Date()
      }})

      if ({self._to_camel_case(entity_name)}OrError.isFailure) {{
        return Result.fail<{entity_name}ResponseDto>({self._to_camel_case(entity_name)}OrError.error)
      }}

      const {self._to_camel_case(entity_name)} = {self._to_camel_case(entity_name)}OrError.getValue()
      
      await this.{self._to_camel_case(entity_name)}Repository.save({self._to_camel_case(entity_name)})
      
      return Result.ok<{entity_name}ResponseDto>(
        this.mapper.toDto({self._to_camel_case(entity_name)})
      )
    }} catch (err) {{
      return Result.fail<{entity_name}ResponseDto>(`Unexpected error creating {entity_name}: ${{err}}`)
    }}
  }}
}}
'''
        self._write_file(
            entity_dir / 'application' / 'handlers' / f'Create{entity_name}Handler.ts',
            create_handler_content
        )
        
        # Update Handler
        update_handler_content = f'''import {{ Update{entity_name}Command }} from '../commands/Update{entity_name}Command'
import {{ {entity_name}Repository }} from '../../domain/contracts/repositories/{entity_name}Repository'
import {{ {entity_name}Id }} from '../../domain/valueObjects/{entity_name}Id'
import {{ {entity_name}Mapper }} from '../mappers/{entity_name}Mapper'
import {{ Result }} from '../../../shared/domain/base/Result'
import {{ {entity_name}ResponseDto }} from '../dtos/{entity_name}Dtos'
import {{ {entity_name}NotFound }} from '../../domain/exceptions/{entity_name}NotFound'

export class Update{entity_name}Handler {{
  private {self._to_camel_case(entity_name)}Repository: {entity_name}Repository
  private mapper: {entity_name}Mapper

  constructor(
    {self._to_camel_case(entity_name)}Repository: {entity_name}Repository,
    mapper: {entity_name}Mapper
  ) {{
    this.{self._to_camel_case(entity_name)}Repository = {self._to_camel_case(entity_name)}Repository
    this.mapper = mapper
  }}

  async execute(command: Update{entity_name}Command): Promise<Result<{entity_name}ResponseDto>> {{
    try {{
      const {self._to_camel_case(entity_name)}Id = {entity_name}Id.create(command.id)
      const {self._to_camel_case(entity_name)} = await this.{self._to_camel_case(entity_name)}Repository.get{entity_name}ById({self._to_camel_case(entity_name)}Id)

      if (!{self._to_camel_case(entity_name)}) {{
        return Result.fail<{entity_name}ResponseDto>(new {entity_name}NotFound().message)
      }}

      const {{ id, ...updateData }} = command
      const updateResult = {self._to_camel_case(entity_name)}.update(updateData)

      if (updateResult.isFailure) {{
        return Result.fail<{entity_name}ResponseDto>(updateResult.error)
      }}

      await this.{self._to_camel_case(entity_name)}Repository.save({self._to_camel_case(entity_name)})
      
      return Result.ok<{entity_name}ResponseDto>(
        this.mapper.toDto({self._to_camel_case(entity_name)})
      )
    }} catch (err) {{
      return Result.fail<{entity_name}ResponseDto>(`Unexpected error updating {entity_name}: ${{err}}`)
    }}
  }}
}}
'''
        self._write_file(
            entity_dir / 'application' / 'handlers' / f'Update{entity_name}Handler.ts',
            update_handler_content
        )
        
        # Delete Handler
        delete_handler_content = f'''import {{ Delete{entity_name}Command }} from '../commands/Delete{entity_name}Command'
import {{ {entity_name}Repository }} from '../../domain/contracts/repositories/{entity_name}Repository'
import {{ {entity_name}Id }} from '../../domain/valueObjects/{entity_name}Id'
import {{ Result }} from '../../../shared/domain/base/Result'
import {{ {entity_name}NotFound }} from '../../domain/exceptions/{entity_name}NotFound'

export class Delete{entity_name}Handler {{
  private {self._to_camel_case(entity_name)}Repository: {entity_name}Repository

  constructor({self._to_camel_case(entity_name)}Repository: {entity_name}Repository) {{
    this.{self._to_camel_case(entity_name)}Repository = {self._to_camel_case(entity_name)}Repository
  }}

  async execute(command: Delete{entity_name}Command): Promise<Result<void>> {{
    try {{
      const {self._to_camel_case(entity_name)}Id = {entity_name}Id.create(command.id)
      const exists = await this.{self._to_camel_case(entity_name)}Repository.exists({self._to_camel_case(entity_name)}Id)

      if (!exists) {{
        return Result.fail<void>(new {entity_name}NotFound().message)
      }}

      await this.{self._to_camel_case(entity_name)}Repository.delete({self._to_camel_case(entity_name)}Id)
      
      return Result.ok<void>()
    }} catch (err) {{
      return Result.fail<void>(`Unexpected error deleting {entity_name}: ${{err}}`)
    }}
  }}
}}
'''
        self._write_file(
            entity_dir / 'application' / 'handlers' / f'Delete{entity_name}Handler.ts',
            delete_handler_content
        )
        
        # GetById Handler
        get_by_id_handler_content = f'''import {{ Get{entity_name}ByIdQuery }} from '../queries/Get{entity_name}ByIdQuery'
import {{ {entity_name}Repository }} from '../../domain/contracts/repositories/{entity_name}Repository'
import {{ {entity_name}Id }} from '../../domain/valueObjects/{entity_name}Id'
import {{ {entity_name}Mapper }} from '../mappers/{entity_name}Mapper'
import {{ Result }} from '../../../shared/domain/base/Result'
import {{ {entity_name}ResponseDto }} from '../dtos/{entity_name}Dtos'
import {{ {entity_name}NotFound }} from '../../domain/exceptions/{entity_name}NotFound'

export class Get{entity_name}ByIdHandler {{
  private {self._to_camel_case(entity_name)}Repository: {entity_name}Repository
  private mapper: {entity_name}Mapper

  constructor(
    {self._to_camel_case(entity_name)}Repository: {entity_name}Repository,
    mapper: {entity_name}Mapper
  ) {{
    this.{self._to_camel_case(entity_name)}Repository = {self._to_camel_case(entity_name)}Repository
    this.mapper = mapper
  }}

  async execute(query: Get{entity_name}ByIdQuery): Promise<Result<{entity_name}ResponseDto>> {{
    try {{
      const {self._to_camel_case(entity_name)}Id = {entity_name}Id.create(query.id)
      const {self._to_camel_case(entity_name)} = await this.{self._to_camel_case(entity_name)}Repository.get{entity_name}ById({self._to_camel_case(entity_name)}Id)

      if (!{self._to_camel_case(entity_name)}) {{
        return Result.fail<{entity_name}ResponseDto>(new {entity_name}NotFound().message)
      }}

      return Result.ok<{entity_name}ResponseDto>(
        this.mapper.toDto({self._to_camel_case(entity_name)})
      )
    }} catch (err) {{
      return Result.fail<{entity_name}ResponseDto>(`Unexpected error getting {entity_name}: ${{err}}`)
    }}
  }}
}}
'''
        self._write_file(
            entity_dir / 'application' / 'handlers' / f'Get{entity_name}ByIdHandler.ts',
            get_by_id_handler_content
        )
        
        # GetList Handler
        get_list_handler_content = f'''import {{ Get{entity_name}ListQuery }} from '../queries/Get{entity_name}ListQuery'
import {{ {entity_name}Repository }} from '../../domain/contracts/repositories/{entity_name}Repository'
import {{ {entity_name}Mapper }} from '../mappers/{entity_name}Mapper'
import {{ Result }} from '../../../shared/domain/base/Result'
import {{ {entity_name}ResponseDto }} from '../dtos/{entity_name}Dtos'

export class Get{entity_name}ListHandler {{
  private {self._to_camel_case(entity_name)}Repository: {entity_name}Repository
  private mapper: {entity_name}Mapper

  constructor(
    {self._to_camel_case(entity_name)}Repository: {entity_name}Repository,
    mapper: {entity_name}Mapper
  ) {{
    this.{self._to_camel_case(entity_name)}Repository = {self._to_camel_case(entity_name)}Repository
    this.mapper = mapper
  }}

  async execute(query: Get{entity_name}ListQuery): Promise<Result<{{
    items: {entity_name}ResponseDto[]
    total: number
    totalPages: number
    page: number
    limit: number
  }}>> {{
    try {{
      const page = query.page || 1
      const limit = query.limit || 20

      const result = await this.{self._to_camel_case(entity_name)}Repository.getAllPaginated(page, limit)
      
      return Result.ok({{
        items: result.{self._to_camel_case(entity_name)}s.map({self._to_camel_case(entity_name)} => this.mapper.toDto({self._to_camel_case(entity_name)})),
        total: result.total,
        totalPages: result.totalPages,
        page,
        limit
      }})
    }} catch (err) {{
      return Result.fail(`Unexpected error getting {entity_name} list: ${{err}}`)
    }}
  }}
}}
'''
        self._write_file(
            entity_dir / 'application' / 'handlers' / f'Get{entity_name}ListHandler.ts',
            get_list_handler_content
        )

    def _generate_dtos(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate DTOs for the entity"""
        properties = entity_spec.get('properties', {})
        
        # Generate property lines for DTOs
        dto_props = []
        for prop_name, prop_config in properties.items():
            if not prop_config.get('generated') and not prop_config.get('primary'):
                prop = EntityProperty(
                    name=prop_name,
                    type=prop_config.get('type', 'string'),
                    required=prop_config.get('required', False),
                    values=prop_config.get('values', [])
                )
                dto_props.append(f"  {prop.name}{prop.to_optional_suffix()}: {prop.to_typescript_type()}")
        
        # Response DTO props
        response_props = []
        for prop_name, prop_config in properties.items():
            prop = EntityProperty(
                name=prop_name,
                type=prop_config.get('type', 'string'),
                values=prop_config.get('values', [])
            )
            response_props.append(f"  {prop.name}: {prop.to_typescript_type()}")
        
        content = f'''export interface Create{entity_name}Dto {{
{chr(10).join(dto_props)}
}}

export interface Update{entity_name}Dto {{
  id: string
{chr(10).join(dto_props)}
}}

export interface {entity_name}ResponseDto {{
  id: string
{chr(10).join(response_props)}
  createdAt: Date
  updatedAt: Date
}}
'''
        
        self._write_file(
            entity_dir / 'application' / 'dtos' / f'{entity_name}Dtos.ts',
            content
        )

    def _generate_mapper(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate mapper class with proper error handling"""
        content = f'''import {{ {entity_name} }} from '../../domain/entities/{entity_name}'
import {{ {entity_name}ResponseDto }} from '../dtos/{entity_name}Dtos'
import {{ UniqueEntityID }} from '../../../shared/domain/base/UniqueEntityID'

export class {entity_name}Mapper {{
  public static toDto({self._to_camel_case(entity_name)}: {entity_name}): {entity_name}ResponseDto {{
    return {{
      id: {self._to_camel_case(entity_name)}.id.toString(),
{self._generate_dto_mapping(entity_spec, entity_name)},
      createdAt: {self._to_camel_case(entity_name)}.props.createdAt,
      updatedAt: {self._to_camel_case(entity_name)}.props.updatedAt
    }}
  }}

  public static toDomain(raw: any): {entity_name} {{
    const {self._to_camel_case(entity_name)}OrError = {entity_name}.create(
      {{
{self._generate_domain_mapping(entity_spec)},
        createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
        updatedAt: raw.updated_at ? new Date(raw.updated_at) : new Date()
      }},
      new UniqueEntityID(raw.id)
    )

    return {self._to_camel_case(entity_name)}OrError.isSuccess 
      ? {self._to_camel_case(entity_name)}OrError.getValue() 
      : null
  }}

  public static toPersistence({self._to_camel_case(entity_name)}: {entity_name}): any {{
    return {{
      id: {self._to_camel_case(entity_name)}.id.toString(),
{self._generate_persistence_mapping(entity_spec, entity_name)},
      created_at: {self._to_camel_case(entity_name)}.props.createdAt,
      updated_at: {self._to_camel_case(entity_name)}.props.updatedAt
    }}
  }}
}}
'''
        
        self._write_file(
            entity_dir / 'application' / 'mappers' / f'{entity_name}Mapper.ts',
            content
        )

    def _generate_use_cases(self, entity_dir: Path, entity_name: str):
        """Generate use case classes"""
        use_cases = ['Create', 'Update', 'Delete', 'GetById', 'GetList']
        
        for use_case in use_cases:
            handler_type = 'Command' if use_case in ['Create', 'Update', 'Delete'] else 'Query'
            content = f'''import {{ {use_case}{entity_name}Handler }} from '../handlers/{use_case}{entity_name}Handler'
import {{ {use_case}{entity_name}{handler_type} }} from '../{handler_type.lower()}s/{use_case}{entity_name}{handler_type}'
import {{ {entity_name}Repository }} from '../../domain/contracts/repositories/{entity_name}Repository'
import {{ {entity_name}Mapper }} from '../mappers/{entity_name}Mapper'

export class {use_case}{entity_name}UseCase {{
  private handler: {use_case}{entity_name}Handler

  constructor(
    {self._to_camel_case(entity_name)}Repository: {entity_name}Repository
  ) {{
    this.handler = new {use_case}{entity_name}Handler(
      {self._to_camel_case(entity_name)}Repository,
      {entity_name}Mapper
    )
  }}

  async execute(request: {use_case}{entity_name}{handler_type}) {{
    return this.handler.execute(request)
  }}
}}
'''
            
            self._write_file(
                entity_dir / 'application' / 'useCases' / f'{use_case}{entity_name}UseCase.ts',
                content
            )

    def _generate_repository_impl(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate repository implementation"""
        content = f'''import {{ {entity_name}Repository }} from '../../../domain/contracts/repositories/{entity_name}Repository'
import {{ {entity_name} }} from '../../../domain/entities/{entity_name}'
import {{ {entity_name}Id }} from '../../../domain/valueObjects/{entity_name}Id'
import {{ {entity_name}Mapper }} from '../../../application/mappers/{entity_name}Mapper'
import {{ {entity_name}Model }} from '../models/{entity_name}Model'

export class {entity_name}RepositoryImpl implements {entity_name}Repository {{
  private models = new Map<string, any>()

  async exists({self._to_camel_case(entity_name)}Id: {entity_name}Id): Promise<boolean> {{
    return this.models.has({self._to_camel_case(entity_name)}Id.value)
  }}

  async get{entity_name}ById({self._to_camel_case(entity_name)}Id: {entity_name}Id): Promise<{entity_name}> {{
    const raw = this.models.get({self._to_camel_case(entity_name)}Id.value)
    if (!raw) {{
      return null
    }}
    return {entity_name}Mapper.toDomain(raw)
  }}

  async save({self._to_camel_case(entity_name)}: {entity_name}): Promise<void> {{
    const raw = {entity_name}Mapper.toPersistence({self._to_camel_case(entity_name)})
    this.models.set({self._to_camel_case(entity_name)}.id.toString(), raw)
  }}

  async delete({self._to_camel_case(entity_name)}Id: {entity_name}Id): Promise<void> {{
    this.models.delete({self._to_camel_case(entity_name)}Id.value)
  }}

  async getAll(): Promise<{entity_name}[]> {{
    const all = Array.from(this.models.values())
    return all.map(raw => {entity_name}Mapper.toDomain(raw)).filter(Boolean)
  }}

  async getAllPaginated(page: number, limit: number): Promise<{{
    {self._to_camel_case(entity_name)}s: {entity_name}[]
    totalPages: number
    total: number
  }}> {{
    const all = await this.getAll()
    const total = all.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const {self._to_camel_case(entity_name)}s = all.slice(start, start + limit)

    return {{
      {self._to_camel_case(entity_name)}s,
      totalPages,
      total
    }}
  }}
}}
'''
        
        self._write_file(
            entity_dir / 'infrastructure' / 'persistence' / 'repositories' / f'{entity_name}RepositoryImpl.ts',
            content
        )

    def _generate_api_service(self, entity_dir: Path, entity_name: str):
        """Generate API service using rawApi from @/services/api"""
        content = f'''import {{ rawApi }} from '@/services/api'

export class {entity_name}ApiService {{
  private readonly baseUrl = '/{self.module_name_kebab}/{self._to_kebab_case(entity_name)}s'

  async create(data: any) {{
    return await rawApi(this.baseUrl, {{ method: 'POST', body: data }})
  }}

  async update(id: string, data: any) {{
    return await rawApi(`${{this.baseUrl}}/${{id}}`, {{ method: 'PUT', body: data }})
  }}

  async delete(id: string) {{
    return await rawApi(`${{this.baseUrl}}/${{id}}`, {{ method: 'DELETE' }})
  }}

  async getById(id: string) {{
    return await rawApi(`${{this.baseUrl}}/${{id}}`, {{ method: 'GET' }})
  }}

  async getAll() {{
    return await rawApi(this.baseUrl, {{ method: 'GET' }})
  }}

  async getList(params: any) {{
    return await rawApi(this.baseUrl, {{ method: 'GET', params }})
  }}
}}
'''
        self._write_file(
            entity_dir / 'infrastructure' / 'api' / 'services' / f'{entity_name}ApiService.ts',
            content
        )

    def _generate_api_transformer(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate API transformer"""
        content = f'''import {{ {entity_name} }} from '../../../domain/entities/{entity_name}'
import {{ {entity_name}Mapper }} from '../../../application/mappers/{entity_name}Mapper'

export class {entity_name}Transformer {{
  static fromApi(apiData: any): {entity_name} | null {{
    return {entity_name}Mapper.toDomain(apiData)
  }}

  static toApi({self._to_camel_case(entity_name)}: {entity_name}): any {{
    return {entity_name}Mapper.toPersistence({self._to_camel_case(entity_name)})
  }}

  static manyFromApi(apiDataArray: any[]): {entity_name}[] {{
    return apiDataArray
      .map(apiData => this.fromApi(apiData))
      .filter(Boolean) as {entity_name}[]
  }}
}}
'''
        
        self._write_file(
            entity_dir / 'infrastructure' / 'api' / 'transformers' / f'{entity_name}Transformer.ts',
            content
        )

    def _generate_views(self, entity_dir: Path, entity_name: str):
        """Generate Vue views compatible with Vuetify and your pattern"""
        views = {
            'List': self._generate_list_view,
            'Add': self._generate_add_view,
            'Edit': self._generate_edit_view,
            'Delete': self._generate_delete_view,
            'View': self._generate_view_view
        }
        
        for view_name, generator in views.items():
            content = generator(entity_name)
            self._write_file(
                entity_dir / 'presentation' / 'views' / f'{entity_name}{view_name}.vue',
                content
            )

    def _generate_list_view(self, entity_name: str) -> str:
        """Generate list view compatible with your pattern and translations"""
        return f'''<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">{{{{ ('{self._to_kebab_case(entity_name)}.title') }}}}</h4>
      <p class="text-body-1 mb-4">{{{{ ('{self._to_kebab_case(entity_name)}.description') }}}}</p>
    </VCardTitle>

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField 
          v-model="{self._to_camel_case(entity_name)}Store.filters.search" 
          :label="('{self._to_kebab_case(entity_name)}.search_{self._to_kebab_case(entity_name)}')" 
          variant="outlined" 
          dense
          class="filter-field" 
          @input="applyFilters" 
        />

        <!-- Botón para exportar -->
        <GlobalMenu 
          :label="('export')" 
          :options="menuOptions" 
          color="secondary" 
          variant="tonal"
          icon="tabler-chevron-down" 
        />

        <!-- Botón para agregar -->
        <VBtn 
          prepend-icon="tabler-plus" 
          color="primary" 
          @click="openAddDialog"
        >
          {{ ('{self._to_kebab_case(entity_name)}.add {self._to_kebab_case(entity_name)}') }}
        </VBtn>

        <!-- Botones para acciones con seleccionados -->
        <VBtn 
          color="error" 
          v-if="{self._to_camel_case(entity_name)}Store.selectedItems.length > 1" 
          @click="deleteSelected"
        >
          {{ ('delete selected') }}
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <!-- Tabla de elementos -->
    <{entity_name}Table 
      :headers="headers" 
      :items="{self._to_camel_case(entity_name)}Store.list" 
      :total="{self._to_camel_case(entity_name)}Store.total" 
      :page="{self._to_camel_case(entity_name)}Store.page"
      :items-per-page="{self._to_camel_case(entity_name)}Store.itemsPerPage" 
      :loading="{self._to_camel_case(entity_name)}Store.isLoading" 
      :selection="{self._to_camel_case(entity_name)}Store.selectedItems"
      @update:selection="val => {self._to_camel_case(entity_name)}Store.selectedItems = val" 
      @update:page="onPageChange"
      @update:items-per-page="onItemsPerPageChange" 
      @view="openViewDialog" 
      @edit="openEditDialog"
      @delete="openDeleteDialog" 
    />
  </VCard>
</template>

<script setup lang="ts">
import {{ use{entity_name}Store }} from '../stores/{self._to_camel_case(entity_name)}Store'
import debounce from 'lodash/debounce'
import {{ useI18n }} from 'vue-i18n'

// Componentes internos
import {entity_name}Table from '../components/organisms/{entity_name}Table.vue'
import {entity_name}Add from './{entity_name}Add.vue'
import {entity_name}Delete from './{entity_name}Delete.vue'
import {entity_name}Edit from './{entity_name}Edit.vue'

// Composable para manejar diálogos
const {{ openDialog, navigateTo }} = useAppManager()
const {{ t }} = useI18n()

// Store
const {self._to_camel_case(entity_name)}Store = use{entity_name}Store()

// Headers para la tabla
const headers = [
{self._generate_table_headers_for_list(entity_name)}
  {{ title: t('actions'), key: 'actions', sortable: false }},
]

// Opciones del menú de exportación
const menuOptions = [
  {{
    text: t('export_to') + ' ' + t('excel'),
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  }},
  {{
    text: t('export_to') + ' ' + t('pdf'),
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  }},
]

// Métodos
const debouncedFetchList = debounce(() => {{
  {self._to_camel_case(entity_name)}Store.fetchList()
}}, 500)

function applyFilters() {{
  debouncedFetchList()
}}

function onPageChange(newPage: number) {{
  {self._to_camel_case(entity_name)}Store.page = newPage
  {self._to_camel_case(entity_name)}Store.fetchList()
}}

function onItemsPerPageChange(newItemsPerPage: number) {{
  {self._to_camel_case(entity_name)}Store.itemsPerPage = newItemsPerPage
  {self._to_camel_case(entity_name)}Store.fetchList()
}}

function deleteSelected() {{
  openDialog({entity_name}Delete, {{}}, {{ width: '900px', persistent: true }}).then((result) => {{
    if (result === 'submit') {{
      {self._to_camel_case(entity_name)}Store.fetchList()
    }}
  }})
}}

function openAddDialog() {{
  openDialog({entity_name}Add, {{ title: t('add {entity_name}') }}, {{ width: '900px', persistent: true }}).then((result) => {{
    if (result === 'submit') {{
      {self._to_camel_case(entity_name)}Store.fetchList()
    }}
  }})
}}

function openEditDialog(item: any) {{
  openDialog({entity_name}Edit, {{ item, title: t('edit {entity_name}') }}, {{ width: '800px', persistent: true }}).then((result) => {{
    if (result === 'submit') {{
      {self._to_camel_case(entity_name)}Store.fetchList()
    }}
  }})
}}

function openViewDialog(item: any) {{
  navigateTo(`/{self._to_kebab_case(entity_name)}s/${{item.id}}`)
}}

function openDeleteDialog(item: any) {{
  openDialog({entity_name}Delete, {{ item, title: t('delete {entity_name}') }}, {{ width: '900px', persistent: true }}).then((result) => {{
    if (result === 'submit') {{
      {self._to_camel_case(entity_name)}Store.fetchList()
    }}
  }})
}}

function exportItems(type: string) {{
  {self._to_camel_case(entity_name)}Store.exportItems(type)
}}

// onMounted
onMounted(() => {{
  {self._to_camel_case(entity_name)}Store.fetchList()
}})
</script>

<style scoped>
.filter-field {{
  flex: 1;
  max-inline-size: 300px;
}}
</style>
'''

    def _generate_table_headers_for_list(self, entity_name: str) -> str:
        """Generate table headers for list view with translations"""
        # This would be generated based on entity properties
        return f'''  {{ title: t('{self._to_kebab_case(entity_name)}.name'), key: 'name' }},\n  {{ title: t('{self._to_kebab_case(entity_name)}.description'), key: 'description' }},\n  {{ title: t('{self._to_kebab_case(entity_name)}.status'), key: 'status' }},'''

    def _generate_add_view(self, entity_name: str) -> str:
        """Generate add view"""
        return f'''<template>
  <{entity_name}Form mode="create" />
</template>

<script setup lang="ts">
import {entity_name}Form from '../components/organisms/{entity_name}Form.vue'
</script>
'''

    def _generate_edit_view(self, entity_name: str) -> str:
        """Generate edit view"""
        return f'''<template>
  <{entity_name}Form 
    mode="edit" 
    :initial-data="currentItem" 
  />
</template>

<script setup lang="ts">
import {{ onMounted, computed }} from 'vue'
import {{ useRoute }} from 'vue-router'
import {{ use{entity_name}Store }} from '../stores/{self._to_camel_case(entity_name)}Store'
import {entity_name}Form from '../components/organisms/{entity_name}Form.vue'

const route = useRoute()
const store = use{entity_name}Store()
const currentItem = computed(() => store.currentItem)

onMounted(async () => {{
  await store.fetchById(route.params.id as string)
}})
</script>
'''

    def _generate_delete_view(self, entity_name: str) -> str:
        """Generate delete view"""
        return f'''<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <h4 class="text-h4 text-center mb-2">{{ t('deleteModule', {{ moduleName: {entity_name}Title }}) }}</h4>
      <p class="text-body-1 text-center mb-6">{{ t('deleteItemDescription') }}</p>

      <div class="text-center">
        <VBtn color="error" @click="confirmDelete">{{ t('confirmDelete') }}</VBtn>
        <VBtn color="secondary" variant="tonal" @click="close" class="ml-2">{{ t('cancel') }}</VBtn>
      </div>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import {{ useI18n }} from 'vue-i18n'
import {{ useAppManager }} from '@/composables/useAppManager'
import {{ use{entity_name}Store }} from '../stores/{self._to_camel_case(entity_name)}Store'

interface Props {{
  item?: any
}}

const props = defineProps<Props>()
const {{ t }} = useI18n()
const {{ closeDialog }} = useAppManager()
const store = use{entity_name}Store()

const {entity_name}Title = t('{self._to_kebab_case(entity_name)}')

function close(result: 'close' | 'submit' | 'cancel' = 'close') {{
  closeDialog(result)
}}

async function confirmDelete() {{
  try {{
    if (props.item) {{
      await store.deleteItem(props.item.id)
    }}
    close('submit')
  }} catch (error) {{
    console.error('Error al eliminar:', error)
  }}
}}
</script>
'''

    def _generate_view_view(self, entity_name: str) -> str:
        """Generate view view"""
        return f'''<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">{{ title }}</h4>
      <p class="text-body-1 mb-4">{{ description }}</p>
    </VCardTitle>

    <VCardText>
      <{entity_name}Detail :{self._to_camel_case(entity_name)}="currentItem" />
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import {{ onMounted, computed }} from 'vue'
import {{ useRoute }} from 'vue-router'
import {{ use{entity_name}Store }} from '../stores/{self._to_camel_case(entity_name)}Store'
import {entity_name}Detail from '../components/organisms/{entity_name}Detail.vue'

const route = useRoute()
const store = use{entity_name}Store()
const currentItem = computed(() => store.currentItem)

onMounted(async () => {{
  await store.fetchById(route.params.id as string)
}})
</script>
'''

    def _generate_detail_component(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate detail component compatible with Vuetify"""
        content = f'''<template>
  <div class="{self._to_kebab_case(entity_name)}-detail">
    <VList>
{self._generate_vuetify_detail_fields(entity_name, entity_spec)}
    </VList>
  </div>
</template>

<script setup lang="ts">
interface Props {{
  {self._to_camel_case(entity_name)}: any
}}

const props = defineProps<Props>()
</script>
'''
        
        self._write_file(
            entity_dir / 'presentation' / 'components' / 'organisms' / f'{entity_name}Detail.vue',
            content
        )

    def _generate_vuetify_detail_fields(self, entity_name: str, entity_spec: Dict) -> str:
        """Generate Vuetify detail fields"""
        fields = []
        properties = entity_spec.get('properties', {})
        
        for prop_name, prop_config in properties.items():
            if not prop_config.get('generated'):
                display_name = prop_name.replace('_', ' ').title()
                prop_type = prop_config.get('type', 'string')
                
                if prop_type in ['datetime', 'date']:
                    fields.append(f'''      <VListItem>
        <VListItemTitle>{{ t('{display_name}') }}</VListItemTitle>
        <VListItemSubtitle>{{{{ formatDate({self._to_camel_case(entity_name)}.{prop_name}) }}}}</VListItemSubtitle>
      </VListItem>''')
                elif prop_type == 'boolean':
                    fields.append(f'''      <VListItem>
        <VListItemTitle>{{ t('{display_name}') }}</VListItemTitle>
        <VListItemSubtitle>
          <VChip :color="{self._to_camel_case(entity_name)}.{prop_name} ? 'success' : 'error'" size="small">
            {{{{ {self._to_camel_case(entity_name)}.{prop_name} ? 'Yes' : 'No' }}}}
          </VChip>
        </VListItemSubtitle>
      </VListItem>''')
                else:
                    fields.append(f'''      <VListItem>
        <VListItemTitle>{{ t('{display_name}') }}</VListItemTitle>
        <VListItemSubtitle>{{{{ {self._to_camel_case(entity_name)}.{prop_name} }}}}</VListItemSubtitle>
      </VListItem>''')
        
        return '\n'.join(fields)

    def _generate_module_routes(self, module_dir: Path):
        """Generate module routes compatible with your pattern"""
        routes = []
        for entity_name in self.entities.keys():
            routes.extend([
                f'''  {{
    path: '/{self._to_kebab_case(entity_name)}s',
    name: '{self._to_kebab_case(entity_name)}sList',
    component: () => import('@/modules/{self.module_name}/{entity_name}/presentation/views/{entity_name}List.vue'),
    meta: {{
      action: 'read',
      subject: '{self._to_kebab_case(entity_name)}s'
    }}
  }},
  {{
    path: '/{self._to_kebab_case(entity_name)}s/:id',
    name: '{self._to_kebab_case(entity_name)}sView',
    component: () => import('@/modules/{self.module_name}/{entity_name}/presentation/views/{entity_name}View.vue'),
    meta: {{
      action: 'read',
      subject: '{self._to_kebab_case(entity_name)}s'
    }}
  }},'''
            ])
        
        content = f'''import {{ RouteRecordRaw }} from 'vue-router'

const {self.module_name}Routes: RouteRecordRaw[] = [
{chr(10).join(routes)}
]

export default {self.module_name}Routes
'''
        
        self._write_file(module_dir / 'config' / 'routes.ts', content)

    def _generate_module_menu(self, module_dir: Path):
        """Generate module menu compatible with your pattern"""
        menu_items = []
        for entity_name in self.entities.keys():
            menu_items.append(f'''  {{
    title: '{entity_name}s',
    icon: {{ icon: 'tabler-{self._to_kebab_case(entity_name)}' }},
    to: '{self._to_kebab_case(entity_name)}sList',
    action: 'read',
    subject: '{self._to_kebab_case(entity_name)}s',
  }},''')
        
        content = f'''import type {{ VerticalNavItems }} from '@layouts/types'

const {self.module_name}Menu: VerticalNavItems = [
{chr(10).join(menu_items)}
]

export default {self.module_name}Menu
'''
        
        self._write_file(module_dir / 'config' / 'menu.ts', content)

    def _generate_indexed_db_config(self, module_dir: Path):
        """Generate IndexedDB configuration"""
        content = f'''const dbConfig = {{
  tableName: '{self.module_name_kebab}',
  version: 1,
  stores: [
    {{
      name: '{self.module_name_kebab}',
      keyPath: 'id',
      indexes: [
        {{ name: 'createdAt', keyPath: 'createdAt' }},
        {{ name: 'updatedAt', keyPath: 'updatedAt' }}
      ]
    }}
  ]
}}

export default dbConfig
'''
        
        self._write_file(module_dir / 'indexedDbConfig.ts', content)

    def _generate_module_index(self, module_dir: Path, entity_names: List[str]):
        """Generate main module index file compatible with your pattern"""
        content = f'''// Module exports
export {{ default as {self.module_name}Routes }} from './config/routes'
export {{ default as {self.module_name}Menu }} from './config/menu'

// Entity exports
{chr(10).join([f"export * from './{entity_name}'" for entity_name in entity_names])}

// Store exports
{chr(10).join([f"export {{ use{entity_name}Store }} from './{entity_name}/presentation/stores/{self._to_camel_case(entity_name)}Store'" for entity_name in entity_names])}

// Component exports
{chr(10).join([f"export {{ default as {entity_name}Table }} from './{entity_name}/presentation/components/organisms/{entity_name}Table.vue'" for entity_name in entity_names])}
{chr(10).join([f"export {{ default as {entity_name}Form }} from './{entity_name}/presentation/components/organisms/{entity_name}Form.vue'" for entity_name in entity_names])}
{chr(10).join([f"export {{ default as {entity_name}Detail }} from './{entity_name}/presentation/components/organisms/{entity_name}Detail.vue'" for entity_name in entity_names])}

// View exports
{chr(10).join([f"export {{ default as {entity_name}List }} from './{entity_name}/presentation/views/{entity_name}List.vue'" for entity_name in entity_names])}
{chr(10).join([f"export {{ default as {entity_name}Add }} from './{entity_name}/presentation/views/{entity_name}Add.vue'" for entity_name in entity_names])}
{chr(10).join([f"export {{ default as {entity_name}Edit }} from './{entity_name}/presentation/views/{entity_name}Edit.vue'" for entity_name in entity_names])}
{chr(10).join([f"export {{ default as {entity_name}Delete }} from './{entity_name}/presentation/views/{entity_name}Delete.vue'" for entity_name in entity_names])}
{chr(10).join([f"export {{ default as {entity_name}View }} from './{entity_name}/presentation/views/{entity_name}View.vue'" for entity_name in entity_names])}

// Composable exports
{chr(10).join([f"export {{ use{entity_name} }} from './{entity_name}/presentation/composables/use{entity_name}'" for entity_name in entity_names])}

// Validator exports
{chr(10).join([f"export {{ {self._to_camel_case(entity_name)}CreateValidation, {self._to_camel_case(entity_name)}UpdateValidation }} from './{entity_name}/presentation/validators/{entity_name}Validators'" for entity_name in entity_names])}
'''
        
        self._write_file(module_dir / 'index.ts', content)

    def _generate_entity_index(self, entity_dir: Path, entity_name: str):
        """Generate index file for entity compatible with your pattern"""
        content = f'''// Domain
export {{ {entity_name} }} from './domain/entities/{entity_name}'
export {{ {entity_name}Id }} from './domain/valueObjects/{entity_name}Id'
export {{ {entity_name}Repository }} from './domain/contracts/repositories/{entity_name}Repository'

// Application
export {{ Create{entity_name}Command }} from './application/commands/Create{entity_name}Command'
export {{ Update{entity_name}Command }} from './application/commands/Update{entity_name}Command'
export {{ Delete{entity_name}Command }} from './application/commands/Delete{entity_name}Command'
export {{ Get{entity_name}ByIdQuery }} from './application/queries/Get{entity_name}ByIdQuery'
export {{ Get{entity_name}ListQuery }} from './application/queries/Get{entity_name}ListQuery'

export {{ Create{entity_name}Handler }} from './application/handlers/Create{entity_name}Handler'
export {{ Update{entity_name}Handler }} from './application/handlers/Update{entity_name}Handler'
export {{ Delete{entity_name}Handler }} from './application/handlers/Delete{entity_name}Handler'
export {{ Get{entity_name}ByIdHandler }} from './application/handlers/Get{entity_name}ByIdHandler'
export {{ Get{entity_name}ListHandler }} from './application/handlers/Get{entity_name}ListHandler'

export {{ {entity_name}Mapper }} from './application/mappers/{entity_name}Mapper'
export {{ Create{entity_name}Dto, Update{entity_name}Dto, {entity_name}ResponseDto }} from './application/dtos/{entity_name}Dtos'

// Infrastructure
export {{ {entity_name}RepositoryImpl }} from './infrastructure/persistence/repositories/{entity_name}RepositoryImpl'
export {{ {entity_name}ApiService }} from './infrastructure/api/services/{entity_name}ApiService'
export {{ {entity_name}Transformer }} from './infrastructure/api/transformers/{entity_name}Transformer'

// Presentation
export {{ default as {entity_name}List }} from './presentation/views/{entity_name}List.vue'
export {{ default as {entity_name}Add }} from './presentation/views/{entity_name}Add.vue'
export {{ default as {entity_name}Edit }} from './presentation/views/{entity_name}Edit.vue'
export {{ default as {entity_name}Delete }} from './presentation/views/{entity_name}Delete.vue'
export {{ default as {entity_name}View }} from './presentation/views/{entity_name}View.vue'

export {{ default as {entity_name}Table }} from './presentation/components/organisms/{entity_name}Table.vue'
export {{ default as {entity_name}Form }} from './presentation/components/organisms/{entity_name}Form.vue'
export {{ default as {entity_name}Detail }} from './presentation/components/organisms/{entity_name}Detail.vue'

export {{ use{entity_name}Store }} from './presentation/stores/{self._to_camel_case(entity_name)}Store'
export {{ use{entity_name} }} from './presentation/composables/use{entity_name}'
export {{ {self._to_camel_case(entity_name)}CreateValidation, {self._to_camel_case(entity_name)}UpdateValidation }} from './presentation/validators/{entity_name}Validators'
'''
        
        self._write_file(entity_dir / 'index.ts', content)

    def _generate_module_types(self, module_dir: Path):
        """Generate shared module types"""
        content = '''export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
  message?: string
  success: boolean
}

export interface ListFilters {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  [key: string]: any
}

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateEntityDto {
  [key: string]: any
}

export interface UpdateEntityDto {
  id: string
  [key: string]: any
}
'''
        
        self._write_file(module_dir / 'shared' / 'types' / 'index.ts', content)

    def _generate_shared_composables(self, module_dir: Path):
        """Generate shared composables"""
        content = '''import { ref, computed } from 'vue'
import type { ListFilters, ApiResponse, PaginationMeta } from '../types'

export function usePagination() {
  const page = ref(1)
  const perPage = ref(20)
  const total = ref(0)
  
  const totalPages = computed(() => Math.ceil(total.value / perPage.value))
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPrevPage = computed(() => page.value > 1)
  
  const setPage = (newPage: number) => {
    page.value = newPage
  }
  
  const setPerPage = (newPerPage: number) => {
    perPage.value = newPerPage
    page.value = 1
  }
  
  const nextPage = () => {
    if (hasNextPage.value) {
      page.value++
    }
  }
  
  const prevPage = () => {
    if (hasPrevPage.value) {
      page.value--
    }
  }
  
  return {
    page,
    perPage,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage,
    setPerPage,
    nextPage,
    prevPage
  }
}

export function useApiCall<T>() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(null)
  
  const execute = async (apiCall: () => Promise<ApiResponse<T>>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiCall()
      data.value = response.data
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const clearError = () => {
    error.value = null
  }
  
  return {
    loading,
    error,
    data,
    execute,
    clearError
  }
}
'''
        
        self._write_file(module_dir / 'shared' / 'composables' / 'index.ts', content)

    def _generate_composables(self, entity_dir: Path, entity_name: str):
        """Generate composables for entity"""
        content = f'''import {{ ref, computed }} from 'vue'
import {{ use{entity_name}Store }} from '../stores/{self._to_camel_case(entity_name)}Store'

export function use{entity_name}() {{
  const store = use{entity_name}Store()
  
  const isLoading = computed(() => store.loading)
  const hasError = computed(() => !!store.error)
  const errorMessage = computed(() => store.error)
  
  const {self._to_camel_case(entity_name)}s = computed(() => store.items)
  const current{entity_name} = computed(() => store.currentItem)
  
  const pagination = computed(() => ({{
    page: store.currentPage,
    perPage: store.perPage,
    total: store.total,
    totalPages: store.totalPages
  }}))
  
  return {{
    // Store
    store,
    
    // Computed
    isLoading,
    hasError,
    errorMessage,
    {self._to_camel_case(entity_name)}s,
    current{entity_name},
    pagination,
    
    // Actions
    fetchList: store.fetchList,
    fetchById: store.fetchById,
    createItem: store.createItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    setPage: store.setPage,
    clearError: store.clearError
  }}
}}
'''
        
        self._write_file(
            entity_dir / 'presentation' / 'composables' / f'use{entity_name}.ts',
            content
        )

    def _generate_components(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate components for entity"""
        # Generate table component
        self._generate_table_component(entity_dir, entity_name, entity_spec)
        # Generate form component
        self._generate_form_component(entity_dir, entity_name, entity_spec)
        # Generate detail component
        self._generate_detail_component(entity_dir, entity_name, entity_spec)

    def _generate_table_component(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate table component"""
        content = f'''<template>
  <VDataTable
    :headers="headers"
    :items="items"
    :loading="loading"
    :items-per-page="itemsPerPage"
    :page="page"
    :total="total"
    v-model:selected="selection"
    @update:page="$emit('update:page', $event)"
    @update:items-per-page="$emit('update:items-per-page', $event)"
  >
    <template #item.actions="{{ item }}">
      <VBtn
        icon="tabler-eye"
        size="small"
        variant="text"
        color="primary"
        @click="$emit('view', item)"
      />
      <VBtn
        icon="tabler-edit"
        size="small"
        variant="text"
        color="warning"
        @click="$emit('edit', item)"
      />
      <VBtn
        icon="tabler-trash"
        size="small"
        variant="text"
        color="error"
        @click="$emit('delete', item)"
      />
    </template>
  </VDataTable>
</template>

<script setup lang="ts">
import {{ computed }} from 'vue'

interface Props {{
  headers: any[]
  items: any[]
  loading: boolean
  itemsPerPage: number
  page: number
  total: number
  selection: any[]
}}

interface Emits {{
  (e: 'update:page', page: number): void
  (e: 'update:items-per-page', itemsPerPage: number): void
  (e: 'view', item: any): void
  (e: 'edit', item: any): void
  (e: 'delete', item: any): void
  (e: 'update:selection', selection: any[]): void
}}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selection = computed({{
  get: () => props.selection,
  set: (value) => emit('update:selection', value)
}})
</script>
'''
        
        self._write_file(
            entity_dir / 'presentation' / 'components' / 'organisms' / f'{entity_name}Table.vue',
            content
        )

    def _generate_form_component(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate form component"""
        store_name = f'use{entity_name}Store'
        store_var = f'{self._to_camel_case(entity_name)}Store'
        content = f'''<template>
  <VForm @submit.prevent="onSubmit">
    <DialogCloseBtn @click="close('cancel')" />
    <VCard>
      <VCardTitle>{{{{ title }}}}</VCardTitle>
      <VCardText>
        <VRow>
{self._generate_form_fields(entity_name, entity_spec, use_model_value=True)}
        </VRow>
      </VCardText>
      <VCardActions>
        <VBtn type="submit" color="primary" :loading="loading">
          {{{{ mode === 'create' ? 'Create' : 'Update' }}}}
        </VBtn>
        <VBtn color="secondary" variant="tonal" @click="close('cancel')">
          Cancel
        </VBtn>
      </VCardActions>
    </VCard>
  </VForm>
</template>

<script setup lang="ts">
import {{ useForm }} from 'vee-validate'
import {{ toTypedSchema }} from '@vee-validate/zod'
import * as z from 'zod'
import {{ {store_name} }} from '../../stores/{self._to_camel_case(entity_name)}Store'

interface Props {{
  mode: 'create' | 'edit'
  initialData?: any
  title?: string
  loading?: boolean
}}

interface Emits {{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
  (e: 'close'): void
}}

const props = withDefaults(defineProps<Props>(), {{
  title: '{entity_name} Form',
  loading: false
}})

const emit = defineEmits<Emits>()
const {store_var} = {store_name}()
const {{ closeDialog }} = useAppManager()

// Form validation schema
const schema = toTypedSchema(z.object({{
{self._generate_zod_schema(entity_spec)}
}}))

const {{ handleSubmit, errors, values, setFieldValue }} = useForm({{
  validationSchema: schema,
  initialValues: props.initialData || {{}}
}})

const onSubmit = handleSubmit(async (values) => {{
  try {{
    if (props.mode === 'create') {{
      await {store_var}.createItem(values)
    }} else if (props.mode === 'edit') {{
      await {store_var}.updateItem(values.id, values)
    }}
    close('submit', values)
  }} catch (error) {{
    // Opcional: mostrar error
    console.error(error)
  }}
}})

function close(result: 'close' | 'submit' | 'cancel' = 'close') {{
  closeDialog(result)
}}
</script>
'''
        
        self._write_file(
            entity_dir / 'presentation' / 'components' / 'organisms' / f'{entity_name}Form.vue',
            content
        )

    def _generate_form_fields(self, entity_name: str, entity_spec: Dict, use_model_value: bool = False) -> str:
        """Generate form fields for entity"""
        fields = []
        properties = entity_spec.get('properties', {})
        
        for prop_name, prop_config in properties.items():
            if not prop_config.get('generated') and not prop_config.get('primary'):
                display_name = prop_name.replace('_', ' ').title()
                prop_type = prop_config.get('type', 'string')
                
                if use_model_value:
                    if prop_type in ['integer', 'number']:
                        model = f':model-value="values.{prop_name}" @update:model-value="val => setFieldValue(\'{prop_name}\', val === \'\' ? undefined : Number(val))"'
                    else:
                        model = f':model-value="values.{prop_name}" @update:model-value="val => setFieldValue(\'{prop_name}\', val)"'
                else:
                    model = f'v-model="values.{prop_name}"'
                
                if prop_type == 'boolean':
                    fields.append(f'''          <VCol cols="12">
            <VCheckbox
              {model}
              :label="'{display_name}'"
              :error-messages="errors.{prop_name}"
            />
          </VCol>''')
                elif prop_type in ['datetime', 'date']:
                    fields.append(f'''          <VCol cols="12">
            <VTextField
              {model}
              :label="'{display_name}'"
              :error-messages="errors.{prop_name}"
              type="date"
            />
          </VCol>''')
                elif prop_type == 'enum' and prop_config.get('values'):
                    options = ',\n'.join([f"              {{ title: '{val}', value: '{val}' }}" for val in prop_config['values']])
                    fields.append(f'''          <VCol cols="12">
            <VSelect
              {model}
              :label="'{display_name}'"
              :error-messages="errors.{prop_name}"
              :items="[\n{options}\n              ]"
            />
          </VCol>''')
                else:
                    fields.append(f'''          <VCol cols="12">
            <VTextField
              {model}
              :label="'{display_name}'"
              :error-messages="errors.{prop_name}"
            />
          </VCol>''')
        
        return '\n'.join(fields)

    def _generate_zod_schema(self, entity_spec: Dict) -> str:
        """Generate Zod validation schema"""
        fields = []
        for prop_name, prop_config in entity_spec.get('properties', {}).items():
            if not prop_config.get('generated') and not prop_config.get('primary'):
                field_type = prop_config.get('type', 'string')
                required = prop_config.get('required', False)
                
                if field_type in ['string', 'text']:
                    field = f"  {prop_name}: z.string()"
                    if required:
                        field += ".min(1, 'This field is required')"
                elif field_type in ['integer', 'number']:
                    field = f"  {prop_name}: z.number()"
                    if required:
                        field += ".min(1, 'This field is required')"
                elif field_type == 'boolean':
                    field = f"  {prop_name}: z.boolean()"
                    # Boolean doesn't need min validation
                elif field_type in ['datetime', 'date']:
                    field = f"  {prop_name}: z.date()"
                    if required:
                        field += ".min(1, 'This field is required')"
                elif field_type == 'enum' and prop_config.get('values'):
                    field = f"  {prop_name}: z.enum({json.dumps(prop_config['values'])})"
                    # Enum validation is handled by the enum itself, no need for min
                else:
                    field = f"  {prop_name}: z.any()"
                    if required:
                        field += ".min(1, 'This field is required')"
                
                fields.append(field)
        
        return ',\n'.join(fields)

    def _generate_store(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate store for entity"""
        content = f'''import {{ defineStore }} from 'pinia'
import {{ ref, computed }} from 'vue'
import {{ {entity_name}ApiService }} from '../../infrastructure/api/services/{entity_name}ApiService'
import {{ {entity_name}Transformer }} from '../../infrastructure/api/transformers/{entity_name}Transformer'
import type {{ ListFilters, ApiResponse }} from '../../../shared/types'

export const use{entity_name}Store = defineStore('{self._to_camel_case(entity_name)}', () => {{
  // State
  const items = ref<any[]>([])
  const currentItem = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)
  
  // Filters
  const filters = ref<ListFilters>({{}})
  
  // Selection
  const selectedItems = ref<any[]>([])
  
  // Computed
  const currentPage = computed(() => page.value)
  const perPage = computed(() => itemsPerPage.value)
  
  // API Service
  const apiService = new {entity_name}ApiService()
  
  // Actions
  const fetchList = async () => {{
    loading.value = true
    error.value = null
    
    try {{
      const response = await apiService.getList({{
        page: page.value,
        limit: itemsPerPage.value,
        ...filters.value
      }})
      
      items.value = response.data
      total.value = response.meta.total
      totalPages.value = response.meta.total_pages
    }} catch (err) {{
      error.value = err instanceof Error ? err.message : 'Failed to fetch {self._to_kebab_case(entity_name)}s'
    }} finally {{
      loading.value = false
    }}
  }}
  
  const fetchById = async (id: string) => {{
    loading.value = true
    error.value = null
    
    try {{
      const response = await apiService.getById(id)
      currentItem.value = response.data
    }} catch (err) {{
      error.value = err instanceof Error ? err.message : 'Failed to fetch {self._to_kebab_case(entity_name)}'
    }} finally {{
      loading.value = false
    }}
  }}
  
  const createItem = async (data: any) => {{
    loading.value = true
    error.value = null
    
    try {{
      const response = await apiService.create(data)
      await fetchList()
      return response.data
    }} catch (err) {{
      error.value = err instanceof Error ? err.message : 'Failed to create {self._to_kebab_case(entity_name)}'
      throw err
    }} finally {{
      loading.value = false
    }}
  }}
  
  const updateItem = async (id: string, data: any) => {{
    loading.value = true
    error.value = null
    
    try {{
      const response = await apiService.update(id, data)
      await fetchList()
      return response.data
    }} catch (err) {{
      error.value = err instanceof Error ? err.message : 'Failed to update {self._to_kebab_case(entity_name)}'
      throw err
    }} finally {{
      loading.value = false
    }}
  }}
  
  const deleteItem = async (id: string) => {{
    loading.value = true
    error.value = null
    
    try {{
      await apiService.delete(id)
      await fetchList()
    }} catch (err) {{
      error.value = err instanceof Error ? err.message : 'Failed to delete {self._to_kebab_case(entity_name)}'
      throw err
    }} finally {{
      loading.value = false
    }}
  }}
  
  const setPage = (newPage: number) => {{
    page.value = newPage
  }}
  
  const clearError = () => {{
    error.value = null
  }}
  
  const exportItems = (type: string) => {{
    // TODO: Implement export functionality
    console.log('Exporting {self._to_kebab_case(entity_name)}s as', type)
  }}
  
  return {{
    // State
    items,
    currentItem,
    loading,
    error,
    
    // Pagination
    page,
    itemsPerPage,
    total,
    totalPages,
    currentPage,
    perPage,
    
    // Filters
    filters,
    
    // Selection
    selectedItems,
    
    // Actions
    fetchList,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    setPage,
    clearError,
    exportItems
  }}
}})
'''
        
        self._write_file(
            entity_dir / 'presentation' / 'stores' / f'{self._to_camel_case(entity_name)}Store.ts',
            content
        )

    def _generate_validators(self, entity_dir: Path, entity_name: str, entity_spec: Dict):
        """Generate validators for entity"""
        content = f'''import * as yup from 'yup'

export const {self._to_camel_case(entity_name)}CreateValidation = yup.object({{
{self._generate_yup_schema(entity_spec, 'create')}
}})

export const {self._to_camel_case(entity_name)}UpdateValidation = yup.object({{
{self._generate_yup_schema(entity_spec, 'update')}
}})
'''
        
        self._write_file(
            entity_dir / 'presentation' / 'validators' / f'{entity_name}Validators.ts',
            content
        )

    def _generate_shared_components(self, module_dir: Path):
        """Generate shared components"""
        # Loading component
        loading_content = '''<template>
  <div v-if="loading" class="flex justify-center items-center p-4">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    <span class="ml-2 text-gray-600">{{ message || 'Loading...' }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loading: boolean
  message?: string
}

defineProps<Props>()
</script>
'''
        
        self._write_file(module_dir / 'shared' / 'components' / 'common' / 'LoadingSpinner.vue', loading_content)
        
        # Error component
        error_content = '''<template>
  <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">Error</h3>
        <div class="mt-2 text-sm text-red-700">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: string | null
}

defineProps<Props>()
</script>
'''
        
        self._write_file(module_dir / 'shared' / 'components' / 'common' / 'ErrorMessage.vue', error_content)

    def _generate_shared_stores(self, module_dir: Path):
        """Generate shared stores"""
        content = '''import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModuleStore = defineStore('module', () => {{
  const notifications = ref<any[]>([])
  
  const addNotification = (notification: any) => {{
    notifications.value.push({
      id: Date.now(),
      ...notification
    })
  }}
  
  const removeNotification = (id: number) => {{
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }}
  
  const clearNotifications = () => {{
    notifications.value = []
  }}
  
  return {{
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  }}
}})
'''
        
        self._write_file(module_dir / 'shared' / 'stores' / 'index.ts', content)

    def _generate_module_container(self, module_dir: Path):
        """Generate dependency injection container"""
        container_content = f'''import {{ {self.module_name}Config }} from './config'
import {{ {self.module_name}Routes }} from './config/routes'
import {{ {self.module_name}Menu }} from './config/menu'

// Import all entities
{chr(10).join([f"import * as {entity_name} from './{entity_name}'" for entity_name in self.entities.keys()])}

export class {self.module_name}Container {{
  private config = {self.module_name}Config
  private routes = {self.module_name}Routes
  private menu = {self.module_name}Menu
  
  // Entity containers
{chr(10).join([f"  private {self._to_camel_case(entity_name)}Container = {entity_name}" for entity_name in self.entities.keys()])}
  
  constructor() {{
    this.initializeContainers()
  }}
  
  private initializeContainers() {{
    // Initialize entity containers
    // This is where you would set up dependency injection
  }}
  
  getConfig() {{
    return this.config
  }}
  
  getRoutes() {{
    return this.routes
  }}
  
  getMenu() {{
    return this.menu
  }}
  
  // Entity getters
{chr(10).join([f"  get{entity_name}Container() {{ return this.{self._to_camel_case(entity_name)}Container }}" for entity_name in self.entities.keys()])}
  
  // Module lifecycle
  install(app: any) {{
    // Register routes
    this.routes.forEach(route => {{
      app.router.addRoute(route)
    }})
    
    // Register stores
    // Register components
    // Register composables
  }}
  
  uninstall(app: any) {{
    // Cleanup when module is uninstalled
  }}
}}
'''
        
        self._write_file(module_dir / 'config' / 'container.ts', container_content)

    def _generate_module_readme(self, module_dir: Path):
        """Generate module README"""
        content = f'''# {self.module_name} Module

This module was generated using the DDD Module Generator.

## Overview

The {self.module_name} module follows Domain-Driven Design principles and provides a complete, functional implementation for managing {', '.join(self.entities.keys())} entities.

## Architecture

This module is structured following DDD layers:

### Domain Layer
- **Entities**: Core business objects
- **Value Objects**: Immutable objects representing concepts
- **Repositories**: Contracts for data access
- **Events**: Domain events for business processes
- **Exceptions**: Domain-specific exceptions
- **Specifications**: Business rules and queries

### Application Layer
- **Commands**: Input DTOs for write operations
- **Queries**: Input DTOs for read operations
- **Handlers**: Business logic implementation
- **DTOs**: Data transfer objects
- **Mappers**: Data transformation logic
- **Use Cases**: Application services

### Infrastructure Layer
- **API Services**: External API communication
- **Repository Implementations**: Data access implementation
- **Transformers**: Data transformation for external APIs

### Presentation Layer
- **Views**: Vue.js page components
- **Components**: Reusable UI components
- **Stores**: Pinia state management
- **Composables**: Vue 3 composition functions
- **Validators**: Form validation schemas

## Features

- ✅ Complete CRUD operations
- ✅ Domain-driven design implementation
- ✅ TypeScript support
- ✅ Vue 3 Composition API
- ✅ Pinia state management
- ✅ Form validation with Yup
- ✅ Responsive UI components
- ✅ Error handling
- ✅ Loading states
- ✅ Pagination support
- ✅ Search and filtering
- ✅ Unit tests structure

## Usage

### Installation

```typescript
import {{ {self.module_name}Module }} from './modules/{self.module_name}'

// In your main app
app.use({self.module_name}Module)
```

### Using the Store

```typescript
import {{ use{list(self.entities.keys())[0]}Store }} from './modules/{self.module_name}/{list(self.entities.keys())[0]}/presentation/stores/{self._to_camel_case(list(self.entities.keys())[0])}Store'

const store = use{list(self.entities.keys())[0]}Store()
await store.fetchList()
```

### Using Components

```vue
<template>
  <{list(self.entities.keys())[0]}Table :items="items" @edit="handleEdit" />
</template>

<script setup>
import {list(self.entities.keys())[0]}Table from './modules/{self.module_name}/{list(self.entities.keys())[0]}/presentation/components/organisms/{list(self.entities.keys())[0]}Table.vue'
</script>
```

## Configuration

The module can be configured through the `{self.module_name}Config` object:

```typescript
import {{ {self.module_name}Config }} from './modules/{self.module_name}'

// Modify configuration
{self.module_name}Config.settings.defaultPageSize = 50
```

## API Endpoints

The module expects the following API endpoints:

- `GET /api/{self.module_name_kebab}/{self._to_kebab_case(list(self.entities.keys())[0])}s` - List {list(self.entities.keys())[0]}s
- `POST /api/{self.module_name_kebab}/{self._to_kebab_case(list(self.entities.keys())[0])}s` - Create {list(self.entities.keys())[0]}
- `GET /api/{self.module_name_kebab}/{self._to_kebab_case(list(self.entities.keys())[0])}s/:id` - Get {list(self.entities.keys())[0]} by ID
- `PUT /api/{self.module_name_kebab}/{self._to_kebab_case(list(self.entities.keys())[0])}s/:id` - Update {list(self.entities.keys())[0]}
- `DELETE /api/{self.module_name_kebab}/{self._to_kebab_case(list(self.entities.keys())[0])}s/:id` - Delete {list(self.entities.keys())[0]}

## Contributing

When contributing to this module:

1. Follow DDD principles
2. Maintain separation of concerns
3. Add tests for new functionality
4. Update documentation
5. Follow the existing code style

## License

This module is part of the main application and follows the same license terms.
'''
        
        self._write_file(module_dir / 'README.md', content)

    def _generate_auto_installer(self, module_dir: Path):
        """Generate auto-installer for plug-and-play module"""
        installer_content = f'''import {{ useRouter }} from 'vue-router'
import {{ useI18n }} from 'vue-i18n'
import {{ useAppManager }} from '@/composables/useAppManager'

// Import module routes and menu
import {self.module_name}Routes from './config/routes'
import {self.module_name}Menu from './config/menu'

export class {self.module_name}Installer {{
  private router: any
  private i18n: any

  constructor() {{
    this.setupDependencies()
  }}

  private setupDependencies() {{
    // Get router from the current app context
    try {{
      this.router = useRouter()
    }} catch (error) {{
      console.warn('Router not available in current context, will register routes later')
      this.router = null
    }}

    // Get i18n from the current app context
    try {{
      this.i18n = useI18n()
    }} catch (error) {{
      console.warn('i18n not available in current context')
      this.i18n = null
    }}
  }}

  install() {{
    console.log('🚀 Installing {self.module_name} module...')
    
    try {{
      // Register routes
      this.registerRoutes()
      
      // Add menu items
      this.addMenuItems()
      
      // Add translations
      this.addTranslations()
      
      // Add CASL abilities
      this.addCaslAbilities()
      
      console.log('✅ {self.module_name} module installed successfully!')
      return true
    }} catch (error) {{
      console.error('❌ Error installing {self.module_name} module:', error)
      return false
    }}
  }}

  private registerRoutes() {{
    console.log('📁 Registering routes...')
    
    if (!this.router) {{
      console.warn('Router not available, routes will be registered when router is available')
      return
    }}
    
    {self.module_name}Routes.forEach(route => {{
      this.router.addRoute(route)
    }})
  }}

  private addMenuItems() {{
    console.log('📋 Adding menu items...')
    // Add menu items to the main navigation
    if (window.mainMenu) {{
      window.mainMenu.push(...{self.module_name}Menu)
    }}
  }}

  private addTranslations() {{
    console.log('🌐 Adding translations...')
    const translations = {{
      en: {{
        {self._generate_translations()}
      }}
    }}
    
    if (this.i18n && this.i18n.global) {{
      this.i18n.global.mergeLocaleMessage('en', translations.en)
    }}
  }}

  private addCaslAbilities() {{
    console.log('🔐 Adding CASL abilities...')
    // Add CASL abilities for module permissions
    const abilities = [
{chr(10).join([f"      {{ action: 'read', subject: '{self._to_kebab_case(entity_name)}s' }}," for entity_name in self.entities.keys()])}
{chr(10).join([f"      {{ action: 'create', subject: '{self._to_kebab_case(entity_name)}s' }}," for entity_name in self.entities.keys()])}
{chr(10).join([f"      {{ action: 'update', subject: '{self._to_kebab_case(entity_name)}s' }}," for entity_name in self.entities.keys()])}
{chr(10).join([f"      {{ action: 'delete', subject: '{self._to_kebab_case(entity_name)}s' }}," for entity_name in self.entities.keys()])}
    ]
    
    if (window.caslAbilities) {{
      window.caslAbilities.push(...abilities)
    }}
  }}

  uninstall() {{
    console.log('🗑️ Uninstalling {self.module_name} module...')
    
    try {{
      // Remove routes
      this.removeRoutes()
      
      // Remove menu items
      this.removeMenuItems()
      
      // Remove translations
      this.removeTranslations()
      
      // Remove CASL abilities
      this.removeCaslAbilities()
      
      console.log('✅ {self.module_name} module uninstalled successfully!')
      return true
    }} catch (error) {{
      console.error('❌ Error uninstalling {self.module_name} module:', error)
      return false
    }}
  }}

  private removeRoutes() {{
    // Remove module routes
    if (this.router) {{
      {self.module_name}Routes.forEach(route => {{
        const existingRoute = this.router.getRoutes().find(r => r.name === route.name)
        if (existingRoute) {{
          this.router.removeRoute(route.name)
        }}
      }})
    }}
  }}

  private removeMenuItems() {{
    // Remove menu items
    if (window.mainMenu) {{
      window.mainMenu = window.mainMenu.filter(item => 
        !{self.module_name}Menu.some(menuItem => menuItem.to === item.to)
      )
    }}
  }}

  private removeTranslations() {{
    // Remove translations
    if (this.i18n && this.i18n.global) {{
      // Implementation depends on i18n setup
    }}
  }}

  private removeCaslAbilities() {{
    // Remove CASL abilities
    if (window.caslAbilities) {{
      window.caslAbilities = window.caslAbilities.filter(ability => 
        !{self.module_name}Menu.some(menuItem => 
          ability.subject === menuItem.subject
        )
      )
    }}
  }}
}}

// Auto-install function
export function install{self.module_name}Module() {{
  const installer = new {self.module_name}Installer()
  return installer.install()
}}

// Auto-uninstall function
export function uninstall{self.module_name}Module() {{
  const installer = new {self.module_name}Installer()
  return installer.uninstall()
}}

// Default export for plugin usage
export default {{
  install: install{self.module_name}Module,
  uninstall: uninstall{self.module_name}Module,
  installer: {self.module_name}Installer
}}

// Auto-install on import (optional)
if (typeof window !== 'undefined' && window.autoInstallModules !== false) {{
  install{self.module_name}Module()
}}
'''
        
        self._write_file(module_dir / 'installer.ts', installer_content)

        # Generate package.json for the module
        package_content = f'''{{
  "name": "@modules/{self.module_name_kebab}",
  "version": "1.0.0",
  "description": "{self.module_name} Module - Auto-installable DDD Module",
  "main": "installer.ts",
  "type": "module",
  "keywords": [
    "vue",
    "typescript",
    "ddd",
    "module",
    "auto-install",
    "plug-and-play"
  ],
  "author": "DDD Module Generator",
  "license": "MIT",
  "dependencies": {{
    "vue": "^3.0.0",
    "pinia": "^2.0.0",
    "vue-router": "^4.0.0",
    "vuetify": "^3.0.0",
    "vee-validate": "^4.0.0",
    "@vee-validate/zod": "^1.0.0",
    "zod": "^3.0.0",
    "yup": "^1.0.0",
    "axios": "^1.0.0",
    "uuid": "^9.0.0"
  }},
  "peerDependencies": {{
    "vue": "^3.0.0",
    "pinia": "^2.0.0",
    "vue-router": "^4.0.0",
    "vuetify": "^3.0.0"
  }},
  "exports": {{
    ".": {{
      "import": "./installer.ts",
      "types": "./installer.ts"
    }},
    "./routes": {{
      "import": "./config/routes.ts",
      "types": "./config/routes.ts"
    }},
    "./menu": {{
      "import": "./config/menu.ts",
      "types": "./config/menu.ts"
    }},
    "./stores/*": {{
      "import": "./*/presentation/stores/*.ts",
      "types": "./*/presentation/stores/*.ts"
    }},
    "./components/*": {{
      "import": "./*/presentation/components/organisms/*.vue",
      "types": "./*/presentation/components/organisms/*.vue"
    }}
  }}
}}'''
        
        self._write_file(module_dir / 'package.json', package_content)

        # Generate installation script
        install_script_content = f'''#!/usr/bin/env node

/**
 * {self.module_name} Module Auto-Installer
 * 
 * This script automatically installs the {self.module_name} module into your Vue application.
 * 
 * Usage:
 *   node install.js
 *   npm run install-module
 *   yarn install-module
 */

import {{ fileURLToPath }} from 'url'
import {{ dirname, join }} from 'path'
import {{ readFileSync, writeFileSync, existsSync }} from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Installing {self.module_name} module...')

try {{
  // Read the installer
  const installerPath = join(__dirname, 'installer.ts')
  const installerContent = readFileSync(installerPath, 'utf8')
  
  // Create installation instructions
  const instructions = `# {self.module_name} Module Installation

## Automatic Installation

1. Copy the module to your project:
   \`\`\`bash
   cp -r {self.module_name} /path/to/your/project/src/modules/
   \`\`\`

2. Import and install in your main.ts:
   \`\`\`typescript
   import {{ install{self.module_name}Module }} from './modules/{self.module_name}/installer'
   
   // Install the module
   install{self.module_name}Module()
   \`\`\`

3. Or use as a plugin:
   \`\`\`typescript
   import {self.module_name}Module from './modules/{self.module_name}/installer'
   
   app.use({self.module_name}Module)
   \`\`\`

## Manual Installation

If automatic installation doesn't work, you can manually:

1. Add routes to your router
2. Add menu items to your navigation
3. Register stores with Pinia
4. Add translations to i18n
5. Configure CASL permissions

## Configuration

The module can be configured through environment variables:

- \`VUE_APP_{self.module_name.upper()}_API_BASE_URL\`: API base URL
- \`VUE_APP_{self.module_name.upper()}_ENABLED\`: Enable/disable module

## Uninstallation

To uninstall the module:

\`\`\`typescript
import {{ uninstall{self.module_name}Module }} from './modules/{self.module_name}/installer'

uninstall{self.module_name}Module()
\`\`\`

## Features

✅ Complete CRUD operations
✅ Domain-driven design
✅ TypeScript support
✅ Vue 3 Composition API
✅ Pinia state management
✅ Vuetify UI components
✅ Form validation
✅ Responsive design
✅ Error handling
✅ Loading states
✅ Pagination
✅ Search and filtering
✅ Export functionality
✅ CASL permissions
✅ i18n translations
✅ Auto-installation
✅ Plug-and-play

## Support

For support, check the README.md file or contact the development team.
`

  // Write installation instructions
  const instructionsPath = join(__dirname, 'INSTALLATION.md')
  writeFileSync(instructionsPath, instructions)
  
  console.log('✅ Installation instructions generated!')
  console.log('📖 Check INSTALLATION.md for detailed instructions')
  
}} catch (error) {{
  console.error('❌ Error generating installation instructions:', error)
  process.exit(1)
}}
'''
        
        self._write_file(module_dir / 'install.js', install_script_content)

    def _generate_translations(self) -> str:
        """Generate translations for the module"""
        translations = []
        
        # Module translations
        translations.append(f'''        '{self.module_name_kebab}': {{
          title: '{self.module_name}',
          description: '{self.module_name} Management Module',
          dashboard: '{self.module_name} Dashboard',
          settings: '{self.module_name} Settings'
        }}''')
        
        # Entity translations
        for entity_name in self.entities.keys():
            entity_kebab = self._to_kebab_case(entity_name)
            translations.append(f'''        '{entity_kebab}': {{
          title: '{entity_name}',
          list: '{entity_name} List',
          create: 'Create {entity_name}',
          edit: 'Edit {entity_name}',
          delete: 'Delete {entity_name}',
          view: 'View {entity_name}',
          add: 'Add {entity_name}',
          update: 'Update {entity_name}',
          search: 'Search {entity_name}s',
          export: 'Export {entity_name}s',
          deleteSelected: 'Delete Selected {entity_name}s',
          confirmDelete: 'Are you sure you want to delete this {entity_name}?',
          deleteItemDescription: 'This action cannot be undone.',
          cancel: 'Cancel',
          confirm: 'Confirm',
          save: 'Save',
          loading: 'Loading...',
          error: 'Error',
          success: 'Success'
        }}''')
        
        return ',\n'.join(translations)

    def _generate_auto_plugin(self, output_dir: str):
        """Genera un plugin auto-registrable en src/plugins/<module_name_kebab>/index.ts para el módulo"""
        plugins_dir = Path(output_dir).parent / 'src' / 'plugins' / self.module_name_kebab
        plugins_dir.mkdir(parents=True, exist_ok=True)
        plugin_file = plugins_dir / 'index.ts'
        content = f"""import {{ install{self.module_name}Module }} from '@/modules/{self.module_name}/installer'
import type {{ App }} from 'vue'

export default function(app: App) {{
  install{self.module_name}Module()
}}
"""
        plugin_file.write_text(content, encoding='utf-8')
        print(f"  ✓ Plugin auto-registrable generado: src/plugins/{self.module_name_kebab}/index.ts")

    def _generate_module_locales(self, module_dir: Path):
        """Genera archivos de traducción en locales/en.json y locales/es.json para el módulo"""
        locales_dir = module_dir / 'locales'
        locales_dir.mkdir(parents=True, exist_ok=True)

        # Inglés
        en = {}
        # Español
        es = {}

        for entity_name, entity_spec in self.entities.items():
            entity_key = self._to_kebab_case(entity_name)
            en[entity_key] = {
                "title": f"{entity_name}s",
                "description": f"Manage your {entity_name.lower()}s",
                "add_{entity_key}": f"Add {entity_name}",
                f"search_{entity_key}": f"Search {entity_name}",
                "name": "Name",
                "status": "Status",
                "description": "Description"
            }
            es[entity_key] = {
                "title": f"{entity_name}s",
                "description": f"Administra tus {entity_name.lower()}s",
                "add_{entity_key}": f"Agregar {entity_name}",
                f"search_{entity_key}": f"Buscar {entity_name}",
                "name": "Nombre",
                "status": "Estado",
                "description": "Descripción"
            }

        import json
        (locales_dir / 'en.json').write_text(json.dumps(en, indent=2, ensure_ascii=False), encoding='utf-8')
        (locales_dir / 'es.json').write_text(json.dumps(es, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f"  ✓ Traducciones generadas: {locales_dir}/en.json y es.json")


def main():
    """Main function to run the generator"""
    if len(sys.argv) != 3:
        print("Usage: python generate_module.py <spec_file> <output_dir>")
        sys.exit(1)
    
    spec_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    try:
        # Load specification
        with open(spec_file, 'r', encoding='utf-8') as f:
            spec = json.load(f)
        
        # Generate module
        generator = ModuleGenerator(spec)
        generator.generate(output_dir)
        
    except FileNotFoundError:
        print(f"❌ Specification file not found: {spec_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in specification file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error generating module: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
