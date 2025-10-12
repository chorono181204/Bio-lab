import { Request, Response, NextFunction } from 'express'
import { fail } from '../libs/utils/response'

export const authErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle Passport authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(fail('INVALID_TOKEN', 'Token không hợp lệ'))
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(fail('TOKEN_EXPIRED', 'Token đã hết hạn'))
  }
  
  if (err.name === 'NotBeforeError') {
    return res.status(401).json(fail('TOKEN_NOT_ACTIVE', 'Token chưa được kích hoạt'))
  }
  
  // Handle other authentication errors
  if (err.message === 'No auth token') {
    return res.status(401).json(fail('NO_TOKEN', 'Không tìm thấy token'))
  }
  
  // Pass other errors to next error handler
  next(err)
}







