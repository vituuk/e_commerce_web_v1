import React from 'react'

export interface Row<TData> {
  id: string
  index: number
  original: TData
  getValue: <TValue = unknown>(columnId: string) => TValue
  getVisibleCells: () => Cell<TData, unknown>[]
}

export interface CellContext<TData, TValue = unknown> {
  row: Row<TData>
  getValue: () => TValue
}

export interface HeaderContext<TData, TValue = unknown> {
  column: Column<TData, TValue>
}

export interface ColumnDef<TData, TValue = unknown> {
  id?: string
  accessorKey?: keyof TData | string
  header?: string | ((context: HeaderContext<TData, TValue>) => React.ReactNode)
  cell?: (context: CellContext<TData, TValue>) => React.ReactNode
}

export interface Column<TData, TValue = unknown> {
  id: string
  columnDef: ColumnDef<TData, TValue>
}

export interface Header<TData, TValue = unknown> {
  id: string
  isPlaceholder?: boolean
  column: Column<TData, TValue>
  getContext: () => HeaderContext<TData, TValue>
}

export interface HeaderGroup<TData> {
  id: string
  headers: Header<TData, unknown>[]
}

export interface Cell<TData, TValue = unknown> {
  id: string
  column: Column<TData, TValue>
  row: Row<TData>
  getValue: () => TValue
  getContext: () => CellContext<TData, TValue>
}

export interface Table<TData> {
  getHeaderGroups: () => HeaderGroup<TData>[]
  getRowModel: () => { rows: Row<TData>[] }
}

export function getCoreRowModel() {
  return 'core'
}

export function flexRender<TProps>(
  Comp: React.ReactNode | ((props: TProps) => React.ReactNode),
  props: TProps,
): React.ReactNode {
  if (typeof Comp === 'function') {
    return (Comp as (props: TProps) => React.ReactNode)(props)
  }
  return Comp
}

export function useReactTable<TData>({
  data,
  columns,
}: {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  getCoreRowModel?: unknown
}): Table<TData> {
  const normalizedColumns: Column<TData, unknown>[] = columns.map((col, idx) => ({
    id: col.id || String(col.accessorKey || `col_${idx}`),
    columnDef: col,
  }))

  const headerGroup: HeaderGroup<TData> = {
    id: 'headerGroup_0',
    headers: normalizedColumns.map((column) => ({
      id: column.id,
      isPlaceholder: false,
      column,
      getContext: () => ({ column }),
    })),
  }

  const rows: Row<TData>[] = (data || []).map((item, rowIndex) => {
    const getValue = <TValue = unknown,>(colId: string): TValue => {
      if (item && typeof item === 'object' && colId in (item as Record<string, unknown>)) {
        return (item as Record<string, unknown>)[colId] as TValue
      }
      return undefined as unknown as TValue
    }

    const rowObj: Row<TData> = {
      id: `row_${rowIndex}`,
      index: rowIndex,
      original: item,
      getValue,
      getVisibleCells: () =>
        normalizedColumns.map((column, colIdx) => {
          const accessor = column.columnDef.accessorKey
            ? String(column.columnDef.accessorKey)
            : column.id
          const cellValue = getValue(accessor)
          const cell: Cell<TData, unknown> = {
            id: `cell_${rowIndex}_${colIdx}`,
            column,
            row: rowObj,
            getValue: () => cellValue,
            getContext: () => ({
              row: rowObj,
              getValue: () => cellValue,
            }),
          }
          return cell
        }),
    }

    return rowObj
  })

  return {
    getHeaderGroups: () => [headerGroup],
    getRowModel: () => ({ rows }),
  }
}

