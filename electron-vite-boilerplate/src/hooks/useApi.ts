import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<{ success: boolean; data: T; message?: string }>
): UseApiReturn<T> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    console.log('=== useApi execute called ===')
    console.log('args:', args)
    console.log('timestamp:', new Date().toISOString())
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await apiFunction(...args)
      console.log('=== useApi response received ===')
      console.log('response:', response)
      console.log('timestamp:', new Date().toISOString())
      
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null
        })
        console.log('=== useApi state updated ===')
        console.log('new data:', response.data)
        return response.data
      } else {
        setState({
          data: null,
          loading: false,
          error: response.message || 'An error occurred'
        })
        return null
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
      setState({
        data: null,
        loading: false,
        error: errorMessage
      })
      return null
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}






