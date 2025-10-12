import jwt from 'jsonwebtoken'

const JWT_SECRET = 'biolab_secret_key' // hardcoded per requirement
const JWT_EXPIRES_IN = '30d'

export function signJwt(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET)
}


