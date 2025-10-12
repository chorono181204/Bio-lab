export function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return null
  
  return dateObj.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

export function formatDateTime(date: Date | string | null | undefined): string | null {
  if (!date) return null
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return null
  
  return dateObj.toISOString()
}

export function formatDisplayDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return null
  
  // Format as DD/MM/YYYY for display
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const year = dateObj.getFullYear()
  
  return `${day}/${month}/${year}`
}


