import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// Tipos robustos para el generador de SQL
export interface SqlColumn {
  field?: string // campo base (ej: 't1.nombre')
  alias?: string
  aggregation?: string // ej: 'SUM', 'COUNT', etc.
  groupBy?: boolean
  expression?: string // expresión SQL custom (CONCAT, CASE, etc.)
  format?: string // currency, date, etc.
  [key: string]: any // para extensibilidad
}

export interface SqlJoin {
  table: string
  alias?: string
  type: 'INNER' | 'LEFT' | 'RIGHT'
  mainField?: string
  joinField?: string
  on?: { leftTable: string; leftField: string; operator: string; rightTable: string; rightField: string }[]
}

export interface SqlFilter {
  field?: string
  operator?: string
  value?: any
  logic?: 'AND' | 'OR'
  group?: SqlFilter[]
}

export interface SqlSorting {
  field: string
  direction: 'ASC' | 'DESC'
}

export interface SqlGroupBy {
  field: string
  alias?: string
}

export interface SqlConfig {
  columns: SqlColumn[]
  table: string
  tableAlias?: string
  joins?: SqlJoin[]
  filters?: SqlFilter[]
  sorting?: SqlSorting[]
  groupBy?: SqlGroupBy[]
  limit?: number
}

// Utilidad para generar alias de tabla
export function generateTableAlias(tableName: string, index: number = 0): string {
  if (!tableName)
    return `t${index}`

  const words = tableName.split('_')
  const alias = words.map(word => word.substring(0, 3)).join('').toLowerCase()

  return index === 0 ? alias : `${alias}${index}`
}

// Genera SQL para una columna
export function buildColumnSql(col: SqlColumn): string {
  if (col.expression)
    return col.alias ? `${col.expression} AS "${col.alias}"` : col.expression

  if (col.aggregation && col.field) {
    return col.alias
      ? `${col.aggregation}(${col.field}) AS "${col.alias}"`
      : `${col.aggregation}(${col.field})`
  }
  if (col.field) {
    return col.alias && col.alias.trim() && col.alias !== col.field
      ? `${col.field} AS "${col.alias}"`
      : col.field
  }

  return ''
}

// SELECT ...
export function buildSelectClause(columns: SqlColumn[]): string {
  if (!columns?.length)
    return '*'

  return columns.map(buildColumnSql).join(', ')
}

// JOIN ...
export function buildJoinClause(mainTableAlias: string, joins: SqlJoin[] = []): string {
  let sql = ''

  // Mapa de alias para lookup rápido
  const aliasMap: Record<string, string> = { main: mainTableAlias }

  joins.forEach((join, idx) => {
    if (!join.table)
      return

    const joinAlias = join.alias || generateTableAlias(join.table, idx + 1)

    aliasMap[joinAlias] = joinAlias

    // Condiciones ON
    let onClause = ''
    if (Array.isArray(join.on) && join.on.length > 0) {
      onClause = join.on.map(cond => {
        // Si leftTable está vacío, asumimos main
        let leftAlias = cond.leftTable
        if (!leftAlias || leftAlias === '' || leftAlias === 'main')
          leftAlias = mainTableAlias

        // Si rightTable está vacío, intentamos usar el alias del join
        let rightAlias = cond.rightTable
        if (!rightAlias || rightAlias === '' || rightAlias === 'main')
          rightAlias = rightAlias === 'main' ? mainTableAlias : joinAlias

        // Si sigue vacío, poner marcador para debug
        if (!leftAlias)
          leftAlias = '??LEFTALIAS??'
        if (!rightAlias)
          rightAlias = '??RIGHTALIAS??'

        return `${leftAlias}.${cond.leftField} ${cond.operator} ${rightAlias}.${cond.rightField}`
      }).join(' AND ')
    }
    else if (join.mainField && join.joinField) {
      // Legacy: solo un campo
      onClause = `${mainTableAlias}.${join.mainField} = ${joinAlias}.${join.joinField}`
    }
    sql += ` ${join.type} JOIN ${join.table} AS ${joinAlias} ON ${onClause}`
  })

  return sql
}

// WHERE ... (soporta grupos anidados y lógica AND/OR)
export function buildWhereClause(filters: SqlFilter[] = [], defaultLogic: 'AND' | 'OR' = 'AND'): string {
  if (!filters || !filters.length)
    return ''
  const clauses: string[] = []

  filters.forEach((f, idx) => {
    let clause = ''
    if (f.group && Array.isArray(f.group)) {
      clause = buildWhereClause(f.group, f.logic || defaultLogic)
      if (clause)
        clause = `(${clause})`
    }
    else if (f.field && f.operator) {
      // IS NULL / IS NOT NULL
      if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
        clause = `${f.field} ${f.operator}`
      }
      else if (f.operator === 'IN' || f.operator === 'NOT IN') {
        let values = Array.isArray(f.value) ? f.value : String(f.value).split(',').map(v => v.trim())
        values = values.filter(v => v !== '').map(v => Number.isNaN(Number(v)) ? `'${v}'` : v)
        clause = `${f.field} ${f.operator} (${values.join(', ')})`
      }
      else if (f.operator === 'BETWEEN') {
        const [a, b] = String(f.value).split(',').map(v => v.trim())
        const valA = Number.isNaN(Number(a)) ? `'${a}'` : a
        const valB = Number.isNaN(Number(b)) ? `'${b}'` : b

        clause = `${f.field} BETWEEN ${valA} AND ${valB}`
      }
      else if (f.operator === 'LIKE' || f.operator === 'NOT LIKE') {
        let val = String(f.value)
        if (!val.startsWith('%'))
          val = `%${val}`
        if (!val.endsWith('%'))
          val = `${val}%`
        clause = `${f.field} ${f.operator} '${val}'`
      }
      else {
        const value = Number.isNaN(Number(f.value)) ? `'${f.value}'` : f.value

        clause = `${f.field} ${f.operator} ${value}`
      }
    }
    if (clause) {
      const logic = idx > 0 ? (f.logic || defaultLogic || 'AND') : ''

      clauses.push(logic ? `${logic} ${clause}` : clause)
    }
  })

  return clauses.join(' ').replace(/^(AND|OR) /, '')
}

// ORDER BY ...
export function buildOrderByClause(sorting: SqlSorting[] = []): string {
  if (!sorting?.length)
    return ''

  // Filtra los que tengan field vacío
  const validSorting = sorting.filter(s => s.field && s.field.trim() !== '')
  if (!validSorting.length)
    return ''

  return `ORDER BY ${validSorting.map(s => `${s.field} ${s.direction}`).join(', ')}`
}

// GROUP BY ...
export function buildGroupByClause(groupBy: SqlGroupBy[] = []): string {
  if (!groupBy?.length)
    return ''

  // Filtra los que tengan field vacío
  const validGroupBy = groupBy.filter(g => g.field && g.field.trim() !== '')
  if (!validGroupBy.length)
    return ''

  return `GROUP BY ${validGroupBy.map(g => g.field).join(', ')}`
}

// SQL completo
export function buildFullSql(config: SqlConfig): string {
  if (!config.table)
    return ''

  const mainTableAlias = config.tableAlias || generateTableAlias(config.table)
  let sql = `SELECT ${buildSelectClause(config.columns)} FROM ${config.table} AS ${mainTableAlias}`

  // JOINs
  if (config.joins && config.joins.length > 0)
    sql += buildJoinClause(mainTableAlias, config.joins)

  // WHERE
  const where = buildWhereClause(config.filters)
  if (where)
    sql += `\nWHERE ${where}`

  // GROUP BY
  const groupBy = buildGroupByClause(config.groupBy)
  if (groupBy)
    sql += `\n${groupBy}`

  // ORDER BY
  const order = buildOrderByClause(config.sorting)
  if (order)
    sql += `\n${order}`

  // LIMIT
  if (config.limit)
    sql += `\nLIMIT ${config.limit}`

  return sql
}

// Función que actualiza el store automáticamente
export function buildFullSqlAndUpdateStore(config: SqlConfig, updateStore?: (sql: string) => void): string {
  const sql = buildFullSql(config)

  // Si se proporciona una función para actualizar el store, la ejecutamos
  if (updateStore && sql && sql.trim() !== '')
    updateStore(sql)

  return sql
}

// Utilidad para preview de expresiones custom
export function getSqlPreview({ type, aggregationType, aggregationField, concatFields, concatSeparator, caseConditions, caseElse, subquery, libreExpr }: any): string {
  let expression = ''
  if (type === 'AGGREGATION') {
    if (!aggregationField)
      return ''
    expression = `${aggregationType}(${aggregationField})`
  }
  else if (type === 'CONCAT') {
    if (!concatFields?.length)
      return ''
    expression = `CONCAT(${concatFields.join(`, '${concatSeparator}' ,`)})`
  }
  else if (type === 'CASE') {
    if (!caseConditions?.length)
      return ''
    expression = `CASE ${caseConditions.map((c: any) => `WHEN ${c.field} ${c.operator} '${c.value}' THEN '${c.result}'`).join(' ')}${caseElse ? ` ELSE '${caseElse}'` : ''} END`
  }
  else if (type === 'SUBQUERY') {
    if (!subquery)
      return ''
    expression = `(${subquery})`
  }
  else if (type === 'LIBRE') {
    if (!libreExpr)
      return ''
    expression = libreExpr
  }

  return expression
}

// Utilidad para resaltar SQL
export function getHighlightedSql(sql: string): string {
  if (!sql)
    return ''

  return hljs.highlight(sql, { language: 'sql' }).value
}

// Composable principal
export function useSqlExpressionPreview() {
  return {
    buildColumnSql,
    buildSelectClause,
    buildJoinClause,
    buildWhereClause,
    buildOrderByClause,
    buildGroupByClause,
    buildFullSql,
    buildFullSqlAndUpdateStore,
    getSqlPreview,
    getHighlightedSql,
    generateTableAlias,
  }
}
