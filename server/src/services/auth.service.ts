import { prisma } from '../config/db'
import { comparePassword } from '../libs/auth/password'
import { signJwt } from '../libs/auth/jwt'

export async function validateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ 
    where: { username },
    include: {
      department: {
        select: { id: true, name: true }
      }
    }
  })
  if (!user || !user.password) return null
  const ok = await comparePassword(password, user.password)
  if (!ok) return null
  return { 
    id: user.id, 
    username: user.username, 
    fullName: user.fullName, 
    role: user.role, 
    position: (user as any).position || null,
    departmentId: user.departmentId,
    departmentName: user.department?.name
  }
}

export function issueToken(payload: { id: string; username: string; fullName?: string | null; role?: string | null; position?: string | null; departmentId?: string | null; departmentName?: string | null }) {
  return signJwt({ sub: payload.id, username: payload.username, fullName: payload.fullName, role: payload.role, position: payload.position, departmentId: payload.departmentId, departmentName: payload.departmentName })
}


