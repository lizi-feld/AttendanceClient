import { ChevronRight, ChevronLeft } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex items-center justify-between px-1 pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        מציג {start}–{end} מתוך {totalCount}
      </p>

      <div className="flex items-center gap-1">
        {/* Next page — on the right in RTL (visually = "previous" in LTR) */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30
                     disabled:cursor-not-allowed transition-colors"
          aria-label="עמוד הבא"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="text-sm text-gray-700 px-2 min-w-[5rem] text-center">
          עמוד {page} מתוך {totalPages}
        </span>

        {/* Previous page — on the left in RTL */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30
                     disabled:cursor-not-allowed transition-colors"
          aria-label="עמוד קודם"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
