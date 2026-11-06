export interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="table-wrap" aria-busy="true">
      <table>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((__, colIdx) => (
                <td key={colIdx}>
                  <div
                    style={{
                      height: '16px',
                      width: colIdx === 0 ? '48px' : '100%',
                      borderRadius: '6px',
                      background: 'rgba(148, 163, 184, 0.18)',
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TableSkeleton

