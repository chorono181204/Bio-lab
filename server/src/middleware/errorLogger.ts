import { Request, Response, NextFunction } from 'express'

export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  console.error('=== ERROR LOG ===')
  console.error('Timestamp:', new Date().toISOString())
  console.error('Method:', req.method)
  console.error('URL:', req.url)
  console.error('Headers:', req.headers)
  console.error('Body:', req.body)
  console.error('Query:', req.query)
  console.error('Params:', req.params)
  console.error('User:', (req as any).user)
  console.error('Error Name:', err.name)
  console.error('Error Message:', err.message)
  console.error('Error Stack:', err.stack)
  console.error('Error Code:', err.code)
  console.error('Error Details:', err)
  console.error('==================')
  
  next(err)
}


