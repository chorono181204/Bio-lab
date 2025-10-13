import { Request, Response } from 'express'
import { ok, fail } from '../libs/utils/response'
import { issueToken, validateUser } from '../services/auth.service'
import { getUserById } from '../services/user.service'

export async function login(req: Request, res: Response) {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json(fail('VALIDATION_ERROR', 'Thiếu username/password'))
  try {
    const user = await validateUser(String(username), String(password))
    if (!user) return res.status(401).json(fail('INVALID_CREDENTIALS', 'Sai tài khoản hoặc mật khẩu'))
    const token = issueToken(user)
    return res.json(ok({ token, user }))
  } catch (e) {
    return res.status(500).json(fail('AUTH_ERROR', 'Internal error'))
  }
}

export async function me(req: Request, res: Response) {
  try {
    const payload = (req as any).user as { sub?: string }
    if (!payload?.sub) return res.status(401).json(fail('UNAUTHORIZED', 'Missing token'))
    
    console.log('=== AUTH ME DEBUG ===')
    console.log('User ID from token:', payload.sub)
    
    const user = await getUserById(String(payload.sub))
    if (!user) return res.status(404).json(fail('USER_NOT_FOUND', 'Không tìm thấy người dùng'))
    
    console.log('User from database:', JSON.stringify(user, null, 2))
    
    // loại bỏ password trước khi trả về
    const { password, ...safe } = user as any
    console.log('Safe user data:', JSON.stringify(safe, null, 2))
    
    return res.json(ok(safe))
  } catch (e) {
    console.error('Auth me error:', e)
    return res.status(500).json(fail('ME_ERROR', 'Internal error'))
  }
}


