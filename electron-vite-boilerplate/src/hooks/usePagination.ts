import { useState, useCallback } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  total?: number
}

interface UsePaginationReturn {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setTotal: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
}

export const usePagination = (options: UsePaginationOptions = {}): UsePaginationReturn => {
  const {
    initialPage = 1,
    initialPageSize = 20,
    total = 0
  } = options

  const [page, setPageState] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [totalState, setTotalState] = useState(total)

  const totalPages = Math.ceil(totalState / pageSize)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const setPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageState(newPage)
    }
  }, [totalPages])

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize)
    setPageState(1) // Reset to first page when page size changes
  }, [])

  const setTotal = useCallback((newTotal: number) => {
    setTotalState(newTotal)
    // If current page is beyond the new total, go to last page
    const newTotalPages = Math.ceil(newTotal / pageSize)
    if (page > newTotalPages && newTotalPages > 0) {
      setPageState(newTotalPages)
    }
  }, [page, pageSize])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPageState(prev => prev + 1)
    }
  }, [hasNextPage])

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPageState(prev => prev - 1)
    }
  }, [hasPrevPage])

  const goToFirstPage = useCallback(() => {
    setPageState(1)
  }, [])

  const goToLastPage = useCallback(() => {
    setPageState(totalPages)
  }, [totalPages])

  return {
    page,
    pageSize,
    total: totalState,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage
  }
}







