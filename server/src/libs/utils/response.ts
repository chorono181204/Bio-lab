export type ApiSuccess<T> = {
  success: true
  data: T
  meta?: Record<string, any>
}

export type ApiError = {
  success: false
  error: { code: string; message: string; details?: any }
}

export function ok<T>(data: T, meta?: Record<string, any>): ApiSuccess<T> {
  return { success: true, data, meta }
}

export function fail(code: string, message: string, details?: any): ApiError {
  return { success: false, error: { code, message, details } }
}


