import { apiClient } from '../utils/api'

export interface DepartmentStats {
  forms: number
  analytes: number
  lots: number
  machines: number
  users: number
  entriesToday: number
  entriesThisWeek: number
  entriesThisMonth: number
  violationsToday: number
  violationsThisWeek: number
  violationsThisMonth: number
}

export const statsService = {
  async getStats(): Promise<{ success: boolean; data: DepartmentStats; message?: string }> {
    const response = await apiClient.get('/stats')
    console.log('=== STATS API RESPONSE ===')
    console.log('Full response:', response)
    console.log('Response data:', response.data)
    return response
  }
}
