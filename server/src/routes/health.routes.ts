import { Router } from 'express'
import passport from 'passport'
import { healthController } from '../controllers/health.controller'
import { requireRole } from '../middleware/requireRole'
import '../libs/auth/strategies/jwt.strategy'

const router = Router()

router.get('/', passport.authenticate('jwt', { session: false }), requireRole('admin', 'manager'), healthController)

export default router






