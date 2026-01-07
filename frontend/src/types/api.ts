// API Response Types

export interface SuccessResponse<T> {
  data: T
  message?: string
}

export interface ErrorResponse {
  error: string
  message: string
  details?: Record<string, unknown>
}

export interface ListResponse<T> {
  data: T[]
  meta?: {
    total: number
  }
}

// Auth Types
export interface User {
  id: string
  email: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface AuthMeResponse {
  id: string
  email: string
}
